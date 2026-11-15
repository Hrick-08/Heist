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

function connect(): Promise<MongoClient> {
  if (!globalThis.__heistMongo) {
    const client = new MongoClient(URI as string, {
      serverSelectionTimeoutMS: 10_000,
    });
    globalThis.__heistMongo = client.connect();
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
