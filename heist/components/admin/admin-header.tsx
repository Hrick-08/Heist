import Link from "next/link";

import { logoutAction } from "@/lib/actions/auth-actions";
import type { SessionPayload } from "@/lib/types";
import { Logo } from "@/components/ui";

export function AdminHeader({ session }: { session: SessionPayload }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-void/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center gap-4 px-5 py-3">
        <Logo />
        <span className="chip border-cyan/40 bg-cyan/10 text-cyan">
          Control room
        </span>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/leaderboard"
            className="hidden text-xs text-white/40 hover:text-white/70 sm:block"
          >
            Public leaderboard
          </Link>
          <span className="hidden text-xs text-white/50 sm:block">
            Operator: <span className="text-white">{session.name}</span>
          </span>
          <form action={logoutAction}>
            <button type="submit" className="btn-ghost btn-sm">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
