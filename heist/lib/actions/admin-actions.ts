"use server";

import { revalidatePath } from "next/cache";

import { generatePassword, hashPassword } from "@/lib/auth";
import {
  adjustTeamScore,
  advanceRound,
  approveRequest,
  assignRoundTasks,
  completeMission,
  createMission,
  createTask,
  crownChampion,
  deleteMission,
  deleteTask,
  dismissApproval,
  getEventState,
  listSelectedTeams,
  markTaskComplete,
  registerTeam,
  setTeamStatus,
  setWanted,
  syncWantedFromLeaderboard,
  toggleTaskActive,
  unmarkTask,
  updateEventState,
  updateMission,
  updateTask,
  updateTeam,
} from "@/lib/game";
import { requireAdmin } from "@/lib/session";
import { getMission } from "@/lib/game";
import { seedEverything } from "@/lib/seed";
import type { MissionScope, TaskType, TeamStatus } from "@/lib/types";

export interface AdminActionResult {
  ok: boolean;
  message: string;
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function num(formData: FormData, key: string, fallback = 0): number {
  const parsed = Number(text(formData, key));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

/* ------------------------------------------------------------------ */
/* Teams                                                               */
/* ------------------------------------------------------------------ */

export async function registerTeamAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();

  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const leaderName = text(formData, "leaderName");
  const leaderEmail = text(formData, "leaderEmail").toLowerCase() || email;
  const leaderPhone = text(formData, "leaderPhone");
  const leaderPhoto = text(formData, "leaderPhoto");
  const password = text(formData, "password") || generatePassword(10);

  if (!name || !email || !leaderName) {
    return { ok: false, message: "Crew name, leader email and leader name are required." };
  }

  const memberNames = formData.getAll("memberName").map((v) => String(v).trim());
  const memberEmails = formData.getAll("memberEmail").map((v) => String(v).trim());
  const memberPhones = formData.getAll("memberPhone").map((v) => String(v).trim());
  const members = memberNames
    .map((memberName, index) => ({
      name: memberName,
      email: memberEmails[index] ?? "",
      phone: memberPhones[index] ?? "",
      role: "Member",
    }))
    .filter((m) => m.name.length > 0);

  if (members.length < 3) {
    return {
      ok: false,
      message: "A crew needs at least 4 members in total (leader + 3).",
    };
  }

  const { team, created } = await registerTeam({
    name,
    email,
    password,
    leader: {
      name: leaderName,
      email: leaderEmail,
      phone: leaderPhone,
      role: "Leader",
      photo: leaderPhoto,
    },
    members,
  });

  if (!created) {
    return {
      ok: false,
      message: `${email} is already registered as ${team.teamId}.`,
    };
  }

  revalidatePath("/admin/teams");
  revalidatePath("/admin");
  return {
    ok: true,
    message: `${team.name} registered as ${team.teamId} (${team.status}). Passcode: ${password}`,
  };
}

export async function setWantedAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const teamId = text(formData, "teamId");
  const wanted = bool(formData, "wanted");
  await setWanted(teamId, wanted);
  revalidatePath("/admin/teams");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: `${teamId} is ${wanted ? "now on the wanted list" : "off the wanted list"}.`,
  };
}

export async function syncWantedAction(
  _prev: AdminActionResult,
  _formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const top = await syncWantedFromLeaderboard(3);
  revalidatePath("/admin");
  revalidatePath("/admin/rounds");
  revalidatePath("/dashboard");
  return { ok: true, message: `Wanted list synced: ${top.join(", ") || "nobody"}.` };
}

export async function adjustScoreAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const teamId = text(formData, "teamId");
  const points = num(formData, "points", 0);
  const money = num(formData, "money", 0);
  await adjustTeamScore(teamId, points, money);
  revalidatePath("/admin/teams");
  revalidatePath(`/admin/teams/${teamId}`);
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: `${teamId} adjusted by ${points >= 0 ? "+" : ""}${points} pts and ${money >= 0 ? "+" : ""}$${money}.`,
  };
}

export async function setTeamStatusAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const teamId = text(formData, "teamId");
  const status = text(formData, "status") as TeamStatus;
  await setTeamStatus(teamId, status);
  revalidatePath("/admin/teams");
  revalidatePath(`/admin/teams/${teamId}`);
  return { ok: true, message: `${teamId} status set to ${status}.` };
}

export async function resetPasswordAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const teamId = text(formData, "teamId");
  const password = text(formData, "password") || generatePassword(10);
  await updateTeam(teamId, { passwordHash: await hashPassword(password) });
  revalidatePath(`/admin/teams/${teamId}`);
  return { ok: true, message: `New passcode for ${teamId}: ${password}` };
}

/* ------------------------------------------------------------------ */
/* Task marking                                                        */
/* ------------------------------------------------------------------ */

export async function markTaskAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const teamId = text(formData, "teamId");
  const teamTaskId = text(formData, "teamTaskId");
  const result = await markTaskComplete(teamId, teamTaskId, session.name);
  revalidatePath(`/admin/teams/${teamId}`);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { ok: result.ok, message: result.message };
}

export async function unmarkTaskAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const teamId = text(formData, "teamId");
  const teamTaskId = text(formData, "teamTaskId");
  const result = await unmarkTask(teamId, teamTaskId);
  revalidatePath(`/admin/teams/${teamId}`);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: result.ok, message: result.message };
}

/* ------------------------------------------------------------------ */
/* Task pool                                                           */
/* ------------------------------------------------------------------ */

function taskPayload(formData: FormData) {
  return {
    title: text(formData, "title"),
    description: text(formData, "description"),
    type: text(formData, "type") as TaskType,
    round: num(formData, "round", 1),
    points: num(formData, "points", 100),
    money: num(formData, "money", 500),
    hint: text(formData, "hint"),
    hintCost: num(formData, "hintCost", 300),
    isEndgame: bool(formData, "isEndgame"),
    active: bool(formData, "active"),
  };
}

export async function createTaskAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const payload = taskPayload(formData);
  if (!payload.title) return { ok: false, message: "Task title is required." };
  await createTask(payload);
  revalidatePath("/admin/tasks");
  return { ok: true, message: `Task "${payload.title}" added to the pool.` };
}

export async function updateTaskAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const id = text(formData, "id");
  const payload = taskPayload(formData);
  await updateTask(id, payload);
  revalidatePath("/admin/tasks");
  return { ok: true, message: "Task updated." };
}

export async function deleteTaskAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const id = text(formData, "id");
  await deleteTask(id);
  revalidatePath("/admin/tasks");
  return { ok: true, message: "Task deleted from the pool." };
}

export async function toggleTaskAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const id = text(formData, "id");
  await toggleTaskActive(id);
  revalidatePath("/admin/tasks");
  return { ok: true, message: "Task status toggled." };
}

/* ------------------------------------------------------------------ */
/* Dexter missions                                                     */
/* ------------------------------------------------------------------ */

function missionPayload(formData: FormData) {
  const scope = text(formData, "scope") as MissionScope;
  return {
    title: text(formData, "title"),
    description: text(formData, "description"),
    round: num(formData, "round", 1),
    difficulty: (text(formData, "difficulty") || "medium") as
      | "easy"
      | "medium"
      | "hard",
    points: num(formData, "points", 200),
    money: num(formData, "money", 1500),
    scope,
    teamIds: formData
      .getAll("teamIds")
      .map((v) => String(v))
      .filter(Boolean),
    active: bool(formData, "active"),
  };
}

export async function createMissionAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const payload = missionPayload(formData);
  if (!payload.title) return { ok: false, message: "Mission title is required." };
  await createMission(payload);
  revalidatePath("/admin/dexter");
  revalidatePath("/dashboard");
  return { ok: true, message: `Dexter mission "${payload.title}" is live.` };
}

export async function updateMissionAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const id = text(formData, "id");
  await updateMission(id, missionPayload(formData));
  revalidatePath("/admin/dexter");
  revalidatePath("/dashboard");
  return { ok: true, message: "Dexter mission updated." };
}

export async function deleteMissionAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  await deleteMission(text(formData, "id"));
  revalidatePath("/admin/dexter");
  revalidatePath("/dashboard");
  return { ok: true, message: "Dexter mission removed." };
}

export async function toggleMissionAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const id = text(formData, "id");
  const mission = await getMission(id);
  if (!mission) return { ok: false, message: "Mission not found." };
  await updateMission(id, { active: !mission.active });
  revalidatePath("/admin/dexter");
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: `Mission ${mission.active ? "pulled" : "pushed"}.`,
  };
}

export async function completeMissionAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const missionId = text(formData, "missionId");
  const teamId = text(formData, "teamId");
  const result = await completeMission(missionId, teamId, session.name);
  revalidatePath("/admin/dexter");
  revalidatePath("/admin/approvals");
  revalidatePath(`/admin/teams/${teamId}`);
  revalidatePath("/dashboard");
  return { ok: result.ok, message: result.message };
}

/* ------------------------------------------------------------------ */
/* Approval queue                                                      */
/* ------------------------------------------------------------------ */

export async function approveRequestAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const id = text(formData, "requestId");
  const result = await approveRequest(id, session.name);
  revalidatePath("/admin/approvals");
  revalidatePath("/admin");
  revalidatePath("/admin/teams");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { ok: result.ok, message: result.message };
}

export async function dismissRequestAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const id = text(formData, "requestId");
  const result = await dismissApproval(id, session.name);
  revalidatePath("/admin/approvals");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: result.ok, message: result.message };
}

/* ------------------------------------------------------------------ */
/* Rounds & settings                                                   */
/* ------------------------------------------------------------------ */

export async function advanceRoundAction(
  _prev: AdminActionResult,
  _formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const result = await advanceRound();
  revalidatePath("/admin");
  revalidatePath("/admin/rounds");
  revalidatePath("/admin/teams");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  return { ok: result.ok, message: result.message };
}

export async function allocateRoundAction(
  _prev: AdminActionResult,
  _formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const state = await getEventState();
  const teams = await listSelectedTeams();
  const result = await assignRoundTasks(
    state.currentRound,
    teams.map((t) => t.teamId),
  );
  revalidatePath("/admin");
  revalidatePath("/admin/rounds");
  revalidatePath("/admin/teams");
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: `Round ${state.currentRound}: ${result.assigned} crew(s) got a technical target, ${result.unassigned} went without one, ${result.skipped} already had a board.`,
  };
}

export async function crownChampionAction(
  _prev: AdminActionResult,
  _formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const result = await crownChampion();
  revalidatePath("/admin");
  revalidatePath("/admin/rounds");
  revalidatePath("/admin/teams");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  return { ok: result.ok, message: result.message };
}

export async function updateSettingsAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  await updateEventState({
    maxTeams: num(formData, "maxTeams", 40),
    physicalPerRound: num(formData, "physicalPerRound", 3),
    technicalPerRound: num(formData, "technicalPerRound", 1),
    hintCostMultiplier: num(formData, "hintCostMultiplier", 1),
    wantedRemovalCost: num(formData, "wantedRemovalCost", 2500),
    endgameCost: num(formData, "endgameCost", 5000),
    eventLive: bool(formData, "eventLive"),
    totalRounds: num(formData, "totalRounds", 4),
  });
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true, message: "Event settings saved." };
}

export async function seedAction(
  _prev: AdminActionResult,
  _formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const result = await seedEverything();
  revalidatePath("/admin");
  revalidatePath("/admin/tasks");
  revalidatePath("/admin/dexter");
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: `Seed complete — ${result.tasks} new tasks, ${result.missions} new missions.`,
  };
}
