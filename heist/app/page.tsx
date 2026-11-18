import Link from "next/link";
import { Suspense } from "react";

import { TeamAvatar } from "@/components/player/avatar";
import { Bolt, Coin } from "@/components/player/icons";
import { Stars } from "@/components/player/stars";
import { WantedTitle } from "@/components/player/wanted-title";
import { LiveStats, StatsSkeleton } from "@/components/live-stats";
import { PublicFooter, PublicHeader, PublicShell } from "@/components/public/shell";

const BRIEFING = [
  {
    step: "01",
    title: "Register",
    body: "Sign your crew up at the desk. Every team gets a TEAM ID, a leader photo and a personal login passcode sent to the team leader.",
  },
  {
    step: "02",
    title: "Crack the board",
    body: "Four rounds. Physical tasks are shared by every crew, technical tasks are yours alone. Complete them in any order, then send each one to the admin desk for sign-off.",
  },
  {
    step: "03",
    title: "Stack the cash",
    body: "Every task pays points for the leaderboard and cash for clues, bribes and the endgame. Points decide who survives. Cash keeps you alive.",
  },
  {
    step: "04",
    title: "Empty the vault",
    body: "40 crews become 20, then 10, then 5. The last crew standing walks away with the prize, and nobody walks away clean.",
  },
];

/*
 * Each briefing card gets its own glow spots: different corners, sizes and tints.
 * Seeded, so the server and every visitor see the same cards (no hydration drift).
 */
function spotsFor(i: number) {
  let seed = 11 + i * 97;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const tints = ["220,171,60", "200,80,62", "121,176,115", "108,147,207", "165,139,201"];
  const pick = () => tints[Math.floor(rnd() * tints.length)];
  const spot = (n: number) => ({
    [`--x${n}`]: `${Math.round(rnd() * 100)}%`,
    [`--y${n}`]: `${Math.round(rnd() * 100)}%`,
    [`--r${n}`]: `${60 + Math.round(rnd() * 90)}px`,
    [`--c${n}`]: pick(),
  });
  return { ...spot(1), ...spot(2), ...(rnd() > 0.45 ? spot(3) : { "--r3": "0px", "--c3": "0,0,0", "--x3": "0%", "--y3": "0%" }) };
}

export default function HomePage() {
  return (
    <PublicShell>
      <PublicHeader current="home" />

      <main className="pu-wrap">
        <section className="pu-hero">
          <div>
            <span className="pu-eyebrow">GDG Campus Chitkara presents</span>
            <h1>
              The Last
              <em>Heist</em>
            </h1>
            <p className="pu-lede">
              A GTA VI themed campus showdown. Forty crews, four rounds, one vault. Finish every
              task, buy what you need, and be the last crew standing when the lights go out.
            </p>
            <div className="pu-ctas">
              <Link href="/login" className="pbtn">
                Enter the vault
              </Link>
              <Link href="/leaderboard" className="pbtn line">
                See the leaderboard
              </Link>
            </div>
          </div>

          <div className="pu-poster" aria-hidden>
            <div className="wp-wrap">
              <div className="wp">
                <i className="tape t1" />
                <i className="tape t2" />
                <div className="wp-in">
                  <span className="wp-code">No. YOU-01</span>
                  <WantedTitle />
                  <div className="wp-rule">
                    <span />
                    <i>★</i>
                    <span />
                  </div>
                  <p className="wp-sub">For the last heist</p>
                  <div className="wp-mug">
                    <TeamAvatar teamId="YOU-01" name="Your crew" hasPhoto={false} size={130} square />
                  </div>
                  <b className="wp-name">Your crew</b>
                  <span className="wp-lead">Last seen near the vault</span>
                  <Stars n={3} size={20} />
                  <div className="wp-reward">
                    <small>Reward</small>
                    <b>
                      <Bolt size={30} color="#8a5a14" />
                      1,000
                    </b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Suspense fallback={<StatsSkeleton />}>
          <LiveStats />
        </Suspense>

        <section className="pu-sec">
          <h2>The briefing</h2>
          <p>Four steps from the registration desk to the vault door.</p>
          <div className="pu-steps">
            {BRIEFING.map((item) => (
              <article key={item.step} className="pu-step" style={spotsFor(Number(item.step)) as React.CSSProperties}>
                <b>{item.step}</b>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pu-sec">
          <h2>Two currencies</h2>
          <p>Know which one you are spending before you spend it.</p>
          <div className="pu-two">
            <div className="pu-cur pts">
              <h3>
                <Bolt size={28} color="#dcab3c" /> Points
              </h3>
              <p>
                Earned by clearing tasks. They drive the leaderboard and decide who survives each
                round. You can never spend them.
              </p>
            </div>
            <div className="pu-cur cash">
              <h3>
                <Coin size={28} /> Cash
              </h3>
              <p>
                Also earned from tasks. Spend it on clues, on bribing the Police off your back, and
                on funding the endgame. It never moves you up the board.
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </PublicShell>
  );
}
