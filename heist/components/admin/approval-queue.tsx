"use client";

import Link from "next/link";

import { ActionForm } from "@/components/admin/action-form";
import {
  approveRequestAction,
  dismissRequestAction,
} from "@/lib/actions/admin-actions";
import type { ApprovalView } from "@/lib/types";

export function ApprovalQueue({
  approvals,
  showCrew = true,
}: {
  approvals: ApprovalView[];
  showCrew?: boolean;
}) {
  if (approvals.length === 0) {
    return (
      <p className="px-5 py-12 text-center text-sm text-white/35">
        Nothing waiting on the desk. Crews raise a request from their board.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-white/6">
      {approvals.map((approval) => (
        <li
          key={approval.id}
          className="flex flex-wrap items-center gap-4 px-5 py-4"
        >
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
              {approval.title}
              <span
                className={
                  approval.kind === "dexter"
                    ? "chip border-violet/50 bg-violet/15 text-violet"
                    : "chip border-cyan/40 bg-cyan/10 text-cyan"
                }
              >
                {approval.kindLabel}
              </span>
              <span className="chip border-white/12 bg-white/5 text-white/45">
                Round {approval.round}
              </span>
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-white/45">
              {approval.description}
            </p>
            <p className="mt-1.5 text-[11px] text-white/35">
              {showCrew && (
                <>
                  <Link
                    href={`/admin/teams/${approval.teamId}`}
                    className="font-semibold text-cyan hover:underline"
                  >
                    {approval.crewName}
                  </Link>
                  <span className="font-mono-display"> · {approval.teamId}</span>
                  {" · "}
                </>
              )}
              requested{" "}
              {approval.requestedAt.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md bg-cyan/10 px-2 py-1 font-mono-display text-cyan">
              +{approval.points} pts
            </span>
            <span className="rounded-md bg-amber/10 px-2 py-1 font-mono-display text-amber">
              +${approval.money.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ActionForm
              action={approveRequestAction}
              submitLabel="Approve & pay"
              submitClassName="btn-lime btn-sm"
            >
              <input type="hidden" name="requestId" value={approval.id} />
            </ActionForm>
            <ActionForm
              action={dismissRequestAction}
              submitLabel="Dismiss"
              submitClassName="btn-ghost btn-sm"
            >
              <input type="hidden" name="requestId" value={approval.id} />
            </ActionForm>
          </div>
        </li>
      ))}
    </ul>
  );
}
