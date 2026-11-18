import { redirect } from "next/navigation";

export const instant = false;

/** The task list now lives on the Home tab, so this old route just forwards there. */
export default function TasksPage() {
  redirect("/dashboard");
}
