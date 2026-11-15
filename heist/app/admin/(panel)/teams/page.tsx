import { Suspense } from "react";

import { CrewsTable } from "@/components/admin/crews-table";
import { RegisterCrewForm } from "@/components/admin/register-crew-form";
import { Panel, PanelHeader, StatCard } from "@/components/ui";
import { listTeams, toTeamRow } from "@/lib/game";

export const instant = false;

export default function AdminTeamsPage() {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <Crews />
    </Suspense>
  );
}

async function Crews() {
  const teams = await listTeams();
  const rows = teams.map(toTeamRow);

  const selected = rows.filter((t) => t.status === "selected").length;
  const eliminated = rows.filter((t) => t.status === "eliminated").length;
  const waiting = rows.filter((t) => t.status === "waitlisted").length;

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Registration desk</p>
        <h1 className="headline mt-2 text-4xl text-white">Crews</h1>
        <p className="mt-2 text-sm text-white/45">
          Register a crew, hand over the TEAM ID and passcode, then verify their
          targets at the desk.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered" value={rows.length} tone="pink" />
        <StatCard label="In play" value={selected} tone="cyan" />
        <StatCard label="Eliminated" value={eliminated} tone="violet" />
        <StatCard label="Waitlisted" value={waiting} tone="amber" />
      </section>

      <Panel>
        <PanelHeader
          title="Register a crew"
          subtitle="First come first served — crews past the slot limit are waitlisted automatically."
          accent="pink"
        />
        <div className="p-5">
          <RegisterCrewForm />
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="All crews"
          subtitle="Search, post wanted posters and jump to the verification desk."
          accent="cyan"
        />
        <CrewsTable crews={rows} />
      </Panel>
    </div>
  );
}
