export function RoundProgress({
  currentRound,
  totalRounds,
  maxTeams,
  survivors,
}: {
  currentRound: number;
  totalRounds: number;
  maxTeams: number;
  survivors: number;
}) {
  const counts: number[] = [];
  let n = maxTeams;
  for (let r = 1; r <= totalRounds; r += 1) {
    counts.push(n);
    n = Math.max(1, Math.ceil(n / 2));
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {counts.map((crews, index) => {
        const round = index + 1;
        const active = round === currentRound;
        const done = round < currentRound;
        return (
          <div
            key={round}
            className={`relative overflow-hidden rounded-xl border px-4 py-3 transition ${
              active
                ? "border-pink/50 bg-pink/10"
                : done
                  ? "border-white/8 bg-white/[0.02] opacity-60"
                  : "border-white/8 bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="eyebrow">Round {round}</span>
              {active && (
                <span className="chip-wanted !px-1.5 !py-0.5 !text-[9px]">
                  Live
                </span>
              )}
            </div>
            <p className="mt-1 font-display text-2xl font-black tabular-nums text-white">
              {round === currentRound ? survivors : crews}
              <span className="ml-1 text-xs font-semibold text-white/40">
                crews
              </span>
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/8">
              <div
                className={`h-full rounded-full ${
                  done
                    ? "bg-white/30"
                    : active
                      ? "bg-gradient-to-r from-pink to-violet"
                      : "bg-white/10"
                }`}
                style={{ width: `${Math.round((crews / maxTeams) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
