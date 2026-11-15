import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/ui";
import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata: Metadata = {
  title: "Control Room Login",
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="panel p-7 sm:p-9">
          <div className="mb-6">
            <p className="eyebrow">Restricted · event control</p>
            <h1 className="headline mt-2 text-3xl text-white">
              Control <span className="text-cyan">Room</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              Admin access. Mark crew tasks as complete, push Dexter
              missions, run the rounds and manage the task pool.
            </p>
          </div>

          <AdminLoginForm />
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <Link href="/" className="text-xs text-white/40 hover:text-white/70">
            ← Back to the briefing
          </Link>
          <Link
            href="/login"
            className="text-[11px] uppercase tracking-[0.2em] text-white/25 hover:text-pink/80"
          >
            Team login
          </Link>
        </div>
      </div>
    </main>
  );
}
