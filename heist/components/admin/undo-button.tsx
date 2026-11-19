"use client";

import { rollbackAction } from "@/lib/actions/admin-actions";
import { UndoIcon } from "./icons";
import { useAdmin } from "./provider";

const HINT =
  "No action to roll back yet. Advancing a round, crowning the champion, closing a Dexter mission or approving a request creates a restore point.";

/**
 * Consumes the newest game snapshot. Shown wherever an operator might mispress:
 * the top bar (always), the round controls and the Dexter board.
 */
export function UndoButton({ compact = false }: { compact?: boolean }) {
  const { snap, run, ask } = useAdmin();
  const undo = snap?.undo;

  return (
    <button
      type="button"
      className={compact ? "btn ghost sm" : undo ? "btn violet" : "btn ghost"}
      disabled={!undo}
      title={undo ? `Roll back: ${undo.label}` : HINT}
      onClick={() => {
        if (!undo) return;
        ask({
          title: "Undo the last action?",
          body: `The game will be restored to exactly where it was before “${undo.label}” — scores, eliminations, task boards and approvals included. Only this newest restore point is consumed; older ones stay available.`,
          cta: "Roll back",
          tone: "red",
          onYes: async () => void (await run(rollbackAction, {})),
        });
      }}
    >
      <UndoIcon size={16} />
      <span
        style={
          compact
            ? undefined
            : { maxWidth: 230, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
        }
      >
        {compact ? "Undo" : undo ? `Undo: ${undo.label}` : "Undo — no restore point yet"}
      </span>
    </button>
  );
}
