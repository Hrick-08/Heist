"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import type { AdminActionResult } from "@/lib/actions/admin-actions";
import type { AdminSnap } from "@/lib/types";
import { diffAdmin, type AdminNoteDraft, type AdminNoteKind } from "./notify";

type Tone = "gold" | "red" | "green";
export interface ConfirmOpts {
  title: string;
  body: string;
  cta: string;
  tone?: Tone;
  onYes: () => void | Promise<void>;
}
type Payload = FormData | Record<string, string | number | boolean | string[] | null | undefined>;
type Action = (prev: AdminActionResult, formData: FormData) => Promise<AdminActionResult>;
export interface AdminNote extends AdminNoteDraft {
  at: number;
}

interface Ctx {
  toast: (message: string, tone?: "ok" | "err") => void;
  ask: (c: ConfirmOpts) => void;
  /** Runs a server action, toasts its message, then refreshes the page data. */
  run: (action: Action, payload: Payload, opts?: { quiet?: boolean; refresh?: boolean }) => Promise<AdminActionResult>;
  busy: boolean;
  snap: AdminSnap;
  pending: number;
  notes: AdminNote[];
  unread: number;
  openNotes: () => void;
  sound: boolean;
  setSound: (on: boolean) => void;
}

const AdminCtx = createContext<Ctx>(null as unknown as Ctx);
export const useAdmin = () => useContext(AdminCtx);

function toFormData(payload: Payload): FormData {
  if (payload instanceof FormData) return payload;
  const fd = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => fd.append(key, v));
    else if (typeof value === "boolean") {
      if (value) fd.append(key, "on");
    } else fd.append(key, String(value));
  }
  return fd;
}

const GLYPH: Record<AdminNoteKind, { glyph: string; tone: string }> = {
  request: { glyph: "✓", tone: "gold" },
  dexter: { glyph: "!", tone: "purple" },
  crew: { glyph: "+", tone: "green" },
  waitlist: { glyph: "…", tone: "gold" },
  round: { glyph: "◷", tone: "blue" },
  ended: { glyph: "★", tone: "green" },
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
    /* storage unavailable: notes just won't persist */
  }
}

const K_SNAP = "lh:admin:snap";
const K_NOTES = "lh:admin:notes";
const K_SEEN = "lh:admin:seen";
const K_SOUND = "lh:admin:sound";

/**
 * Everything the control room shares: toasts, the confirm sheet, a helper that runs
 * server actions, live refresh (so new requests appear without reloading) and the
 * operator's notification centre.
 */
export function AdminProvider({
  snap,
  children,
}: {
  snap: AdminSnap;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sync, startSync] = useTransition();
  const [busyCount, setBusyCount] = useState(0);
  const [toastMsg, setToastMsg] = useState<{ text: string; tone: "ok" | "err" } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [confirm, setConfirm] = useState<ConfirmOpts | null>(null);
  const [confirming, setConfirming] = useState(false);

  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [seen, setSeen] = useState(0);
  const [panel, setPanel] = useState(false);
  const [freshSince, setFreshSince] = useState(0);
  const [sound, setSoundState] = useState(true);
  const [popups, setPopups] = useState<AdminNote[]>([]);
  const audio = useRef<AudioContext | null>(null);
  const [every] = useState(() => 8000 + Math.floor(Math.random() * 2000));

  const toast = useCallback((text: string, tone: "ok" | "err" = "ok") => {
    setToastMsg({ text, tone });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), tone === "err" ? 5200 : 3200);
  }, []);

  const run = useCallback<Ctx["run"]>(
    async (action, payload, opts) => {
      setBusyCount((c) => c + 1);
      try {
        const res = await action({ ok: true, message: "" }, toFormData(payload));
        if (!opts?.quiet) toast(res.message || (res.ok ? "Done." : "That did not work."), res.ok ? "ok" : "err");
        if (opts?.refresh !== false) router.refresh();
        return res;
      } catch {
        toast("Something went wrong. Try again.", "err");
        return { ok: false, message: "Something went wrong." };
      } finally {
        setBusyCount((c) => c - 1);
      }
    },
    [router, toast],
  );

  /* ---------------- live refresh ---------------- */
  useEffect(() => {
    const tick = () => startSync(() => router.refresh());
    // Visible tab: every ~8s. Hidden tab: slower, so a minimised desk still hears about new requests.
    let id = 0;
    const schedule = () => {
      window.clearInterval(id);
      id = window.setInterval(tick, document.visibilityState === "visible" ? every : every * 3);
    };
    const onVis = () => {
      schedule();
      if (document.visibilityState === "visible") tick();
    };
    schedule();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", tick);
    window.addEventListener("online", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", tick);
      window.removeEventListener("online", tick);
    };
  }, [router, every]);

  /* ---------------- notification centre ---------------- */
  useEffect(() => {
    setNotes(read<AdminNote[]>(K_NOTES, []));
    setSeen(read<number>(K_SEEN, 0));
    setSoundState(read<boolean>(K_SOUND, true));
    const onStorage = (e: StorageEvent) => {
      if (e.key === K_NOTES) setNotes(read<AdminNote[]>(K_NOTES, []));
      if (e.key === K_SEEN) setSeen(read<number>(K_SEEN, 0));
    };
    // Browsers only allow sound after a tap, so unlock audio on the first one.
    const unlock = () => {
      try {
        audio.current ??= new AudioContext();
        void audio.current.resume();
      } catch {
        /* no audio available */
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pointerdown", unlock);
    };
  }, []);

  const beep = useCallback(() => {
    const ctx = audio.current;
    if (!ctx || ctx.state !== "running") return;
    const tone = (freq: number, at: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + 0.3);
    };
    tone(880, 0);
    tone(1175, 0.16);
  }, []);

  const add = useCallback(
    (drafts: AdminNoteDraft[]) => {
      const current = read<AdminNote[]>(K_NOTES, []);
      const known = new Set(current.map((n) => n.id));
      const now = Date.now();
      const fresh = drafts.filter((d) => !known.has(d.id)).map((d) => ({ ...d, at: now }));
      if (fresh.length === 0) return;
      const merged = [...fresh.reverse(), ...current].slice(0, 60);
      write(K_NOTES, merged);
      setNotes(merged);
      setPopups((cur) => [...cur, ...fresh.slice(0, 3)].slice(-3));
      window.setTimeout(
        () => setPopups((cur) => cur.filter((p) => !fresh.some((f) => f.id === p.id))),
        6000,
      );
      const urgent = fresh.some((f) => f.kind === "request" || f.kind === "dexter");
      if (urgent) {
        if (read<boolean>(K_SOUND, true)) beep();
        try {
          navigator.vibrate?.([60, 40, 60]);
        } catch {
          /* optional */
        }
        if (document.visibilityState === "hidden" && "Notification" in window && Notification.permission === "granted") {
          const first = fresh.find((f) => f.kind === "request" || f.kind === "dexter")!;
          try {
            new Notification(first.title, { body: first.body, tag: "lh-desk" });
          } catch {
            /* some browsers only allow this from a service worker */
          }
        }
      }
    },
    [beep],
  );

  useEffect(() => {
    const prev = read<AdminSnap | null>(K_SNAP, null);
    write(K_SNAP, snap);
    if (prev) add(diffAdmin(prev, snap));
  }, [snap, add]);

  // Tab title shows how many requests are waiting, even from another tab.
  const pending = snap.pending.length;
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = pending > 0 ? `(${pending}) ${base}` : base;
  }, [pending, pathname]);

  const unread = notes.filter((n) => n.at > seen).length;
  const openNotes = useCallback(() => {
    setFreshSince(seen);
    const now = Date.now();
    setSeen(now);
    write(K_SEEN, now);
    setPopups([]);
    setPanel(true);
  }, [seen]);
  const setSound = useCallback((on: boolean) => {
    setSoundState(on);
    write(K_SOUND, on);
  }, []);

  useEffect(() => {
    if (!panel && !confirm) return;
    const k = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setPanel(false);
      setConfirm(null);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [panel, confirm]);

  const value = useMemo<Ctx>(
    () => ({
      toast,
      ask: setConfirm,
      run,
      busy: busyCount > 0,
      snap,
      pending,
      notes,
      unread,
      openNotes,
      sound,
      setSound,
    }),
    [toast, run, busyCount, snap, pending, notes, unread, openNotes, sound, setSound],
  );

  const canAlert = typeof window !== "undefined" && "Notification" in window && Notification.permission === "default";

  return (
    <AdminCtx.Provider value={value}>
      <div className={sync || busyCount > 0 ? "sweep on" : "sweep"} aria-hidden />
      {children}

      {confirm && (
        <>
          <div className="scrim" onClick={() => setConfirm(null)} />
          <div className="sheet" role="dialog" aria-label={confirm.title}>
            <div className="grab" />
            <h3>{confirm.title}</h3>
            <p className="mute" style={{ margin: "8px 0 18px" }}>
              {confirm.body}
            </p>
            <div className="row" style={{ gap: 10 }}>
              <button
                className={`btn ${confirm.tone === "gold" || !confirm.tone ? "" : confirm.tone}`}
                style={{ flex: 1 }}
                disabled={confirming}
                onClick={async () => {
                  setConfirming(true);
                  try {
                    await confirm.onYes();
                  } finally {
                    setConfirming(false);
                    setConfirm(null);
                  }
                }}
              >
                {confirming ? "Working…" : confirm.cta}
              </button>
              <button className="btn ghost" onClick={() => setConfirm(null)}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {toastMsg && (
        <div className={toastMsg.tone === "err" ? "toast err" : "toast"} role="status">
          {toastMsg.text}
        </div>
      )}

      {popups.length > 0 && (
        <div className="popups" role="status" aria-live="polite">
          {popups.map((p) => (
            <button key={p.id} type="button" className={`popup n-${GLYPH[p.kind].tone}`} onClick={openNotes}>
              <span className="nic">{GLYPH[p.kind].glyph}</span>
              <span className="nt">
                <b>{p.title}</b>
                {p.body && <small>{p.body}</small>}
              </span>
            </button>
          ))}
        </div>
      )}

      {panel && (
        <>
          <div className="scrim" onClick={() => setPanel(false)} />
          <aside className="drawer" role="dialog" aria-label="Updates">
            <div className="grab" />
            <div className="drawer-head">
              <div>
                <h2>Updates</h2>
                <p className="mute small">New requests, crews and round changes.</p>
              </div>
              <button className="btn ghost sm" onClick={() => setPanel(false)}>
                Close
              </button>
            </div>
            <div className="drawer-body">
              <div className="row wrap" style={{ gap: 10, marginBottom: 14 }}>
                <label className="check">
                  <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
                  Sound on new requests
                </label>
                {canAlert && (
                  <button
                    className="btn ghost sm"
                    onClick={() => void Notification.requestPermission().then(() => toast("Desktop alerts updated"))}
                  >
                    Enable desktop alerts
                  </button>
                )}
                {notes.length > 0 && (
                  <button
                    className="btn ghost sm"
                    style={{ marginLeft: "auto" }}
                    onClick={() => {
                      write(K_NOTES, []);
                      setNotes([]);
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              {notes.length === 0 ? (
                <div className="empty">
                  <b>All quiet</b>
                  <p className="mute small">Requests, new crews and round changes show up here as they happen.</p>
                </div>
              ) : (
                <ul>
                  {notes.map((n) => (
                    <li key={n.id} className={n.at > freshSince ? `nrow n-${GLYPH[n.kind].tone} new` : `nrow n-${GLYPH[n.kind].tone}`}>
                      <span className="nic">{GLYPH[n.kind].glyph}</span>
                      <div className="nt">
                        <b>{n.title}</b>
                        {n.body && <small>{n.body}</small>}
                      </div>
                      <span className="mute small">{clock(n.at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </>
      )}
    </AdminCtx.Provider>
  );
}
