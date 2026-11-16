import { Barlow_Semi_Condensed, Bowlby_One } from "next/font/google";
import { Suspense } from "react";

import { PlayerNav } from "@/components/player/nav";
import { TopBar } from "@/components/player/top-bar";
import { getShellData } from "@/lib/player";
import { requireTeam } from "@/lib/session";

import "./player.css";

const display = Bowlby_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pl-display",
});
const body = Barlow_Semi_Condensed({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-pl-body",
});

export const instant = false;

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The guard lives in the layout (not inside a Suspense boundary) so an
  // unauthenticated request is redirected instead of rendering a half shell.
  const { team } = await requireTeam();
  const { state, ledger, pointsLedger } = await getShellData(team);

  return (
    <div className={`pl ${display.variable} ${body.variable}`}>
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
      />
      <Suspense fallback={null}>
        <PlayerNav />
      </Suspense>
      <main className="app">{children}</main>
    </div>
  );
}
