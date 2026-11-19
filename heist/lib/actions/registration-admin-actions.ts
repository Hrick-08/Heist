"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionResult } from "@/lib/actions/admin-actions";
import { getTeam, logAudit, updateEventState } from "@/lib/game";
import { deleteRegistration, getRegistration, selectRegistrations } from "@/lib/registrations";
import { requireAdmin } from "@/lib/session";

function refresh() {
  revalidatePath("/");
  revalidatePath("/register");
  revalidatePath("/login");
  revalidatePath("/leaderboard");
  revalidatePath("/admin");
  revalidatePath("/admin/registrations");
  revalidatePath("/admin/teams");
}

/** The big checkbox. Open means the public site shows Register and hides the live game. */
export async function setRegistrationOpenAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const open = formData.get("open") === "on" || formData.get("open") === "true";
  await updateEventState({ registrationOpen: open });
  await logAudit(session.name, open ? "registration-open" : "registration-close", "", open ? "Registrations opened" : "Registrations closed");
  refresh();
  return {
    ok: true,
    message: open
      ? "Registrations are open. The site now shows Register instead of login."
      : "Registrations are closed. The site is back to team login and the leaderboard.",
  };
}

/** Team login switch. Turning it off also ends every team session that is open right now. */
export async function setTeamLoginOpenAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const open = formData.get("open") === "on" || formData.get("open") === "true";
  await updateEventState(
    open ? { teamLoginOpen: true } : { teamLoginOpen: false, teamSessionsValidFrom: new Date() },
  );
  await logAudit(session.name, open ? "team-login-open" : "team-login-close", "", open ? "Team login opened" : "Team login closed, crews signed out");
  refresh();
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: open
      ? "Team login is on. Crews can sign in again."
      : "Team login is off. Every signed-in crew has been logged out.",
  };
}

/** Picks the chosen sign-ups: next free TLH-XX id and a fresh passcode for each. */
export async function selectCrewsAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const ids = formData.getAll("ids").map((v) => String(v)).slice(0, 200);
  const result = await selectRegistrations(ids);
  if (result.created > 0) {
    await logAudit(session.name, "select-crews", "", `${result.created} sign-up(s) turned into crews`);
  }
  refresh();
  return { ok: result.ok, message: result.message };
}

export async function deleteRegistrationAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const removed = await deleteRegistration(id);
  if (!removed) {
    return { ok: false, message: "That sign-up could not be removed. Crews that already have credentials stay." };
  }
  await logAudit(session.name, "delete-registration", "", `Sign-up ${id} removed`);
  refresh();
  return { ok: true, message: "Sign-up removed." };
}

/**
 * Reads the Team ID and current passcode of a crew that came from a sign-up.
 * Fetched on demand (admin only) so passcodes are never shipped inside the page data.
 */
export async function getCrewLoginAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const reg = await getRegistration(id);
  if (!reg || !reg.teamId) {
    return { ok: false, message: "That sign-up has not been turned into a crew yet." };
  }
  const team = await getTeam(reg.teamId);
  if (!team) return { ok: false, message: `Crew ${reg.teamId} could not be found.` };
  return {
    ok: true,
    message: "",
    data: { teamId: team.teamId, email: team.email, passcode: team.passcode },
  };
}
