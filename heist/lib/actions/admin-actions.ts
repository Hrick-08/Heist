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
  logAudit,
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
  /** Extra fields for screens that show more than a toast (e.g. new credentials). */
  data?: Record<string, string>;
}

function text(formData: FormData, key: string, max = 600): string {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

/** A finite whole number kept inside sane bounds, so one typo cannot wreck the scoreboard. */
function num(formData: FormData, key: string, fallback = 0, limit = 1_000_000): number {
  const parsed = Math.round(Number(text(formData, key, 24)));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(-limit, Math.min(limit, parsed));
}

function oneOf<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

const TEAM_STATUSES = ["registered", "selected", "waitlisted", "eliminated", "champion"] as const;
const TASK_TYPES = ["physical", "technical"] as const;
const SCOPES = ["all", "selected"] as const;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const TEAM_ID = /^TLH-\d{1,4}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSCODE = 8;

/** Leader photos: a small raster data URL or an https link, nothing else. */
function photo(value: string): string {
  if (/^https:\/\/\S+$/i.test(value) && value.length <= 2000) return value;
  if (/^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(value) && value.length <= 600_000) {
    return value;
  }
  return "";
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

  const name = text(formData, "name", 80);
  const email = text(formData, "email", 200).toLowerCase();
  const leaderName = text(formData, "leaderName", 80);
  const leaderEmail = text(formData, "leaderEmail", 200).toLowerCase() || email;
  const leaderPhone = text(formData, "leaderPhone", 24);
  const leaderPhoto = photo(String(formData.get("leaderPhoto") ?? "").trim());
  const password = text(formData, "password", 128) || generatePassword(10);

  if (!name || !email || !leaderName) {
    return { ok: false, message: "Crew name, leader email and leader name are required." };
  }
  if (!EMAIL.test(email) || !EMAIL.test(leaderEmail)) {
    return { ok: false, message: "Enter a valid email address." };
  }
  if (password.length < MIN_PASSCODE) {
    return { ok: false, message: `Passcodes need at least ${MIN_PASSCODE} characters.` };
  }

  const memberNames = formData.getAll("memberName").map((v) => String(v).trim().slice(0, 80));
  const memberEmails = formData.getAll("memberEmail").map((v) => String(v).trim().slice(0, 200));
  const memberPhones = formData.getAll("memberPhone").map((v) => String(v).trim().slice(0, 24));
  const members = memberNames
    .map((memberName, index) => ({
      name: memberName,
      email: memberEmails[index] ?? "",
      phone: memberPhones[index] ?? "",
      role: "Member",
    }))
    .filter((m) => m.name.length > 0)
    .slice(0, 12);

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
    data: {
      name: team.name,
      teamId: team.teamId,
      status: team.status,
      passcode: password,
      loginEmail: email,
    },
  };
}

export async function setWantedAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();
  const teamId = text(formData, "teamId", 16);
  if (!TEAM_ID.test(teamId)) return { ok: false, message: "Unknown crew." };
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
  const session = await requireAdmin();
  const teamId = text(formData, "teamId", 16);
  if (!TEAM_ID.test(teamId)) return { ok: false, message: "Unknown crew." };
  const points = num(formData, "points", 0, 100_000);
  const money = num(formData, "money", 0, 10_000_000);
  if (!points && !money) return { ok: false, message: "Enter points, cash or both." };
  await adjustTeamScore(teamId, points, money);
  await logAudit(session.name, "adjust-score", teamId, `${points} pts, $${money}`);
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
  const session = await requireAdmin();
  const teamId = text(formData, "teamId", 16);
  if (!TEAM_ID.test(teamId)) return { ok: false, message: "Unknown crew." };
  const status = oneOf<TeamStatus>(text(formData, "status", 16), TEAM_STATUSES, "registered");
  if (status !== text(formData, "status", 16)) return { ok: false, message: "Unknown status." };
  await setTeamStatus(teamId, status);
  await logAudit(session.name, "set-status", teamId, status);
  revalidatePath("/admin/teams");
  revalidatePath(`/admin/teams/${teamId}`);
  return { ok: true, message: `${teamId} status set to ${status}.` };
}

export async function resetPasswordAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const teamId = text(formData, "teamId", 16);
  if (!TEAM_ID.test(teamId)) return { ok: false, message: "Unknown crew." };
  const password = text(formData, "password", 128) || generatePassword(10);
  if (password.length < MIN_PASSCODE) {
    return { ok: false, message: `Passcodes need at least ${MIN_PASSCODE} characters.` };
  }
  await updateTeam(teamId, {
    passwordHash: await hashPassword(password),
    passwordChangedAt: new Date(),
  });
  await logAudit(session.name, "reset-passcode", teamId, "passcode replaced, old sessions ended");
  revalidatePath(`/admin/teams/${teamId}`);
  return {
    ok: true,
    message: `New passcode for ${teamId}: ${password}`,
    data: { teamId, passcode: password },
  };
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
  const session = await requireAdmin();
  const teamId = text(formData, "teamId", 16);
  const teamTaskId = text(formData, "teamTaskId", 40);
  const result = await unmarkTask(teamId, teamTaskId, session.name);
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
    title: text(formData, "title", 120),
    description: text(formData, "description", 1200),
    type: oneOf<TaskType>(text(formData, "type", 16), TASK_TYPES, "physical"),
    round: num(formData, "round", 1, 12),
    points: Math.max(0, num(formData, "points", 100, 100_000)),
    money: Math.max(0, num(formData, "money", 500, 10_000_000)),
    hint: text(formData, "hint", 600),
    hintCost: Math.max(0, num(formData, "hintCost", 300, 10_000_000)),
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
  const scope = oneOf<MissionScope>(text(formData, "scope", 16), SCOPES, "all");
  return {
    title: text(formData, "title", 120),
    description: text(formData, "description", 1200),
    round: num(formData, "round", 1, 12),
    difficulty: oneOf(text(formData, "difficulty", 16), DIFFICULTIES, "medium"),
    points: Math.max(0, num(formData, "points", 200, 100_000)),
    money: Math.max(0, num(formData, "money", 1500, 10_000_000)),
    scope,
    teamIds: formData
      .getAll("teamIds")
      .map((v) => String(v).trim())
      .filter((v) => TEAM_ID.test(v))
      .slice(0, 200),
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
    message: `Round ${state.currentRound}: ${result.assigned} crew(s) got a technical task, ${result.unassigned} went without one, ${result.skipped} already had a board.`,
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
    maxTeams: Math.max(1, num(formData, "maxTeams", 40, 1000)),
    physicalPerRound: Math.max(0, num(formData, "physicalPerRound", 3, 50)),
    technicalPerRound: Math.max(0, num(formData, "technicalPerRound", 1, 50)),
    hintCostMultiplier: Math.max(0, num(formData, "hintCostMultiplier", 1, 20)),
    wantedRemovalCost: Math.max(0, num(formData, "wantedRemovalCost", 2500, 10_000_000)),
    endgameCost: Math.max(0, num(formData, "endgameCost", 5000, 10_000_000)),
    eventLive: bool(formData, "eventLive"),
    totalRounds: Math.max(1, num(formData, "totalRounds", 4, 12)),
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
