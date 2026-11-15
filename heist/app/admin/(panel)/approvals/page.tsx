import { Suspense } from "react";

import { ApprovalQueue } from "@/components/admin/approval-queue";
import { Panel, PanelHeader, StatCard } from "@/components/ui";
import { countPendingApprovals, listPendingApprovals } from "@/lib/game";

export const instant = false;

export default function AdminApprovalsPage() {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <Approvals />
    </Suspense>
  );
}

async function Approvals() {
  const [approvals, pending] = await Promise.all([
    listPendingApprovals(),
    countPendingApprovals(),
  ]);

  const targetCount = approvals.filter((a) => a.kind === "target").length;
  const dexterCount = approvals.filter((a) => a.kind === "dexter").length;

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">The desk</p>
        <h1 className="headline mt-2 text-4xl text-white">Approvals</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/45">
          Crews raise a request from their board when they have finished a
          task or pulled off a Dexter mission. Approving signs it off and pays
          the points and cash. Dismissing closes it without a payout.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Waiting on the desk"
          value={pending}
          hint="Approvals queued by crews"
          tone="pink"
        />
        <StatCard label="Task requests" value={targetCount} tone="cyan" />
        <StatCard label="Dexter requests" value={dexterCount} tone="violet" />
      </section>

      <Panel>
        <PanelHeader
          title="Queue"
          subtitle="Oldest request first."
          accent="lime"
        />
        <ApprovalQueue approvals={approvals} />
      </Panel>
    </div>
  );
}
