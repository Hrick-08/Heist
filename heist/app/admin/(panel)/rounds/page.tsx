import { Suspense } from "react";

import { RoundsView } from "@/components/admin/rounds";
import { Skeleton } from "@/components/admin/skeleton";
import { listTeamRows } from "@/lib/admin-view";
import { getEventState, getLeaderboard } from "@/lib/game";
import { wantedStars } from "@/lib/player";

export const instant = false;

export const metadata = { title: "Rounds" };

export default function AdminRoundsPage() {
  return (
    <Suspense fallback={<Skeleton blocks={2} />}>
      <Rounds />
    </Suspense>
  );
}

async function Rounds() {
  const [state, teams, board] = await Promise.all([getEventState(), listTeamRows(), getLeaderboard()]);

  const rank = new Map(board.map((r) => [r.teamId, r.rank]));
  const eliminated = teams.filter((t) => t.status === "eliminated" && t.eliminatedInRound);
  const wanted = teams
    .filter((t) => t.wanted)
    .sort((a, b) => b.points - a.points)
    .map((t) => ({
      teamId: t.teamId,
      name: t.name,
      points: t.points,
      rank: rank.get(t.teamId) ?? 0,
      stars: wantedStars(true, rank.get(t.teamId) ?? 0),
      hasPhoto: t.hasPhoto,
    }));

  const plan: number[] = [];
  let n = state.maxTeams;
  for (let r = 1; r <= state.totalRounds; r += 1) {
    plan.push(n);
    n = Math.max(1, Math.ceil(n / 2));
  }

  return (
    <RoundsView
      round={state.currentRound}
      totalRounds={state.totalRounds}
      ended={state.eventEnded}
      slots={state.maxTeams}
      inPlay={teams.filter((t) => t.status === "selected").length}
      eliminated={eliminated.length}
      plan={plan}
      wanted={wanted}
      wantedTotal={wanted.length}
      history={Array.from({ length: state.totalRounds }, (_, i) => ({
        round: i + 1,
        crews: eliminated
          .filter((t) => t.eliminatedInRound === i + 1)
          .map((t) => ({ teamId: t.teamId, name: t.name, points: t.finalPoints ?? t.points })),
      }))}
      standings={board.slice(0, 12).map((r) => ({ rank: r.rank, teamId: r.teamId, name: r.name, points: r.points }))}
    />
  );
}
