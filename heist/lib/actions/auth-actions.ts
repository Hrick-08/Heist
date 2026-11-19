"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { burnPasswordCheck, getSessionCookieOptions, verifyPassword } from "@/lib/auth";
import { findAdmin, getEventState, getTeam } from "@/lib/game";
import {
  THROTTLE_MESSAGE,
  checkLoginThrottle,
  clearLoginFailures,
  recordLoginFailure,
} from "@/lib/ratelimit";
import { bootstrapAdmin } from "@/lib/seed";
import { SESSION_COOKIE, signSession } from "@/lib/token";
import type { AuthState } from "@/lib/types";

const MAX_ID = 32;
const MAX_PASSWORD = 128;

export async function teamLoginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const teamId = String(formData.get("teamId") ?? "")
    .trim()
    .toUpperCase()
    .slice(0, MAX_ID);
  const password = String(formData.get("password") ?? "").slice(0, MAX_PASSWORD);

  if (!teamId || !password) {
    return { error: "Enter your Team ID and passcode." };
  }

  if ((await getEventState()).teamLoginOpen === false) {
    return { error: "Team login is closed right now. Check back soon." };
  }

  const throttle = await checkLoginThrottle("team", teamId);
  if (throttle.blocked) return { error: THROTTLE_MESSAGE };

  const team = await getTeam(teamId);
  const valid = team
    ? await verifyPassword(password, team.passwordHash)
    : (await burnPasswordCheck(password), false);

  // One message for "no such crew" and "wrong passcode" so IDs cannot be probed.
  if (!team || !valid) {
    await recordLoginFailure(throttle);
    return { error: "Team ID or passcode is incorrect." };
  }

  if (team.status === "registered") {
    return {
      error:
        "Your crew is registered but has not been added to the heist yet. Event control will add you and send your login details.",
    };
  }

  if (team.status === "waitlisted") {
    return {
      error: "Your crew is on the waitlist. Only selected crews can sign in.",
    };
  }

  if (team.status === "eliminated") {
    return {
      error:
        "Your crew has been knocked out of the heist. The leaderboard has the final scores.",
    };
  }

  await clearLoginFailures(throttle);
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
    .toLowerCase()
    .slice(0, MAX_ID);
  const password = String(formData.get("password") ?? "").slice(0, MAX_PASSWORD);

  if (!username || !password) {
    return { error: "Enter the operator username and passcode." };
  }

  const throttle = await checkLoginThrottle("admin", username);
  if (throttle.blocked) return { error: THROTTLE_MESSAGE };

  await bootstrapAdmin();
  const admin = await findAdmin(username);
  const valid = admin
    ? await verifyPassword(password, admin.passwordHash)
    : (await burnPasswordCheck(password), false);

  if (!admin || !valid) {
    await recordLoginFailure(throttle);
    return { error: "Operator or passcode is incorrect." };
  }

  await clearLoginFailures(throttle);
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

export async function adminLogoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
