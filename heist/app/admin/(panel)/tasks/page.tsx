import { Suspense } from "react";

import { Skeleton } from "@/components/admin/skeleton";
import { TaskPoolView } from "@/components/admin/task-pool";
import { listTasks, toTaskRow } from "@/lib/game";

export const instant = false;

export const metadata = { title: "Task pool" };

export default function AdminTasksPage() {
  return (
    <Suspense fallback={<Skeleton stats={5} blocks={1} />}>
      <Pool />
    </Suspense>
  );
}

async function Pool() {
  const tasks = await listTasks();
  return <TaskPoolView tasks={tasks.map(toTaskRow)} />;
}
