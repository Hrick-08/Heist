import "server-only";

import { redirect } from "next/navigation";

import { getSession } from "./auth";
import { getEventState, getTeam } from "./game";
import type { SessionPayload, Team } from "./types";

export async function requireTeam(): Promise<{
  session: SessionPayload;
  team: Team;
}> {
  const session = await getSession();
  if (!session || session.role !== "team") redirect("/login");
  // Control can switch team login off. That also ends every team session issued before the switch.
  const event = await getEventState();
  if (event.teamLoginOpen === false) redirect("/login");
  if (
    event.teamSessionsValidFrom &&
    Math.floor(event.teamSessionsValidFrom.getTime() / 1000) > (session.iat ?? 0)
  ) {
    redirect("/login");
  }
  const team = await getTeam(session.sub);
  // Access follows the crew's current standing, not just a still-valid cookie.
  if (
    !team ||
    team.status === "registered" ||
    team.status === "waitlisted" ||
    team.status === "eliminated"
  ) {
    redirect("/login");
  }
  // A passcode reset ends every session issued before it.
  if (team.passwordChangedAt && Math.floor(team.passwordChangedAt.getTime() / 1000) > (session.iat ?? 0)) {
    redirect("/login");
  }
  return { session, team };
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/admin/login");
  return session;
}
