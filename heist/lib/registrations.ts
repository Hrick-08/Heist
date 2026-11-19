import "server-only";

import { ObjectId } from "mongodb";

import { registrationsCol } from "./collections";
import { generatePassword } from "./auth";
import { registerTeam } from "./game";
import type { Member, Registration, RegistrationRow } from "./types";

export interface CreateRegistrationInput {
  crewName: string;
  leader: Member;
  /** 2 to 4 crew mates beside the leader. */
  members: Member[];
  leaderPhoto: string;
}

export type CreateRegistrationResult =
  | { ok: true }
  | { ok: false; error: string };

/** A crew signs up through the public `/register` form. Stored on its own,  *
 *  separate from `teams`, until an admin picks it in the control room.      */
export async function createRegistration(
  input: CreateRegistrationInput,
): Promise<CreateRegistrationResult> {
  const col = await registrationsCol();
  const existing = await col.findOne({ "leader.email": input.leader.email });
  if (existing) {
    return {
      ok: false,
      error:
        existing.status === "selected"
          ? `This leader email is already registered as crew ${existing.teamId}.`
          : "This leader email has already signed up. Only one sign-up per leader.",
    };
  }
  await col.insertOne({
    crewName: input.crewName,
    leader: input.leader,
    leaderPhoto: input.leaderPhoto,
    members: input.members,
    status: "pending",
    teamId: null,
    createdAt: new Date(),
  });
  return { ok: true };
}

export async function listRegistrations(): Promise<Registration[]> {
  const col = await registrationsCol();
  return col.find({}).sort({ createdAt: 1 }).toArray();
}

export async function getRegistration(id: string): Promise<Registration | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await registrationsCol();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function countPendingRegistrations(): Promise<number> {
  const col = await registrationsCol();
  return col.countDocuments({ status: "pending" });
}

export function toRegistrationRow(r: Registration): RegistrationRow {
  return {
    id: String(r._id),
    crewName: r.crewName,
    leaderName: r.leader.name,
    leaderEmail: r.leader.email,
    leaderPhone: r.leader.phone,
    hasPhoto: Boolean(r.leaderPhoto),
    membersCount: r.members.length + 1,
    status: r.status,
    teamId: r.teamId,
    createdAt: r.createdAt,
  };
}

/** Removes a sign-up that has not been turned into a crew yet. */
export async function deleteRegistration(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await registrationsCol();
  const result = await col.deleteOne({ _id: new ObjectId(id), status: "pending" });
  return result.deletedCount === 1;
}

export interface SelectRegistrationsResult {
  ok: boolean;
  created: number;
  message: string;
}

/**
 * Turns the chosen pending sign-ups into real crews: each gets the next free
 * Team ID and a freshly minted passcode, written through `registerTeam` so
 * they land in the same `teams` collection the rest of the app (team login,
 * the admin crews screen, round allocation) already reads.
 */
export async function selectRegistrations(
  ids: string[],
): Promise<SelectRegistrationsResult> {
  const col = await registrationsCol();
  const objectIds = [...new Set(ids)].filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  if (objectIds.length === 0) {
    return { ok: false, created: 0, message: "No sign-ups were selected." };
  }

  const rows = await col.find({ _id: { $in: objectIds }, status: "pending" }).toArray();
  if (rows.length === 0) {
    return { ok: false, created: 0, message: "Those sign-ups were already turned into crews." };
  }

  let created = 0;
  const alreadyRegistered: string[] = [];

  for (const row of rows) {
    const passcode = generatePassword(10);
    const { team, created: wasCreated } = await registerTeam({
      name: row.crewName,
      email: row.leader.email,
      password: passcode,
      leader: { ...row.leader, photo: row.leaderPhoto },
      members: row.members,
    });

    if (!wasCreated) {
      // A crew with this leader email already exists (e.g. created earlier).
      alreadyRegistered.push(`${row.crewName} (${team.teamId})`);
      await col.updateOne(
        { _id: row._id },
        { $set: { status: "selected", teamId: team.teamId } },
      );
      continue;
    }

    // Creating the crew mints credentials but does NOT enter it in the heist.
    // That is a separate, explicit decision on the Crews page ("In heist").
    await col.updateOne(
      { _id: row._id },
      { $set: { status: "selected", teamId: team.teamId } },
    );
    created += 1;
  }

  const parts: string[] = [];
  if (created > 0) {
    parts.push(
      `${created} crew${created === 1 ? "" : "s"} got a Team ID and passcode — flip "In heist" on the Crews page to admit them`,
    );
  }
  if (alreadyRegistered.length > 0) {
    parts.push(`${alreadyRegistered.length} already had an account (${alreadyRegistered.join(", ")})`);
  }

  return {
    ok: created > 0 || alreadyRegistered.length > 0,
    created,
    message: parts.length ? `${parts.join("; ")}.` : "No sign-ups were selected.",
  };
}
