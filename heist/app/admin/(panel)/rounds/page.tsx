import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { WantedBoard } from "@/components/wanted-board";
import { EmptyState, Panel, PanelHeader, StatCard } from "@/components/ui";
import {
  advanceRoundAction,
  allocateRoundAction,
  crownChampionAction,
  syncWantedAction,
} from "@/lib/actions/admin-actions";
import {
  getEventState,
  getLeaderboard,
  getWantedTeams,
  listTeams,
} from "@/lib/game";

export const instant = false;

export default function AdminRoundsPage() {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <Rounds />
    </Suspense>
  );
}

async function Rounds() {
  const [state, teams, board, wanted] = await Promise.all([
    getEventState(),
    listTeams(),
    getLeaderboard(),
    getWantedTeams(),
  ]);

  const alive = teams.filter((t) => t.status === "selected");
  const eliminated = teams.filter(
    (t) => t.status === "eliminated" && t.eliminatedInRound,
  );
  const eliminatedByRound = [1, 2, 3, 4].map((round) => ({
    round,
    teams: eliminated.filter((t) => t.eliminatedInRound === round),
  }));

  const counts: number[] = [];
  let n = state.maxTeams;
  for (let r = 1; r <= state.totalRounds; r += 1) {
    counts.push(n);
    n = Math.max(1, Math.ceil(n / 2));
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">The funnel</p>
        <h1 className="headline mt-2 text-4xl text-white">Rounds</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/45">
          Closing a round knocks out the bottom half of the standings and
          allocates the next round&apos;s targets to the survivors.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Current round"
          value={`${state.currentRound} / ${state.totalRounds}`}
          hint={state.eventEnded ? "Event closed" : "Live"}
          tone="pink"
        />
        <StatCard
          label="Crews in play"
          value={alive.length}
          hint={`${state.maxTeams} slots originally`}
          tone="cyan"
        />
        <StatCard
          label="Eliminated"
          value={eliminated.length}
          tone="violet"
        />
        <StatCard
          label="On the wanted list"
          value={wanted.length}
          tone="amber"
        />
      </section>

      <Panel>
        <PanelHeader title="Round flow" accent="pink" />
        <div className="space-y-5 p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {counts.map((crews, index) => {
              const round = index + 1;
              const active = round === state.currentRound;
              const done = round < state.currentRound;
              return (
                <div
                  key={round}
                  className={`rounded-xl border px-4 py-3 ${
                    active
                      ? "border-pink/50 bg-pink/10"
                      : done
                        ? "border-white/8 bg-white/[0.02] opacity-60"
                        : "border-white/8 bg-white/[0.02]"
                  }`}
                >
                  <p className="eyebrow">Round {round}</p>
                  <p className="mt-1 font-display text-2xl font-black text-white">
                    {crews}
                    <span className="ml-1 text-xs font-semibold text-white/40">
                      crews
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] text-white/35">
                    {done ? "closed" : active ? "in play" : "upcoming"}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <ActionForm
              action={allocateRoundAction}
              submitLabel={`Allocate round ${state.currentRound} targets`}
              submitClassName="btn-violet"
            />
            <ActionForm
              action={advanceRoundAction}
              submitLabel={
                state.currentRound >= state.totalRounds
                  ? "Close the final round"
                  : `Advance to round ${state.currentRound + 1}`
              }
              submitClassName="btn-pink"
              confirm={`Eliminate ${Math.floor(alive.length / 2)} crew(s) and allocate the next round?`}
            />
            <ActionForm
              action={crownChampionAction}
              submitLabel="Crown the champion"
              submitClassName="btn-lime"
              confirm="End the event now?"
            />
            <ActionForm
              action={syncWantedAction}
              submitLabel="Sync wanted (top 3)"
              submitClassName="btn-amber"
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Wanted board"
          subtitle="The top three crews on the leaderboard are the ones the city wants."
          accent="amber"
        />
        <div className="p-5">
          <WantedBoard teams={wanted} />
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Elimination history"
          accent="violet"
        />
        {eliminatedByRound.every((entry) => entry.teams.length === 0) ? (
          <EmptyState
            title="Nobody has been knocked out yet"
            description="Close round one to see the eliminations roll in."
          />
        ) : (
          eliminatedByRound.map((entry) =>
            entry.teams.length === 0 ? null : (
              <div key={entry.round} className="border-b border-white/6 last:border-0">
                <p className="eyebrow px-5 pt-4">Round {entry.round}</p>
                <ul className="flex flex-wrap gap-2 px-5 py-3">
                  {entry.teams.map((team) => (
                    <li
                      key={team.teamId}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/60"
                    >
                      <span className="font-mono-display text-white/40">
                        {team.teamId}
                      </span>{" "}
                      {team.name} · {team.finalPoints ?? team.points} pts
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Standings" subtitle="Points only." accent="cyan" />
        <ul className="divide-y divide-white/6">
          {board.slice(0, 12).map((row) => (
            <li
              key={row.teamId}
              className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-sm"
            >
              <span className="headline w-7 text-xs text-white/40">
                {row.rank}
              </span>
              <span className="font-semibold text-white">{row.name}</span>
              <span className="font-mono-display text-[10px] text-white/30">
                {row.teamId}
              </span>
              <span className="ml-auto font-mono-display text-white">
                {row.points.toLocaleString("en-IN")}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
