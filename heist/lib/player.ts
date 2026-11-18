import "server-only";

import { approvalsCol, missionsCol, tasksCol, teamTasksCol } from "./collections";
import {
  getEventState,
  getLeaderboard,
  getTeamTasks,
  getVisibleMissions,
  listApprovalsForTeam,
  listTeams,
  type TeamTaskView,
} from "./game";
import type {
  ApprovalView,
  EventState,
  LedgerEntry,
  NotifySnap,
  PlayerTask,
  RankedCrew,
  Team,
} from "./types";

/*
 * Read-only helpers for the player UI.
 *
 * Nothing in here writes to the database or changes how the game behaves, so
 * the admin side keeps working exactly as before.
 */

const TZ = "Asia/Kolkata";

export function formatTime(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });
}

export function formatDay(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: TZ,
  });
}

/** Wanted level shown as police stars. Rank 1 is the hottest (3 stars). */
export function wantedStars(wanted: boolean, rank: number): number {
  if (!wanted) return 0;
  if (!rank) return 1;
  return Math.min(3, Math.max(1, 4 - rank));
}

/** What a clue really costs a crew: base price x the event multiplier. */
export function clueCostFor(hintCost: number, state: EventState): number {
  return Math.max(0, Math.round(hintCost * state.hintCostMultiplier));
}

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

function toPlayerTask(
  view: TeamTaskView,
  state: EventState,
  pendingRefs: Set<string>,
): PlayerTask | null {
  const task = view.task;
  if (!task) return null;
  const id = String(view._id);
  return {
    id,
    title: task.title,
    description: task.description,
    type: view.type,
    round: view.round,
    points: view.points,
    money: view.money,
    status: view.status,
    isEndgame: view.isEndgame,
    clueCost: clueCostFor(task.hintCost, state),
    hintPurchased: view.hintPurchased,
    // The clue text only travels to the browser after it has been paid for.
    hint: view.hintPurchased ? task.hint : "",
    requested: pendingRefs.has(id),
    completedLabel: view.completedAt
      ? `${formatDay(view.completedAt)}, ${formatTime(view.completedAt)}`
      : "",
    completedBy: view.completedBy,
    station: task.station ?? "",
    minutes: typeof task.minutes === "number" ? task.minutes : null,
    materials: task.materials ?? [],
    judging: task.judging ?? [],
  };
}

/** Live round first, then older pending tasks, then everything cleared. */
function taskOrder(a: PlayerTask, b: PlayerTask, currentRound: number): number {
  const group = (t: PlayerTask) =>
    t.status === "completed" ? 2 : t.round === currentRound ? 0 : 1;
  return (
    group(a) - group(b) ||
    Number(a.isEndgame) - Number(b.isEndgame) ||
    a.round - b.round
  );
}

export async function getPlayerTasks(
  team: Team,
  state: EventState,
  /** Pass the crew's pending approvals when the caller already has them. */
  knownApprovals?: ApprovalView[],
): Promise<PlayerTask[]> {
  const [allotments, approvals] = await Promise.all([
    getTeamTasks(team.teamId),
    knownApprovals ?? listApprovalsForTeam(team.teamId),
  ]);
  const pendingRefs = new Set(approvals.map((a) => String(a.refId)));
  return allotments
    .map((a) => toPlayerTask(a, state, pendingRefs))
    .filter((t): t is PlayerTask => t !== null)
    .sort((a, b) => taskOrder(a, b, state.currentRound));
}

export async function getPlayerTask(
  team: Team,
  state: EventState,
  teamTaskId: string,
): Promise<PlayerTask | null> {
  const tasks = await getPlayerTasks(team, state);
  return tasks.find((t) => t.id === teamTaskId) ?? null;
}

/* ------------------------------------------------------------------ */
/* Cash history                                                        */
/* ------------------------------------------------------------------ */

/**
 * Rebuilds the crew's cash history from records that already exist - no new
 * collection, no schema change.
 *
 *  - task payouts and the endgame funding carry a real timestamp
 *  - Dexter payouts use the approval time when the crew asked for sign-off
 *  - clue prices are rebuilt from the current clue price (no timestamp kept)
 *  - bribes and manual desk adjustments leave no trace, so whatever is left
 *    between the known lines and the real balance is shown as one
 *    reconciling line. The list therefore always adds up to the balance.
 */
export async function getTeamLedger(
  team: Team,
  state: EventState,
): Promise<LedgerEntry[]> {
  const [teamTasks, pool, approvals, missions] = await Promise.all([
    teamTasksCol().then((c) => c.find({ teamId: team.teamId }).toArray()),
    tasksCol().then((c) => c.find({}).project({ title: 1, hintCost: 1 }).toArray()),
    approvalsCol().then((c) =>
      c
        .find({ teamId: team.teamId, kind: "dexter", status: "approved" })
        .toArray(),
    ),
    missionsCol().then((c) => c.find({}).toArray()),
  ]);

  const poolById = new Map(pool.map((t) => [String(t._id), t]));
  const missionById = new Map(missions.map((m) => [String(m._id), m]));

  const timed: { at: Date; entry: LedgerEntry }[] = [];
  const untimed: LedgerEntry[] = [];

  for (const tt of teamTasks) {
    const task = poolById.get(String(tt.taskId)) as
      | { title?: string; hintCost?: number }
      | undefined;
    const title = task?.title ?? "Task";

    if (tt.status === "completed" && tt.money > 0) {
      const at = tt.completedAt ?? tt.createdAt;
      timed.push({
        at,
        entry: { label: `${title} payout`, time: formatTime(at), amount: tt.money },
      });
    }

    if (tt.hintPurchased && task?.hintCost) {
      untimed.push({
        label: `Clue: ${title}`,
        time: "",
        amount: -clueCostFor(task.hintCost, state),
      });
    }

    if (tt.isEndgame) {
      timed.push({
        at: tt.createdAt,
        entry: {
          label: "Endgame heist funded",
          time: formatTime(tt.createdAt),
          amount: -state.endgameCost,
        },
      });
    }
  }

  for (const missionId of team.dexterCompleted) {
    const mission = missionById.get(missionId);
    if (!mission || mission.money <= 0) continue;
    const approved = approvals
      .filter((a) => String(a.refId) === missionId && a.resolvedAt)
      .sort((a, b) => +b.resolvedAt! - +a.resolvedAt!)[0];
    const entry: LedgerEntry = {
      label: `${mission.title} payout`,
      time: formatTime(approved?.resolvedAt),
      amount: mission.money,
    };
    if (approved?.resolvedAt) timed.push({ at: approved.resolvedAt, entry });
    else untimed.push(entry);
  }

  const known = [...timed.map((t) => t.entry), ...untimed];
  const other = team.money - known.reduce((sum, e) => sum + e.amount, 0);
  if (other !== 0) {
    untimed.push({
      label:
        other < 0
          ? "Bribes and other desk deductions"
          : "Desk adjustments",
      time: "",
      amount: other,
    });
  }

  timed.sort((a, b) => +b.at - +a.at);
  return [...timed.map((t) => t.entry), ...untimed];
}

/**
 * Rebuilds the crew's points history the same way as the cash history: task
 * and Dexter payouts are real lines, anything left between them and the real
 * total (desk adjustments, reverted tasks) is one reconciling line, so the
 * list always adds up to the points total.
 */
export async function getTeamPointsLedger(team: Team): Promise<LedgerEntry[]> {
  const [teamTasks, pool, approvals, missions] = await Promise.all([
    teamTasksCol().then((c) =>
      c.find({ teamId: team.teamId, status: "completed" }).toArray(),
    ),
    tasksCol().then((c) => c.find({}).project({ title: 1 }).toArray()),
    approvalsCol().then((c) =>
      c
        .find({ teamId: team.teamId, kind: "dexter", status: "approved" })
        .toArray(),
    ),
    missionsCol().then((c) => c.find({}).toArray()),
  ]);

  const poolById = new Map(pool.map((t) => [String(t._id), t]));
  const missionById = new Map(missions.map((m) => [String(m._id), m]));

  const timed: { at: Date; entry: LedgerEntry }[] = [];
  const untimed: LedgerEntry[] = [];

  for (const tt of teamTasks) {
    if (tt.points <= 0) continue;
    const title =
      (poolById.get(String(tt.taskId)) as { title?: string } | undefined)
        ?.title ?? "Task";
    const at = tt.completedAt ?? tt.createdAt;
    timed.push({
      at,
      entry: { label: `${title} cleared`, time: formatTime(at), amount: tt.points },
    });
  }

  for (const missionId of team.dexterCompleted) {
    const mission = missionById.get(missionId);
    if (!mission || mission.points <= 0) continue;
    const approved = approvals
      .filter((a) => String(a.refId) === missionId && a.resolvedAt)
      .sort((a, b) => +b.resolvedAt! - +a.resolvedAt!)[0];
    const entry: LedgerEntry = {
      label: `${mission.title} (Dexter)`,
      time: formatTime(approved?.resolvedAt),
      amount: mission.points,
    };
    if (approved?.resolvedAt) timed.push({ at: approved.resolvedAt, entry });
    else untimed.push(entry);
  }

  const known = [...timed.map((t) => t.entry), ...untimed];
  const other = team.points - known.reduce((sum, e) => sum + e.amount, 0);
  if (other !== 0) {
    untimed.push({ label: "Desk adjustment", time: "", amount: other });
  }

  timed.sort((a, b) => +b.at - +a.at);
  return [...timed.map((t) => t.entry), ...untimed];
}

/* ------------------------------------------------------------------ */
/* Ranks + funnel                                                      */
/* ------------------------------------------------------------------ */

export async function getRankedCrews(): Promise<RankedCrew[]> {
  const [board, teams] = await Promise.all([getLeaderboard(), listTeams()]);
  const byId = new Map(teams.map((t) => [t.teamId, t]));
  return board.map((row) => {
    const team = byId.get(row.teamId);
    return {
      ...row,
      leaderName: team?.leader.name ?? "",
      membersCount: team ? team.members.length + 1 : 0,
      wantedSince: team?.wanted ? formatTime(team.wantedAt) : "",
      stars: wantedStars(row.isWanted, row.rank),
      hasPhoto: Boolean(team?.leader.photo),
      bounty: row.points,
    };
  });
}

export interface FunnelStep {
  round: number;
  crews: number;
  /** Bar fill, 0-100. */
  pct: number;
  live: boolean;
}

/** Same halving model the old dashboard used: 40 -> 20 -> 10 -> 5. */
export function getFunnel(state: EventState, survivors: number): FunnelStep[] {
  const steps: FunnelStep[] = [];
  let n = state.maxTeams;
  for (let round = 1; round <= state.totalRounds; round += 1) {
    steps.push({
      round,
      crews: round === state.currentRound ? survivors : n,
      pct: Math.round((n / state.maxTeams) * 100),
      live: round === state.currentRound,
    });
    n = Math.max(1, Math.ceil(n / 2));
  }
  return steps;
}

/** What the notification centre diffs between refreshes. Plain and serialisable. */
export async function getNotifySnapshot(
  team: Team,
  state: EventState,
): Promise<NotifySnap> {
  const [board, allotments, approvals, missions] = await Promise.all([
    getLeaderboard(),
    getTeamTasks(team.teamId),
    listApprovalsForTeam(team.teamId),
    getVisibleMissions(team.teamId, state.currentRound),
  ]);
  const pending = new Set(approvals.map((a) => String(a.refId)));
  const rank = board.findIndex((row) => row.teamId === team.teamId) + 1;

  return {
    rank,
    round: state.currentRound,
    totalRounds: state.totalRounds,
    wanted: team.wanted,
    endgameUnlocked: team.endgameUnlocked,
    status: team.status,
    tasks: allotments
      .filter((v) => v.task)
      .map((v) => ({
        id: String(v._id),
        title: v.task!.title,
        points: v.points,
        money: v.money,
        done: v.status === "completed",
        requested: pending.has(String(v._id)),
        clue: v.hintPurchased,
        endgame: v.isEndgame,
      })),
    dexter: missions.map((m) => ({
      id: String(m._id),
      title: m.title,
      points: m.points,
      money: m.money,
      done: team.dexterCompleted.includes(String(m._id)),
      requested: pending.has(String(m._id)),
    })),
  };
}

/** Everything the player shell (top bar, notifications) needs on every page. */
export async function getShellData(team: Team) {
  const state = await getEventState();
  const [ledger, pointsLedger, snap] = await Promise.all([
    getTeamLedger(team, state),
    getTeamPointsLedger(team),
    getNotifySnapshot(team, state),
  ]);
  return { state, ledger, pointsLedger, snap };
}
