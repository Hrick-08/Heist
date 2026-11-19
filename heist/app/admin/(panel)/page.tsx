import { io } from "next/cache";
import { Suspense } from "react";

import { Skeleton } from "@/components/admin/skeleton";
import { OverviewView } from "@/components/admin/overview";
import { time } from "@/components/admin/format";
import { listTeamRows } from "@/lib/admin-view";
import {
  getEventState,
  getLeaderboard,
  getRecentCompletions,
  getTotals,
  listMissions,
  listPendingApprovals,
} from "@/lib/game";
import { wantedStars } from "@/lib/player";

export const instant = false;

export const metadata = { title: "Overview" };

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const [state, totals, teams, board, missions, feed, approvals] = await Promise.all([
    getEventState(),
    getTotals(),
    listTeamRows(),
    getLeaderboard(),
    listMissions(),
    getRecentCompletions(10),
    listPendingApprovals(),
  ]);

  const photo = new Map(teams.map((t) => [t.teamId, t.hasPhoto]));
  const champion = teams.find((t) => t.status === "champion");

  // time() formats a timestamp with `new Date()`; defer that to request time.
  await io();

  return (
    <OverviewView
      round={state.currentRound}
      totalRounds={state.totalRounds}
      ended={state.eventEnded}
      live={state.eventLive}
      slots={state.maxTeams}
      counts={{
        registered: teams.length,
        inPlay: teams.filter((t) => t.status === "selected").length,
        out: teams.filter((t) => t.status === "eliminated").length,
        waiting: teams.filter((t) => t.status === "waitlisted").length,
      }}
      pending={{ count: approvals.length, crew: approvals[0]?.crewName, title: approvals[0]?.title }}
      points={totals.points}
      cash={totals.money}
      missionsLive={missions.filter((m) => m.active).length}
      missionsTotal={missions.length}
      champion={
        champion
          ? { name: champion.name, teamId: champion.teamId, points: champion.points, money: champion.money, hasPhoto: champion.hasPhoto }
          : null
      }
      feed={feed.map((item, i) => ({
        key: `${item.teamId}-${i}`,
        teamName: item.teamName,
        title: item.title,
        points: item.points,
        money: item.money,
        at: time(item.completedAt),
      }))}
      standings={board.slice(0, 10).map((row) => ({
        rank: row.rank,
        teamId: row.teamId,
        name: row.name,
        points: row.points,
        completed: row.completed,
        status: row.status,
        stars: wantedStars(row.isWanted, row.rank),
        hasPhoto: photo.get(row.teamId) ?? false,
      }))}
    />
  );
}
