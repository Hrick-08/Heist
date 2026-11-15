import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { EmptyState, Panel, PanelHeader, StatCard } from "@/components/ui";
import {
  advanceRoundAction,
  allocateRoundAction,
  crownChampionAction,
  seedAction,
  syncWantedAction,
} from "@/lib/actions/admin-actions";
import {
  getEventState,
  getLeaderboard,
  getRecentCompletions,
  getTotals,
  listMissions,
  listTeams,
} from "@/lib/game";

export const instant = false;

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const [state, totals, teams, board, missions, feed] = await Promise.all([
    getEventState(),
    getTotals(),
    listTeams(),
    getLeaderboard(),
    listMissions(),
    getRecentCompletions(10),
  ]);

  const selected = teams.filter((t) => t.status === "selected").length;
  const eliminated = teams.filter((t) => t.status === "eliminated").length;
  const waitlisted = teams.filter((t) => t.status === "waitlisted").length;
  const champion = teams.find((t) => t.status === "champion");
  const activeMissions = missions.filter((m) => m.active);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Event control</p>
          <h1 className="headline mt-2 text-4xl text-white">Overview</h1>
          <p className="mt-2 text-sm text-white/45">
            Round {state.currentRound} of {state.totalRounds} ·{" "}
            {state.eventEnded ? "event closed" : "event live"} ·{" "}
            {state.maxTeams} crew slots
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionForm
            action={syncWantedAction}
            submitLabel="Sync wanted (top 3)"
            submitClassName="btn-amber btn-sm"
          />
          <ActionForm action={seedAction} submitLabel="Seed pool" submitClassName="btn-ghost btn-sm" />
        </div>
      </header>

      {champion && (
        <section className="panel border-lime/35 bg-lime/[0.07] p-6">
          <p className="eyebrow text-lime/70">Champion</p>
          <h2 className="headline mt-2 text-3xl text-lime">
            {champion.name} <span className="text-white/40">({champion.teamId})</span>
          </h2>
          <p className="mt-2 text-sm text-white/50">
            {champion.points.toLocaleString("en-IN")} points ·{" "}
            {champion.money.toLocaleString("en-IN")} cash left in the pocket.
          </p>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Crews registered"
          value={teams.length}
          hint={`${selected} in play · ${eliminated} out · ${waitlisted} waiting`}
          tone="pink"
        />
        <StatCard
          label="Points on the board"
          value={totals.points.toLocaleString("en-IN")}
          hint="Drives every elimination"
          tone="cyan"
        />
        <StatCard
          label="Cash in play"
          value={"$" + totals.money.toLocaleString("en-IN")}
          hint="Clues, bribes, endgame"
          tone="amber"
        />
        <StatCard
          label="Dexter missions live"
          value={activeMissions.length}
          hint={`${missions.length} total in the archive`}
          tone="violet"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <Panel>
          <PanelHeader
            title="Round control"
            subtitle="Half the crews are knocked out when a round closes."
            accent="pink"
          />
          <div className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4].map((r) => (
                <div
                  key={r}
                  className={`flex-1 rounded-xl border px-2 py-3 text-center ${
                    r === state.currentRound
                      ? "border-pink/50 bg-pink/12"
                      : r < state.currentRound
                        ? "border-white/10 bg-white/[0.03] opacity-60"
                        : "border-white/8 bg-white/[0.02]"
                  }`}
                >
                  <p className="eyebrow">R{r}</p>
                  <p className="headline mt-1 text-lg text-white">
                    {r === state.currentRound ? "●" : r < state.currentRound ? "✓" : "○"}
                  </p>
                </div>
              ))}
            </div>

            <ActionForm
              action={allocateRoundAction}
              submitLabel={`Allocate round ${state.currentRound} targets`}
              submitClassName="btn-violet w-full"
              className="space-y-3"
            >
              <p className="text-xs leading-relaxed text-white/45">
                Hands this round&apos;s board to every crew that does not have one
                yet. Physical targets are shared, technical targets are dealt
                one to one crew.
              </p>
            </ActionForm>

            <ActionForm
              action={advanceRoundAction}
              submitLabel={
                state.currentRound >= state.totalRounds
                  ? "Close the final round"
                  : `Advance to round ${state.currentRound + 1}`
              }
              submitClassName="btn-pink w-full"
              confirm={
                state.currentRound >= state.totalRounds
                  ? "Close the final round?"
                  : `This eliminates ${Math.floor(selected / 2)} crew(s). Continue?`
              }
              className="space-y-3"
            >
              <p className="text-xs leading-relaxed text-white/45">
                Ranking by points, then targets cleared. The bottom half of the
                board is eliminated and the next round&apos;s targets are
                allocated to the survivors.
              </p>
            </ActionForm>

            <ActionForm
              action={crownChampionAction}
              submitLabel="Crown the champion"
              submitClassName="btn-lime w-full"
              confirm="End the event and crown the top crew?"
              className="space-y-3"
            >
              <p className="text-xs leading-relaxed text-white/45">
                Ends the event, eliminates the rest and locks the final scores.
              </p>
            </ActionForm>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Desk activity"
            subtitle="Targets verified at the desk."
            accent="cyan"
          />
          {feed.length === 0 ? (
            <EmptyState
              title="Nothing verified yet"
              description="As crews reach the desk and you mark their targets, the activity shows up here."
            />
          ) : (
            <ul className="divide-y divide-white/6">
              {feed.map((item, index) => (
                <li
                  key={`${item.teamId}-${index}`}
                  className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm"
                >
                  <span className="font-semibold text-white">{item.teamName}</span>
                  <span className="text-white/40">cleared</span>
                  <span className="text-white/75">{item.title}</span>
                  <span className="ml-auto flex items-center gap-2 text-[11px]">
                    <span className="rounded-md bg-cyan/10 px-2 py-0.5 font-mono-display text-cyan">
                      +{item.points}
                    </span>
                    <span className="rounded-md bg-amber/10 px-2 py-0.5 font-mono-display text-amber">
                      +${item.money}
                    </span>
                    {item.completedAt && (
                      <span className="text-white/30">
                        {item.completedAt.toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Standings"
          subtitle="Points only — cash never affects the order."
          accent="cyan"
          action={
            <Link href="/admin/teams" className="btn-ghost btn-sm">
              Manage crews
            </Link>
          }
        />
        <LeaderboardTable rows={board.slice(0, 10)} />
      </Panel>
    </div>
  );
}
