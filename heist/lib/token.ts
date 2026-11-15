import "server-only";

import { SignJWT, jwtVerify } from "jose";

import type { SessionPayload } from "./types";

export const SESSION_COOKIE = "tlh_session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      "AUTH_SECRET env var is missing or too short (use at least 16 characters).",
    );
  }
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const role = payload.role;
    if (role !== "team" && role !== "admin") return null;
    if (typeof payload.sub !== "string") return null;
    return {
      role,
      sub: payload.sub,
      name: typeof payload.name === "string" ? payload.name : payload.sub,
    };
  } catch {
    return null;
  }
}
