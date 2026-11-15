"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { teamLoginAction } from "@/lib/actions/auth-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-pink w-full" disabled={pending}>
      {pending ? "Verifying credentials…" : "Breach in"}
    </button>
  );
}

export function TeamLoginForm() {
  const [state, formAction] = useActionState(teamLoginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="teamId">
          Team ID
        </label>
        <input
          id="teamId"
          name="teamId"
          className="field font-mono-display uppercase tracking-[0.2em]"
          placeholder="TLH-01"
          autoComplete="off"
          required
        />
      </div>

      <div>
        <label className="field-label" htmlFor="password">
          Passcode
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      {state.error && (
        <p className="rounded-xl border border-blood/40 bg-blood/10 px-4 py-3 text-sm text-blood">
          {state.error}
        </p>
      )}

      <SubmitButton />

      <p className="text-center text-[11px] leading-relaxed text-white/35">
        Only the team leader can sign in. Credentials are mailed to the leader
        after registration.
      </p>
    </form>
  );
}
