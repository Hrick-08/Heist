"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  buyHintAction,
  removeWantedAction,
  unlockEndgameAction,
  type TeamActionResult,
} from "@/lib/actions/team-actions";

const EMPTY: TeamActionResult = { ok: true, message: "" };

function Feedback({ state }: { state: TeamActionResult }) {
  if (!state.message) return null;
  return (
    <p
      className={`mt-2 rounded-lg border px-3 py-2 text-[11px] leading-relaxed ${
        state.ok
          ? "border-lime/30 bg-lime/10 text-lime"
          : "border-blood/30 bg-blood/10 text-blood"
      }`}
    >
      {state.message}
    </p>
  );
}

function HintSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-violet btn-sm" disabled={pending}>
      {pending ? "Decrypting…" : label}
    </button>
  );
}

export function TaskActions({
  teamTaskId,
  hintCost,
  hintPurchased,
  canAfford,
}: {
  teamTaskId: string;
  hintCost: number;
  hintPurchased: boolean;
  canAfford: boolean;
}) {
  const [state, formAction] = useActionState(buyHintAction, EMPTY);

  if (hintPurchased) {
    return (
      <p className="mt-3 rounded-lg border border-cyan/25 bg-cyan/8 px-3 py-2 text-[11px] text-cyan/90">
        Clue decrypted and on record.
      </p>
    );
  }

  return (
    <div>
      <form action={formAction} className="mt-3">
        <input type="hidden" name="teamTaskId" value={teamTaskId} />
        <HintSubmit
          label={canAfford ? `Buy clue · $${hintCost}` : `Need $${hintCost}`}
        />
      </form>
      <Feedback state={state} />
    </div>
  );
}

function BribeSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-pink btn-sm" disabled={pending}>
      {pending ? "Sliding the cash…" : "Pay the bribe"}
    </button>
  );
}

export function WantedActions({ cost }: { cost: number }) {
  const [state, formAction] = useActionState(removeWantedAction, EMPTY);

  return (
    <div>
      <form action={formAction}>
        <BribeSubmit />
      </form>
      <Feedback state={state} />
      <p className="mt-2 text-[11px] text-white/40">
        Bribe cost: ${cost.toLocaleString("en-IN")} cash. Cash never affects
        the leaderboard.
      </p>
    </div>
  );
}

function UnlockSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-cyan btn-sm" disabled={pending}>
      {pending ? "Opening the vault…" : label}
    </button>
  );
}

export function EndgameActions({
  cost,
  canAfford,
}: {
  cost: number;
  canAfford: boolean;
}) {
  const [state, formAction] = useActionState(unlockEndgameAction, EMPTY);

  return (
    <div>
      <form action={formAction}>
        <UnlockSubmit
          label={canAfford ? `Fund the heist · $${cost}` : `Need $${cost}`}
        />
      </form>
      <Feedback state={state} />
    </div>
  );
}
