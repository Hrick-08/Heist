import { Suspense } from "react";

import { EndgameActions, RequestApproval } from "@/components/crew-actions";
import { Panel, PanelHeader, StatCard } from "@/components/ui";
import {
  getEventState,
  getTeamTasks,
  listApprovalsForTeam,
} from "@/lib/game";
import { requireTeam } from "@/lib/session";

export const instant = false;

export default function EndgamePage() {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <Endgame />
    </Suspense>
  );
}

async function Endgame() {
  const { team } = await requireTeam();
  const [state, tasks, approvals] = await Promise.all([
    getEventState(),
    getTeamTasks(team.teamId),
    listApprovalsForTeam(team.teamId),
  ]);

  const endgameTasks = tasks.filter((t) => t.isEndgame);
  const unlocked = team.endgameUnlocked;
  const pendingRefs = new Set(approvals.map((a) => String(a.refId)));

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-2xl border border-violet/30 bg-gradient-to-br from-violet/15 via-panel/80 to-panel/80 p-7">
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-violet/25 blur-3xl" />
        <p className="eyebrow">Final chapter</p>
        <h1 className="headline mt-2 text-4xl text-white sm:text-5xl">
          The Endgame
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/55">
          One vault. One shot. Funding the endgame costs real cash — and cash
          is the only currency the final door accepts. Points decide who walks
          away with the prize, but cash decides who gets to try.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Vault status"
          value={unlocked ? "Open" : "Sealed"}
          hint={unlocked ? "Final task assigned" : "Needs funding"}
          tone={unlocked ? "lime" : "violet"}
        />
        <StatCard
          label="Funding cost"
          value={"$" + state.endgameCost.toLocaleString("en-IN")}
          hint="Deducted from your cash"
          tone="amber"
        />
        <StatCard
          label="Your cash"
          value={"$" + team.money.toLocaleString("en-IN")}
          hint={`${team.hintsUsed} clue(s) bought so far`}
          tone="cyan"
        />
      </section>

      <Panel>
        <PanelHeader
          title="Fund the heist"
          subtitle="One payment opens the vault and assigns your final task."
          accent="violet"
        />
        <div className="space-y-4 p-6">
          {unlocked ? (
            <p className="rounded-xl border border-lime/30 bg-lime/8 px-4 py-3 text-sm text-lime">
              The vault is open. Your final task is on the board below — send it
              to the desk for sign-off when it is done.
            </p>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-white/50">
                {team.money >= state.endgameCost
                  ? "You have the cash. One click and the endgame is live."
                  : `You are $${(state.endgameCost - team.money).toLocaleString("en-IN")} short. Clear more tasks to raise the funds.`}
              </p>
              <EndgameActions
                cost={state.endgameCost}
                canAfford={team.money >= state.endgameCost}
              />
            </>
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Endgame tasks"
          subtitle="The only tasks worth the name."
          accent="pink"
        />
        {endgameTasks.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-white/35">
            No endgame task yet. Fund the heist to receive one.
          </p>
        ) : (
          <ul className="divide-y divide-white/8">
            {endgameTasks.map((task) => (
              <li key={String(task._id)} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="headline text-sm text-white">{task.task.title}</p>
                  <p className="mt-1 text-xs text-white/45">{task.task.description}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-md bg-cyan/10 px-2 py-1 font-mono-display text-cyan">
                    +{task.points} pts
                  </span>
                  <span className="rounded-md bg-amber/10 px-2 py-1 font-mono-display text-amber">
                    +${task.money.toLocaleString("en-IN")}
                  </span>
                  {task.status === "completed" ? (
                    <span className="chip-done">Done</span>
                  ) : (
                    <span className="chip-eliminated">Pending</span>
                  )}
                </div>
                {task.status !== "completed" && (
                  <div className="w-full">
                    <RequestApproval
                      kind="target"
                      refId={String(task._id)}
                      requested={pendingRefs.has(String(task._id))}
                      label="Task completed? Request sign-off"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
