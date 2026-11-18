"use client";

import { useEffect, useState } from "react";

import { logoutAction } from "@/lib/actions/auth-actions";
import type { LedgerEntry, NotifySnap } from "@/lib/types";
import { TeamAvatar } from "./avatar";
import { money, count } from "./format";
import { Bolt, Caret, Coin } from "./icons";
import { Notifications } from "./notifications";

export function TopBar({
  teamId,
  name,
  hasPhoto,
  points,
  cash,
  round,
  totalRounds,
  ledger,
  pointsLedger,
  snap,
}: {
  teamId: string;
  name: string;
  hasPhoto: boolean;
  points: number;
  cash: number;
  round: number;
  totalRounds: number;
  ledger: LedgerEntry[];
  pointsLedger: LedgerEntry[];
  snap: NotifySnap;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"cash" | "points">("cash");

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const entries = tab === "cash" ? ledger : pointsLedger;

  return (
    <>
      <header className="top">
        <div className="who">
          <TeamAvatar teamId={teamId} name={name} hasPhoto={hasPhoto} size={36} />
          <div className="nm">
            <b>{name}</b>
            <small className="mute">{teamId}</small>
          </div>
        </div>
        <div className="brand" aria-label="Event">
          The Last Heist
          <small>GDG Chitkara · GTA VI</small>
        </div>
        <div className="pills">
          <button
            className="pill m"
            onClick={() => {
              setTab("cash");
              setOpen(true);
            }}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={`Cash ${money(cash)}. Open history`}
          >
            <Coin size={18} />
            <span key={cash} className="bump">{money(cash)}</span>
            <Caret />
          </button>
          <button
            className="pill"
            onClick={() => {
              setTab("points");
              setOpen(true);
            }}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={`${points} points. Open history`}
          >
            <Bolt size={16} />
            <span key={points} className="bump">{count(points)}</span>
            <Caret />
          </button>
          <span className="pill rd" aria-label={`Round ${round} of ${totalRounds}`}>
            <span className="mute">Round&nbsp;</span>
            {round}/{totalRounds}
          </span>
          <Notifications teamId={teamId} snap={snap} />
          <form action={logoutAction} className="so-d">
            <button type="submit" className="pill">Sign out</button>
          </form>
        </div>
      </header>

      {open && (
        <>
          <div className="scrim" onClick={() => setOpen(false)} />
          <div className="sheet" role="dialog" aria-label="History">
            <div className="grab" />
            <div className="row sp" style={{ marginBottom: 12 }}>
              <div className="seg" role="tablist" aria-label="History type">
                <button
                  role="tab"
                  aria-selected={tab === "cash"}
                  className={tab === "cash" ? "on" : ""}
                  onClick={() => setTab("cash")}
                >
                  Cash
                </button>
                <button
                  role="tab"
                  aria-selected={tab === "points"}
                  className={tab === "points" ? "on" : ""}
                  onClick={() => setTab("points")}
                >
                  Points
                </button>
              </div>
              <button
                className="pbtn ghost"
                style={{ width: "auto", padding: "8px 14px" }}
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div style={{ marginBottom: 6 }}>
              <span className="mute small">{tab === "cash" ? "Balance" : "Total points"}</span>
              <div className="row" style={{ gap: 8 }}>
                {tab === "cash" ? <Coin size={26} /> : <Bolt size={24} />}
                <b className={tab === "cash" ? "cash big" : "big c-pts"}>
                  {tab === "cash" ? money(cash) : count(points)}
                </b>
              </div>
            </div>

            {entries.length === 0 ? (
              <p className="empty">
                {tab === "cash"
                  ? "No cash moves yet. Clear a task and the payout lands here."
                  : "No points yet. Clear a task and they land here."}
              </p>
            ) : (
              entries.map((l, i) => (
                <div key={`${tab}-${l.label}-${i}`} className="led">
                  <span className="ic">
                    {l.amount > 0 ? tab === "cash" ? <Coin size={18} /> : <Bolt size={16} /> : "−"}
                  </span>
                  <div className="t">
                    <b>{l.label}</b>
                    {l.time ? <div className="mute small">{l.time}</div> : null}
                  </div>
                  <span className={l.amount > 0 ? "amt in" : "amt out"}>
                    {l.amount > 0 ? "+" : "−"}
                    {tab === "cash" ? money(Math.abs(l.amount)) : count(Math.abs(l.amount))}
                  </span>
                </div>
              ))
            )}

            <form action={logoutAction} className="so-m">
              <button type="submit" className="pbtn ghost" style={{ marginTop: 14 }}>
                Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
