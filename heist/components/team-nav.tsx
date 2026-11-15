"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tasks", label: "Targets" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/endgame", label: "Endgame" },
];

export function TeamNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto scroll-thin">
      {LINKS.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${
              active
                ? "bg-pink/15 text-pink shadow-[0_0_20px_-8px_var(--color-pink)]"
                : "text-white/45 hover:bg-white/5 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
