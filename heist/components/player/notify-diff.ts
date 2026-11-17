import type { NotifySnap } from "@/lib/types";

export type NoteKind =
  | "accepted"
  | "sent"
  | "declined"
  | "dexter"
  | "rank_up"
  | "rank_down"
  | "round"
  | "endgame"
  | "wanted"
  | "clear"
  | "clue"
  | "champion"
  | "out";

export interface NoteDraft {
  id: string;
  kind: NoteKind;
  title: string;
  body?: string;
}

const n = (v: number) => v.toLocaleString("en-IN");
const rewards = (pts: number, money: number) =>
  [pts ? `+${n(pts)} pts` : "", money ? `+$${n(money)}` : ""].filter(Boolean).join(" · ");

/** Turns "what changed between two snapshots" into the important updates only. */
export function diffSnapshots(prev: NotifySnap, next: NotifySnap): NoteDraft[] {
  const out: NoteDraft[] = [];
  const stamp = Date.now();

  // Tasks: accepted, request sent, request declined, clue bought.
  for (const t of next.tasks) {
    const before = prev.tasks.find((x) => x.id === t.id);
    if (!before) continue;
    if (t.done && !before.done) {
      out.push({ id: `accepted:${t.id}`, kind: "accepted", title: "Mission accepted", body: `${t.title} · ${rewards(t.points, t.money)}` });
    } else if (t.requested && !before.requested) {
      out.push({ id: `sent:${t.id}:${stamp}`, kind: "sent", title: "Request sent to the desk", body: t.title });
    } else if (before.requested && !t.requested && !t.done) {
      out.push({ id: `declined:${t.id}:${stamp}`, kind: "declined", title: "Sign-off declined", body: `${t.title}. Finish it and ask again.` });
    }
    if (t.clue && !before.clue) {
      out.push({ id: `clue:${t.id}`, kind: "clue", title: "Clue unlocked", body: t.title });
    }
  }

  // Dexter missions: spotted, accepted, request sent / declined.
  for (const d of next.dexter) {
    const before = prev.dexter.find((x) => x.id === d.id);
    if (!before) {
      if (!d.done) {
        out.push({ id: `dexter:${d.id}`, kind: "dexter", title: "Dexter spotted", body: `${d.title} · ${rewards(d.points, d.money)}` });
      }
      continue;
    }
    if (d.done && !before.done) {
      out.push({ id: `accepted:${d.id}`, kind: "accepted", title: "Dexter mission accepted", body: `${d.title} · ${rewards(d.points, d.money)}` });
    } else if (d.requested && !before.requested) {
      out.push({ id: `sent:${d.id}:${stamp}`, kind: "sent", title: "Request sent to the desk", body: d.title });
    } else if (before.requested && !d.requested && !d.done) {
      out.push({ id: `declined:${d.id}:${stamp}`, kind: "declined", title: "Sign-off declined", body: d.title });
    }
  }

  // Rank moves.
  if (prev.rank && next.rank && prev.rank !== next.rank) {
    if (next.rank < prev.rank) {
      out.push({
        id: `rank_up:${next.rank}:${stamp}`,
        kind: "rank_up",
        title: next.rank === 1 ? "You took the #1 spot" : "Rank climbed",
        body: `You moved up from #${prev.rank} to #${next.rank}.`,
      });
    } else {
      out.push({
        id: `rank_down:${next.rank}:${stamp}`,
        kind: "rank_down",
        title: prev.rank === 1 ? "Your #1 spot was taken" : "Rank overthrown",
        body: `A rival pushed you from #${prev.rank} to #${next.rank}.`,
      });
    }
  }

  // Rounds and endgame.
  if (next.round > prev.round) {
    out.push({ id: `round:${prev.round}`, kind: "round", title: `Round ${prev.round} is over`, body: `Round ${next.round} is live. New tasks are on your board.` });
    if (next.round >= next.totalRounds) {
      out.push({ id: `endgame:final`, kind: "endgame", title: "ENDGAME!", body: "The final round is live. Fund the heist to open the vault." });
    }
  }
  if (next.endgameUnlocked && !prev.endgameUnlocked) {
    out.push({ id: `endgame:open`, kind: "endgame", title: "ENDGAME! Vault unlocked", body: "Your final task has been assigned." });
  }

  // Police heat.
  if (next.wanted && !prev.wanted) {
    out.push({ id: `wanted:${stamp}`, kind: "wanted", title: "The Police are looking for you", body: "Your poster is up. Pay the bribe to go dark." });
  } else if (!next.wanted && prev.wanted) {
    out.push({ id: `clear:${stamp}`, kind: "clear", title: "You're off the radar", body: "The heat is gone." });
  }

  // Final results.
  if (next.status !== prev.status) {
    if (next.status === "champion") out.push({ id: "champion", kind: "champion", title: "CHAMPION!", body: "Your crew emptied the vault." });
    if (next.status === "eliminated") out.push({ id: "out", kind: "out", title: "Knocked out", body: "Your crew is out of the heist. Thanks for playing." });
  }

  return out;
}
