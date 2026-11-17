"use client";

import { useEffect } from "react";

export function PageHead({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="phead">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {children && <p className="mute lede">{children}</p>}
      </div>
      {actions && <div className="pactions">{actions}</div>}
    </header>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
  onClick,
  active,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      className={`card stat${onClick ? " click" : ""}${active ? " active" : ""}`}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      <span className="mute small cap">{label}</span>
      <b className={tone ? `t-${tone}` : undefined}>{value}</b>
      {sub && <span className="mute small">{sub}</span>}
    </Tag>
  );
}

export function Panel({
  title,
  sub,
  accent = "gold",
  action,
  children,
  flush,
}: {
  title: string;
  sub?: string;
  accent?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div className="row" style={{ alignItems: "stretch", gap: 12 }}>
          <i className={`accent a-${accent}`} />
          <div>
            <h2>{title}</h2>
            {sub && <p className="mute small">{sub}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className={flush ? "panel-body flush" : "panel-body"}>{children}</div>
    </section>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      <b>{title}</b>
      {children && <p className="mute small">{children}</p>}
    </div>
  );
}

export function Chip({
  on,
  onClick,
  children,
  count,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button type="button" className={on ? "chip on" : "chip"} onClick={onClick}>
      {children}
      {count !== undefined && <em>{count}</em>}
    </button>
  );
}

export function Toggle({
  on,
  onChange,
  label,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      className={on ? "switch on" : "switch"}
      onClick={() => onChange(!on)}
    >
      <i />
    </button>
  );
}

/* Drawer: right panel on desktop, bottom sheet on phones. Esc and the scrim close it. */
export function Drawer({
  open,
  onClose,
  title,
  sub,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className={wide ? "drawer wide" : "drawer"} role="dialog" aria-label={title}>
        <div className="grab" />
        <div className="drawer-head">
          <div>
            <h2>{title}</h2>
            {sub && <p className="mute small">{sub}</p>}
          </div>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </>
  );
}
