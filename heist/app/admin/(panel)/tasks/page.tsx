import { Suspense } from "react";

import { TaskPool } from "@/components/admin/task-pool";
import { Panel, PanelHeader, StatCard } from "@/components/ui";
import { listTasks, toTaskRow } from "@/lib/game";

export const instant = false;

export default function AdminTasksPage() {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <Pool />
    </Suspense>
  );
}

async function Pool() {
  const tasks = await listTasks();
  const rows = tasks.map(toTaskRow);

  const physical = rows.filter((t) => t.type === "physical" && !t.isEndgame);
  const technical = rows.filter((t) => t.type === "technical" && !t.isEndgame);
  const endgame = rows.filter((t) => t.isEndgame);
  const perRound = [1, 2, 3, 4].map((round) => ({
    round,
    physical: physical.filter((t) => t.round === round).length,
    technical: technical.filter((t) => t.round === round).length,
  }));

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Task library</p>
        <h1 className="headline mt-2 text-4xl text-white">Task pool</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/45">
          Physical tasks are handed to every crew in a round. Technical tasks are
          dealt one to one crew, so a task is never given to two teams at once.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {perRound.map((entry) => (
          <StatCard
            key={entry.round}
            label={`Round ${entry.round} tasks`}
            value={`${entry.physical + entry.technical}`}
            hint={`${entry.physical} physical · ${entry.technical} technical`}
            tone={entry.round === 1 ? "pink" : "cyan"}
          />
        ))}
      </section>

      <Panel>
        <PanelHeader
          title="Pool"
          subtitle="Edit, disable or delete any task."
          accent="pink"
        />
        <TaskPool tasks={rows} />
      </Panel>

      {endgame.length > 0 && (
        <Panel>
          <PanelHeader
            title="Endgame tasks"
            subtitle="Dealt to the crew that funds the final heist."
            accent="violet"
          />
          <ul className="divide-y divide-white/6">
            {endgame.map((task) => (
              <li key={task.id} className="px-5 py-3 text-sm">
                <p className="font-semibold text-white">{task.title}</p>
                <p className="mt-0.5 text-[11px] text-white/35">
                  {task.description} · {task.points} pts · ${task.money}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
