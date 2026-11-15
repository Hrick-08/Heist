"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview", icon: "◈" },
  { href: "/admin/approvals", label: "Approvals", icon: "✓" },
  { href: "/admin/teams", label: "Crews", icon: "▣" },
  { href: "/admin/tasks", label: "Task pool", icon: "⌘" },
  { href: "/admin/dexter", label: "Dexter", icon: "◐" },
  { href: "/admin/rounds", label: "Rounds", icon: "⏱" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
];

export function AdminSidebar({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="panel sticky top-24 h-fit w-full shrink-0 p-3 lg:w-56">
      <p className="eyebrow px-3 py-2">Control room</p>
      <ul className="flex gap-1 overflow-x-auto scroll-thin lg:flex-col lg:overflow-visible">
        {LINKS.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          const badge = link.href === "/admin/approvals" ? pendingCount : 0;
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-cyan/12 text-cyan shadow-[0_0_22px_-10px_var(--color-cyan)]"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="font-mono-display text-xs opacity-70">
                  {link.icon}
                </span>
                {link.label}
                {badge > 0 && (
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-pink px-1.5 font-mono-display text-[10px] text-white">
                    {badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
