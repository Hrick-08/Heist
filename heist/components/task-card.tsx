import type { TeamTaskView } from "@/lib/game";
import { RequestApproval, TaskActions } from "@/components/crew-actions";

export function TaskCard({
  allotment,
  canAfford,
  requested = false,
}: {
  allotment: TeamTaskView;
  canAfford: boolean;
  requested?: boolean;
}) {
  const { task } = allotment;
  const done = allotment.status === "completed";

  if (!task) return null;

  return (
    <article
      className={`panel relative flex h-full flex-col overflow-hidden p-5 ${
        done ? "opacity-70" : ""
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${
          allotment.type === "physical"
            ? "from-amber/70 via-amber/10 to-transparent"
            : "from-cyan/70 via-cyan/10 to-transparent"
        }`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {allotment.type === "physical" ? (
            <span className="chip-physical">Physical</span>
          ) : (
            <span className="chip-technical">Technical</span>
          )}
          {allotment.isEndgame && (
            <span className="chip border-violet/50 bg-violet/15 text-violet">
              Endgame
            </span>
          )}
          <span className="chip border-white/12 bg-white/5 text-white/50">
            Round {allotment.round}
          </span>
        </div>
        {done ? (
          <span className="chip-done">Done</span>
        ) : (
          <span className="chip border-white/12 bg-white/5 text-white/40">
            Pending
          </span>
        )}
      </div>

      <h3 className="headline mt-3 text-base leading-snug text-white">
        {task.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-white/50">
        {task.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/8 pt-3 text-xs">
        <span className="rounded-md bg-cyan/10 px-2 py-1 font-mono-display text-cyan">
          +{task.points} pts
        </span>
        <span className="rounded-md bg-amber/10 px-2 py-1 font-mono-display text-amber">
          +${task.money.toLocaleString("en-IN")}
        </span>
      </div>

      {allotment.hintPurchased ? (
        <p className="mt-3 rounded-lg border border-cyan/25 bg-cyan/8 px-3 py-2 text-[11px] leading-relaxed text-cyan/90">
          <span className="eyebrow block text-cyan/60">Clue</span>
          {task.hint}
        </p>
      ) : !done ? (
        <TaskActions
          teamTaskId={String(allotment._id)}
          hintCost={task.hintCost}
          hintPurchased={false}
          canAfford={canAfford}
        />
      ) : null}

      {!done && (
        <RequestApproval
          kind="target"
          refId={String(allotment._id)}
          requested={requested}
          label="Task completed? Request sign-off"
        />
      )}

      {done && allotment.completedAt && (
        <p className="mt-3 text-[11px] text-white/40">
          Verified at the desk by {allotment.completedBy ?? "control"} ·{" "}
          {allotment.completedAt.toLocaleString("en-IN")}
        </p>
      )}
    </article>
  );
}
