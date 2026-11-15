import type { ObjectId } from "mongodb";

export type TeamStatus =
  | "registered"
  | "selected"
  | "waitlisted"
  | "eliminated"
  | "champion";

export type TaskType = "physical" | "technical";

export type TaskStatus = "pending" | "completed";

export type MissionScope = "all" | "selected";

export interface Member {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface Team {
  _id?: ObjectId;
  /** Public team identifier handed out at registration, e.g. "TLH-01". */
  teamId: string;
  name: string;
  /** Leader's email — this is the login id. */
  email: string;
  passwordHash: string;
  leader: Member & { photo: string };
  members: Member[];
  status: TeamStatus;
  points: number;
  money: number;
  wanted: boolean;
  wantedAt: Date | null;
  /** Round the team is currently competing in (1..4). */
  round: number;
  eliminatedInRound: number | null;
  finalPoints: number | null;
  hintsUsed: number;
  endgameUnlocked: boolean;
  /** Dexter mission ids already completed by this team. */
  dexterCompleted: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  _id?: ObjectId;
  title: string;
  description: string;
  type: TaskType;
  round: number;
  points: number;
  money: number;
  /** Hint text revealed when the team pays `hintCost`. */
  hint: string;
  hintCost: number;
  /** Endgame tasks are only allotted when a team unlocks the final heist. */
  isEndgame: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamTask {
  _id?: ObjectId;
  teamId: string;
  taskId: ObjectId;
  round: number;
  type: TaskType;
  status: TaskStatus;
  points: number;
  money: number;
  hintPurchased: boolean;
  isEndgame: boolean;
  completedAt: Date | null;
  completedBy: string | null;
  createdAt: Date;
}

export interface DexterMission {
  _id?: ObjectId;
  title: string;
  description: string;
  round: number;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  money: number;
  scope: MissionScope;
  /** Team ids the mission is targeted at when scope is "selected". */
  teamIds: string[];
  active: boolean;
  /** How many teams have completed this mission. */
  completions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventState {
  _id: "state";
  currentRound: number;
  totalRounds: number;
  maxTeams: number;
  physicalPerRound: number;
  technicalPerRound: number;
  hintCostMultiplier: number;
  wantedRemovalCost: number;
  endgameCost: number;
  eventLive: boolean;
  eventEnded: boolean;
  championTeamId: string | null;
  updatedAt: Date;
}

export interface SessionPayload {
  role: "team" | "admin";
  /** Team id for team sessions, admin id for admin sessions. */
  sub: string;
  name: string;
}

export interface AuthState {
  error?: string;
  success?: string;
}

export interface TeamWithTasks extends Team {
  tasks: TeamTask[];
}

/** What a crew is asking the desk to approve. */
export type ApprovalKind = "target" | "dexter";

export interface ApprovalRequest {
  _id?: ObjectId;
  /** "target" for a task allotment, "dexter" for a Dexter mission. */
  kind: ApprovalKind;
  /** teamTasks._id for a task, dexterMissions._id for a Dexter mission. */
  refId: ObjectId;
  teamId: string;
  status: "pending" | "approved" | "dismissed";
  /** Optional note the crew left for the desk. */
  note: string;
  requestedAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
}

/** A pending request joined with the crew and the task/mission it refers to.
 *  Plain and serialisable so it can cross the server/client boundary. */
export interface ApprovalView {
  id: string;
  kind: ApprovalKind;
  /** teamTasks id for a task, dexterMissions id for a Dexter mission. */
  refId: string;
  teamId: string;
  crewName: string;
  title: string;
  description: string;
  points: number;
  money: number;
  round: number;
  kindLabel: string;
  note: string;
  status: "pending" | "approved" | "dismissed";
  requestedAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
}

/** Serializable projection of a team, safe to pass into client components. */
/** Serializable projection of a task, safe to pass into client components. */
export interface TaskRow {
  id: string;
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

/** Serializable projection of a Dexter mission. */
export interface MissionRow {
  id: string;
  title: string;
  description: string;
  round: number;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  money: number;
  scope: MissionScope;
  teamIds: string[];
  active: boolean;
  completions: number;
}

export interface TeamRow {
  teamId: string;
  name: string;
  email: string;
  leaderName: string;
  status: TeamStatus;
  points: number;
  money: number;
  wanted: boolean;
  round: number;
  membersCount: number;
  eliminatedInRound: number | null;
  createdAt: Date;
}

export interface LeaderboardRow {
  rank: number;
  teamId: string;
  name: string;
  points: number;
  completed: number;
  status: TeamStatus;
  isWanted: boolean;
}
