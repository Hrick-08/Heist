import "server-only";

import { headers } from "next/headers";

import { getDb } from "./db";

/**
 * Login throttling, stored in MongoDB so it holds across server instances.
 * Two buckets per attempt: one for the client address alone (spray protection)
 * and one for address + account (targeted guessing). Entries expire on their own.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_ACCOUNT = 8;
const MAX_PER_ADDRESS = 40;

interface Bucket {
  _id: string;
  count: number;
  expiresAt: Date;
}

let indexReady: Promise<unknown> | null = null;

async function buckets() {
  const col = (await getDb()).collection<Bucket>("loginAttempts");
  indexReady ??= col
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    .catch(() => {
      indexReady = null;
    });
  await indexReady;
  return col;
}

export async function clientAddress(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || h.get("x-real-ip") || "unknown").slice(0, 64);
}

export interface Throttle {
  blocked: boolean;
  keys: string[];
}

export async function checkLoginThrottle(scope: string, account: string): Promise<Throttle> {
  const ip = await clientAddress();
  const keys = [`${scope}:ip:${ip}`, `${scope}:acct:${ip}:${account.slice(0, 64)}`];
  const col = await buckets();
  const now = new Date();
  const rows = await col.find({ _id: { $in: keys }, expiresAt: { $gt: now } }).toArray();
  const byId = new Map(rows.map((r) => [r._id, r.count]));
  const blocked =
    (byId.get(keys[0]) ?? 0) >= MAX_PER_ADDRESS || (byId.get(keys[1]) ?? 0) >= MAX_PER_ACCOUNT;
  return { blocked, keys };
}

export async function recordLoginFailure(throttle: Throttle): Promise<void> {
  const col = await buckets();
  const expiresAt = new Date(Date.now() + WINDOW_MS);
  await Promise.all(
    throttle.keys.map(async (key) => {
      // Reset a stale bucket, otherwise count up inside the current window.
      await col.deleteOne({ _id: key, expiresAt: { $lte: new Date() } });
      await col.updateOne(
        { _id: key },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
        { upsert: true },
      );
    }),
  );
}

export async function clearLoginFailures(throttle: Throttle): Promise<void> {
  const col = await buckets();
  // Only the account bucket: a good login must not wipe the address-wide counter.
  await col.deleteOne({ _id: throttle.keys[1] });
}

export const THROTTLE_MESSAGE = "Too many attempts. Wait a few minutes and try again.";
