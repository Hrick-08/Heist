"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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

/**
 * Two-tap submit for anything that spends cash or cannot be undone: the first tap
 * arms the button ("Tap again to confirm"), the second sends the form. It disarms
 * itself after a few seconds so a stray tap never costs anything.
 */
function ConfirmSubmit({
  className,
  idle,
  confirm,
  busy,
  skipConfirm = false,
}: {
  className: string;
  idle: string;
  confirm: string;
  busy: string;
  skipConfirm?: boolean;
}) {
  const { pending } = useFormStatus();
  const [armed, setArmed] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  // Once the request is on its way (or came back), start from a fresh, unarmed button.
  useEffect(() => {
    if (pending) setArmed(false);
  }, [pending]);

  if (pending) {
    return (
      <button type="submit" className={className} disabled>
        {busy}
      </button>
    );
  }
  if (skipConfirm || armed) {
    return (
      <button type="submit" className={armed ? `${className} armed` : className}>
        {armed ? confirm : idle}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        setArmed(true);
        timer.current = window.setTimeout(() => setArmed(false), 4000);
      }}
    >
      {idle}
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
        <ConfirmSubmit
          className="pbtn clue"
          idle={canAfford ? `Buy clue ${money(cost)}` : `Need ${money(cost)}`}
          confirm={`Tap again to pay ${money(cost)}`}
          busy="Decrypting…"
          skipConfirm={!canAfford}
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
        <ConfirmSubmit
          className="pbtn ghost so"
          idle={label}
          confirm="Tap again to send to the desk"
          busy="Sending to the desk…"
        />
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
        <ConfirmSubmit
          className="pbtn"
          idle="Pay the bribe"
          confirm={`Tap again to pay ${money(cost)}`}
          busy="Sliding the cash…"
        />
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
        <ConfirmSubmit
          className="pbtn"
          idle={canAfford ? `Fund the heist ${money(cost)}` : `Need ${money(cost)}`}
          confirm={`Tap again to pay ${money(cost)}`}
          busy="Opening the vault…"
          skipConfirm={!canAfford}
        />
      </form>
      <Feedback state={state} />
    </>
  );
}
