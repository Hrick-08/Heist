import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "@/components/ui";
import { LiveStats, StatsSkeleton } from "@/components/live-stats";

const BRIEFING = [
  {
    step: "01",
    title: "Register",
    body: "Sign your crew up at the desk. Every team gets a TEAM ID, a leader photo and a personal login passcode sent to the team leader.",
  },
  {
    step: "02",
    title: "Crack the board",
    body: "Four rounds. Physical tasks are shared by every crew, technical tasks are yours alone. Complete them in any order — send each one to the admin desk for sign-off.",
  },
  {
    step: "03",
    title: "Stack the cash",
    body: "Every task pays points (for the leaderboard) and cash (for clues, bribes and the endgame). Points decide who survives. Cash keeps you alive.",
  },
  {
    step: "04",
    title: "Empty the vault",
    body: "40 crews become 20, then 10, then 5. The last crew standing walks away with the prize — and nobody walks away clean.",
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
        <Logo />
        <div className="flex items-center gap-3">
          <Link href="/leaderboard" className="btn-ghost btn-sm">
            Leaderboard
          </Link>
          <Link href="/login" className="btn-pink btn-sm">
            Team Login
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 pt-10 pb-16 sm:pt-16">
        <p className="eyebrow">GDG Campus Chitkara presents</p>
        <h1 className="headline mt-4 text-[clamp(2.75rem,8vw,6rem)] leading-[0.92] text-white">
          The Last
          <br />
          <span className="neon-title">Heist</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
          A GTA VI themed campus showdown. Forty crews, four rounds, one vault.
          Finish every task, buy what you need, and be the last crew standing
          when the lights go out.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link href="/login" className="btn-pink">
            Enter the Vault
          </Link>
          <Link href="/admin/login" className="btn-ghost">
            Control Room
          </Link>
        </div>

        <Suspense fallback={<StatsSkeleton />}>
          <LiveStats />
        </Suspense>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BRIEFING.map((item) => (
            <article key={item.step} className="panel p-6">
              <span className="font-mono-display text-xs text-pink">
                {item.step}
              </span>
              <h2 className="headline mt-3 text-lg text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/45">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-white/8 px-5 py-8 text-center">
        <p className="eyebrow">
          Google Developer Groups · Campus Chitkara · The Last Heist
        </p>
      </footer>
    </main>
  );
}
