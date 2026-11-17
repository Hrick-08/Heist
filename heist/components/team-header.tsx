import { logoutAction } from "@/lib/actions/auth-actions";
import type { EventState, Team } from "@/lib/types";
import { Logo } from "@/components/ui";
import { TeamNav } from "@/components/team-nav";
import { PosterLink } from "@/components/poster-link";

export function TeamHeader({
  team,
  state,
}: {
  team: Team;
  state: EventState;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-void/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        <Logo />
        <TeamNav />

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs sm:inline-flex">
            <span className="eyebrow">Round</span>
            <span className="font-mono-display text-white">
              {state.currentRound}/{state.totalRounds}
            </span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-cyan/25 bg-cyan/10 px-3 py-1.5 text-xs">
            <span className="eyebrow text-cyan/60">Pts</span>
            <span className="font-mono-display text-cyan">
              {team.points.toLocaleString("en-IN")}
            </span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-amber/25 bg-amber/10 px-3 py-1.5 text-xs">
            <span className="eyebrow text-amber/60">Cash</span>
            <span className="font-mono-display text-amber">
              ${team.money.toLocaleString("en-IN")}
            </span>
          </span>
          <span className="hidden rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono-display text-[11px] text-white/60 md:inline-flex">
            {team.teamId}
          </span>
          <form action={logoutAction}>
            <button type="submit" className="btn-ghost btn-sm">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {team.wanted && (
        <div className="border-t border-pink/30 bg-pink/10">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-5 py-2 text-xs text-pink">
            <span className="headline text-sm">Wanted</span>
            <span>
              Your crew is on the city&apos;s most wanted list. Visit the
              dashboard to pay the bribe and go dark.
            </span>
            <PosterLink className="ml-auto font-semibold text-pink underline underline-offset-4">
              View poster
            </PosterLink>
          </div>
        </div>
      )}
    </header>
  );
}
