import "server-only";

import {
  approvalsCol,
  missionsCol,
  rollbacksCol,
  stateCol,
  teamTasksCol,
  teamsCol,
} from "./collections";
import { DEFAULT_STATE, logAudit } from "./game";
import type { GameSnapshot, RollbackKind, RollbackRecord } from "./types";

export interface ReversibleResult {
  ok: boolean;
  message: string;
}

/** The Undo button only ever offers the newest point, so keep a small window. */
const ROLLBACK_KEEP = 10;

/** Copy every mutable collection before an operator action touches it. */
async function captureGame(): Promise<GameSnapshot> {
  const [teams, teamTasks, missions, approvals, eventState] = await Promise.all([
    teamsCol().then((c) => c.find({}).toArray()),
    teamTasksCol().then((c) => c.find({}).toArray()),
    missionsCol().then((c) => c.find({}).toArray()),
    approvalsCol().then((c) => c.find({}).toArray()),
    stateCol().then((c) => c.findOne({ _id: "state" })),
  ]);
  return { teams, teamTasks, missions, approvals, eventState };
}

/**
 * Run a destructive operator action with a restore point taken first.
 * A failed (or thrown) action discards its own point so the undo stack never
 * offers a snapshot that does not correspond to a completed action.
 */
export async function withRollback<T extends ReversibleResult>(
  label: string,
  kind: RollbackKind,
  actor: string,
  action: () => Promise<T>,
): Promise<T> {
  const col = await rollbacksCol();
  const record: RollbackRecord = {
    label: label.slice(0, 240),
    kind,
    actor,
    createdAt: new Date(),
    snapshot: await captureGame(),
  };
  const { insertedId } = await col.insertOne(record);

  let result: T;
  try {
    result = await action();
  } catch (error) {
    await col.deleteOne({ _id: insertedId });
    throw error;
  }
  if (!result.ok) await col.deleteOne({ _id: insertedId });
  await pruneRollbacks(col);
  return result;
}

/** Keep only the newest `ROLLBACK_KEEP` points; older full copies are dead weight. */
async function pruneRollbacks(col: Awaited<ReturnType<typeof rollbacksCol>>): Promise<void> {
  const count = await col.countDocuments({});
  const excess = count - ROLLBACK_KEEP;
  if (excess <= 0) return;
  const oldest = await col
    .find({})
    .sort({ createdAt: 1, _id: 1 })
    .limit(excess)
    .toArray();
  if (oldest.length > 0) {
    await col.deleteMany({ _id: { $in: oldest.map((r) => r._id) } });
  }
}

/** The next restore point the Undo button would consume. */
export async function getLatestRollback(): Promise<{
  id: string;
  label: string;
  kind: RollbackKind;
  at: number;
} | null> {
  const record = await (await rollbacksCol()).findOne(
    {},
    { sort: { createdAt: -1, _id: -1 }, projection: { label: 1, kind: 1, createdAt: 1 } },
  );
  if (!record) return null;
  return {
    id: String(record._id),
    label: record.label,
    kind: record.kind,
    at: record.createdAt.getTime(),
  };
}

/** Restore the most recent snapshot and consume it, leaving older points intact. */
export async function rollbackLast(actor: string): Promise<ReversibleResult> {
  const col = await rollbacksCol();
  const record = await col.findOne({}, { sort: { createdAt: -1, _id: -1 } });
  if (!record) return { ok: false, message: "Nothing to roll back — no restore point yet." };

  const s = record.snapshot;
  try {
    const [teams, teamTasks, missions, approvals, state] = await Promise.all([
      teamsCol(),
      teamTasksCol(),
      missionsCol(),
      approvalsCol(),
      stateCol(),
    ]);

    await Promise.all([
      teams.deleteMany({}),
      teamTasks.deleteMany({}),
      missions.deleteMany({}),
      approvals.deleteMany({}),
      state.deleteMany({}),
    ]);

    if (s.teams.length) await teams.insertMany(s.teams);
    if (s.teamTasks.length) await teamTasks.insertMany(s.teamTasks);
    if (s.missions.length) await missions.insertMany(s.missions);
    if (s.approvals.length) await approvals.insertMany(s.approvals);
    // When the state doc was absent at capture time, restore the same synthesized
    // default getEventState() would produce, so a restore never silently resets it.
    await state.insertOne(
      s.eventState ?? { _id: "state", ...DEFAULT_STATE, updatedAt: new Date() },
    );

    // Only consume the point once every collection has been restored.
    await col.deleteOne({ _id: record._id });
    await logAudit(
      actor,
      "rollback",
      "",
      `Rolled back "${record.label}" (restore point created by ${record.actor}).`,
    );
    return {
      ok: true,
      message: `Rolled back: ${record.label}. The game is back where it was before that action.`,
    };
  } catch (error) {
    console.error("Rollback failed while restoring the snapshot:", error);
    return {
      ok: false,
      message: "Rollback failed while restoring the snapshot. Nothing was consumed — check the server log and try again.",
    };
  }
}
