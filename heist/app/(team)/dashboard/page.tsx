import Link from "next/link";
import { Suspense } from "react";

import { DexterBanner } from "@/components/dexter-banner";
import { LiveTaskBanner } from "@/components/live-task-banner";
import { WantedActions } from "@/components/crew-actions";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { RoundProgress } from "@/components/round-progress";
import { WantedBoard } from "@/components/wanted-board";
import { Panel, PanelHeader, StatCard } from "@/components/ui";
import {
  getEventState,
  getLeaderboard,
  getTeamTasks,
  getVisibleMissions,
  getWantedTeams,
  listApprovalsForTeam,
} from "@/lib/game";
import { requireTeam } from "@/lib/session";

export const instant = false;

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="panel h-32 animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="panel-flush h-28 animate-pulse" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="panel h-64 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

async function Dashboard() {
  const { team } = await requireTeam();
  const state = await getEventState();
  const [allTasks, missions, wanted, board, approvals] = await Promise.all([
    getTeamTasks(team.teamId),
    getVisibleMissions(team.teamId, state.currentRound),
    getWantedTeams(),
    getLeaderboard(),
    listApprovalsForTeam(team.teamId),
  ]);

  const pendingRefs = new Set(approvals.map((a) => String(a.refId)));

  const completed = allTasks.filter((t) => t.status === "completed");
  const rank = board.findIndex((row) => row.teamId === team.teamId) + 1;
  const liveTasks = allTasks.filter(
    (t) =>
      t.round === state.currentRound &&
      !t.isEndgame &&
      t.status !== "completed",
  );
  const pendingMissions = missions.filter(
    (m) => !team.dexterCompleted.includes(String(m._id)),
  );
  const survivors = board.filter(
    (row) => row.status === "selected" || row.status === "champion",
  ).length;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="panel relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-pink/15 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">
              {team.teamId} · Round {team.round} of {state.totalRounds}
            </p>
            <h1 className="headline mt-2 text-4xl leading-tight text-white sm:text-5xl">
              {team.name}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/45">
              Leader <span className="text-white/80">{team.leader.name}</span>{" "}
              · {team.members.length + 1} crew members ·{" "}
              {completed.length} of {allTasks.length} tasks cleared.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {team.wanted ? (
              <span className="chip-wanted">Wanted</span>
            ) : (
              <span className="chip border-lime/40 bg-lime/10 text-lime">Clean</span>
            )}
            <span className="chip border-cyan/40 bg-cyan/10 text-cyan">
              Rank #{rank || "—"}
            </span>
            {team.endgameUnlocked && (
              <span className="chip border-violet/50 bg-violet/15 text-violet">
                Endgame armed
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Points"
          value={team.points.toLocaleString("en-IN")}
          hint="Drives the leaderboard and survival"
          tone="cyan"
        />
        <StatCard
          label="Cash"
          value={"$" + team.money.toLocaleString("en-IN")}
          hint="Clues, bribes and the endgame"
          tone="amber"
        />
        <StatCard
          label="Tasks cleared"
          value={`${completed.length}/${allTasks.length}`}
          hint="Approved by the desk"
          tone="lime"
        />
        <StatCard
          label="Clues bought"
          value={team.hintsUsed}
          hint="Cash spent on hints"
          tone="violet"
        />
      </section>

      {/* Dexter */}
      {missions.length > 0 && (
        <section className="space-y-4">
          <h2 className="headline text-lg text-white">Dexter missions</h2>
          {pendingMissions.map((mission) => (
            <DexterBanner
              key={String(mission._id)}
              mission={mission}
              completed={false}
              requested={pendingRefs.has(String(mission._id))}
            />
          ))}
          {pendingMissions.length === 0 && (
            <p className="rounded-xl border border-lime/25 bg-lime/8 px-4 py-3 text-sm text-lime">
              Every Dexter mission aimed at your crew is done. Stay sharp.
            </p>
          )}
        </section>
      )}

      {/* Rounds */}
      <section className="space-y-4">
        <h2 className="headline text-lg text-white">The funnel</h2>
        <RoundProgress
          currentRound={state.currentRound}
          totalRounds={state.totalRounds}
          maxTeams={state.maxTeams}
          survivors={survivors}
        />
      </section>

      {/* Live tasks */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="headline text-lg text-white">
              Live tasks · Round {state.currentRound}
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Finish a task and request sign-off from the desk — just like
              Dexter missions.
            </p>
          </div>
          <Link href="/tasks" className="btn-ghost btn-sm">
            All tasks
          </Link>
        </div>
        {liveTasks.length === 0 ? (
          <p className="rounded-xl border border-lime/25 bg-lime/8 px-4 py-3 text-sm text-lime">
            No live tasks right now. Every task for this round is cleared or
            waiting to be assigned.
          </p>
        ) : (
          <div className="space-y-4">
            {liveTasks.map((task) => (
              <LiveTaskBanner
                key={String(task._id)}
                allotment={task}
                requested={pendingRefs.has(String(task._id))}
                canAfford={team.money >= task.task.hintCost}
              />
            ))}
          </div>
        )}
      </section>

      {/* Cleared tasks */}
      {completed.length > 0 && (
        <Panel>
          <PanelHeader
            title="Cleared tasks"
            subtitle="Approved by the desk — the payout is already in your ledger."
            accent="lime"
            action={
              <Link href="/tasks" className="btn-ghost btn-sm">
                All tasks
              </Link>
            }
          />
          <ul className="divide-y divide-white/8">
            {completed.map((task) => (
              <li
                key={String(task._id)}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="headline text-sm text-white">{task.task.title}</p>
                  <p className="mt-1 text-xs text-white/45">
                    Round {task.round} · verified by{" "}
                    {task.completedBy ?? "the desk"}
                    {task.completedAt
                      ? ` · ${task.completedAt.toLocaleString("en-IN")}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-md bg-cyan/10 px-2 py-1 font-mono-display text-cyan">
                    +{task.points} pts
                  </span>
                  <span className="rounded-md bg-amber/10 px-2 py-1 font-mono-display text-amber">
                    +${task.money.toLocaleString("en-IN")}
                  </span>
                  <span className="chip-done">Approved</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Wanted */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel>
          <PanelHeader
            title="Most wanted"
            subtitle="Top crews on the leaderboard are on the city's radar."
            accent="amber"
          />
          <div className="p-5">
            <WantedBoard teams={wanted} />
          </div>
        </Panel>

        <Panel id="wanted-poster" className="scroll-mt-28">
          <PanelHeader title="Your poster" accent="pink" />
          <div className="p-5">
            {team.wanted ? (
              <div className="space-y-4">
                <p className="rounded-xl border border-pink/35 bg-pink/10 px-4 py-3 text-sm leading-relaxed text-pink">
                  Your crew is wanted. Pay the bribe and the heat dies down.
                </p>
                <WantedActions cost={state.wantedRemovalCost} />
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-white/45">
                You are not on the wanted list. Stay off the radar and the
                posters stay empty.
              </p>
            )}
          </div>
        </Panel>
      </div>

      {/* Leaderboard */}
      <Panel>
        <PanelHeader
          title="Leaderboard"
          subtitle="Ranked on points only. Cash is deliberately hidden."
          accent="cyan"
          action={
            <Link href="/leaderboard" className="btn-ghost btn-sm">
              Full board
            </Link>
          }
        />
        <LeaderboardTable rows={board.slice(0, 8)} highlightTeamId={team.teamId} />
      </Panel>
    </div>
  );
}
