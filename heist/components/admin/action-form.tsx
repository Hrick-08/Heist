"use client";

import { useActionState, type ReactNode } from "react";

export interface AdminActionState {
  ok: boolean;
  message: string;
}

const INITIAL: AdminActionState = { ok: true, message: "" };

type AdminAction = (
  prev: AdminActionState,
  formData: FormData,
) => Promise<AdminActionState>;

export function ActionForm({
  action,
  children,
  submitLabel,
  submitClassName = "btn-pink btn-sm",
  className = "",
  feedbackClassName = "",
  confirm,
}: {
  action: AdminAction;
  children?: ReactNode;
  submitLabel: string;
  submitClassName?: string;
  className?: string;
  feedbackClassName?: string;
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) {
          event.preventDefault();
        }
      }}
    >
      {children}
      <button
        type="submit"
        className={submitClassName}
        disabled={pending}
        title={confirm}
      >
        {pending ? "Working…" : submitLabel}
      </button>
      {state.message && (
        <p
          className={`mt-2 rounded-lg border px-3 py-2 text-[11px] leading-relaxed ${
            state.ok
              ? "border-lime/30 bg-lime/10 text-lime"
              : "border-blood/30 bg-blood/10 text-blood"
          } ${feedbackClassName}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
