import { notFound } from "next/navigation";
import { Suspense } from "react";

import { toApprovalItems } from "@/components/admin/approval-items";
import { CrewDetail } from "@/components/admin/crew-detail";
import { dateTime } from "@/components/admin/format";
import { Skeleton } from "@/components/admin/skeleton";
import { getEventState, getTeam, getTeamTasks, listApprovalsForTeam, listMissions } from "@/lib/game";

export const instant = false;

export default function AdminTeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  return (
    <Suspense fallback={<Skeleton blocks={2} />}>
      <TeamDetail params={params} />
    </Suspense>
  );
}

async function TeamDetail({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const team = await getTeam(teamId);
  if (!team) notFound();

  const [state, tasks, missions, approvals] = await Promise.all([
    getEventState(),
    getTeamTasks(team.teamId),
    listMissions(),
    listApprovalsForTeam(team.teamId),
  ]);

  return (
    <CrewDetail
      bribe={state.wantedRemovalCost}
      team={{
        teamId: team.teamId,
        name: team.name,
        status: team.status,
        wanted: team.wanted,
        round: team.round,
        eliminatedInRound: team.eliminatedInRound,
        points: team.points,
        money: team.money,
        hintsUsed: team.hintsUsed,
        endgameUnlocked: team.endgameUnlocked,
        loginEmail: team.email,
        hasPhoto: Boolean(team.leader.photo),
        leader: { name: team.leader.name, email: team.leader.email, phone: team.leader.phone ?? "" },
        members: team.members.map((m) => ({ name: m.name, email: m.email ?? "", phone: m.phone ?? "" })),
      }}
      tasks={tasks.map((t) => ({
        id: String(t._id),
        title: t.task?.title ?? "Task",
        type: t.type,
        round: t.round,
        isEndgame: t.isEndgame,
        points: t.points,
        money: t.money,
        done: t.status === "completed",
        by: t.completedBy ?? "",
        at: t.completedAt ? dateTime(t.completedAt) : "",
      }))}
      missions={missions.map((m) => ({
        id: String(m._id),
        title: m.title,
        round: m.round,
        difficulty: m.difficulty,
        points: m.points,
        money: m.money,
        scope: m.scope,
        crews: m.teamIds.length,
        done: team.dexterCompleted.includes(String(m._id)),
      }))}
      approvals={await toApprovalItems(approvals)}
    />
  );
}
