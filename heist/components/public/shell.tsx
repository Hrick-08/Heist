import Link from "next/link";
import type { ReactNode } from "react";

import { LogIn, Trophy } from "@/components/player/icons";
import { fontVars } from "@/lib/fonts";

import "@/app/(team)/player.css";
import "@/app/public.css";

/** Same theme as the player app (charcoal, paper, gold), for every public page. */
export function PublicShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`pl pu ${fontVars} ${className}`}>{children}</div>;
}

export function PublicLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="pu-logo" aria-label="Cash, Chaos & Code, home">
      <span className="pu-mark" aria-hidden>
        C<i />
      </span>
      {!compact && (
        <span className="pu-word">
          Cash, Chaos &amp; Code
          <small>GDG Chitkara · The Ultimate Heist</small>
        </span>
      )}
    </Link>
  );
}

export function PublicHeader({
  current,
  registrationOpen = false,
}: {
  current?: "home" | "leaderboard";
  registrationOpen?: boolean;
}) {
  return (
    <header className="pu-head">
      <div className="pu-head-in">
        <PublicLogo />
        <nav className="pu-nav" aria-label="Site">
          {!registrationOpen && (
            <Link
              href="/leaderboard"
              className={current === "leaderboard" ? "pu-link on" : "pu-link"}
              aria-current={current === "leaderboard" ? "page" : undefined}
              aria-label="Leaderboard"
            >
              <Trophy size={22} />
              <span className="lbl">Leaderboard</span>
            </Link>
          )}
          {registrationOpen ? (
            <Link href="/register" className="pbtn pu-cta" aria-label="Register your crew">
              <LogIn size={22} />
              <span className="lbl">Register</span>
            </Link>
          ) : (
            <Link href="/login" className="pbtn pu-cta" aria-label="Team login">
              <LogIn size={22} />
              <span className="lbl">Team login</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter({ registrationOpen = false }: { registrationOpen?: boolean }) {
  return (
    <footer className="pu-foot">
      <span>Cash, Chaos &amp; Code · GDG Campus Chitkara</span>
      <span className="pu-foot-links">
        {registrationOpen ? (
          <Link href="/register">Register</Link>
        ) : (
          <>
            <Link href="/leaderboard">Leaderboard</Link>
            <Link href="/login">Team login</Link>
          </>
        )}
        <Link href="/admin/login">Control room</Link>
      </span>
    </footer>
  );
}
