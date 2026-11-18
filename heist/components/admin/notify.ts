import type { AdminSnap } from "@/lib/types";

export type AdminNoteKind = "request" | "dexter" | "crew" | "waitlist" | "round" | "ended";

export interface AdminNoteDraft {
  id: string;
  kind: AdminNoteKind;
  title: string;
  body?: string;
}

/** Turns "what changed on the desk" into the updates an operator cares about. */
export function diffAdmin(prev: AdminSnap, next: AdminSnap): AdminNoteDraft[] {
  const out: AdminNoteDraft[] = [];
  const known = new Set(prev.pending.map((p) => p.id));

  for (const p of next.pending) {
    if (known.has(p.id)) continue;
    out.push({
      id: `req:${p.id}`,
      kind: p.kind === "dexter" ? "dexter" : "request",
      title: `${p.crew} wants a sign-off`,
      body: `${p.title} · ${p.teamId}`,
    });
  }

  if (next.crews > prev.crews && next.latest) {
    out.push({
      id: `crew:${next.latest.teamId}`,
      kind: next.latest.status === "waitlisted" ? "waitlist" : "crew",
      title: next.latest.status === "waitlisted" ? "New crew waitlisted" : "New crew registered",
      body: `${next.latest.name} · ${next.latest.teamId}`,
    });
  }

  if (next.round > prev.round) {
    out.push({
      id: `round:${next.round}`,
      kind: "round",
      title: `Round ${next.round} is live`,
      body: `Round ${prev.round} was closed.`,
    });
  }
  if (next.ended && !prev.ended) {
    out.push({ id: "ended", kind: "ended", title: "Event ended", body: "The champion is crowned and scores are locked." });
  }
  return out;
}
