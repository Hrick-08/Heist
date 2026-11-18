import { getEventState, getTotals } from "@/lib/game";

export function StatsSkeleton() {
  return (
    <div className="pu-stats" aria-busy="true" aria-label="Loading stats">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="pu-stat sk" style={{ height: 112 }} />
      ))}
    </div>
  );
}

export async function LiveStats() {
  const [state, totals] = await Promise.all([getEventState(), getTotals()]);
  const items = [
    {
      label: "Crews in the game",
      value: totals.crews,
      hint: `${state.maxTeams} slots · first come first served`,
      color: "var(--gold)",
    },
    {
      label: "Round",
      value: `${state.currentRound} / ${state.totalRounds}`,
      hint: state.eventEnded ? "Event closed" : "Rounds live",
      color: "#6c93cf",
    },
    {
      label: "Points on the board",
      value: totals.points.toLocaleString("en-IN"),
      hint: "Points decide survival",
      color: "var(--text)",
    },
    {
      label: "Cash in circulation",
      value: "$" + totals.money.toLocaleString("en-IN"),
      hint: "Clues, bribes and the endgame",
      color: "var(--cash)",
    },
  ];
  return (
    <div className="pu-stats">
      {items.map((s) => (
        <div key={s.label} className="pu-stat">
          <small>{s.label}</small>
          <b style={{ color: s.color }}>{s.value}</b>
          <span>{s.hint}</span>
        </div>
      ))}
    </div>
  );
}
