"use server";

import { getTeam, getTeamTasks } from "@/lib/game";
import { requireAdmin } from "@/lib/session";

export interface CrewDesk {
  team: {
    teamId: string;
    name: string;
    leaderName: string;
    email: string;
    phone: string;
    points: number;
    money: number;
    round: number;
    status: string;
    hasPhoto: boolean;
  };
  tasks: {
    id: string;
    title: string;
    description: string;
    type: "physical" | "technical";
    round: number;
    isEndgame: boolean;
    points: number;
    money: number;
    done: boolean;
  }[];
}

/** Read-only: the board a crew was dealt, for the verify drawer in the crews list. */
export async function getCrewDeskAction(teamId: string): Promise<CrewDesk | null> {
  await requireAdmin();
  const team = await getTeam(teamId);
  if (!team) return null;
  const tasks = await getTeamTasks(team.teamId);
  return {
    team: {
      teamId: team.teamId,
      name: team.name,
      leaderName: team.leader.name,
      email: team.leader.email || team.email,
      phone: team.leader.phone ?? "",
      points: team.points,
      money: team.money,
      round: team.round,
      status: team.status,
      hasPhoto: Boolean(team.leader.photo),
    },
    tasks: tasks.map((t) => ({
      id: String(t._id),
      title: t.task?.title ?? "Task",
      description: t.task?.description ?? "",
      type: t.type,
      round: t.round,
      isEndgame: t.isEndgame,
      points: t.points,
      money: t.money,
      done: t.status === "completed",
    })),
  };
}
