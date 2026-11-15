import { getEventState, getTotals } from "@/lib/game";
import { StatCard } from "@/components/ui";

export function StatsSkeleton() {
  return (
    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="panel-flush h-[104px] animate-pulse px-5 py-4"
          aria-hidden
        />
      ))}
    </div>
  );
}

export async function LiveStats() {
  const [state, totals] = await Promise.all([getEventState(), getTotals()]);

  return (
    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Crews in the game"
        value={totals.crews}
        hint={`${state.maxTeams} slots · first come first served`}
        tone="pink"
      />
      <StatCard
        label="Round"
        value={`${state.currentRound} / ${state.totalRounds}`}
        hint={state.eventEnded ? "Event closed" : "Rounds live"}
        tone="cyan"
      />
      <StatCard
        label="Points on the board"
        value={totals.points.toLocaleString("en-IN")}
        hint="Points decide survival"
        tone="violet"
      />
      <StatCard
        label="Cash in circulation"
        value={"$" + totals.money.toLocaleString("en-IN")}
        hint="Clues, bribes and the endgame"
        tone="amber"
      />
    </div>
  );
}
