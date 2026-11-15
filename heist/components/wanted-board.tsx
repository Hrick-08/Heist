import type { Team } from "@/lib/types";

export function WantedBoard({ teams }: { teams: Team[] }) {
  if (teams.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-white/35">
        The city is quiet. Nobody is wanted right now.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <article
          key={team.teamId}
          className="relative overflow-hidden rounded-2xl border border-amber/30 bg-gradient-to-br from-amber/15 via-amber/5 to-transparent p-5"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,176,32,0.18),transparent_60%)]" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="headline text-2xl tracking-[0.08em] text-amber">
                WANTED
              </span>
              <span className="font-mono-display text-[11px] text-amber/70">
                {team.teamId}
              </span>
            </div>

            <div className="mt-4 space-y-1 text-sm">
              <p className="font-semibold text-white">{team.name}</p>
              <p className="text-white/50">
                {team.leader.name} · {team.leader.email}
              </p>
              <p className="text-white/35">
                {team.points.toLocaleString("en-IN")} pts ·{" "}
                {team.members.length + 1} crew members
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-amber/20 pt-3 text-[11px] text-amber/70">
              <span>Bounty: ${team.points.toLocaleString("en-IN")}</span>
              {team.wantedAt && (
                <span>
                  Since{" "}
                  {team.wantedAt.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
