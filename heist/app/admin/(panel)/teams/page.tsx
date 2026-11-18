import { Suspense } from "react";

import { CrewsView } from "@/components/admin/crews";
import { Skeleton } from "@/components/admin/skeleton";
import { listTeamRows } from "@/lib/admin-view";
import { getEventState } from "@/lib/game";

export const instant = false;

export const metadata = { title: "Crews" };

export default function AdminTeamsPage() {
  return (
    <Suspense fallback={<Skeleton blocks={1} />}>
      <Crews />
    </Suspense>
  );
}

async function Crews() {
  const [rows, state] = await Promise.all([listTeamRows(), getEventState()]);
  return <CrewsView rows={rows} slots={state.maxTeams} bribe={state.wantedRemovalCost} />;
}
