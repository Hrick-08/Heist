"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { adminLoginAction } from "@/lib/actions/auth-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-cyan w-full" disabled={pending}>
      {pending ? "Authorising…" : "Enter control room"}
    </button>
  );
}

export function AdminLoginForm() {
  const [state, formAction] = useActionState(adminLoginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="username">
          Operator
        </label>
        <input
          id="username"
          name="username"
          className="field"
          placeholder="admin"
          autoComplete="username"
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
    </form>
  );
}
