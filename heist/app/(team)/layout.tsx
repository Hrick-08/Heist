import { Suspense } from "react";

import { LiveSync } from "@/components/player/live-sync";
import { PlayerNav } from "@/components/player/nav";
import { SignOutFooter } from "@/components/player/signout-footer";
import { TopBar } from "@/components/player/top-bar";
import { getShellData } from "@/lib/player";
import { fontVars } from "@/lib/fonts";
import { requireTeam } from "@/lib/session";

import "./player.css";

export const instant = false;

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The guard lives in the layout (not inside a Suspense boundary) so an
  // unauthenticated request is redirected instead of rendering a half shell.
  const { team } = await requireTeam();
  const { state, ledger, pointsLedger, snap } = await getShellData(team);

  return (
    <div className={`pl ${fontVars}`}>
      <TopBar
        teamId={team.teamId}
        name={team.name}
        hasPhoto={Boolean(team.leader.photo)}
        points={team.points}
        cash={team.money}
        round={state.currentRound}
        totalRounds={state.totalRounds}
        ledger={ledger}
        pointsLedger={pointsLedger}
        snap={snap}
      />
      <LiveSync />
      <Suspense fallback={null}>
        <PlayerNav />
      </Suspense>
      <main className="app">
        {children}
        <SignOutFooter />
      </main>
    </div>
  );
}
