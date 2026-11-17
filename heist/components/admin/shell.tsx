"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/lib/actions/auth-actions";
import { useAdmin } from "./provider";
import {
  BellIcon,
  CheckIcon,
  CrewIcon,
  ExitIcon,
  FlagIcon,
  GridIcon,
  ListIcon,
  ShadesIcon,
  SlidersIcon,
} from "./icons";

const TABS = [
  { href: "/admin", label: "Overview", Icon: GridIcon },
  { href: "/admin/approvals", label: "Approvals", Icon: CheckIcon },
  { href: "/admin/teams", label: "Crews", Icon: CrewIcon },
  { href: "/admin/tasks", label: "Task pool", Icon: ListIcon },
  { href: "/admin/dexter", label: "Dexter", Icon: ShadesIcon },
  { href: "/admin/rounds", label: "Rounds", Icon: FlagIcon },
  { href: "/admin/settings", label: "Settings", Icon: SlidersIcon },
];

export function TopBar({ operator }: { operator: string }) {
  const { unread, openNotes } = useAdmin();
  return (
    <div className="top">
      <Link href="/admin" className="who" aria-label="Control room home">
        <span className="logo">
          <b>L</b>
          <i className="live" />
        </span>
        <span className="nm">
          <b>The Last Heist</b>
          <small className="mute">GDG Chitkara · GTA VI</small>
        </span>
      </Link>
      <span className="badge">Control room</span>
      <span className="grow" />
      <nav className="toplinks" aria-label="Account">
        <Link href="/leaderboard" className="mute hide-sm">
          Public leaderboard
        </Link>
        <span className="pill hide-sm">
          <span className="mute">Operator:</span> {operator}
        </span>
        <button
          type="button"
          className={unread > 0 ? "icobtn bell on" : "icobtn bell"}
          onClick={openNotes}
          aria-label={unread > 0 ? `Updates, ${unread} new` : "Updates"}
        >
          <BellIcon size={18} />
          {unread > 0 && <span className="bdot">{unread > 9 ? "9+" : unread}</span>}
        </button>
        <form action={logoutAction}>
          <button type="submit" className="btn ghost sm" aria-label="Sign out">
            <ExitIcon size={16} />
            <span className="so-label">Sign out</span>
          </button>
        </form>
      </nav>
    </div>
  );
}

export function SideNav() {
  const path = usePathname();
  const { pending } = useAdmin();
  return (
    <nav className="nav" aria-label="Control room">
      <span className="nav-label">Control room</span>
      {TABS.map(({ href, label, Icon }) => {
        const on = href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} className={on ? "tab on" : "tab"} aria-current={on ? "page" : undefined}>
            <Icon size={18} />
            {label}
            {label === "Approvals" && pending > 0 && <span className="count">{pending}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
