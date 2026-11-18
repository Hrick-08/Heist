import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BlockSkeleton } from "@/components/player/skeleton";

import { SignoffButton } from "@/components/player/actions";
import { count, money } from "@/components/player/format";
import { getEventState, getMission, listApprovalsForTeam } from "@/lib/game";
import { requireTeam } from "@/lib/session";

export const instant = false;

const LEVEL = { easy: "Easy", medium: "Medium", hard: "Hard" } as const;

export default function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<BlockSkeleton />}>
      <MissionDetail params={params} />
    </Suspense>
  );
}

async function MissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { team } = await requireTeam();
  const state = await getEventState();
  const mission = await getMission(id);

  // Same visibility rule the home screen uses: active, unlocked round, aimed at this crew.
  const visible =
    mission &&
    mission.active &&
    mission.round <= state.currentRound &&
    (mission.scope === "all" || mission.teamIds.includes(team.teamId));
  if (!mission || !visible) notFound();

  const missionId = String(mission._id);
  const done = team.dexterCompleted.includes(missionId);
  const approvals = await listApprovalsForTeam(team.teamId);
  const requested = approvals.some((a) => String(a.refId) === missionId);

  return (
    <div className="dtint" style={{ ["--c" as string]: "var(--red)" }}>
      <Link href="/dashboard" className="back">Back to home</Link>
      <div className="chiprow">
        <span className="badge red">Dexter spotted</span>
        <span className="badge tiny">Round {mission.round}</span>
        <span className="badge purple tiny">{LEVEL[mission.difficulty]}</span>
        <span className="badge tiny">{done ? "Cleared" : "Open"}</span>
      </div>
      <h1>{mission.title}</h1>

      <div className="meta">
        <div><span className="mute small">Points</span><b>{count(mission.points)} pts</b></div>
        <div><span className="mute small">Cash</span><b>+{money(mission.money)}</b></div>
        <div><span className="mute small">Level</span><b>{LEVEL[mission.difficulty]}</b></div>
      </div>

      {done && (
        <div className="card done">
          Mission cleared. You earned {count(mission.points)} points and {money(mission.money)}.
        </div>
      )}

      <h2>The mission</h2>
      <p className="quote">{mission.description}</p>

      <h2>Rewards</h2>
      <div className="card">
        <div className="row sp score"><span>Points (leaderboard)</span><b>+{count(mission.points)}</b></div>
        <div className="row sp score"><span>Cash (clues, bribes, endgame)</span><b>+{money(mission.money)}</b></div>
        <p className="mute small" style={{ marginTop: 8 }}>
          Dexter missions are signed off at the admin desk. Points and cash land once it is approved.
        </p>
      </div>

      {!done && (
        <SignoffButton
          kind="dexter"
          refId={missionId}
          requested={requested}
          label="Dexter mission done? Request sign-off"
        />
      )}
    </div>
  );
}
