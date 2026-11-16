import { Suspense } from "react";

import { RanksView } from "@/components/player/ranks-view";
import { getRankedCrews } from "@/lib/player";
import { requireTeam } from "@/lib/session";

export const instant = false;

export default function RanksPage() {
  return (
    <Suspense fallback={<div className="card" style={{ height: 240 }} />}>
      <Ranks />
    </Suspense>
  );
}

async function Ranks() {
  const { team } = await requireTeam();
  const crews = await getRankedCrews();
  return <RanksView crews={crews} meId={team.teamId} />;
}
