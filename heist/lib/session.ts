import "server-only";

import { redirect } from "next/navigation";

import { getSession } from "./auth";
import { getTeam } from "./game";
import type { SessionPayload, Team } from "./types";

export async function requireTeam(): Promise<{
  session: SessionPayload;
  team: Team;
}> {
  const session = await getSession();
  if (!session || session.role !== "team") redirect("/login");
  const team = await getTeam(session.sub);
  if (!team) redirect("/login");
  return { session, team };
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/admin/login");
  return session;
}
