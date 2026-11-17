"use client";

import { useState } from "react";

/** Passcode input with a show/hide toggle and a caps-lock warning. */
export function PasswordField({ id = "password" }: { id?: string }) {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);

  return (
    <div className="au-field">
      <label htmlFor={id}>Passcode</label>
      <div className="au-inputwrap">
        <input
          id={id}
          name="password"
          type={show ? "text" : "password"}
          className="au-input"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))}
          onBlur={() => setCaps(false)}
        />
        <button
          type="button"
          className="au-eye"
          onClick={() => setShow((s) => !s)}
          aria-pressed={show}
          aria-label={show ? "Hide passcode" : "Show passcode"}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {caps && <p className="au-hint warn">Caps Lock is on.</p>}
    </div>
  );
}
