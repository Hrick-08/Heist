import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LeaderboardTable } from "@/components/leaderboard-table";
import { Logo, Panel, PanelHeader, StatCard } from "@/components/ui";
import { getEventState, getLeaderboard } from "@/lib/game";

export const metadata: Metadata = {
  title: "Leaderboard",
};

export default function LeaderboardPage() {
  return (
    <main className="flex min-h-full flex-col">
      <header className="border-b border-white/8 bg-void/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost btn-sm">
              Team login
            </Link>
            <Link href="/admin/login" className="btn-ghost btn-sm">
              Control room
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
          <Board />
        </Suspense>
      </div>

      <footer className="border-t border-white/8 px-5 py-6 text-center">
        <p className="eyebrow">
          The Last Heist · GDG Campus Chitkara · Ranked on points only
        </p>
      </footer>
    </main>
  );
}

async function Board() {
  const [board, state] = await Promise.all([getLeaderboard(), getEventState()]);
  const alive = board.filter(
    (row) => row.status === "selected" || row.status === "champion",
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">
          Round {state.currentRound} of {state.totalRounds}
          {state.eventEnded ? " · Event closed" : ""}
        </p>
        <h1 className="headline mt-2 text-4xl text-white sm:text-5xl">
          Leaderboard
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
          Survival is decided by points. Cash buys clues and bribes but it never
          moves you up this board.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Crews tracked"
          value={board.length}
          hint={`${alive.length} still in the heist`}
          tone="pink"
        />
        <StatCard
          label="Top score"
          value={(board[0]?.points ?? 0).toLocaleString("en-IN")}
          hint={board[0]?.name ?? "—"}
          tone="cyan"
        />
        <StatCard
          label="Round"
          value={`${state.currentRound} / ${state.totalRounds}`}
          hint={state.eventEnded ? "Final scores locked" : "Live"}
          tone="violet"
        />
      </section>

      <Panel>
        <PanelHeader
          title="All crews"
          subtitle="Points only — cash is never part of the ranking."
          accent="cyan"
        />
        <LeaderboardTable rows={board} />
      </Panel>
    </div>
  );
}
