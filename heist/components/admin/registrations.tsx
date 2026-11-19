"use client";

import { Fragment, useState } from "react";

import { deleteCrewAction } from "@/lib/actions/admin-actions";
import {
  deleteRegistrationAction,
  getCrewLoginAction,
  selectCrewsAction,
  setRegistrationOpenAction,
  setTeamLoginOpenAction,
} from "@/lib/actions/registration-admin-actions";
import type { RegistrationRow } from "@/lib/types";
import { Avatar } from "./avatar";
import { CopyIcon, KeyIcon, MailIcon } from "./icons";
import { useAdmin } from "./provider";
import { Empty, PageHead, Panel, Stat, Toggle } from "./ui";

const COLS = "40px minmax(140px,1.2fr) minmax(160px,1.3fr) 110px 90px 190px";

interface Login {
  teamId: string;
  email: string;
  passcode: string;
}

function mailto(login: Login): string {
  const subject = "Your Last Heist login details";
  const body =
    `Team ID: ${login.teamId}\n` +
    `Passcode: ${login.passcode}\n\n` +
    "Open the Heist app, choose Team login and sign in with these details. " +
    "Keep them safe — only the leader signs in.\n";
  return `mailto:${login.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function RegistrationsView({
  rows,
  registrationOpen,
  teamLoginOpen,
}: {
  rows: RegistrationRow[];
  registrationOpen: boolean;
  teamLoginOpen: boolean;
}) {
  const { run, ask, toast } = useAdmin();
  const [open, setOpenLocal] = useState(registrationOpen);
  const [toggling, setToggling] = useState(false);
  const [loginOpen, setLoginOpenLocal] = useState(teamLoginOpen);
  const [loginToggling, setLoginToggling] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  /** Which crews have their login panel open, and the details once fetched. */
  const [openLogin, setOpenLogin] = useState<Set<string>>(new Set());
  const [logins, setLogins] = useState<Record<string, Login>>({});
  const [loadingLogin, setLoadingLogin] = useState<string | null>(null);
  const [shown, setShown] = useState<Set<string>>(new Set());

  const pending = rows.filter((r) => r.status === "pending");
  const selectedList = rows.filter((r) => r.status === "selected");

  const toggle = async (next: boolean) => {
    setOpenLocal(next);
    setToggling(true);
    try {
      await run(setRegistrationOpenAction, { open: next });
    } finally {
      setToggling(false);
    }
  };

  const applyLogin = async (next: boolean) => {
    setLoginOpenLocal(next);
    setLoginToggling(true);
    try {
      const res = await run(setTeamLoginOpenAction, { open: next });
      if (!res.ok) setLoginOpenLocal(!next);
    } finally {
      setLoginToggling(false);
    }
  };
  const toggleTeamLogin = (next: boolean) => {
    if (next) return void applyLogin(true);
    ask({
      title: "Turn off team login?",
      body: "Every crew that is signed in right now is logged out straight away, and nobody can sign in until you turn it back on.",
      cta: "Turn off and log everyone out",
      tone: "red",
      onYes: () => applyLogin(false),
    });
  };

  const toggleOne = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allPendingSelected = pending.length > 0 && pending.every((r) => selected.has(r.id));
  const toggleAllPending = () =>
    setSelected((cur) => {
      if (allPendingSelected) return new Set();
      return new Set(pending.map((r) => r.id));
    });

  const generate = async () => {
    if (selected.size === 0) return;
    setGenerating(true);
    try {
      const res = await run(selectCrewsAction, { ids: [...selected] });
      if (res.ok) setSelected(new Set());
    } finally {
      setGenerating(false);
    }
  };

  const toggleCreds = async (row: RegistrationRow) => {
    if (openLogin.has(row.id)) {
      setOpenLogin((cur) => {
        const next = new Set(cur);
        next.delete(row.id);
        return next;
      });
      return;
    }
    setOpenLogin((cur) => new Set(cur).add(row.id));
    // Always re-read, so a passcode reset on the crew page shows up here too.
    setLoadingLogin(row.id);
    try {
      const res = await run(getCrewLoginAction, { id: row.id }, { quiet: true, refresh: false });
      if (res.ok && res.data) {
        const d = res.data;
        setLogins((cur) => ({ ...cur, [row.id]: { teamId: d.teamId, email: d.email, passcode: d.passcode } }));
      } else {
        toast(res.message || "Could not load the login.", "err");
        setOpenLogin((cur) => {
          const next = new Set(cur);
          next.delete(row.id);
          return next;
        });
      }
    } finally {
      setLoadingLogin(null);
    }
  };

  const toggleShown = (id: string) =>
    setShown((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const remove = (row: RegistrationRow) =>
    ask({
      title: `Remove ${row.crewName || row.leaderName}'s sign-up?`,
      body: "This only removes the sign-up. It cannot be undone.",
      cta: "Remove sign-up",
      tone: "red",
      onYes: async () => void (await run(deleteRegistrationAction, { id: row.id })),
    });

  /** Undo a mistaken "Generate credentials": delete the crew, keep the sign-up. */
  const removeCrew = (row: RegistrationRow) => {
    const teamId = row.teamId;
    if (!teamId) return;
    ask({
      title: `Delete crew ${teamId}?`,
      body: "Removes the crew, its Team ID, passcode and any tasks. The sign-up goes back to pending so you can generate new credentials. Crews already in the heist must be switched out first.",
      cta: "Delete crew",
      tone: "red",
      onYes: async () => {
        const res = await run(deleteCrewAction, { teamId });
        if (!res.ok) return;
        setOpenLogin((cur) => {
          const next = new Set(cur);
          next.delete(row.id);
          return next;
        });
        setLogins((cur) => {
          const next = { ...cur };
          delete next[row.id];
          return next;
        });
        setShown((cur) => {
          const next = new Set(cur);
          next.delete(row.id);
          return next;
        });
      },
    });
  };

  return (
    <>
      <PageHead eyebrow="Before the event" title="Registration">
        Open crew sign-ups, review who has applied, then generate their Team IDs and passcodes.
        Crews only enter the heist when you switch them in on the Crews page.
      </PageHead>

      <div className="stats">
        <Stat label="Sign-ups" value={rows.length} tone="gold" />
        <Stat label="Pending review" value={pending.length} tone="blue" />
        <Stat label="Turned into crews" value={selectedList.length} tone="cash" />
      </div>

      <Panel title="Registrations are open" sub="Flips the public site between Register and Team login." accent="red" flush>
        <div className="setrow">
          <div>
            <b>{open ? "Open — the site shows Register" : "Closed — the site shows Team login"}</b>
            <div className="mute small">
              While open, the landing page and every login button send visitors to{" "}
              <code>/register</code> instead, and the public leaderboard is hidden.
            </div>
          </div>
          <Toggle on={open} onChange={toggle} label="Registrations open" disabled={toggling} />
        </div>
      </Panel>

      <div style={{ height: 14 }} />

      <Panel title="Team login" sub="Lets crews sign in with their Team ID and passcode." accent="blue" flush>
        <div className="setrow">
          <div>
            <b>{loginOpen ? "On — crews can sign in" : "Off — crews are locked out"}</b>
            <div className="mute small">
              Turning this off logs out every crew that is signed in and blocks new logins. The
              control room login is not affected.
            </div>
          </div>
          <Toggle on={loginOpen} onChange={toggleTeamLogin} label="Team login on" disabled={loginToggling} />
        </div>
      </Panel>

      <div style={{ height: 14 }} />

      <Panel
        title="Sign-ups"
        sub="Tick the crews you want in, then generate their Team ID and passcode."
        accent="blue"
        flush
        action={
          <button className="btn sm" disabled={selected.size === 0 || generating} onClick={generate}>
            {generating ? "Generating…" : `Generate credentials (${selected.size})`}
          </button>
        }
      >
        {rows.length === 0 ? (
          <Empty title="No sign-ups yet">Once you open registrations, crews will appear here as they apply.</Empty>
        ) : (
          <div className="tbl regs" style={{ ["--cols" as string]: COLS }}>
            <div className="tr th">
              <span>
                <input
                  type="checkbox"
                  aria-label="Select all pending"
                  checked={allPendingSelected}
                  onChange={toggleAllPending}
                  disabled={pending.length === 0}
                />
              </span>
              <span>Crew</span>
              <span className="hide-m">Leader</span>
              <span>Contact</span>
              <span>Status</span>
              <span className="r">Desk</span>
            </div>
            {rows.map((r) => (
              <Fragment key={r.id}>
              <div className="tr body">
                <span>
                  {r.status === "pending" ? (
                    <input
                      type="checkbox"
                      aria-label={`Select ${r.crewName}`}
                      checked={selected.has(r.id)}
                      onChange={() => toggleOne(r.id)}
                    />
                  ) : null}
                </span>
                <div className="row" style={{ gap: 12, minWidth: 0 }}>
                  {/* Registration photos aren't served by /api/photo until the crew is created, so always show the silhouette here. */}
                  <Avatar teamId={r.id} hasPhoto={false} size={36} label={r.crewName} />
                  <div className="t-main">
                    <b>{r.crewName || "(unnamed crew)"}</b>
                    <span>
                      {r.membersCount} members{r.hasPhoto ? " · has photo" : " · no photo"}
                      {r.teamId ? ` · ${r.teamId}` : ""}
                    </span>
                  </div>
                </div>
                <div className="t-main hide-m">
                  <b style={{ fontFamily: "var(--body)", fontWeight: 700 }}>{r.leaderName}</b>
                  <span>{r.leaderPhone}</span>
                </div>
                <span className="mute small" style={{ wordBreak: "break-all" }}>{r.leaderEmail}</span>
                <span>
                  <span className={r.status === "selected" ? "tag cash" : "tag gold"}>
                    {r.status === "selected" ? "Crew created" : "Pending"}
                  </span>
                </span>
                <span className="r">
                  {r.status === "pending" && (
                    <button className="btn ghost sm" onClick={() => remove(r)}>
                      Remove
                    </button>
                  )}
                  {r.status === "selected" && r.teamId && (
                    <div className="rowacts">
                      <button
                        className="btn ghost sm"
                        aria-expanded={openLogin.has(r.id)}
                        onClick={() => toggleCreds(r)}
                      >
                        <KeyIcon size={15} />
                        {openLogin.has(r.id) ? "Hide login" : "View login"}
                      </button>
                      <button className="btn danger sm" onClick={() => removeCrew(r)}>
                        Delete
                      </button>
                    </div>
                  )}
                </span>
              </div>
              {openLogin.has(r.id) && (
                <div className="tr cred" style={{ ["--cols" as string]: "1fr" }}>
                  <div className="credtbl" role="table" aria-label={`Login for ${r.crewName || r.leaderName}`}>
                    <div className="credrow credhead" role="row">
                      <span role="columnheader">Team ID</span>
                      <span role="columnheader">Login email</span>
                      <span role="columnheader">Passcode</span>
                      <span role="columnheader" className="r">&nbsp;</span>
                    </div>
                    {logins[r.id] && loadingLogin !== r.id ? (
                      <div className="credrow" role="row">
                        <b role="cell">{logins[r.id].teamId}</b>
                        <span role="cell" className="credmail">{logins[r.id].email}</span>
                        <code role="cell">{shown.has(r.id) ? logins[r.id].passcode : "••••••••••"}</code>
                        <span role="cell" className="r credbtns">
                          <button className="btn ghost sm" onClick={() => toggleShown(r.id)}>
                            {shown.has(r.id) ? "Hide" : "Show"}
                          </button>
                          <button
                            className="btn ghost sm"
                            onClick={() => {
                              const l = logins[r.id];
                              void navigator.clipboard?.writeText(`TEAM ID: ${l.teamId}\nPasscode: ${l.passcode}`);
                              toast("Credentials copied");
                            }}
                          >
                            <CopyIcon size={15} />
                            Copy
                          </button>
                          <a className="btn ghost sm" href={mailto(logins[r.id])}>
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
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
