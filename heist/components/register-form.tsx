"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";

import { submitRegistrationAction } from "@/lib/actions/register-actions";

/** Resize an uploaded photo to max 480px and return it as a JPEG data URL (matches the admin photo field). */
function resize(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 480 / Math.max(img.width, img.height));
        const w = Math.round(img.width * k);
        const h = Math.round(img.height * k);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve("");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => resolve("");
      img.src = String(reader.result);
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function CameraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.6" />
    </svg>
  );
}

function PersonFields({
  prefix,
  label,
  required,
  badField,
}: {
  prefix: string;
  label: string;
  required: boolean;
  badField?: string;
}) {
  const bad = (f: string) => badField === `${prefix}${f}`;
  return (
    <div className="au-person">
      <div className="au-grouptitle">
        {label}
        {!required && <span className="au-optional">Optional</span>}
      </div>
      <div className="au-field">
        <label htmlFor={`${prefix}Name`}>Name</label>
        <input
          id={`${prefix}Name`}
          name={`${prefix}Name`}
          className="au-input"
          placeholder="Full name"
          autoComplete="off"
          required={required}
          aria-invalid={bad("Name") || undefined}
        />
      </div>
      <div className="au-row">
        <div className="au-field">
          <label htmlFor={`${prefix}Phone`}>Phone</label>
          <input
            id={`${prefix}Phone`}
            name={`${prefix}Phone`}
            className="au-input"
            placeholder="10-digit number"
            inputMode="tel"
            autoComplete="off"
            required={required}
            aria-invalid={bad("Phone") || undefined}
          />
        </div>
        <div className="au-field">
          <label htmlFor={`${prefix}Email`}>College email</label>
          <input
            id={`${prefix}Email`}
            name={`${prefix}Email`}
            type="email"
            className="au-input"
            placeholder="you@college.edu"
            autoComplete="off"
            required={required}
            aria-invalid={bad("Email") || undefined}
          />
        </div>
      </div>
    </div>
  );
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(submitRegistrationAction, {});
  const [photo, setPhoto] = useState("");
  const [photoErr, setPhotoErr] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // After a failed submit, jump to the field that needs fixing. Everything else stays as typed.
  useEffect(() => {
    if (!state.field) return;
    if (state.field === "photo") {
      fileRef.current?.focus();
      return;
    }
    document.getElementById(state.field)?.focus();
  }, [state]);

  if (state.done) {
    return (
      <div className="au-done">
        <span className="au-done-mark" aria-hidden>
          ✓
        </span>
        <h2>Thanks, {state.done.crew}.</h2>
        <p>We&rsquo;ve got your crew&rsquo;s sign-up. We will send an email if you got selected.</p>
      </div>
    );
  }

  const badPhoto = photoErr || state.field === "photo";

  return (
    <form
      // Submitting through onSubmit (not the `action` prop) stops React 19 from resetting the
      // fields after the server responds, so a wrong phone number doesn't wipe the whole form.
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        if (!photo) {
          setPhotoErr(true);
          fileRef.current?.focus();
          return;
        }
        setPhotoErr(false);
        const formData = new FormData(e.currentTarget);
        formData.set("photo", photo);
        startTransition(() => formAction(formData));
      }}
      className="au-form au-regform"
    >
      {/* Honeypot: real visitors never fill this in. */}
      <input
        type="text"
        name="contact_fax"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      <div className="au-top2">
        <div className="au-field">
          <label htmlFor="crewName">Crew name</label>
          <input
            id="crewName"
            name="crewName"
            className="au-input"
            placeholder="What should we call your crew?"
            autoComplete="off"
          />
          <p className="au-hint">Optional. We&rsquo;ll name you after the leader if you skip it.</p>
        </div>

        <div className="au-field">
          <label htmlFor="teamPhoto">Team photo</label>
          <div className="au-photofield">
            <span className="au-photoprev">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Team preview" />
              ) : (
                <CameraIcon />
              )}
            </span>
            <div>
              <input
                id="teamPhoto"
                ref={fileRef}
                type="file"
                accept="image/*"
                aria-invalid={badPhoto || undefined}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setPhoto(await resize(f));
                  setPhotoErr(false);
                }}
              />
              <p className="au-hint">One photo of the whole crew. We&rsquo;ll resize it.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="au-crew">
        <PersonFields prefix="leader" label="Leader" required badField={state.field} />
        <PersonFields prefix="m1" label="Crew 1" required badField={state.field} />
        <PersonFields prefix="m2" label="Crew 2" required badField={state.field} />
        <PersonFields prefix="m3" label="Crew 3" required badField={state.field} />
        <PersonFields prefix="m4" label="Crew 4" required={false} badField={state.field} />
      </div>

      {photoErr && (
        <p className="au-err" role="alert">
          Add a team photo before submitting.
        </p>
      )}
      {state.error && (
        <p key={state.error} className="au-err" role="alert">
          {state.error}
        </p>
      )}

      <div className="au-submitrow">
        <p className="au-fine">
          We will send an email to the crew leader if your crew is selected to play.
        </p>
        <button type="submit" className="au-btn" disabled={pending}>
          {pending ? "Submitting your crew…" : "Submit registration"}
          {!pending && <span aria-hidden>→</span>}
        </button>
      </div>
    </form>
  );
}
