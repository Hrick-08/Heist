import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { RanksView } from "@/components/player/ranks-view";
import { BlockSkeleton } from "@/components/player/skeleton";
import { AutoRefresh } from "@/components/public/auto-refresh";
import { PublicFooter, PublicHeader, PublicShell } from "@/components/public/shell";
import { getEventState } from "@/lib/game";
import { getRankedCrews } from "@/lib/player";

export const metadata: Metadata = {
  title: "Leaderboard",
};

export default async function LeaderboardPage() {
  // The board only means something once the game is running. While crews are
  // still being signed up and picked, send visitors back to the briefing.
  const gate = await getEventState();
  if (gate.registrationOpen) redirect("/");

  return (
    <PublicShell>
      <PublicHeader current="leaderboard" />
      <main className="pu-board">
        <Suspense fallback={<BlockSkeleton height={420} />}>
          <Board />
        </Suspense>
      </main>
      <PublicFooter />
    </PublicShell>
  );
}

async function Board() {
  const [crews, state] = await Promise.all([getRankedCrews(), getEventState()]);
  // Team photos are only served to signed-in crews, so the public board uses silhouettes.
  const publicCrews = crews.map((c) => ({ ...c, hasPhoto: false }));

  return (
    <>
      <AutoRefresh />
      <span className="pu-live">
        <i aria-hidden />
        Live · Round {state.currentRound} of {state.totalRounds}
        {state.eventEnded ? " · Event closed" : ""}
      </span>
      <RanksView crews={publicCrews} meId="" />
    </>
  );
}
