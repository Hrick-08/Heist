"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { approveRequestAction, dismissRequestAction } from "@/lib/actions/admin-actions";
import { Avatar } from "./avatar";
import { money } from "./format";
import { Bolt, Coin } from "./icons";
import { useAdmin } from "./provider";
import { Empty, PageHead, Panel, Stat } from "./ui";

export interface ApprovalItem {
  id: string;
  kind: "target" | "dexter";
  kindLabel: string;
  title: string;
  description: string;
  round: number;
  teamId: string;
  crewName: string;
  hasPhoto: boolean;
  points: number;
  money: number;
  at: string;
}

/** The list of requests. Reused on the crew page (without the crew line). */
export function ApprovalList({ items, showCrew = true }: { items: ApprovalItem[]; showCrew?: boolean }) {
  const { run } = useAdmin();
  const [busy, setBusy] = useState<string | null>(null);

  const go = async (action: typeof approveRequestAction, id: string) => {
    setBusy(id);
    try {
      await run(action, { requestId: id });
    } finally {
      setBusy(null);
    }
  };

  return (
    <ul className="list pool-pad">
      {items.map((a) => (
        <li key={a.id} className="mcard" style={{ ["--c" as string]: a.kind === "target" ? "var(--blue)" : "var(--purple)" }}>
          <div className="body">
            <h3>
              {a.title}
              <span className={`tag ${a.kind === "target" ? "blue" : "purple"}`}>{a.kindLabel}</span>
              <span className="tag">Round {a.round}</span>
            </h3>
            <p className="mute">{a.description}</p>
            <div className="row small" style={{ marginTop: 8 }}>
              {showCrew && (
                <>
                  <Avatar teamId={a.teamId} hasPhoto={a.hasPhoto} size={22} label={a.crewName} />
                  <Link href={`/admin/teams/${a.teamId}`}>
                    <b style={{ color: "var(--blue)" }}>{a.crewName}</b>
                  </Link>
                  <span className="mute">· {a.teamId} · requested {a.at}</span>
                </>
              )}
              {!showCrew && <span className="mute">requested {a.at}</span>}
            </div>
          </div>
          <div className="acts">
            <span className="reward pts">
              <Bolt size={13} />+{a.points} pts
            </span>
            <span className="reward cashr">
              <Coin size={14} />+{money(a.money)}
            </span>
            <button className="btn green" disabled={busy === a.id} onClick={() => go(approveRequestAction, a.id)}>
              {busy === a.id ? "Working…" : "Approve & pay"}
            </button>
            <button className="btn ghost" disabled={busy === a.id} onClick={() => go(dismissRequestAction, a.id)}>
              Dismiss
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ApprovalsView({ items }: { items: ApprovalItem[] }) {
  const { run, ask, toast } = useAdmin();
  const router = useRouter();
  const targets = items.filter((a) => a.kind === "target").length;
  const dexter = items.filter((a) => a.kind === "dexter").length;

  const approveAll = async () => {
    let ok = 0;
    for (const a of items) {
      const res = await run(approveRequestAction, { requestId: a.id }, { quiet: true, refresh: false });
      if (res.ok) ok += 1;
    }
    router.refresh();
    toast(`Approved ${ok} of ${items.length} request${items.length === 1 ? "" : "s"}.`, ok === items.length ? "ok" : "err");
  };

  return (
    <>
      <PageHead eyebrow="The desk" title="Approvals">
        Crews raise a request from their board when they have finished a task or pulled off a Dexter mission. Approving signs it off and pays the points and cash. Dismissing closes it without a payout.
      </PageHead>

      <div className="stats">
        <Stat label="Waiting on the desk" value={items.length} tone="red" sub="Approvals queued by crews" />
        <Stat label="Task requests" value={targets} tone="blue" />
        <Stat label="Dexter requests" value={dexter} tone="purple" />
      </div>

      <Panel
        title="Queue"
        sub="Oldest request first. New ones appear here by themselves."
        accent="cash"
        flush={items.length > 0}
        action={
          items.length > 1 ? (
            <button
              className="btn green sm"
              onClick={() =>
                ask({
                  title: `Approve all ${items.length}?`,
                  body: "Pays every queued request its points and cash.",
                  cta: "Approve all",
                  tone: "green",
                  onYes: approveAll,
                })
              }
            >
              Approve all
            </button>
          ) : undefined
        }
      >
        {items.length === 0 ? (
          <Empty title="Desk is clear">No approvals queued. New requests land here the moment a crew raises one.</Empty>
        ) : (
          <ApprovalList items={items} />
        )}
      </Panel>
    </>
  );
}
