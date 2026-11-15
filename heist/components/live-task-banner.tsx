import { RequestApproval, TaskActions } from "@/components/crew-actions";
import type { TeamTaskView } from "@/lib/game";

export function LiveTaskBanner({
  allotment,
  requested = false,
  canAfford = false,
}: {
  allotment: TeamTaskView;
  requested?: boolean;
  canAfford?: boolean;
}) {
  const { task } = allotment;
  if (!task) return null;

  return (
    <section className="panel relative overflow-hidden border-cyan/30 bg-cyan/[0.06] p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan/15 blur-3xl" />
      <div className="relative flex flex-wrap items-start gap-5">
        <div className="shrink-0">
          <span className="headline pulse-live flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan/40 bg-cyan/12 text-2xl text-cyan">
            T
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip border-cyan/40 bg-cyan/10 text-cyan">
              Live task
            </span>
            {allotment.type === "physical" ? (
              <span className="chip-physical">Physical</span>
            ) : (
              <span className="chip-technical">Technical</span>
            )}
            <span className="chip border-white/12 bg-white/5 text-white/50">
              Round {allotment.round}
            </span>
            {allotment.isEndgame && (
              <span className="chip border-violet/50 bg-violet/15 text-violet">
                Endgame
              </span>
            )}
          </div>

          <h2 className="headline mt-3 text-xl text-white">{task.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">
            {task.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md bg-cyan/10 px-2 py-1 font-mono-display text-cyan">
              +{task.points} pts
            </span>
            <span className="rounded-md bg-amber/10 px-2 py-1 font-mono-display text-amber">
              +${task.money.toLocaleString("en-IN")}
            </span>
            <span className="text-white/40">
              Finished the task? Send it to the desk for approval.
            </span>
          </div>

          {allotment.hintPurchased ? (
            <p className="mt-4 rounded-lg border border-cyan/25 bg-cyan/8 px-3 py-2 text-[11px] leading-relaxed text-cyan/90">
              <span className="eyebrow block text-cyan/60">Clue</span>
              {task.hint}
            </p>
          ) : (
            <div className="mt-2">
              <TaskActions
                teamTaskId={String(allotment._id)}
                hintCost={task.hintCost}
                hintPurchased={false}
                canAfford={canAfford}
              />
            </div>
          )}

          <RequestApproval
            kind="target"
            refId={String(allotment._id)}
            requested={requested}
            label="Task completed? Request sign-off"
          />
        </div>
      </div>
    </section>
  );
}
