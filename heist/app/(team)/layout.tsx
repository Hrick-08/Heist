import { TeamHeader } from "@/components/team-header";
import { getEventState } from "@/lib/game";
import { requireTeam } from "@/lib/session";

export const instant = false;

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The guard lives in the layout (not inside a Suspense boundary) so an
  // unauthenticated request is redirected instead of rendering a half shell.
  const { team } = await requireTeam();
  const state = await getEventState();

  return (
    <div className="flex min-h-full flex-col">
      <TeamHeader team={team} state={state} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8">{children}</main>
      <footer className="border-t border-white/8 px-5 py-6 text-center">
        <p className="eyebrow">
          The Last Heist · GDG Campus Chitkara · Cash never touches the
          leaderboard
        </p>
      </footer>
    </div>
  );
}
