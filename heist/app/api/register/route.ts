import { revalidatePath } from "next/cache";

import { generatePassword } from "@/lib/auth";
import { registerTeam } from "@/lib/game";
import type { Member } from "@/lib/types";

/**
 * Public crew registration for the static landing page.
 *
 * The landing site is not a Next.js app, so it posts here instead of calling a
 * server action. Everything is still written through the same `registerTeam`
 * helper the rest of the app uses, which means the crew lands in the very same
 * MongoDB `teams` collection the admin panel reads, gets the first-come /
 * waitlist status, and has its leader photo stored on the crew record.
 */

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** JPEG/WebP/PNG/GIF data URLs only — the same formats /api/photo will serve. */
const PHOTO = /^data:image\/(?:png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/i;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanPhoto(value: unknown): string {
  const photo = typeof value === "string" ? value.trim() : "";
  if (!photo) return "";
  const match = PHOTO.exec(photo);
  // A 480px JPEG is well under this. Reject anything larger / non-image rather
  // than stuffing junk into the crew record.
  if (!match || match[1].length > 1_500_000) return "";
  return photo;
}

function readMember(raw: unknown): Member | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const name = text(row.name, 80);
  const email = text(row.email, 160).toLowerCase();
  const phone = text(row.phone, 30);
  if (!name || !EMAIL.test(email) || !phone) return null;
  return { name, email, phone, role: "member" };
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid submission." }, 400);
  }

  const name = text(body.name, 60);
  const email = text(body.email, 160).toLowerCase();
  const leaderName = text(body.leaderName, 80);
  const leaderPhone = text(body.leaderPhone, 30);
  const photo = cleanPhoto(body.leaderPhoto);

  if (!photo) {
    return json({ ok: false, error: "A leader photo is required." }, 422);
  }
  if (name.length < 2) {
    return json({ ok: false, error: "Enter a crew name." }, 422);
  }
  if (!EMAIL.test(email)) {
    return json({ ok: false, error: "Enter a valid leader login email." }, 422);
  }
  if (!leaderName) {
    return json({ ok: false, error: "Enter the leader's name." }, 422);
  }
  if (!leaderPhone) {
    return json({ ok: false, error: "Enter the leader's phone number." }, 422);
  }

  // Leader + at least 3, up to 4 crew members (crews of 4–5).
  const rawMembers = Array.isArray(body.members) ? body.members : [];
  if (rawMembers.length < 3 || rawMembers.length > 4) {
    return json(
      {
        ok: false,
        error:
          "A crew needs the leader plus at least 3 members, and at most 4 members.",
      },
      422,
    );
  }
  const members: Member[] = [];
  for (const raw of rawMembers) {
    const member = readMember(raw);
    if (!member) {
      return json(
        {
          ok: false,
          error: "Every member needs a name, a valid email and a phone number.",
        },
        422,
      );
    }
    members.push(member);
  }

  // The passcode is never chosen by the registrant. We mint it here, hand it
  // back once so the crew can log in, and let registerTeam store only its hash.
  const passcode = generatePassword(10);

  try {
    const { team, created } = await registerTeam({
      name,
      email,
      password: passcode,
      leader: {
        name: leaderName,
        email,
        phone: leaderPhone,
        role: "leader",
        photo,
      },
      members,
    });

    if (!created) {
      return json(
        {
          ok: false,
          teamId: team.teamId,
          error:
            `A crew is already registered with this leader email (Team ID ${team.teamId}). ` +
            "Log in with the passcode from your confirmation, or ask event control to reset it.",
        },
        409,
      );
    }

    revalidatePath("/admin");
    revalidatePath("/leaderboard");

    const waitlisted = team.status === "waitlisted";
    return json(
      {
        ok: true,
        teamId: team.teamId,
        passcode,
        status: team.status,
        waitlisted,
        message: waitlisted
          ? "Your crew is on the waitlist. Keep this passcode — you'll need it when a slot opens."
          : "Crew registered. Save your Team ID and passcode — you need both to log in.",
      },
      201,
    );
  } catch (error) {
    console.error("[register] failed:", (error as Error).message);
    return json(
      {
        ok: false,
        error: "Registration could not be completed. Please try again.",
      },
      500,
    );
  }
}
