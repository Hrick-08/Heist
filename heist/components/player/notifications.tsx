"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { NotifySnap } from "@/lib/types";
import { Bell } from "./icons";
import { diffSnapshots, type NoteDraft, type NoteKind } from "./notify-diff";

interface Note extends NoteDraft {
  at: number;
}

const MAX_NOTES = 40;

const LOOK: Record<NoteKind, { glyph: string; tone: string }> = {
  accepted: { glyph: "✓", tone: "up" },
  sent: { glyph: "↗", tone: "gold" },
  declined: { glyph: "✕", tone: "down" },
  dexter: { glyph: "!", tone: "down" },
  rank_up: { glyph: "▲", tone: "up" },
  rank_down: { glyph: "▼", tone: "down" },
  round: { glyph: "◷", tone: "info" },
  endgame: { glyph: "★", tone: "purple" },
  wanted: { glyph: "⚑", tone: "down" },
  clear: { glyph: "✓", tone: "up" },
  clue: { glyph: "?", tone: "purple" },
  champion: { glyph: "♛", tone: "gold" },
  out: { glyph: "✕", tone: "down" },
};

const clock = (at: number) =>
  new Date(at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or full storage: notifications just won't persist */
  }
}

/**
 * Bell + updates panel + toasts.
 * The server sends a snapshot on every refresh; we diff it against the last one
 * we saw (kept in localStorage, so things that happened while the app was closed
 * still show up), and turn the important changes into notifications.
 */
export function Notifications({ teamId, snap }: { teamId: string; snap: NotifySnap }) {
  const kNotes = `lh:notes:${teamId}`;
  const kSnap = `lh:snap:${teamId}`;
  const kSeen = `lh:seen:${teamId}`;

  const [notes, setNotes] = useState<Note[]>([]);
  const [seen, setSeen] = useState(0);
  const [open, setOpen] = useState(false);
  const [freshSince, setFreshSince] = useState(0);
  const [toasts, setToasts] = useState<Note[]>([]);
  const [ring, setRing] = useState(0);
  const btn = useRef<HTMLButtonElement>(null);
  // The header has a backdrop-filter, which would trap fixed children. Render the
  // toasts and panel at the page root instead.
  const [host, setHost] = useState<Element | null>(null);
  useEffect(() => {
    setHost(btn.current?.closest(".pl") ?? document.body);
  }, []);

  // Load what we already know, and stay in sync with other tabs.
  useEffect(() => {
    const load = () => {
      setNotes(read<Note[]>(kNotes, []));
      setSeen(read<number>(kSeen, 0));
    };
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === kNotes || e.key === kSeen) load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [kNotes, kSeen]);

  const add = useCallback(
    (drafts: NoteDraft[]) => {
      const now = Date.now();
      const current = read<Note[]>(kNotes, []);
      const known = new Set(current.map((x) => x.id));
      const fresh = drafts.filter((d) => !known.has(d.id)).map((d) => ({ ...d, at: now }));
      if (fresh.length === 0) return;
      const merged = [...fresh.reverse(), ...current].slice(0, MAX_NOTES);
      write(kNotes, merged);
      setNotes(merged);
      setRing((r) => r + 1);
      try {
        navigator.vibrate?.(fresh.some((f) => f.kind === "endgame" || f.kind === "dexter") ? [40, 60, 40] : 30);
      } catch {
        /* vibration is a nicety */
      }
      const shown = fresh.slice(0, 3);
      setToasts((cur) => [...cur, ...shown].slice(-3));
      const ids = new Set(shown.map((s) => s.id));
      window.setTimeout(() => setToasts((cur) => cur.filter((t) => !ids.has(t.id))), 5200);
    },
    [kNotes],
  );

  // Every refresh: diff against the last snapshot we stored.
  useEffect(() => {
    const prev = read<NotifySnap | null>(kSnap, null);
    write(kSnap, snap);
    if (prev) add(diffSnapshots(prev, snap));
  }, [snap, kSnap, add]);

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

  const unread = notes.filter((x) => x.at > seen).length;

  const openPanel = () => {
    setFreshSince(seen);
    const now = Date.now();
    setSeen(now);
    write(kSeen, now);
    setToasts([]);
    setOpen(true);
  };

  const clear = () => {
    write(kNotes, []);
    setNotes([]);
  };

  return (
    <>
      <button
        key={ring}
        ref={btn}
        type="button"
        className={unread > 0 ? "pill bell on" : "pill bell"}
        onClick={openPanel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread > 0 ? `Updates, ${unread} new` : "Updates"}
      >
        <Bell size={20} />
        {unread > 0 && <span className="bdot">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {host && createPortal(
        <>
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <button key={t.id} type="button" className={`toast n-${LOOK[t.kind].tone}`} onClick={openPanel}>
            <span className="nic">{LOOK[t.kind].glyph}</span>
            <span className="nt">
              <b>{t.title}</b>
              {t.body && <small>{t.body}</small>}
            </span>
          </button>
        ))}
      </div>

      {open && (
        <>
          <div className="scrim" onClick={() => setOpen(false)} />
          <div className="sheet notes" role="dialog" aria-label="Updates">
            <div className="grab" />
            <div className="row sp" style={{ marginBottom: 10 }}>
              <h2 style={{ margin: 0 }}>Updates</h2>
              <div className="row" style={{ gap: 8 }}>
                {notes.length > 0 && (
                  <button type="button" className="pbtn ghost" style={{ width: "auto", padding: "8px 14px" }} onClick={clear}>
                    Clear
                  </button>
                )}
                <button type="button" className="pbtn ghost" style={{ width: "auto", padding: "8px 14px" }} onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>
            </div>

            {notes.length === 0 ? (
              <p className="empty">
                Nothing yet. Approvals, rank moves, Dexter alerts and round changes land here.
              </p>
            ) : (
              notes.map((x) => (
                <div key={x.id} className={x.at > freshSince ? `nrow n-${LOOK[x.kind].tone} new` : `nrow n-${LOOK[x.kind].tone}`}>
                  <span className="nic">{LOOK[x.kind].glyph}</span>
                  <div className="nt">
                    <b>{x.title}</b>
                    {x.body && <small>{x.body}</small>}
                  </div>
                  <span className="mute small">{clock(x.at)}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
        </>,
        host,
      )}
    </>
  );
}
