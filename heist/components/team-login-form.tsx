"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { PasswordField } from "@/components/auth/password-field";
import { teamLoginAction } from "@/lib/actions/auth-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="au-btn" disabled={pending}>
      {pending ? "Verifying credentials…" : "Breach in"}
      {!pending && <span aria-hidden>→</span>}
    </button>
  );
}

export function TeamLoginForm() {
  const [state, formAction] = useActionState(teamLoginAction, {});
  // Controlled so a wrong passcode does not wipe the Team ID.
  const [teamId, setTeamId] = useState("");

  return (
    <form action={formAction} className="au-form">
      <div className="au-field">
        <label htmlFor="teamId">Team ID</label>
        <input
          id="teamId"
          name="teamId"
          className="au-input mono"
          placeholder="TLH-00"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus
          required
          value={teamId}
          onChange={(e) => setTeamId(e.target.value.toUpperCase())}
        />
      </div>

      <PasswordField />

      {state.error && (
        <p key={state.error} className="au-err" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton />

      <p className="au-fine">
        Only the team leader can sign in. Credentials are mailed to the leader after registration.
      </p>
    </form>
  );
}
