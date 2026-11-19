import "server-only";

import { io } from "next/cache";
import { MongoClient, type Db } from "mongodb";

const URI = process.env.DATABASE;
const DB_NAME = process.env.DATABASE_NAME || "last-heist";

if (!URI) {
  throw new Error(
    "DATABASE env var is missing. Add it to .env (mongodb://... or mongodb+srv://...).",
  );
}

declare global {
  var __heistMongo: Promise<MongoClient> | undefined;
}

/** Uniqueness the application relies on, enforced by the database itself. */
async function ensureIndexes(db: Db): Promise<void> {
  try {
    await Promise.all([
      db.collection("teams").createIndex({ teamId: 1 }, { unique: true }),
      db.collection("teams").createIndex({ email: 1 }, { unique: true }),
      db.collection("teams").createIndex({ status: 1, points: -1 }),
      db.collection("admins").createIndex({ username: 1 }, { unique: true }),
      db.collection("teamTasks").createIndex({ teamId: 1, round: 1 }),
      db.collection("approvals").createIndex({ status: 1, requestedAt: 1 }),
      db.collection("approvals").createIndex(
        { teamId: 1, refId: 1 },
        { unique: true, partialFilterExpression: { status: "pending" } },
      ),
      db.collection("auditLog").createIndex({ at: -1 }),
      db.collection("rollbacks").createIndex({ createdAt: -1 }),
    ]);
  } catch (error) {
    // Most likely pre-existing duplicate rows; the app keeps running and the log says why.
    console.error("[db] index setup skipped:", (error as Error).message);
  }
}

function connect(): Promise<MongoClient> {
  if (!globalThis.__heistMongo) {
    const client = new MongoClient(URI as string, {
      serverSelectionTimeoutMS: 10_000,
    });
    globalThis.__heistMongo = client.connect().then(async (c) => {
      await ensureIndexes(c.db(DB_NAME));
      return c;
    });
  }
  return globalThis.__heistMongo;
}

export async function getDb(): Promise<Db> {
  // `io()` keeps the Mongo driver (which calls `new Date()` internally) out of
  // the prerender pass. It resolves immediately in server actions and requests,
  // and suspends the surrounding <Suspense> boundary while prerendering.
  await io();
  const client = await connect();
  return client.db(DB_NAME);
}

export async function ping(): Promise<boolean> {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}
