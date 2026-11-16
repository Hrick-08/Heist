import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ClueButton, SignoffButton } from "@/components/player/actions";
import { count, money } from "@/components/player/format";
import { getEventState, listApprovalsForTeam } from "@/lib/game";
import { getPlayerTasks } from "@/lib/player";
import { requireTeam } from "@/lib/session";

export const instant = false;

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="card" style={{ height: 240 }} />}>
      <TaskDetail params={params} />
    </Suspense>
  );
}

async function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { team } = await requireTeam();
  const state = await getEventState();
  const approvals = await listApprovalsForTeam(team.teamId);
  const task = (await getPlayerTasks(team, state, approvals)).find((t) => t.id === id);
  if (!task) notFound();

  const done = task.status === "completed";
  const color = task.isEndgame ? "#a58bc9" : task.type === "physical" ? "#c8503e" : "#6c93cf";
  const kind = task.isEndgame ? "Endgame" : task.type === "physical" ? "Physical" : "Technical";

  return (
    <div style={{ ["--c" as string]: color }}>
      <Link href="/dashboard" className="back">Back to home</Link>
      <div className="chiprow">
        <span className="tag">{kind}</span>
        <span className="badge tiny">Round {task.round}</span>
        <span className="badge tiny">{done ? "Cleared" : task.round === state.currentRound ? "Live task" : "Open"}</span>
      </div>
      <h1>{task.title}</h1>

      <div className="meta">
        {task.minutes ? <div><span className="mute small">Time</span><b>{task.minutes} min</b></div> : null}
        {task.station ? <div><span className="mute small">Station</span><b>{task.station}</b></div> : null}
        <div><span className="mute small">Points</span><b>{count(task.points)} pts</b></div>
        <div><span className="mute small">Cash</span><b>+{money(task.money)}</b></div>
      </div>

      {done && (
        <div className="card done">
          Cleared by {task.completedBy ?? "the desk"}
          {task.completedLabel ? ` · ${task.completedLabel}` : ""}. You earned {count(task.points)} points
          and {money(task.money)}.
        </div>
      )}

      <h2>The job</h2>
      <p className="quote">{task.description}</p>

      {task.materials.length > 0 && (
        <>
          <h2>What you need</h2>
          <ul className="plain">{task.materials.map((x) => <li key={x}>{x}</li>)}</ul>
        </>
      )}

      {task.judging.length > 0 && (
        <>
          <h2>How you&apos;re judged</h2>
          <ul className="plain">{task.judging.map((x) => <li key={x}>{x}</li>)}</ul>
        </>
      )}

      <h2>Rewards</h2>
      <div className="card">
        <div className="row sp score"><span>Points (leaderboard)</span><b>+{count(task.points)}</b></div>
        <div className="row sp score"><span>Cash (clues, bribes, endgame)</span><b>+{money(task.money)}</b></div>
        <div className="row sp score"><span>Clue price</span><b>−{money(task.clueCost)} cash</b></div>
        <p className="mute small" style={{ marginTop: 8 }}>
          Clues are paid for in cash, never points. Cash never affects the leaderboard.
        </p>
      </div>

      {!done && (
        <>
          <h2>Stuck?</h2>
          <div className="card">
            {task.hintPurchased ? (
              <div className="cluebox">
                <span className="p-eyebrow">Clue</span>
                <p>{task.hint}</p>
              </div>
            ) : (
              <>
                <p className="mute small" style={{ marginBottom: 10 }}>
                  Buy the clue for this task with your cash.
                </p>
                <ClueButton teamTaskId={task.id} cost={task.clueCost} canAfford={team.money >= task.clueCost} />
              </>
            )}
          </div>
          <SignoffButton
            kind="target"
            refId={task.id}
            requested={task.requested}
            label="Task completed? Request sign-off"
          />
        </>
      )}
    </div>
  );
}
