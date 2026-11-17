import { Suspense } from "react";

import { Skeleton } from "@/components/admin/skeleton";
import { SettingsView } from "@/components/admin/settings";
import { getEventState } from "@/lib/game";

export const instant = false;

export const metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<Skeleton blocks={2} />}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  const state = await getEventState();
  return (
    <SettingsView
      saved={{
        maxTeams: state.maxTeams,
        totalRounds: state.totalRounds,
        physicalPerRound: state.physicalPerRound,
        technicalPerRound: state.technicalPerRound,
        hintCostMultiplier: state.hintCostMultiplier,
        wantedRemovalCost: state.wantedRemovalCost,
        endgameCost: state.endgameCost,
        eventLive: state.eventLive,
      }}
    />
  );
}
