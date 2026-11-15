"use client";

import { useMemo, useState } from "react";

import { ActionForm } from "@/components/admin/action-form";
import {
  createTaskAction,
  deleteTaskAction,
  toggleTaskAction,
  updateTaskAction,
} from "@/lib/actions/admin-actions";
import type { TaskRow } from "@/lib/types";

function TaskFields({ task }: { task?: Partial<TaskRow> }) {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="title"
          className="field"
          placeholder="Task title"
          defaultValue={task?.title ?? ""}
          required
        />
        <select
          name="type"
          className="field"
          defaultValue={task?.type ?? "technical"}
        >
          <option value="physical">Physical</option>
          <option value="technical">Technical</option>
        </select>
      </div>
      <textarea
        name="description"
        className="field min-h-[72px]"
        placeholder="What has to be done?"
        defaultValue={task?.description ?? ""}
      />
      <div className="grid gap-2 sm:grid-cols-4">
        <input
          name="round"
          type="number"
          min={1}
          max={4}
          className="field"
          placeholder="Round"
          defaultValue={task?.round ?? 1}
        />
        <input
          name="points"
          type="number"
          className="field"
          placeholder="Points"
          defaultValue={task?.points ?? 150}
        />
        <input
          name="money"
          type="number"
          className="field"
          placeholder="Cash"
          defaultValue={task?.money ?? 800}
        />
        <input
          name="hintCost"
          type="number"
          className="field"
          placeholder="Hint cost"
          defaultValue={task?.hintCost ?? 350}
        />
      </div>
      <textarea
        name="hint"
        className="field min-h-[64px]"
        placeholder="Clue revealed when the crew pays"
        defaultValue={task?.hint ?? ""}
      />
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-white/60">
          <input
            type="checkbox"
            name="active"
            defaultChecked={task?.active ?? true}
            className="h-4 w-4 accent-cyan"
          />
          Active in pool
        </label>
        <label className="flex items-center gap-2 text-xs text-white/60">
          <input
            type="checkbox"
            name="isEndgame"
            defaultChecked={task?.isEndgame ?? false}
            className="h-4 w-4 accent-violet"
          />
          Endgame target
        </label>
      </div>
    </>
  );
}

export function TaskPool({ tasks }: { tasks: TaskRow[] }) {
  const [round, setRound] = useState("all");
  const [type, setType] = useState("all");
  const [editing, setEditing] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (round === "all" || task.round === Number(round)) &&
          (type === "all" || task.type === type),
      ),
    [tasks, round, type],
  );

  const grouped = useMemo(() => {
    const map = new Map<number, TaskRow[]>();
    for (const task of filtered) {
      const list = map.get(task.round) ?? [];
      list.push(task);
      map.set(task.round, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/8 px-5 py-4">
        <select
          className="field max-w-[160px]"
          value={round}
          onChange={(event) => setRound(event.target.value)}
        >
          <option value="all">All rounds</option>
          {[1, 2, 3, 4].map((r) => (
            <option key={r} value={r}>
              Round {r}
            </option>
          ))}
        </select>
        <select
          className="field max-w-[160px]"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          <option value="all">All types</option>
          <option value="physical">Physical</option>
          <option value="technical">Technical</option>
        </select>
        <span className="text-xs text-white/40">
          {filtered.length} task(s) shown · physical targets are shared, technical
          targets are handed out one crew at a time.
        </span>
      </div>

      {grouped.length === 0 && (
        <p className="px-5 py-12 text-center text-sm text-white/35">
          No tasks match that filter.
        </p>
      )}

      {grouped.map(([roundNumber, roundTasks]) => (
        <div key={roundNumber}>
          <p className="eyebrow px-5 pt-5">Round {roundNumber}</p>
          <div className="divide-y divide-white/6">
            {roundTasks.map((task) => (
              <div key={task.id} className="px-5 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                      {task.title}
                      {task.type === "physical" ? (
                        <span className="chip-physical">Physical</span>
                      ) : (
                        <span className="chip-technical">Technical</span>
                      )}
                      {task.isEndgame && (
                        <span className="chip border-violet/50 bg-violet/15 text-violet">
                          Endgame
                        </span>
                      )}
                      {task.active ? (
                        <span className="chip border-lime/40 bg-lime/10 text-lime">
                          Active
                        </span>
                      ) : (
                        <span className="chip-eliminated">Inactive
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/35">
                      {task.description}
                    </p>
                  </div>
                  <span className="rounded-md bg-cyan/10 px-2 py-1 font-mono-display text-xs text-cyan">
                    {task.points} pts
                  </span>
                  <span className="rounded-md bg-amber/10 px-2 py-1 font-mono-display text-xs text-amber">
                    ${task.money}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={() =>
                        setEditing(editing === task.id ? null : task.id)
                      }
                    >
                      {editing === task.id ? "Close" : "Edit"}
                    </button>
                    <ActionForm
                      action={toggleTaskAction}
                      submitLabel={task.active ? "Disable" : "Enable"}
                      submitClassName="btn-ghost btn-sm"
                    >
                      <input type="hidden" name="id" value={task.id} />
                    </ActionForm>
                    <ActionForm
                      action={deleteTaskAction}
                      submitLabel="Delete"
                      submitClassName="btn-danger btn-sm"
                      confirm={`Delete "${task.title}"? Allotments are removed too.`}
                    >
                      <input type="hidden" name="id" value={task.id} />
                    </ActionForm>
                  </div>
                </div>

                {editing === task.id && (
                  <div className="mt-3 rounded-xl border border-white/10 bg-ink/60 p-4">
                    <ActionForm
                      action={updateTaskAction}
                      submitLabel="Save task"
                      submitClassName="btn-cyan btn-sm"
                      className="space-y-2"
                    >
                      <input type="hidden" name="id" value={task.id} />
                      <TaskFields task={task} />
                    </ActionForm>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="border-t border-white/8 p-5">
        <p className="field-label">Add a task to the pool</p>
        <ActionForm
          action={createTaskAction}
          submitLabel="Add task"
          submitClassName="btn-pink btn-sm"
          className="space-y-2"
        >
          <TaskFields />
        </ActionForm>
      </div>
    </div>
  );
}
