"use client";

import Link from "next/link";
import { useState } from "react";

import { setTeamStatusAction, setWantedAction } from "@/lib/actions/admin-actions";
import type { TeamRow } from "@/lib/types";
import { Avatar } from "./avatar";
import { RegisterDrawer, VerifyDrawer } from "./crew-drawers";
import { money, num, STATUS_TAG } from "./format";
import { PlusIcon, SearchIcon } from "./icons";
import { useAdmin } from "./provider";
import { Empty, PageHead, Panel, Stat } from "./ui";

const COLS = "minmax(160px,1.2fr) minmax(130px,1fr) 120px 56px 80px 90px 90px 190px";

export function CrewsView({
  rows,
  slots,
  bribe,
}: {
  rows: TeamRow[];
  slots: number;
  bribe: number;
}) {
  const { run, ask } = useAdmin();
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const [reg, setReg] = useState(false);
  const [verify, setVerify] = useState<string | null>(null);

  const count = (s: string) => rows.filter((c) => c.status === s).length;
  const needle = q.trim().toLowerCase();
  const list = rows.filter(
    (c) =>
      (f === "all" || c.status === f) &&
      (!needle ||
        [c.name, c.teamId, c.leaderName, c.email].join(" ").toLowerCase().includes(needle)),
  );
  const occupied = rows.filter((c) => c.status !== "waitlisted").length;

  const setStatus = (c: TeamRow, status: string) => run(setTeamStatusAction, { teamId: c.teamId, status });
  const setWanted = (c: TeamRow, wanted: boolean) => run(setWantedAction, { teamId: c.teamId, wanted: wanted ? "true" : "false" });

  return (
    <>
      <PageHead
        eyebrow="Registration desk"
        title="Crews"
        actions={
          <button className="btn" onClick={() => setReg(true)}>
            <PlusIcon size={16} />
            Register a crew
          </button>
        }
      >
        Register a crew, hand over the TEAM ID and passcode, then verify their tasks at the desk.
      </PageHead>

      <div className="stats">
        <Stat label="Registered" value={rows.length} tone="gold" sub={`of ${slots} slots`} onClick={() => setF("all")} active={f === "all"} />
        <Stat label="In play" value={count("selected")} tone="blue" onClick={() => setF("selected")} active={f === "selected"} />
        <Stat label="Eliminated" value={count("eliminated")} tone="purple" onClick={() => setF("eliminated")} active={f === "eliminated"} />
        <Stat label="Waitlisted" value={count("waitlisted")} tone="gold" onClick={() => setF("waitlisted")} active={f === "waitlisted"} />
      </div>

      <Panel title="All crews" sub="Search, post wanted posters and jump to the verification desk." accent="blue" flush>
        <div className="toolbar">
          <label className="search">
            <SearchIcon size={18} />
            <input type="text" aria-label="Search crews" placeholder="Search crew, TEAM ID, leader or email…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <select aria-label="Filter crews" style={{ width: "auto", minWidth: 150 }} value={f} onChange={(e) => setF(e.target.value)}>
            <option value="all">All crews</option>
            <option value="selected">In play</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="eliminated">Eliminated</option>
            <option value="champion">Champion</option>
          </select>
          <span className="mute small">
            {list.length} of {rows.length} shown
          </span>
        </div>

        {list.length === 0 ? (
          <Empty title="No crews found">Try a different search, or register a new crew.</Empty>
        ) : (
          <div className="tbl" style={{ ["--cols" as string]: COLS }}>
            <div className="tr th">
              <span>Team</span>
              <span>Leader</span>
              <span>Status</span>
              <span>Round</span>
              <span className="r">Points</span>
              <span className="r">Cash</span>
              <span>Wanted</span>
              <span className="r">Desk</span>
            </div>
            {list.map((c) => {
              const [label, tone] = STATUS_TAG[c.status] ?? STATUS_TAG.registered;
              return (
                <div key={c.teamId} className="tr body">
                  <div className="row" style={{ gap: 12, minWidth: 0 }}>
                    <Avatar teamId={c.teamId} hasPhoto={c.hasPhoto} size={40} label={c.name} />
                    <div className="t-main">
                      <Link href={`/admin/teams/${c.teamId}`}>
                        <b>{c.name}</b>
                      </Link>
                      <span>
                        {c.teamId} · {c.membersCount} crew
                      </span>
                    </div>
                  </div>
                  <div className="t-main hide-m">
                    <b style={{ fontFamily: "var(--body)", fontWeight: 700 }}>{c.leaderName}</b>
                    <span>{c.email}</span>
                  </div>
                  <span>
                    <span className={`tag ${tone}`}>{label}</span>
                    {c.eliminatedInRound && <span className="mute small" style={{ display: "block", marginTop: 4 }}>out in R{c.eliminatedInRound}</span>}
                  </span>
                  <span className="hide-m num">{c.round}</span>
                  <span className="r num" style={{ fontFamily: "var(--display)", fontSize: 17 }}>
                    {num(c.points)}
                  </span>
                  <span className="r hide-m cashv num">{money(c.money)}</span>
                  <span className="hide-m">
                    {c.wanted ? (
                      <button
                        className="btn ghost sm"
                        onClick={() =>
                          ask({
                            title: `Clear ${c.name}'s wanted poster?`,
                            body: `Takes ${c.name} off the wanted board. The bribe a crew pays is ${money(bribe)}.`,
                            cta: "Clear poster",
                            tone: "gold",
                            onYes: async () => void (await setWanted(c, false)),
                          })
                        }
                      >
                        Clear
                      </button>
                    ) : (
                      <button className="btn ghost sm" onClick={() => setWanted(c, true)}>
                        Post
                      </button>
                    )}
                  </span>
                  <div className="rowacts">
                    {c.status === "waitlisted" && (
                      <button className="btn green sm" onClick={() => setStatus(c, "selected")}>
                        Admit
                      </button>
                    )}
                    {(c.status === "selected" || c.status === "champion") && (
                      <button className="btn sm" style={{ background: "var(--blue)", color: "var(--ink)" }} onClick={() => setVerify(c.teamId)}>
                        Verify
                      </button>
                    )}
                    {c.status === "eliminated" && (
                      <button className="btn ghost sm" onClick={() => setStatus(c, "selected")}>
                        Reinstate
                      </button>
                    )}
                    {c.status === "selected" && (
                      <button
                        className="btn danger sm"
                        onClick={() =>
                          ask({
                            title: `Eliminate ${c.name}?`,
                            body: "They drop off the board and can be reinstated later.",
                            cta: "Eliminate",
                            tone: "red",
                            onYes: async () => void (await setStatus(c, "eliminated")),
                          })
                        }
                      >
                        Out
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <RegisterDrawer open={reg} onClose={() => setReg(false)} full={occupied >= slots} slots={slots} />
      <VerifyDrawer teamId={verify} onClose={() => setVerify(null)} />
    </>
  );
}
