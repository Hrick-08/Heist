import { Suspense } from "react";

import { DexterView } from "@/components/admin/dexter";
import { Skeleton } from "@/components/admin/skeleton";
import { listTeamRows } from "@/lib/admin-view";
import { listMissions, toMissionRow } from "@/lib/game";

export const instant = false;

export const metadata = { title: "Dexter missions" };

export default function AdminDexterPage() {
  return (
    <Suspense fallback={<Skeleton stats={3} blocks={1} />}>
      <Dexter />
    </Suspense>
  );
}

async function Dexter() {
  const [missions, crews] = await Promise.all([listMissions(), listTeamRows()]);
  return <DexterView missions={missions.map(toMissionRow)} crews={crews} />;
}
