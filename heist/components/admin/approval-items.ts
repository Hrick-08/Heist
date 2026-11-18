import { listTeamRows } from "@/lib/admin-view";
import type { ApprovalView } from "@/lib/types";
import { time } from "./format";
import type { ApprovalItem } from "./approvals";

/** Server-side: turn approvals into plain rows (with a photo flag for the crew avatar). */
export async function toApprovalItems(approvals: ApprovalView[]): Promise<ApprovalItem[]> {
  const photo = approvals.length
    ? new Map((await listTeamRows()).map((t) => [t.teamId, t.hasPhoto]))
    : new Map<string, boolean>();
  return approvals.map((a) => ({
    id: a.id,
    kind: a.kind,
    kindLabel: a.kindLabel,
    title: a.title,
    description: a.description,
    round: a.round,
    teamId: a.teamId,
    crewName: a.crewName,
    hasPhoto: photo.get(a.teamId) ?? false,
    points: a.points,
    money: a.money,
    at: time(a.requestedAt),
  }));
}
