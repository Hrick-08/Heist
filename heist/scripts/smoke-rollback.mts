/*
 * Smoke test for the admin rollback: advance the real round, then roll it back,
 * and verify every mutable collection is byte-identical to before.
 *
 * Safe because the snapshot restore is exact: after a successful rollback the
 * database is in the same state it had before the test. If anything fails
 * halfway, the restore point stays in `rollbacks` and the admin "Undo" button
 * will consume it.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

// Load .env the same way Next does (plain KEY=VALUE lines).
const env = readFileSync(path.join(process.cwd(), ".env"), "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && process.env[m[1]] === undefined) {
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const { getEventState } = await import("../lib/game");
const { teamsCol, teamTasksCol, missionsCol, approvalsCol, stateCol, rollbacksCol } =
  await import("../lib/collections");
const { withRollback, rollbackLast } = await import("../lib/rollback");

const state = await getEventState();
console.log(`event: round ${state.currentRound}/${state.totalRounds}, ended=${state.eventEnded}`);
if (state.eventEnded) {
  console.log("SKIP: event already ended — advance is refused, nothing to test.");
  process.exit(0);
}

const selected = await (await teamsCol()).countDocuments({ status: "selected" });
if (selected < 2) {
  console.log(`SKIP: only ${selected} selected team(s) — need at least 2 to advance.`);
  process.exit(0);
}

async function captureAll(): Promise<Record<string, unknown[]>> {
  const cols = {
    teams: teamsCol,
    teamTasks: teamTasksCol,
    missions: missionsCol,
    approvals: approvalsCol,
    state: stateCol,
  };
  const out: Record<string, unknown[]> = {};
  for (const [name, get] of Object.entries(cols)) {
    const c = await get();
    out[name] = await c.find({}).toArray();
  }
  return out;
}

const before = await captureAll();

console.log("\n-- advance (with rollback capture) --");
const advance = await withRollback("Smoke advance", "round", "smoke-test", () =>
  import("../lib/game").then((g) => g.advanceRound()),
);
console.log("ok:", advance.ok, "|", advance.message);

const mid = await getEventState();
console.log(`round moved: ${state.currentRound} -> ${mid.currentRound}`);

console.log("\n-- rollback --");
const rb = await rollbackLast("smoke-test");
console.log("ok:", rb.ok, "|", rb.message);

const after = await captureAll();
const same = (a: unknown[], b: unknown[]) => JSON.stringify(a) === JSON.stringify(b);
let allGood = true;
for (const name of Object.keys(before)) {
  const ok = same(before[name], after[name]);
  allGood = allGood && ok;
  console.log(`${name}: ${before[name].length} docs, identical=${ok}`);
}

const leftover = await (await rollbacksCol()).countDocuments({});
console.log(`\nrollback stack leftovers: ${leftover}`);
console.log(allGood && leftover === 0 ? "PASS: exact restore" : "FAIL: state differs");
process.exit(allGood && leftover === 0 ? 0 : 1);
