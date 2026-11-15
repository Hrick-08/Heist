import Link from "next/link";
import { Suspense } from "react";

import { TaskCard } from "@/components/task-card";
import { EmptyState, Panel, PanelHeader } from "@/components/ui";
import { getEventState, getTeamTasks, listApprovalsForTeam } from "@/lib/game";
import { requireTeam } from "@/lib/session";

export const instant = false;

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <Tasks />
    </Suspense>
  );
}

async function Tasks() {
  const { team } = await requireTeam();
  const [state, tasks, approvals] = await Promise.all([
    getEventState(),
    getTeamTasks(team.teamId),
    listApprovalsForTeam(team.teamId),
  ]);

  const pendingRefs = new Set(approvals.map((a) => String(a.refId)));

  const rounds = [...new Set(tasks.map((t) => t.round))].sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Target board</p>
        <h1 className="headline mt-2 text-4xl text-white">All targets</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
          Every target your crew has been given, in any order. Visit the control
          room desk and an admin marks each one off for you.
        </p>
      </header>

      {rounds.length === 0 ? (
        <Panel>
          <EmptyState
            title="No targets assigned yet"
            description="Targets are allocated when a round opens. The control room will post them here."
          />
        </Panel>
      ) : (
        rounds.map((round) => {
          const roundTasks = tasks.filter((t) => t.round === round);
          const done = roundTasks.filter((t) => t.status === "completed").length;
          const live = round === state.currentRound;
          return (
            <Panel key={round}>
              <PanelHeader
                title={`Round ${round}`}
                subtitle={`${done} of ${roundTasks.length} cleared`}
                accent={live ? "pink" : "cyan"}
                action={
                  live ? (
                    <span className="chip-wanted">Live round</span>
                  ) : (
                    <span className="chip-eliminated">Closed</span>
                  )
                }
              />
              <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {roundTasks.map((task) => (
                  <TaskCard
                    key={String(task._id)}
                    allotment={task}
                    canAfford={team.money >= task.task.hintCost}
                    requested={pendingRefs.has(String(task._id))}
                  />
                ))}
              </div>
            </Panel>
          );
        })
      )}

      <div className="flex justify-center">
        <Link href="/dashboard" className="btn-ghost">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
