"use server";

import { revalidatePath } from "next/cache";

import { purchaseHint, removeWanted, unlockEndgame } from "@/lib/game";
import { requireTeam } from "@/lib/session";

export interface TeamActionResult {
  ok: boolean;
  message: string;
}

export async function buyHintAction(
  _prev: TeamActionResult,
  formData: FormData,
): Promise<TeamActionResult> {
  const { team } = await requireTeam();
  const teamTaskId = String(formData.get("teamTaskId") ?? "");
  const result = await purchaseHint(team.teamId, teamTaskId);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return result;
}

export async function removeWantedAction(
  _prev: TeamActionResult,
  _formData: FormData,
): Promise<TeamActionResult> {
  const { team } = await requireTeam();
  const result = await removeWanted(team.teamId);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return result;
}

export async function unlockEndgameAction(
  _prev: TeamActionResult,
  _formData: FormData,
): Promise<TeamActionResult> {
  const { team } = await requireTeam();
  const result = await unlockEndgame(team.teamId);
  revalidatePath("/dashboard");
  revalidatePath("/endgame");
  revalidatePath("/tasks");
  return result;
}
