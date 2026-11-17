"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { PasswordField } from "@/components/auth/password-field";
import { adminLoginAction } from "@/lib/actions/auth-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="au-btn" disabled={pending}>
      {pending ? "Authorising…" : "Enter control room"}
      {!pending && <span aria-hidden>→</span>}
    </button>
  );
}

export function AdminLoginForm() {
  const [state, formAction] = useActionState(adminLoginAction, {});
  const [username, setUsername] = useState("");

  return (
    <form action={formAction} className="au-form">
      <div className="au-field">
        <label htmlFor="username">Operator</label>
        <input
          id="username"
          name="username"
          className="au-input"
          placeholder="admin"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <PasswordField />

      {state.error && (
        <p key={state.error} className="au-err" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton />

      <p className="au-fine">Authorised operators only.</p>
    </form>
  );
}
