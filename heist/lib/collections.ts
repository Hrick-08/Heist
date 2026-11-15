import "server-only";

import type { Collection } from "mongodb";

import { getDb } from "./db";
import type {
  ApprovalRequest,
  DexterMission,
  EventState,
  Task,
  Team,
  TeamTask,
} from "./types";

export interface AdminUser {
  _id?: unknown;
  username: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
}

export async function teamsCol(): Promise<Collection<Team>> {
  return (await getDb()).collection<Team>("teams");
}

export async function tasksCol(): Promise<Collection<Task>> {
  return (await getDb()).collection<Task>("tasks");
}

export async function teamTasksCol(): Promise<Collection<TeamTask>> {
  return (await getDb()).collection<TeamTask>("teamTasks");
}

export async function missionsCol(): Promise<Collection<DexterMission>> {
  return (await getDb()).collection<DexterMission>("dexterMissions");
}

export async function adminsCol(): Promise<Collection<AdminUser>> {
  return (await getDb()).collection<AdminUser>("admins");
}

export async function stateCol(): Promise<Collection<EventState>> {
  return (await getDb()).collection<EventState>("eventState");
}

export async function approvalsCol(): Promise<Collection<ApprovalRequest>> {
  return (await getDb()).collection<ApprovalRequest>("approvals");
}
