"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSessionCookieOptions, verifyPassword } from "@/lib/auth";
import { findAdmin, getTeam } from "@/lib/game";
import { SESSION_COOKIE, signSession } from "@/lib/token";
import type { AuthState } from "@/lib/types";

export async function teamLoginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const teamId = String(formData.get("teamId") ?? "")
    .trim()
    .toUpperCase();
  const password = String(formData.get("password") ?? "");

  if (!teamId || !password) {
    return { error: "Enter your TEAM ID and passcode." };
  }

  const team = await getTeam(teamId);
  if (!team) {
    return { error: `No crew is registered under ${teamId}.` };
  }

  const valid = await verifyPassword(password, team.passwordHash);
  if (!valid) {
    return { error: "That passcode does not match our records." };
  }

  if (team.status === "waitlisted") {
    return {
      error:
        "Your crew is on the waitlist. You will be emailed the moment a slot opens.",
    };
  }

  if (team.status === "eliminated") {
    return {
      error:
        "Your crew has been knocked out of the heist. The leaderboard has the final scores.",
    };
  }

  const token = await signSession({
    role: "team",
    sub: team.teamId,
    name: team.name,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, getSessionCookieOptions());
  redirect("/dashboard");
}

export async function adminLoginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Enter the control room username and passcode." };
  }

  const admin = await findAdmin(username);
  if (!admin) {
    return { error: "No operator found with that username." };
  }

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) {
    return { error: "Access denied. Wrong passcode." };
  }

  const token = await signSession({
    role: "admin",
    sub: admin.username,
    name: admin.name,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, getSessionCookieOptions());
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
