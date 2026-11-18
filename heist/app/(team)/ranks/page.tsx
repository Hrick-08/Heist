import { Suspense } from "react";

import { BlockSkeleton } from "@/components/player/skeleton";

import { RanksView } from "@/components/player/ranks-view";
import { getRankedCrews } from "@/lib/player";
import { requireTeam } from "@/lib/session";

export const instant = false;

export const metadata = { title: "Ranks" };

export default function RanksPage() {
  return (
    <Suspense fallback={<BlockSkeleton />}>
      <Ranks />
    </Suspense>
  );
}

async function Ranks() {
  const { team } = await requireTeam();
  const crews = await getRankedCrews();
  return <RanksView crews={crews} meId={team.teamId} />;
}
