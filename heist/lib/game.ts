import "server-only";

import { ObjectId } from "mongodb";

import {
  adminsCol,
  approvalsCol,
  auditCol,
  missionsCol,
  stateCol,
  tasksCol,
  teamTasksCol,
  teamsCol,
  type AdminUser,
} from "./collections";
import { hashPassword } from "./auth";
import type {
  ApprovalKind,
  ApprovalRequest,
  ApprovalView,
  DexterMission,
  EventState,
  LeaderboardRow,
  Member,
  MissionRow,
  Task,
  TaskRow,
  TaskType,
  Team,
  TeamRow,
  TeamStatus,
  TeamTask,
} from "./types";

export type TeamTaskView = TeamTask & { task: Task };

export const DEFAULT_STATE: Omit<EventState, "_id" | "updatedAt"> = {
  currentRound: 1,
  totalRounds: 4,
  maxTeams: 40,
  physicalPerRound: 3,
  technicalPerRound: 1,
  hintCostMultiplier: 1,
  wantedRemovalCost: 2500,
  endgameCost: 5000,
  eventLive: true,
  eventEnded: false,
  championTeamId: null,
};

/* ------------------------------------------------------------------ */
/* Event state                                                         */
/* ------------------------------------------------------------------ */

/** Stable fallback so a missing state document never destabilises a render. */
const FALLBACK_UPDATED_AT = new Date("2024-01-01T00:00:00.000Z");

export async function getEventState(): Promise<EventState> {
  const col = await stateCol();
  const existing = await col.findOne({ _id: "state" });
  if (existing) return existing;
  return {
    _id: "state",
    ...DEFAULT_STATE,
    updatedAt: FALLBACK_UPDATED_AT,
  };
}

export async function updateEventState(
  patch: Partial<Omit<EventState, "_id">>,
): Promise<EventState> {
  const col = await stateCol();
  await col.updateOne(
    { _id: "state" },
    { $set: { ...patch, updatedAt: new Date() } },
    { upsert: true },
  );
  return getEventState();
}

/* ------------------------------------------------------------------ */
/* Teams                                                               */
/* ------------------------------------------------------------------ */

export async function getTeam(teamId: string): Promise<Team | null> {
  const col = await teamsCol();
  return col.findOne({ teamId });
}

export async function listTeams(): Promise<Team[]> {
  const col = await teamsCol();
  return col.find({}).sort({ createdAt: 1 }).toArray();
}

export async function listSelectedTeams(): Promise<Team[]> {
  const col = await teamsCol();
  return col
    .find({ status: { $in: ["selected", "champion"] } })
    .sort({ createdAt: 1 })
    .toArray();
}

export async function countTeams(): Promise<number> {
  const col = await teamsCol();
  return col.countDocuments();
}

export async function nextTeamId(): Promise<string> {
  const col = await teamsCol();
  const rows = await col.find({}, { projection: { teamId: 1 } }).toArray();
  // Numeric, not alphabetical: TLH-100 must come after TLH-99.
  const highest = rows.reduce((max, doc) => {
    const num = Number(doc.teamId.split("-")[1] ?? "0");
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  return `TLH-${String(highest + 1).padStart(2, "0")}`;
}

export interface RegisterTeamInput {
  name: string;
  email: string;
  password: string;
  leader: Member & { photo: string };
  members: Member[];
}

export async function registerTeam(
  input: RegisterTeamInput,
): Promise<{ team: Team; created: boolean }> {
  const col = await teamsCol();
  const state = await getEventState();
  const email = input.email.toLowerCase();
  const passwordHash = await hashPassword(input.password);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await col.findOne({ email });
    if (existing) return { team: existing, created: false };

    const teamId = await nextTeamId();
    const selectedCount = await col.countDocuments({ status: "selected" });
    const status: TeamStatus =
      selectedCount < state.maxTeams ? "selected" : "waitlisted";
    const now = new Date();
    const team: Team = {
      teamId,
      name: input.name,
      email,
      passwordHash,
      leader: input.leader,
      members: input.members,
      status,
      points: 0,
      money: 0,
      wanted: false,
      wantedAt: null,
      round: state.currentRound,
      eliminatedInRound: null,
      finalPoints: null,
      hintsUsed: 0,
      endgameUnlocked: false,
      dexterCompleted: [],
      createdAt: now,
      updatedAt: now,
    };
    try {
      await col.insertOne(team);
    } catch (error) {
      // Unique index hit: another registration took this ID or email a moment ago.
      if ((error as { code?: number }).code === 11000) continue;
      throw error;
    }
    if (status === "selected") {
      // Late arrivals still get this round's board.
      await assignRoundTasks(state.currentRound, [teamId]);
    }
    return { team, created: true };
  }
  throw new Error("Could not allocate a Team ID. Try again.");
}

export async function updateTeam(
  teamId: string,
  patch: Partial<Team>,
): Promise<void> {
  const col = await teamsCol();
  await col.updateOne(
    { teamId },
    { $set: { ...patch, updatedAt: new Date() } },
  );
}

/** Why a crew cannot spend or submit right now, or null when play is open. */
function playBlocker(state: EventState, team: Team | null): string | null {
  if (!team) return "Team not found.";
  if (state.eventEnded) return "The event has ended. Scores are locked.";
  if (!state.eventLive) return "The event is paused. Try again in a moment.";
  if (team.status !== "selected" && team.status !== "champion") {
    return "Your crew is not in play.";
  }
  return null;
}

/** Append-only record of every manual change an operator makes. */
export async function logAudit(
  actor: string,
  action: string,
  teamId: string,
  detail: string,
): Promise<void> {
  const col = await auditCol();
  await col.insertOne({ actor, action, teamId, detail, at: new Date() });
}

export async function adjustTeamScore(
  teamId: string,
  deltaPoints: number,
  deltaMoney: number,
): Promise<void> {
  const col = await teamsCol();
  await col.updateOne(
    { teamId },
    {
      $inc: { points: deltaPoints, money: deltaMoney },
      $set: { updatedAt: new Date() },
    },
  );
}

export async function setTeamStatus(
  teamId: string,
  status: TeamStatus,
): Promise<void> {
  const col = await teamsCol();
  await col.updateOne(
    { teamId },
    { $set: { status, updatedAt: new Date() } },
  );
}

/* ------------------------------------------------------------------ */
/* Task pool                                                           */
/* ------------------------------------------------------------------ */

export async function listTasks(): Promise<Task[]> {
  const col = await tasksCol();
  return col.find({}).sort({ round: 1, type: 1, createdAt: 1 }).toArray();
}

export async function getTask(id: string): Promise<Task | null> {
  const col = await tasksCol();
  if (!ObjectId.isValid(id)) return null;
  return col.findOne({ _id: new ObjectId(id) });
}

export interface TaskInput {
  title: string;
  description: string;
  type: TaskType;
  round: number;
  points: number;
  money: number;
  hint: string;
  hintCost: number;
  isEndgame: boolean;
  active: boolean;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const col = await tasksCol();
  const now = new Date();
  const task: Task = { ...input, createdAt: now, updatedAt: now };
  await col.insertOne(task);
  return task;
}

export async function updateTask(
  id: string,
  patch: Partial<TaskInput>,
): Promise<void> {
  const col = await tasksCol();
  if (!ObjectId.isValid(id)) return;
  await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
  );
}

export async function deleteTask(id: string): Promise<void> {
  const col = await tasksCol();
  if (!ObjectId.isValid(id)) return;
  await col.deleteOne({ _id: new ObjectId(id) });
  const tt = await teamTasksCol();
  await tt.deleteMany({ taskId: new ObjectId(id) });
}

export async function toggleTaskActive(id: string): Promise<void> {
  const col = await tasksCol();
  if (!ObjectId.isValid(id)) return;
  const task = await col.findOne({ _id: new ObjectId(id) });
  if (!task) return;
  await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { active: !task.active, updatedAt: new Date() } },
  );
}

/* ------------------------------------------------------------------ */
/* Team task allotments                                                */
/* ------------------------------------------------------------------ */

export async function getTeamTasks(teamId: string): Promise<TeamTaskView[]> {
  const tt = await teamTasksCol();
  const allotments = await tt.find({ teamId }).sort({ round: 1, createdAt: 1 }).toArray();
  if (allotments.length === 0) return [];
  const pool = await tasksCol();
  const ids = allotments.map((a) => a.taskId).filter((id) => id instanceof ObjectId);
  const tasks = await pool.find({ _id: { $in: ids } }).toArray();
  const byId = new Map(tasks.map((t) => [String(t._id), t]));
  return allotments.map((a) => ({
    ...a,
    task: byId.get(String(a.taskId)) as Task,
  }));
}

export async function getAllotments(): Promise<TeamTask[]> {
  const tt = await teamTasksCol();
  return tt.find({}).toArray();
}

export async function markTaskComplete(
  teamId: string,
  teamTaskId: string,
  adminName: string,
): Promise<{ ok: boolean; message: string }> {
  const tt = await teamTasksCol();
  if (!ObjectId.isValid(teamTaskId)) {
    return { ok: false, message: "Invalid task reference." };
  }
  const id = new ObjectId(teamTaskId);
  // One atomic claim: only the first caller flips the task, so points are paid once.
  const claimed = await tt.findOneAndUpdate(
    { _id: id, teamId, status: { $ne: "completed" } },
    { $set: { status: "completed", completedAt: new Date(), completedBy: adminName } },
    { returnDocument: "before" },
  );
  if (!claimed) {
    const exists = await tt.findOne({ _id: id, teamId });
    return {
      ok: false,
      message: exists ? "Task already completed." : "Task not found for this team.",
    };
  }
  await adjustTeamScore(teamId, claimed.points, claimed.money);
  await closeRequestsFor("target", id, adminName);
  return {
    ok: true,
    message: `Task completed. +${claimed.points} pts, +$${claimed.money}.`,
  };
}

export async function unmarkTask(
  teamId: string,
  teamTaskId: string,
  adminName = "operator",
): Promise<{ ok: boolean; message: string }> {
  const tt = await teamTasksCol();
  if (!ObjectId.isValid(teamTaskId)) {
    return { ok: false, message: "Invalid task reference." };
  }
  const id = new ObjectId(teamTaskId);
  const claimed = await tt.findOneAndUpdate(
    { _id: id, teamId, status: "completed" },
    { $set: { status: "pending", completedAt: null, completedBy: null } },
    { returnDocument: "before" },
  );
  if (!claimed) {
    const exists = await tt.findOne({ _id: id, teamId });
    return {
      ok: false,
      message: exists ? "Task is not completed." : "Task not found for this team.",
    };
  }
  await adjustTeamScore(teamId, -claimed.points, -claimed.money);
  // Cash already spent on clues can make the reversal dip below zero; floor it there.
  const teams = await teamsCol();
  await teams.updateOne({ teamId, points: { $lt: 0 } }, { $set: { points: 0 } });
  await teams.updateOne({ teamId, money: { $lt: 0 } }, { $set: { money: 0 } });
  await logAudit(adminName, "unmark-task", teamId, `-${claimed.points} pts, -$${claimed.money}`);
  return { ok: true, message: "Task reverted to pending." };
}

export async function purchaseHint(
  teamId: string,
  teamTaskId: string,
): Promise<{ ok: boolean; message: string }> {
  if (!ObjectId.isValid(teamTaskId)) {
    return { ok: false, message: "Invalid task reference." };
  }
  const id = new ObjectId(teamTaskId);
  const state = await getEventState();
  const team = await getTeam(teamId);
  const blocked = playBlocker(state, team);
  if (blocked) return { ok: false, message: blocked };

  const tt = await teamTasksCol();
  const allotment = await tt.findOne({ _id: id, teamId });
  if (!allotment) return { ok: false, message: "Task not found." };
  if (allotment.status === "completed") {
    return { ok: false, message: "This task is already verified." };
  }
  if (allotment.hintPurchased) {
    return { ok: false, message: "Hint already unlocked." };
  }
  const pool = await tasksCol();
  const task = await pool.findOne({ _id: allotment.taskId });
  if (!task) return { ok: false, message: "Task missing." };
  const cost = Math.max(0, Math.round(task.hintCost * state.hintCostMultiplier));

  // Claim the clue first, then debit with a balance guard. If the debit misses, hand the clue back.
  const claimed = await tt.findOneAndUpdate(
    { _id: id, teamId, hintPurchased: false, status: { $ne: "completed" } },
    { $set: { hintPurchased: true } },
  );
  if (!claimed) return { ok: false, message: "Hint already unlocked." };

  const teams = await teamsCol();
  const paid = await teams.findOneAndUpdate(
    { teamId, money: { $gte: cost } },
    { $inc: { money: -cost, hintsUsed: 1 }, $set: { updatedAt: new Date() } },
  );
  if (!paid) {
    await tt.updateOne({ _id: id }, { $set: { hintPurchased: false } });
    return {
      ok: false,
      message: `Not enough cash. You need $${cost} to buy this clue.`,
    };
  }
  return { ok: true, message: `Clue unlocked for $${cost}.` };
}

export async function assignEndgameTask(
  teamId: string,
): Promise<{ ok: boolean; message: string }> {
  const pool = await tasksCol();
  const tt = await teamTasksCol();
  const existing = await tt.findOne({ teamId, isEndgame: true });
  if (existing) return { ok: false, message: "Endgame vault already opened." };
  const used = await tt.find({ isEndgame: true }).toArray();
  const usedIds = new Set(used.map((u) => String(u.taskId)));
  const candidates = await pool.find({ isEndgame: true, active: true }).toArray();
  const free = candidates.filter((c) => !usedIds.has(String(c._id)));
  const task = free[0] ?? candidates[0];
  if (!task) return { ok: false, message: "No endgame task available." };
  const state = await getEventState();
  await tt.insertOne({
    teamId,
    taskId: task._id as ObjectId,
    round: state.currentRound,
    type: "technical",
    status: "pending",
    points: task.points,
    money: task.money,
    hintPurchased: false,
    isEndgame: true,
    completedAt: null,
    completedBy: null,
    createdAt: new Date(),
  });
  return { ok: true, message: "The vault is open. Final task assigned." };
}

export async function unlockEndgame(
  teamId: string,
): Promise<{ ok: boolean; message: string }> {
  const state = await getEventState();
  const team = await getTeam(teamId);
  const blocked = playBlocker(state, team);
  if (blocked || !team) return { ok: false, message: blocked ?? "Team not found." };
  if (team.endgameUnlocked) {
    return { ok: false, message: "Endgame already unlocked." };
  }
  if (team.money < state.endgameCost) {
    return {
      ok: false,
      message: `You need $${state.endgameCost} to fund the endgame heist.`,
    };
  }
  const pool = await tasksCol();
  if ((await pool.countDocuments({ isEndgame: true, active: true })) === 0) {
    return { ok: false, message: "The vault is not ready yet. Nothing was charged." };
  }

  // Charge and flag in one guarded step, so a double tap cannot pay twice.
  const teams = await teamsCol();
  const paid = await teams.findOneAndUpdate(
    { teamId, endgameUnlocked: false, money: { $gte: state.endgameCost } },
    { $inc: { money: -state.endgameCost }, $set: { endgameUnlocked: true, updatedAt: new Date() } },
  );
  if (!paid) return { ok: false, message: "Endgame already unlocked." };

  const assigned = await assignEndgameTask(teamId);
  if (!assigned.ok) {
    // Never keep the cash without giving the vault: put everything back.
    await teams.updateOne(
      { teamId },
      { $inc: { money: state.endgameCost }, $set: { endgameUnlocked: false, updatedAt: new Date() } },
    );
    return { ok: false, message: `${assigned.message} Nothing was charged.` };
  }
  return { ok: true, message: `Endgame unlocked for $${state.endgameCost}.` };
}

export async function removeWanted(
  teamId: string,
): Promise<{ ok: boolean; message: string }> {
  const state = await getEventState();
  const team = await getTeam(teamId);
  const blocked = playBlocker(state, team);
  if (blocked || !team) return { ok: false, message: blocked ?? "Team not found." };
  if (!team.wanted) return { ok: false, message: "Your crew is not wanted." };

  const teams = await teamsCol();
  const paid = await teams.findOneAndUpdate(
    { teamId, wanted: true, money: { $gte: state.wantedRemovalCost } },
    {
      $inc: { money: -state.wantedRemovalCost },
      $set: { wanted: false, wantedAt: null, updatedAt: new Date() },
    },
  );
  if (!paid) {
    const fresh = await getTeam(teamId);
    if (fresh && !fresh.wanted) return { ok: false, message: "Your crew is not wanted." };
    return {
      ok: false,
      message: `Bribing the cops costs $${state.wantedRemovalCost}. You have $${fresh?.money ?? 0}.`,
    };
  }
  return { ok: true, message: "Bribe paid. You are off the wanted list." };
}

/* ------------------------------------------------------------------ */
/* Leaderboard + wanted                                                */
/* ------------------------------------------------------------------ */

export async function getLeaderboard(
  limit?: number,
): Promise<LeaderboardRow[]> {
  const col = await teamsCol();
  const teams = await col
    .find({ status: { $in: ["selected", "eliminated", "champion"] } })
    .toArray();
  const tt = await teamTasksCol();
  const completed = await tt
    .aggregate<{ _id: string; count: number }>([
      { $match: { status: "completed" } },
      { $group: { _id: "$teamId", count: { $sum: 1 } } },
    ])
    .toArray();
  const completedMap = new Map(completed.map((c) => [c._id, c.count]));
  const rows = teams
    .map((t) => ({
      rank: 0,
      teamId: t.teamId,
      name: t.name,
      points: t.points,
      completed: completedMap.get(t.teamId) ?? 0,
      status: t.status,
      isWanted: t.wanted,
    }))
    // Money is deliberately excluded from the ranking.
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.completed - a.completed ||
        a.teamId.localeCompare(b.teamId),
    );
  rows.forEach((row, index) => {
    row.rank = index + 1;
  });
  return limit ? rows.slice(0, limit) : rows;
}

export async function getTotals(): Promise<{
  crews: number;
  points: number;
  money: number;
}> {
  const col = await teamsCol();
  const rows = await col
    .find({ status: { $in: ["selected", "eliminated", "champion"] } })
    .project<{ points: number; money: number }>({ points: 1, money: 1 })
    .toArray();
  return {
    crews: rows.length,
    points: rows.reduce((sum, r) => sum + (r.points ?? 0), 0),
    money: rows.reduce((sum, r) => sum + (r.money ?? 0), 0),
  };
}

export async function getWantedTeams(): Promise<Team[]> {
  const col = await teamsCol();
  return col.find({ wanted: true }).sort({ points: -1 }).toArray();
}

export function toTeamRow(team: Team): TeamRow {
  return {
    teamId: team.teamId,
    name: team.name,
    email: team.email,
    leaderName: team.leader.name,
    status: team.status,
    points: team.points,
    money: team.money,
    wanted: team.wanted,
    round: team.round,
    membersCount: team.members.length + 1,
    eliminatedInRound: team.eliminatedInRound,
    createdAt: team.createdAt,
    hasPhoto: Boolean(team.leader.photo),
    finalPoints: team.finalPoints ?? null,
  };
}

export function toTaskRow(task: Task): TaskRow {
  return {
    id: String(task._id),
    title: task.title,
    description: task.description,
    type: task.type,
    round: task.round,
    points: task.points,
    money: task.money,
    hint: task.hint,
    hintCost: task.hintCost,
    isEndgame: task.isEndgame,
    active: task.active,
  };
}

export function toMissionRow(mission: DexterMission): MissionRow {
  return {
    id: String(mission._id),
    title: mission.title,
    description: mission.description,
    round: mission.round,
    difficulty: mission.difficulty,
    points: mission.points,
    money: mission.money,
    scope: mission.scope,
    teamIds: mission.teamIds,
    active: mission.active,
    completions: mission.completions ?? 0,
  };
}

export interface CompletionFeedItem {
  teamId: string;
  teamName: string;
  title: string;
  completedAt: Date | null;
  completedBy: string | null;
  points: number;
  money: number;
}

export async function getRecentCompletions(
  limit = 12,
): Promise<CompletionFeedItem[]> {
  const tt = await teamTasksCol();
  const rows = await tt
    .find({ status: "completed" })
    .sort({ completedAt: -1 })
    .limit(limit)
    .toArray();
  if (rows.length === 0) return [];

  const pool = await tasksCol();
  const taskDocs = await pool
    .find({ _id: { $in: rows.map((r) => r.taskId) } })
    .toArray();
  const taskMap = new Map(taskDocs.map((t) => [String(t._id), t]));

  const col = await teamsCol();
  const teamDocs = await col
    .find({ teamId: { $in: [...new Set(rows.map((r) => r.teamId))] } })
    .toArray();
  const teamMap = new Map(teamDocs.map((t) => [t.teamId, t]));

  return rows.map((r) => ({
    teamId: r.teamId,
    teamName: teamMap.get(r.teamId)?.name ?? r.teamId,
    title: taskMap.get(String(r.taskId))?.title ?? "Task",
    completedAt: r.completedAt,
    completedBy: r.completedBy,
    points: r.points,
    money: r.money,
  }));
}

/** Marks the top N teams on the leaderboard as wanted. */
export async function syncWantedFromLeaderboard(
  topN = 3,
): Promise<string[]> {
  const board = await getLeaderboard();
  const top = board.slice(0, topN).map((r) => r.teamId);
  const col = await teamsCol();
  const teams = await col.find({ wanted: true }).toArray();
  for (const team of teams) {
    if (!top.includes(team.teamId)) {
      await col.updateOne(
        { teamId: team.teamId },
        { $set: { wanted: false, wantedAt: null, updatedAt: new Date() } },
      );
    }
  }
  for (const teamId of top) {
    await col.updateOne(
      { teamId },
      { $set: { wanted: true, wantedAt: new Date(), updatedAt: new Date() } },
    );
  }
  return top;
}

export async function setWanted(
  teamId: string,
  wanted: boolean,
): Promise<void> {
  const col = await teamsCol();
  await col.updateOne(
    { teamId },
    {
      $set: {
        wanted,
        wantedAt: wanted ? new Date() : null,
        updatedAt: new Date(),
      },
    },
  );
}

/* ------------------------------------------------------------------ */
/* Dexter missions                                                     */
/* ------------------------------------------------------------------ */

export async function listMissions(): Promise<DexterMission[]> {
  const col = await missionsCol();
  return col.find({}).sort({ round: 1, createdAt: -1 }).toArray();
}

export async function getMission(id: string): Promise<DexterMission | null> {
  const col = await missionsCol();
  if (!ObjectId.isValid(id)) return null;
  return col.findOne({ _id: new ObjectId(id) });
}

export interface MissionInput {
  title: string;
  description: string;
  round: number;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  money: number;
  scope: "all" | "selected";
  teamIds: string[];
  active: boolean;
}

export async function createMission(
  input: MissionInput,
): Promise<DexterMission> {
  const col = await missionsCol();
  const now = new Date();
  const mission: DexterMission = {
    ...input,
    completions: 0,
    createdAt: now,
    updatedAt: now,
  };
  await col.insertOne(mission);
  return mission;
}

export async function updateMission(
  id: string,
  patch: Partial<MissionInput>,
): Promise<void> {
  const col = await missionsCol();
  if (!ObjectId.isValid(id)) return;
  await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
  );
}

export async function deleteMission(id: string): Promise<void> {
  const col = await missionsCol();
  if (!ObjectId.isValid(id)) return;
  await col.deleteOne({ _id: new ObjectId(id) });
}

/** Missions visible to a given team for the given round. */
export async function getVisibleMissions(
  teamId: string,
  round: number,
): Promise<DexterMission[]> {
  const col = await missionsCol();
  const missions = await col
    .find({ active: true, round: { $lte: round } })
    .sort({ createdAt: -1 })
    .toArray();
  return missions.filter(
    (m) => m.scope === "all" || m.teamIds.includes(teamId),
  );
}

export async function completeMission(
  missionId: string,
  teamId: string,
  adminName: string,
): Promise<{ ok: boolean; message: string }> {
  const col = await missionsCol();
  if (!ObjectId.isValid(missionId)) {
    return { ok: false, message: "Invalid mission reference." };
  }
  const id = new ObjectId(missionId);
  const mission = await col.findOne({ _id: id });
  if (!mission) return { ok: false, message: "Mission not found." };
  const teams = await teamsCol();
  if (!(await teams.findOne({ teamId }, { projection: { _id: 1 } }))) {
    return { ok: false, message: "Team not found." };
  }
  // $addToSet behind a "not yet in the list" guard: concurrent sign-offs cannot overwrite each other.
  const claimed = await teams.findOneAndUpdate(
    { teamId, dexterCompleted: { $ne: String(id) } },
    { $addToSet: { dexterCompleted: String(id) }, $set: { updatedAt: new Date() } },
  );
  if (!claimed) {
    return { ok: false, message: "Mission already completed by this team." };
  }
  await col.updateOne(
    { _id: id },
    { $inc: { completions: 1 }, $set: { updatedAt: new Date() } },
  );
  await adjustTeamScore(teamId, mission.points, mission.money);
  await closeRequestsFor("dexter", id, adminName);
  return {
    ok: true,
    message: `Dexter mission logged by ${adminName}. +${mission.points} pts, +$${mission.money}.`,
  };
}

/* ------------------------------------------------------------------ */
/* Approval requests                                                   */
/* ------------------------------------------------------------------ */

/**
 * A crew asks the desk to sign off on a task or a Dexter mission.
 * Only one live request may exist per crew + task.
 */
export async function requestApproval(
  kind: ApprovalKind,
  teamId: string,
  refId: string,
  note = "",
): Promise<{ ok: boolean; message: string }> {
  if (!ObjectId.isValid(refId)) {
    return { ok: false, message: "Invalid request reference." };
  }
  const id = new ObjectId(refId);
  const blocked = playBlocker(await getEventState(), await getTeam(teamId));
  if (blocked) return { ok: false, message: blocked };
  const col = await approvalsCol();

  const existing = await col.findOne({ teamId, refId: id, status: "pending" });
  if (existing) {
    return { ok: false, message: "Already queued for the desk." };
  }

  if (kind === "target") {
    const allotment = await (await teamTasksCol()).findOne({
      _id: id,
      teamId,
    });
    if (!allotment) return { ok: false, message: "Task not found." };
    if (allotment.status === "completed") {
      return { ok: false, message: "This task is already verified." };
    }
  } else {
    const mission = await (await missionsCol()).findOne({ _id: id });
    if (!mission) return { ok: false, message: "Mission not found." };
    const team = await getTeam(teamId);
    if (team?.dexterCompleted.includes(String(id))) {
      return { ok: false, message: "This mission is already signed off." };
    }
  }

  try {
    await col.insertOne({
      kind,
      refId: id,
      teamId,
      status: "pending",
      note: note.slice(0, 300),
      requestedAt: new Date(),
      resolvedAt: null,
      resolvedBy: null,
    });
  } catch (error) {
    // The unique "one live request per crew + task" index caught a double tap.
    if ((error as { code?: number }).code === 11000) {
      return { ok: false, message: "Already queued for the desk." };
    }
    throw error;
  }

  return {
    ok: true,
    message:
      kind === "target"
        ? "Queued for the desk — an admin will verify your task."
        : "Queued for the desk — an admin will sign off your Dexter mission.",
  };
}

async function decorateApprovals(
  rows: ApprovalRequest[],
): Promise<ApprovalView[]> {
  if (rows.length === 0) return [];

  const crewIds = [...new Set(rows.map((r) => r.teamId))];
  const teams = await (await teamsCol())
    .find({ teamId: { $in: crewIds } })
    .toArray();
  const crewMap = new Map(teams.map((t) => [t.teamId, t]));

  const allotmentIds = rows
    .filter((r) => r.kind === "target")
    .map((r) => r.refId);
  const allotments = allotmentIds.length
    ? await (await teamTasksCol())
        .find({ _id: { $in: allotmentIds } })
        .toArray()
    : [];
  const allotmentMap = new Map(
    allotments.map((a) => [String(a._id), a] as const),
  );

  const pool = await tasksCol();
  const taskIds = allotments.map((a) => a.taskId);
  const tasks = taskIds.length
    ? await pool.find({ _id: { $in: taskIds } }).toArray()
    : [];
  const taskMap = new Map(tasks.map((t) => [String(t._id), t] as const));

  const missionIds = rows
    .filter((r) => r.kind === "dexter")
    .map((r) => r.refId);
  const missions = missionIds.length
    ? await (await missionsCol())
        .find({ _id: { $in: missionIds } })
        .toArray()
    : [];
  const missionMap = new Map(missions.map((m) => [String(m._id), m] as const));

  return rows.map((row) => {
    if (row.kind === "target") {
      const allotment = allotmentMap.get(String(row.refId));
      const task = allotment ? taskMap.get(String(allotment.taskId)) : undefined;
      return {
        id: String(row._id),
        kind: row.kind,
        refId: String(row.refId),
        teamId: row.teamId,
        crewName: crewMap.get(row.teamId)?.name ?? row.teamId,
        title: task?.title ?? "Task",
        description: task?.description ?? "",
        points: allotment?.points ?? task?.points ?? 0,
        money: allotment?.money ?? task?.money ?? 0,
        round: allotment?.round ?? task?.round ?? 0,
        kindLabel: "Task",
        note: row.note,
        status: row.status,
        requestedAt: row.requestedAt,
        resolvedAt: row.resolvedAt,
        resolvedBy: row.resolvedBy,
      };
    }

    const mission = missionMap.get(String(row.refId));
    return {
      id: String(row._id),
      kind: row.kind,
      refId: String(row.refId),
      teamId: row.teamId,
      crewName: crewMap.get(row.teamId)?.name ?? row.teamId,
      title: mission?.title ?? "Dexter mission",
      description: mission?.description ?? "",
      points: mission?.points ?? 0,
      money: mission?.money ?? 0,
      round: mission?.round ?? 0,
      kindLabel: "Dexter",
      note: row.note,
      status: row.status,
      requestedAt: row.requestedAt,
      resolvedAt: row.resolvedAt,
      resolvedBy: row.resolvedBy,
    };
  });
}

export async function listPendingApprovals(): Promise<ApprovalView[]> {
  const col = await approvalsCol();
  const rows = await col
    .find({ status: "pending" })
    .sort({ requestedAt: 1 })
    .toArray();
  return decorateApprovals(rows);
}

export async function listApprovalsForTeam(
  teamId: string,
): Promise<ApprovalView[]> {
  const col = await approvalsCol();
  const rows = await col
    .find({ teamId, status: "pending" })
    .sort({ requestedAt: 1 })
    .toArray();
  return decorateApprovals(rows);
}

export async function countPendingApprovals(): Promise<number> {
  const col = await approvalsCol();
  return col.countDocuments({ status: "pending" });
}

/** Closes a request without paying it out. */
export async function dismissApproval(
  id: string,
  adminName: string,
): Promise<{ ok: boolean; message: string }> {
  if (!ObjectId.isValid(id)) {
    return { ok: false, message: "Invalid request." };
  }
  const col = await approvalsCol();
  const closed = await col.findOneAndUpdate(
    { _id: new ObjectId(id), status: "pending" },
    { $set: { status: "dismissed", resolvedAt: new Date(), resolvedBy: adminName } },
  );
  if (!closed) return { ok: false, message: "Request already closed." };
  return { ok: true, message: "Request dismissed — nothing was paid out." };
}

/**
 * Signs off a request: the task is marked complete or the Dexter mission is
 * credited, and the payout lands on the crew.
 */
export async function approveRequest(
  id: string,
  adminName: string,
): Promise<{ ok: boolean; message: string }> {
  if (!ObjectId.isValid(id)) {
    return { ok: false, message: "Invalid request." };
  }
  const col = await approvalsCol();
  const oid = new ObjectId(id);
  // Claim the request so two operators (or two clicks) cannot both pay it out.
  const request = await col.findOneAndUpdate(
    { _id: oid, status: "pending" },
    { $set: { status: "approved", resolvedAt: new Date(), resolvedBy: adminName } },
    { returnDocument: "before" },
  );
  if (!request) {
    const exists = await col.findOne({ _id: oid });
    return {
      ok: false,
      message: exists ? "Request already closed." : "Request not found.",
    };
  }

  const result =
    request.kind === "target"
      ? await markTaskComplete(request.teamId, String(request.refId), adminName)
      : await completeMission(String(request.refId), request.teamId, adminName);

  if (!result.ok) {
    // Nothing was paid, so put the request back in the queue.
    await col.updateOne(
      { _id: oid },
      { $set: { status: "pending", resolvedAt: null, resolvedBy: null } },
    );
    return result;
  }
  return { ok: true, message: result.message };
}

/** Closes any live request for a task/mission once it has been signed off. */
async function closeRequestsFor(
  kind: ApprovalKind,
  refId: ObjectId,
  adminName: string,
): Promise<void> {
  const col = await approvalsCol();
  await col.updateMany(
    { kind, refId, status: "pending" },
    {
      $set: {
        status: "approved",
        resolvedAt: new Date(),
        resolvedBy: adminName,
      },
    },
  );
}

/* ------------------------------------------------------------------ */
/* Round flow                                                          */
/* ------------------------------------------------------------------ */

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Assigns the task set for a round.
 *
 * Physical tasks are shared by every team; technical tasks are handed out
 * one-to-one so a technical task is never given to two teams.
 *
 * Teams that already hold tasks for the round are skipped, so the function
 * can be called repeatedly (late registrations, manual re-allocation) without
 * handing anybody the same task twice.
 */
export async function assignRoundTasks(
  round: number,
  teamIds: string[],
): Promise<{ assigned: number; unassigned: number; skipped: number }> {
  const pool = await tasksCol();
  const tt = await teamTasksCol();
  const state = await getEventState();

  const existing = await tt.find({ round, isEndgame: false }).toArray();
  const teamsWithTargets = new Set(existing.map((a) => a.teamId));
  const technicalInUse = new Set(
    existing.filter((a) => a.type === "technical").map((a) => String(a.taskId)),
  );

  const candidates = await pool
    .find({ round, active: true, isEndgame: false })
    .toArray();
  const physical = shuffle(candidates.filter((t) => t.type === "physical"));
  const technical = shuffle(
    candidates.filter(
      (t) => t.type === "technical" && !technicalInUse.has(String(t._id)),
    ),
  );

  const physicalChosen = physical.slice(0, state.physicalPerRound);

  const now = new Date();
  const docs: TeamTask[] = [];
  const eligible = teamIds.filter((id) => !teamsWithTargets.has(id));
  const skipped = teamIds.length - eligible.length;

  for (const teamId of eligible) {
    for (const task of physicalChosen) {
      docs.push({
        teamId,
        taskId: task._id as ObjectId,
        round,
        type: "physical",
        status: "pending",
        points: task.points,
        money: task.money,
        hintPurchased: false,
        isEndgame: false,
        completedAt: null,
        completedBy: null,
        createdAt: now,
      });
    }
  }

  // Deal technical tasks one at a time so no task is ever shared.
  const perTeam = eligible.length
    ? Math.min(
        state.technicalPerRound,
        Math.floor(technical.length / eligible.length),
      )
    : 0;
  const assignments = new Map<string, Task[]>();
  let cursor = 0;
  for (let pass = 0; pass < perTeam; pass += 1) {
    for (const teamId of eligible) {
      const task = technical[cursor];
      cursor += 1;
      if (!task) break;
      const list = assignments.get(teamId) ?? [];
      list.push(task);
      assignments.set(teamId, list);
    }
  }
  if (perTeam === 0) {
    // Not enough tasks to give everybody one — hand them out one each to as
    // many crews as possible and report the rest.
    for (const teamId of eligible) {
      const task = technical[cursor];
      cursor += 1;
      if (!task) break;
      assignments.set(teamId, [task]);
    }
  }

  for (const [teamId, tasks] of assignments) {
    for (const task of tasks) {
      docs.push({
        teamId,
        taskId: task._id as ObjectId,
        round,
        type: "technical",
        status: "pending",
        points: task.points,
        money: task.money,
        hintPurchased: false,
        isEndgame: false,
        completedAt: null,
        completedBy: null,
        createdAt: now,
      });
    }
  }

  if (docs.length > 0) await tt.insertMany(docs);

  const unassigned = eligible.length - assignments.size;
  return {
    assigned: assignments.size,
    unassigned,
    skipped,
  };
}

export interface AdvanceRoundResult {
  ok: boolean;
  message: string;
  eliminated: string[];
  survivors: string[];
}

export async function advanceRound(): Promise<AdvanceRoundResult> {
  const state = await getEventState();
  if (state.eventEnded) {
    return { ok: false, message: "The event has already ended.", eliminated: [], survivors: [] };
  }
  const nextRound = state.currentRound + 1;
  if (nextRound > state.totalRounds) {
    return {
      ok: false,
      message: "All rounds are complete. Crown the champion instead.",
      eliminated: [],
      survivors: [],
    };
  }

  const col = await teamsCol();
  const alive = await col.find({ status: "selected" }).toArray();
  if (alive.length === 0) {
    return { ok: false, message: "No active teams to advance.", eliminated: [], survivors: [] };
  }

  const completed = await (await teamTasksCol())
    .aggregate<{ _id: string; count: number }>([
      { $match: { status: "completed" } },
      { $group: { _id: "$teamId", count: { $sum: 1 } } },
    ])
    .toArray();
  const completedMap = new Map(
    completed.map((c) => [c._id, c.count] as const),
  );

  const ranked = [...alive].sort(
    (a, b) =>
      b.points - a.points ||
      (completedMap.get(b.teamId) ?? 0) - (completedMap.get(a.teamId) ?? 0) ||
      a.teamId.localeCompare(b.teamId),
  );

  const keepCount = Math.max(1, Math.ceil(ranked.length / 2));
  const survivors = ranked.slice(0, keepCount).map((t) => t.teamId);
  const eliminated = ranked.slice(keepCount).map((t) => t.teamId);

  if (eliminated.length > 0) {
    for (const team of ranked.slice(keepCount)) {
      await col.updateOne(
        { teamId: team.teamId },
        {
          $set: {
            status: "eliminated",
            eliminatedInRound: state.currentRound,
            finalPoints: team.points,
            updatedAt: new Date(),
          },
        },
      );
    }
  }

  await col.updateMany(
    { teamId: { $in: survivors } },
    { $set: { round: nextRound, updatedAt: new Date() } },
  );

  const assignment = await assignRoundTasks(nextRound, survivors);
  await updateEventState({ currentRound: nextRound });
  await syncWantedFromLeaderboard(3);

  let message = `Round ${state.currentRound} closed. ${survivors.length} team(s) advanced to round ${nextRound}, ${eliminated.length} eliminated.`;
  if (assignment.unassigned > 0) {
    message += ` Warning: ${assignment.unassigned} team(s) got no technical task — add more technical tasks to the pool for round ${nextRound}.`;
  }
  return { ok: true, message, eliminated, survivors };
}

export async function crownChampion(): Promise<AdvanceRoundResult> {
  const state = await getEventState();
  const board = await getLeaderboard();
  const alive = board.filter(
    (r) => r.status === "selected" || r.status === "champion",
  );
  const winner = alive[0];
  if (!winner) {
    return { ok: false, message: "No surviving team to crown.", eliminated: [], survivors: [] };
  }
  const col = await teamsCol();
  await col.updateMany(
    { status: "selected" },
    {
      $set: {
        status: "eliminated",
        eliminatedInRound: state.currentRound,
        updatedAt: new Date(),
      },
    },
  );
  await col.updateOne(
    { teamId: winner.teamId },
    { $set: { status: "champion", updatedAt: new Date() } },
  );
  await updateEventState({
    eventEnded: true,
    championTeamId: winner.teamId,
  });
  return {
    ok: true,
    message: `${winner.name} (${winner.teamId}) takes the vault with ${winner.points} points.`,
    eliminated: [],
    survivors: [winner.teamId],
  };
}

/* ------------------------------------------------------------------ */
/* Admins                                                              */
/* ------------------------------------------------------------------ */

export async function findAdmin(
  username: string,
): Promise<AdminUser | null> {
  const col = await adminsCol();
  return col.findOne({ username: username.toLowerCase() });
}

export async function ensureAdmin(
  username: string,
  password: string,
  name = "Event Control",
): Promise<void> {
  const col = await adminsCol();
  const existing = await col.findOne({ username: username.toLowerCase() });
  if (existing) return;
  await col.insertOne({
    username: username.toLowerCase(),
    passwordHash: await hashPassword(password),
    name,
    createdAt: new Date(),
  });
}
