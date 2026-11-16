"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  buyHintAction,
  removeWantedAction,
  requestApprovalAction,
  unlockEndgameAction,
  type TeamActionResult,
} from "@/lib/actions/team-actions";
import { money } from "./format";

const EMPTY: TeamActionResult = { ok: true, message: "" };

function Feedback({ state }: { state: TeamActionResult }) {
  if (!state.message) return null;
  return (
    <p className={state.ok ? "note ok" : "note err"} role="status">
      {state.message}
    </p>
  );
}

function Submit({
  className,
  idle,
  busy,
}: {
  className: string;
  idle: string;
  busy: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? busy : idle}
    </button>
  );
}

/** Purple clue button. Clues are paid for with cash, never points. */
export function ClueButton({
  teamTaskId,
  cost,
  canAfford,
}: {
  teamTaskId: string;
  cost: number;
  canAfford: boolean;
}) {
  const [state, formAction] = useActionState(buyHintAction, EMPTY);
  return (
    <>
      <form action={formAction}>
        <input type="hidden" name="teamTaskId" value={teamTaskId} />
        <Submit
          className="pbtn clue"
          idle={canAfford ? `Buy clue ${money(cost)}` : `Need ${money(cost)}`}
          busy="Decrypting…"
        />
      </form>
      <Feedback state={state} />
    </>
  );
}

/** "Task completed? Request sign-off" / "Dexter mission done? Request sign-off". */
export function SignoffButton({
  kind,
  refId,
  requested,
  label,
}: {
  kind: "target" | "dexter";
  refId: string;
  requested: boolean;
  label: string;
}) {
  const [state, formAction] = useActionState(requestApprovalAction, EMPTY);

  if (requested) {
    return (
      <p className="note" role="status">
        Queued for the desk. An admin still has to approve this before the
        points and cash land.
      </p>
    );
  }

  return (
    <>
      <form action={formAction}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="refId" value={refId} />
        <Submit className="pbtn ghost so" idle={label} busy="Sending to the desk…" />
      </form>
      <Feedback state={state} />
    </>
  );
}

export function BribeButton({ cost }: { cost: number }) {
  const [state, formAction] = useActionState(removeWantedAction, EMPTY);
  return (
    <>
      <form action={formAction}>
        <Submit className="pbtn" idle="Pay the bribe" busy="Sliding the cash…" />
      </form>
      <Feedback state={state} />
      <p className="mute small" style={{ marginTop: 10 }}>
        Bribe cost: {money(cost)} cash. Cash never affects the leaderboard.
      </p>
    </>
  );
}

export function FundHeistButton({
  cost,
  canAfford,
}: {
  cost: number;
  canAfford: boolean;
}) {
  const [state, formAction] = useActionState(unlockEndgameAction, EMPTY);
  return (
    <>
      <form action={formAction}>
        <Submit
          className="pbtn"
          idle={canAfford ? `Fund the heist ${money(cost)}` : `Need ${money(cost)}`}
          busy="Opening the vault…"
        />
      </form>
      <Feedback state={state} />
    </>
  );
}
