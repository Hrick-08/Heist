import { readFileSync } from "node:fs";
import path from "node:path";
const env = readFileSync(path.join(process.cwd(), ".env"), "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { rollbacksCol } = await import("../lib/collections");
const col = await rollbacksCol();
const rows = await col.find({}).sort({ createdAt: -1 }).toArray();
console.log(`stack depth: ${rows.length}`);
for (const r of rows) {
  console.log(
    `- ${new Date(r.createdAt).toISOString()} | kind=${r.kind} | actor=${r.actor} | "${r.label}"`,
  );
}
