"use client";

import Link from "next/link";
import { Fragment, useState } from "react";

import {
  deleteCrewAction,
  getTeamLoginAction,
  setTeamAdmissionAction,
  setTeamStatusAction,
  setWantedAction,
} from "@/lib/actions/admin-actions";
import type { TeamRow } from "@/lib/types";
import { Avatar } from "./avatar";
import { RegisterDrawer, VerifyDrawer } from "./crew-drawers";
import { money, num, STATUS_TAG } from "./format";
import { CopyIcon, KeyIcon, MailIcon, SearchIcon, PlusIcon } from "./icons";
import { useAdmin } from "./provider";
import { Empty, PageHead, Panel, Stat, Toggle } from "./ui";

// Fits the 1240px app width beside the sidebar; narrower screens switch to the compact row layout (see admin.css).
const COLS = "minmax(140px,1.1fr) minmax(110px,1fr) 112px 92px 48px 68px 76px 72px minmax(190px,auto)";

interface Login {
  teamId: string;
  email: string;
  passcode: string;
  name: string;
}

function mailto(login: Login): string {
  const subject = "Your Last Heist login details";
  const body =
    `Hi ${login.name},\n\n` +
    `Team ID: ${login.teamId}\n` +
    `Passcode: ${login.passcode}\n\n` +
    "Open the Heist app, choose Team login and sign in with these details. " +
    "Keep them safe — only the leader signs in.\n";
  return `mailto:${login.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function CrewsView({
  rows,
  slots,
  bribe,
}: {
  rows: TeamRow[];
  slots: number;
  bribe: number;
}) {
  const { run, ask, toast, busy } = useAdmin();
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const [reg, setReg] = useState(false);
  const [verify, setVerify] = useState<string | null>(null);
  /** Crews whose login panel is open, and the credentials once fetched. */
  const [openLogin, setOpenLogin] = useState<Set<string>>(new Set());
  const [logins, setLogins] = useState<Record<string, Login>>({});
  const [loadingLogin, setLoadingLogin] = useState<string | null>(null);
  const [shown, setShown] = useState<Set<string>>(new Set());

  const count = (s: string) => rows.filter((c) => c.status === s).length;
  const awaiting = rows.filter((c) => c.status === "registered" || c.status === "waitlisted");
  const needle = q.trim().toLowerCase();
  const list = rows.filter(
    (c) =>
      (f === "all" ||
        (f === "notin"
          ? c.status === "registered" || c.status === "waitlisted"
          : c.status === f)) &&
      (!needle ||
        [c.name, c.teamId, c.leaderName, c.email].join(" ").toLowerCase().includes(needle)),
  );
  const occupied = rows.filter((c) => c.status === "selected" || c.status === "champion").length;

  const inHeist = (c: TeamRow) => c.status === "selected" || c.status === "champion";
  const locked = (c: TeamRow) => c.status === "eliminated" || c.status === "champion";

  const setStatus = (c: TeamRow, status: string) => run(setTeamStatusAction, { teamId: c.teamId, status });
  const setWanted = (c: TeamRow, wanted: boolean) => run(setWantedAction, { teamId: c.teamId, wanted: wanted ? "true" : "false" });

  const removeCrew = (c: TeamRow) =>
    ask({
      title: `Delete ${c.name} (${c.teamId})?`,
      body: "Removes the crew, its login details and any tasks, and puts its sign-up back in the review queue. Crews in the heist must be switched out first.",
      cta: "Delete crew",
      tone: "red",
      onYes: async () => void (await run(deleteCrewAction, { teamId: c.teamId })),
    });

  const setAdmission = (c: TeamRow, next: boolean) => {
    if (next) return void run(setTeamAdmissionAction, { teamId: c.teamId, admitted: true });
    ask({
      title: `Take ${c.name} out of the heist?`,
      body: "They lose access straight away and cannot sign in until you switch them back on. Their score and tasks are kept.",
      cta: "Remove from heist",
      tone: "red",
      onYes: async () => void (await run(setTeamAdmissionAction, { teamId: c.teamId, admitted: false })),
    });
  };

  const toggleCreds = async (c: TeamRow) => {
    if (openLogin.has(c.teamId)) {
      setOpenLogin((cur) => {
        const next = new Set(cur);
        next.delete(c.teamId);
        return next;
      });
      return;
    }
    setOpenLogin((cur) => new Set(cur).add(c.teamId));
    // Always re-read, so a passcode reset on the crew page shows up here too.
    setLoadingLogin(c.teamId);
    try {
      const res = await run(getTeamLoginAction, { teamId: c.teamId }, { quiet: true, refresh: false });
      if (res.ok && res.data) {
        const d = res.data;
        setLogins((cur) => ({
          ...cur,
          [c.teamId]: {
            teamId: d.teamId,
            email: d.email,
            passcode: d.passcode,
            name: d.name,
          },
        }));
      } else {
        toast(res.message || "Could not load the login.", "err");
        setOpenLogin((cur) => {
          const next = new Set(cur);
          next.delete(c.teamId);
          return next;
        });
      }
    } finally {
      setLoadingLogin(null);
    }
  };

  const toggleShown = (teamId: string) =>
    setShown((cur) => {
      const next = new Set(cur);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });

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
        Register a crew, decide who enters the heist with the switching, then verify tasks at the desk.
      </PageHead>

      <div className="stats">
        <Stat label="Registered" value={rows.length} tone="gold" sub={`of ${slots} slots`} onClick={() => setF("all")} active={f === "all"} />
        <Stat label="Awaiting entry" value={awaiting.length} tone="gold" onClick={() => setF("notin")} active={f === "notin"} />
        <Stat label="In heist" value={count("selected")} tone="blue" onClick={() => setF("selected")} active={f === "selected"} />
        <Stat label="Eliminated" value={count("eliminated")} tone="purple" onClick={() => setF("eliminated")} active={f === "eliminated"} />
        <Stat label="Waitlisted" value={count("waitlisted")} tone="gold" onClick={() => setF("waitlisted")} active={f === "waitlisted"} />
      </div>

      <Panel title="All crews" sub="Switch a crew into the heist, share its login details, and jump to the verification desk." accent="blue" flush>
        <div className="toolbar">
          <label className="search">
            <SearchIcon size={18} />
            <input type="text" aria-label="Search crews" placeholder="Search crew, TEAM ID, leader or email…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <select aria-label="Filter crews" style={{ width: "auto", minWidth: 150 }} value={f} onChange={(e) => setF(e.target.value)}>
            <option value="all">All crews</option>
            <option value="notin">Not in heist</option>
            <option value="selected">In heist</option>
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
          <div className="tbl crews" style={{ ["--cols" as string]: COLS }}>
            <div className="tr th">
              <span>Team</span>
              <span>Leader</span>
              <span>Status</span>
              <span>In heist</span>
              <span>Round</span>
              <span className="r">Points</span>
              <span className="r">Cash</span>
              <span>Wanted</span>
              <span className="r">Desk</span>
            </div>
            {list.map((c) => {
              const [label, tone] = STATUS_TAG[c.status] ?? STATUS_TAG.registered;
              return (
                <Fragment key={c.teamId}>
                <div className="tr body">
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
                  <span>
                    <Toggle
                      on={inHeist(c)}
                      onChange={(v) => setAdmission(c, v)}
                      label={`${c.name} in heist`}
                      disabled={locked(c) || busy}
                    />
                    <span className="mute small" style={{ display: "block", marginTop: 4 }}>
                      {locked(c) ? (c.status === "champion" ? "Champion" : "Out") : inHeist(c) ? "Admitted" : "Not admitted"}
                    </span>
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
                    <button
                      className="btn ghost sm"
                      aria-expanded={openLogin.has(c.teamId)}
                      onClick={() => void toggleCreds(c)}
                      title="View Team ID and passcode to send to the leader"
                    >
                      <KeyIcon size={15} />
                      {openLogin.has(c.teamId) ? "Hide login" : "Login"}
                    </button>
                    {(c.status === "registered" || c.status === "waitlisted") && (
                      <button className="btn danger sm" onClick={() => removeCrew(c)}>
                        Delete
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
                {openLogin.has(c.teamId) && (
                  <div className="tr cred" style={{ ["--cols" as string]: "1fr" }}>
                    <div className="credtbl" role="table" aria-label={`Login for ${c.name}`}>
                      <div className="credrow credhead" role="row">
                        <span role="columnheader">Team ID</span>
                        <span role="columnheader">Login email</span>
                        <span role="columnheader">Passcode</span>
                        <span role="columnheader" className="r">&nbsp;</span>
                      </div>
                      {logins[c.teamId] && loadingLogin !== c.teamId ? (
                        <div className="credrow" role="row">
                          <b role="cell">{logins[c.teamId].teamId}</b>
                          <span role="cell" className="credmail">{logins[c.teamId].email}</span>
                          <code role="cell">{shown.has(c.teamId) ? logins[c.teamId].passcode : "••••••••••"}</code>
                          <span role="cell" className="r credbtns">
                            <button className="btn ghost sm" onClick={() => toggleShown(c.teamId)}>
                              {shown.has(c.teamId) ? "Hide" : "Show"}
                            </button>
                            <button
                              className="btn ghost sm"
                              onClick={() => {
                                const l = logins[c.teamId];
                                void navigator.clipboard?.writeText(`TEAM ID: ${l.teamId}\nPasscode: ${l.passcode}`);
                                toast("Credentials copied");
                              }}
                            >
                              <CopyIcon size={15} />
                              Copy
                            </button>
                            <a className="btn ghost sm" href={mailto(logins[c.teamId])}>
                              <MailIcon size={15} />
                              Email
                            </a>
                          </span>
                        </div>
                      ) : (
                        <div className="credrow" role="row">
                          <span className="mute small">Loading…</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                </Fragment>
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
