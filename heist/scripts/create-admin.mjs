// Creates (or resets) a control-room operator without needing a login first.
// Usage: DATABASE=... node scripts/create-admin.mjs <username> <passcode> ["Display name"]
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { MongoClient } from "mongodb";

const [username, password, name = "Event Control"] = process.argv.slice(2);
if (!process.env.DATABASE) fail("DATABASE is not set.");
if (!username || !password) fail('Usage: node scripts/create-admin.mjs <username> <passcode> ["Display name"]');
if (password.length < 12) fail("Use a passcode of at least 12 characters.");

function fail(message) {
  console.error(message);
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const derived = await promisify(scrypt)(password, salt, 64);
const client = new MongoClient(process.env.DATABASE);
try {
  await client.connect();
  const admins = client.db(process.env.DATABASE_NAME || "last-heist").collection("admins");
  await admins.updateOne(
    { username: username.trim().toLowerCase() },
    {
      $set: { passwordHash: `${salt}:${derived.toString("hex")}`, name },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
  console.log(`Operator "${username.trim().toLowerCase()}" is ready.`);
} finally {
  await client.close();
}
