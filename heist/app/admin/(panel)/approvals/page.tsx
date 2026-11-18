import { Suspense } from "react";

import { ApprovalsView } from "@/components/admin/approvals";
import { toApprovalItems } from "@/components/admin/approval-items";
import { Skeleton } from "@/components/admin/skeleton";
import { listPendingApprovals } from "@/lib/game";

export const instant = false;

export const metadata = { title: "Approvals" };

export default function AdminApprovalsPage() {
  return (
    <Suspense fallback={<Skeleton stats={3} blocks={1} />}>
      <Approvals />
    </Suspense>
  );
}

async function Approvals() {
  const approvals = await listPendingApprovals();
  return <ApprovalsView items={await toApprovalItems(approvals)} />;
}
