import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/ui";
import { TeamLoginForm } from "@/components/team-login-form";

export const metadata: Metadata = {
  title: "Team Login",
};

export default function TeamLoginPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="panel sweep p-7 sm:p-9">
          <div className="mb-6">
            <p className="eyebrow">Crew access only</p>
            <h1 className="headline mt-2 text-3xl text-white">Team Login</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              Enter the TEAM ID printed on your registration slip along with
              the passcode the control room mailed to your leader.
            </p>
          </div>

          <TeamLoginForm />
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <Link href="/" className="text-xs text-white/40 hover:text-white/70">
            ← Back to the briefing
          </Link>
          <Link
            href="/admin/login"
            className="text-[11px] uppercase tracking-[0.2em] text-white/25 hover:text-cyan/80"
          >
            Control room
          </Link>
        </div>
      </div>
    </main>
  );
}
