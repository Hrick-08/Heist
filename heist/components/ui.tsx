import Link from "next/link";
import type { ReactNode } from "react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3">
      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-pink/40 bg-pink/10 shadow-[0_0_24px_-8px_var(--color-pink)]">
        <span className="headline text-lg text-pink">L</span>
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-cyan shadow-[0_0_10px_var(--color-cyan)]" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="headline block text-lg tracking-tight text-white">
            The Last <span className="neon-title">Heist</span>
          </span>
          <span className="eyebrow block">GDG Chitkara · GTA VI</span>
        </span>
      )}
    </Link>
  );
}

export function Panel({
  children,
  className = "",
  id,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: "section" | "div" | "article" | "aside";
}) {
  return (
    <Tag id={id} className={`panel ${className}`}>
      {children}
    </Tag>
  );
}

export function PanelHeader({
  title,
  subtitle,
  action,
  accent = "pink",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  accent?: "pink" | "cyan" | "violet" | "amber" | "lime";
}) {
  const accents: Record<string, string> = {
    pink: "from-pink",
    cyan: "from-cyan",
    violet: "from-violet",
    amber: "from-amber",
    lime: "from-lime",
  };
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 px-5 py-4">
      <div className="flex items-start gap-3">
        <span
          className={`mt-1.5 h-8 w-1 shrink-0 rounded-full bg-gradient-to-b ${accents[accent]} to-transparent`}
        />
        <div>
          <h2 className="headline text-base tracking-tight text-white">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-white/45">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "white",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "white" | "pink" | "cyan" | "amber" | "lime" | "violet";
  icon?: ReactNode;
}) {
  const tones: Record<string, string> = {
    white: "text-white",
    pink: "text-pink",
    cyan: "text-cyan",
    amber: "text-amber",
    lime: "text-lime",
    violet: "text-violet",
  };
  return (
    <div className="panel-flush relative overflow-hidden px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        {icon}
      </div>
      <p className={`stat-value mt-2 ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-white/40">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p className="headline text-sm text-white/70">{title}</p>
      {description && (
        <p className="max-w-md text-xs leading-relaxed text-white/40">
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Money({
  amount,
  className = "",
}: {
  amount: number;
  className?: string;
}) {
  return (
    <span className={`font-mono-display tabular-nums ${className}`}>
      ${amount.toLocaleString("en-IN")}
    </span>
  );
}

export function Points({
  amount,
  className = "",
}: {
  amount: number;
  className?: string;
}) {
  return (
    <span className={`font-mono-display tabular-nums ${className}`}>
      {amount.toLocaleString("en-IN")} pts
    </span>
  );
}

export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-white/8" />;
  return (
    <div className="flex items-center gap-3">
      <hr className="flex-1 border-white/8" />
      <span className="eyebrow">{label}</span>
      <hr className="flex-1 border-white/8" />
    </div>
  );
}
