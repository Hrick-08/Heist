"use client";

import { useState } from "react";

import { rewindRoundAction } from "@/lib/actions/admin-actions";
import { useAdmin } from "./provider";

/**
 * Rebuild the tournament as it was during an earlier round. Useful when the
 * round was closed before Undo existed and there is no snapshot to restore.
 */
export function RewindControl({ current }: { current: number }) {
  const { run, ask } = useAdmin();
  const options = Array.from({ length: Math.max(0, current - 1) }, (_, i) => i + 1);
  const [picked, setPicked] = useState(Math.max(1, current - 1));

  if (!options.length) return null;
  const target = options.includes(picked) ? picked : options[options.length - 1];

  return (
    <span className="row" style={{ gap: 6 }}>
      <select aria-label="Rewind to round" value={target} onChange={(e) => setPicked(Number(e.target.value))}>
        {options.map((r) => (
          <option key={r} value={r}>
            Round {r}
          </option>
        ))}
      </select>
      <button
        className="btn ghost"
        onClick={() =>
          ask({
            title: `Rewind to round ${target}?`,
            body: `Rebuilds the funnel as it was during round ${target}: crews eliminated in later rounds return to play, the champion and event-ended flags are cleared, and later-round boards are removed. Manual score edits stay as they are. A restore point is saved first, so Undo can reverse this.`,
            cta: `Rewind to round ${target}`,
            tone: "red",
            onYes: async () => void (await run(rewindRoundAction, { round: target })),
          })
        }
      >
        Rewind
      </button>
    </span>
  );
}
