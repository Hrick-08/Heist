import type { LeaderboardRow } from "@/lib/types";

const PODIUM = ["#f5c451", "#c9d1e4", "#c08457"];

export function LeaderboardTable({
  rows,
  highlightTeamId,
  compact = false,
}: {
  rows: LeaderboardRow[];
  highlightTeamId?: string;
  compact?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-white/35">
        No crews on the board yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full min-w-[520px] border-collapse text-left">
        <thead>
          <tr className="border-b border-white/8 text-[10px] uppercase tracking-[0.2em] text-white/35">
            <th className="px-5 py-3 font-semibold">Rank</th>
            <th className="px-3 py-3 font-semibold">Crew</th>
            <th className="px-3 py-3 font-semibold">Targets</th>
            {!compact && <th className="px-3 py-3 font-semibold">Status</th>}
            <th className="px-5 py-3 text-right font-semibold">Points</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const mine = row.teamId === highlightTeamId;
            return (
              <tr
                key={row.teamId}
                className={`border-b border-white/5 text-sm transition ${
                  mine ? "bg-pink/[0.08]" : "hover:bg-white/[0.03]"
                }`}
              >
                <td className="px-5 py-3">
                  <span
                    className="headline inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs"
                    style={{
                      color:
                        row.rank <= 3 ? PODIUM[row.rank - 1] : "rgba(255,255,255,0.55)",
                      background:
                        row.rank <= 3
                          ? `rgba(255,255,255,0.06)`
                          : "transparent",
                    }}
                  >
                    {row.rank}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="flex items-center gap-2">
                    <span className={mine ? "font-semibold text-pink" : "text-white"}>
                      {row.name}
                    </span>
                    {row.isWanted && (
                      <span className="chip-wanted !px-1.5 !py-0.5 !text-[9px]">
                        Wanted
                      </span>
                    )}
                    <span className="font-mono-display text-[10px] text-white/30">
                      {row.teamId}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-3 font-mono-display text-white/50">
                  {row.completed}
                </td>
                {!compact && (
                  <td className="px-3 py-3">
                    <span
                      className={
                        row.status === "champion"
                          ? "chip-done"
                          : row.status === "eliminated"
                            ? "chip-eliminated"
                            : "chip border-cyan/40 bg-cyan/10 text-cyan"
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                )}
                <td className="px-5 py-3 text-right font-mono-display text-white">
                  {row.points.toLocaleString("en-IN")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
