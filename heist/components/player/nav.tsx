"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HomeIcon, RankIcon } from "./icons";

/** Two tabs only: Home (dashboard + tasks) and Ranks. */
export function PlayerNav() {
  const path = usePathname();
  const tabs = [
    {
      href: "/dashboard",
      label: "Home",
      Icon: HomeIcon,
      on: path.startsWith("/dashboard") || path.startsWith("/tasks") || path.startsWith("/missions"),
    },
    { href: "/ranks", label: "Ranks", Icon: RankIcon, on: path.startsWith("/ranks") },
  ];
  return (
    <nav className="nav" aria-label="Main">
      {tabs.map(({ href, label, Icon, on }) => (
        <Link key={href} href={href} className={on ? "tab on" : "tab"} aria-current={on ? "page" : undefined}>
          <Icon size={18} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
