import { Suspense } from "react";

import { DexterBoard } from "@/components/admin/dexter-board";
import { Panel, PanelHeader, StatCard } from "@/components/ui";
import { listMissions, listTeams, toMissionRow, toTeamRow } from "@/lib/game";

export const instant = false;

export default function AdminDexterPage() {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <Dexter />
    </Suspense>
  );
}

async function Dexter() {
  const [missions, teams] = await Promise.all([listMissions(), listTeams()]);
  const rows = missions.map(toMissionRow);
  const crews = teams.map(toTeamRow);
  const live = rows.filter((m) => m.active);

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Special targets</p>
        <h1 className="headline mt-2 text-4xl text-white">Dexter missions</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/45">
          Dexter missions pop up on the crew dashboard. Close one out at the
          desk and the crew banks the extra points and cash. Target every crew
          or pick who sees it.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Missions live" value={live.length} tone="pink" />
        <StatCard label="Archive" value={rows.length} tone="violet" />
        <StatCard
          label="Closures"
          value={rows.reduce((sum, m) => sum + m.completions, 0)}
          tone="lime"
        />
      </section>

      <Panel>
        <PanelHeader
          title="Mission board"
          subtitle="Push, edit or pull a mission."
          accent="pink"
        />
        <DexterBoard missions={rows} crews={crews} />
      </Panel>
    </div>
  );
}
