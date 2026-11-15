import { RequestApproval } from "@/components/crew-actions";
import type { DexterMission } from "@/lib/types";

export function DexterBanner({
  mission,
  completed,
  requested = false,
}: {
  mission: DexterMission;
  completed: boolean;
  requested?: boolean;
}) {
  return (
    <section
      className={`panel relative overflow-hidden border-pink/35 bg-pink/[0.07] p-6 ${
        completed ? "opacity-60" : ""
      }`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-pink/20 blur-3xl" />
      <div className="relative flex flex-wrap items-start gap-5">
        <div className="shrink-0">
          <span
            className={`headline flex h-14 w-14 items-center justify-center rounded-2xl border border-pink/50 bg-pink/15 text-2xl text-pink ${
              completed ? "" : "pulse-live"
            }`}
          >
            D
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip-wanted">Dexter Spotted</span>
            <span className="chip border-white/12 bg-white/5 text-white/50">
              Round {mission.round}
            </span>
            <span className="chip border-violet/40 bg-violet/10 text-violet">
              {mission.difficulty}
            </span>
            {completed && (
              <span className="chip-done">Already pulled off</span>
            )}
          </div>

          <h2 className="headline mt-3 text-xl text-white">{mission.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">
            {mission.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md bg-cyan/10 px-2 py-1 font-mono-display text-cyan">
              +{mission.points} pts
            </span>
            <span className="rounded-md bg-amber/10 px-2 py-1 font-mono-display text-amber">
              +${mission.money.toLocaleString("en-IN")}
            </span>
            <span className="text-white/40">
              {completed
                ? "Logged by the control room."
                : "Report to the admin desk to close this out."}
            </span>
          </div>

          {!completed && (
            <RequestApproval
              kind="dexter"
              refId={String(mission._id)}
              requested={requested}
              label="Dexter mission done? Request sign-off"
            />
          )}
        </div>
      </div>
    </section>
  );
}
