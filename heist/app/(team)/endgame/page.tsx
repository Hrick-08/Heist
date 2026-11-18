import { redirect } from "next/navigation";

export const instant = false;

/** The endgame vault is now a card in the Home task list, so this old route forwards there. */
export default function EndgamePage() {
  redirect("/dashboard");
}
