import Link from "next/link";
import { Suspense } from "react";

import { TeamAvatar } from "@/components/player/avatar";
import { Bolt, Coin } from "@/components/player/icons";
import { Stars } from "@/components/player/stars";
import { WantedTitle } from "@/components/player/wanted-title";
import { LiveStats, StatsSkeleton } from "@/components/live-stats";
import { PublicFooter, PublicHeader, PublicShell } from "@/components/public/shell";
import { getEventState } from "@/lib/game";
import {
  CHALLENGES,
  EVENT,
  FACTS,
  FINAL_BONUS,
  GETTING_IN,
  POLICE_STEPS,
  RULES,
  SCORING,
  SCORING_EXAMPLE,
  STAGES,
  TIMELINE,
  WANTED_CHOICES,
} from "@/lib/event-content";

export const instant = false;

/*
 * Each card gets its own glow spots: different corners, sizes and tints.
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

const TL_TONE: Record<string, string> = {
  round: "gold",
  break: "plain",
  heist: "red",
};

export default async function HomePage() {
  const state = await getEventState();
  const registrationOpen = state.registrationOpen;

  return (
    <PublicShell>
      <PublicHeader current="home" registrationOpen={registrationOpen} />

      <main className="pu-wrap">
        <section className="pu-hero">
          <div>
            <span className="pu-eyebrow">{EVENT.host} presents</span>
            <h1>
              Cash, Chaos
              <br />
              <em>&amp; Code</em>
            </h1>
            <p className="pu-lede">{EVENT.lede}</p>
            <div className="pu-ctas">
              {registrationOpen ? (
                <Link href="/register" className="pbtn">
                  Register your crew
                </Link>
              ) : (
                <Link href="/login" className="pbtn">
                  Team login
                </Link>
              )}
              <Link href="#workflow" className="pbtn line">
                See how it works
              </Link>
            </div>
          </div>

          <div className="pu-poster" aria-hidden>
            <div className="wp-wrap">
              <div className="wp">
                <i className="tape t1" />
                <i className="tape t2" />
                <div className="wp-in">
                  <span className="wp-code">No. TLH-01</span>
                  <WantedTitle />
                  <div className="wp-rule">
                    <span />
                    <i>★</i>
                    <span />
                  </div>
                  <p className="wp-sub">For the ultimate heist</p>
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

        {!registrationOpen && (
          <Suspense fallback={<StatsSkeleton />}>
            <LiveStats />
          </Suspense>
        )}

        <section className="pu-sec">
          <h2>The brief</h2>
          <p>What we know so far. Anything still open says so.</p>
          <div className="pu-stats">
            {FACTS.map((f) => (
              <div key={f.label} className="pu-stat">
                <small>{f.label}</small>
                <b>{f.value}</b>
                <span>{f.note}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pu-sec" id="workflow">
          <h2>How the day works</h2>
          <p>Six stages, start to finish. This is the whole workflow — no surprises on the day.</p>
          <div className="pu-steps">
            {STAGES.map((s, i) => (
              <article key={s.title} className="pu-step" style={spotsFor(i + 1) as React.CSSProperties}>
                <b>{String(i + 1).padStart(2, "0")}</b>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pu-sec">
          <h2>Timeline</h2>
          <p>A rough schedule for the day. Wraps up by {EVENT.endsBy}.</p>
          <ol className="pu-tl">
            {TIMELINE.map((t) => (
              <li key={t.time} className={t.kind ? `tone-${TL_TONE[t.kind]}` : ""}>
                <span className="pu-tl-time">{t.time}</span>
                <span className="pu-tl-dot" aria-hidden />
                <span className="pu-tl-what">{t.what}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="pu-sec">
          <h2>Mission categories</h2>
          <p>
            The exact missions are still secret and will be revealed on the day. These are the
            categories we&rsquo;re building from — a preview, not the final list.
          </p>
          <div className="pu-chals">
            {CHALLENGES.map((c) => (
              <article key={c.name} className="pu-chal">
                <h3>{c.name}</h3>
                <p>{c.blurb}</p>
                <div className="pu-chips">
                  {c.styles.map((s) => (
                    <span key={s} className="pu-chip">
                      {s}
                    </span>
                  ))}
                </div>
                <span className="pu-tba">Missions: to be announced</span>
              </article>
            ))}
          </div>
        </section>

        <section className="pu-sec">
          <h2>Scoring, in short</h2>
          <p>{SCORING_EXAMPLE}</p>
          <div className="pu-score">
            {SCORING.map((s) => (
              <div key={s.label} className={`pu-scorebar tone-${s.tone}`}>
                <span>{s.label}</span>
                <b>{s.value}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="pu-sec">
          <h2>Police &amp; Dexter</h2>
          <p>Score well and the city notices. Here is exactly how that works.</p>
          <div className="pu-two">
            <div className="pu-cur">
              <h3>Going wanted</h3>
              <ol className="pu-ord">
                {POLICE_STEPS.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
            <div className="pu-cur cash">
              <h3>Clearing your name</h3>
              <ol className="pu-ord">
                {WANTED_CHOICES.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="pu-sec">
          <h2>The Big Heist</h2>
          <p>Top {EVENT.topFinalists} crews after the regular rounds qualify. Everyone else watches.</p>
          <div className="pu-stats">
            {FINAL_BONUS.map((f) => (
              <div key={f.place} className="pu-stat">
                <small>{f.place}</small>
                <b className="gold">{f.bonus}</b>
                <span>bonus points</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pu-sec">
          <h2>House rules</h2>
          <p>Short version: play fair, stay safe, stay inside the zones.</p>
          <ul className="pu-rules">
            {RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>

        <section className="pu-sec join">
          <h2>How to join</h2>
          <p>Three steps between reading this and standing at the registration desk.</p>
          <div className="pu-steps">
            {GETTING_IN.map((s, i) => (
              <article key={s.title} className="pu-step" style={spotsFor(i + 1) as React.CSSProperties}>
                <b>{String(i + 1).padStart(2, "0")}</b>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
          <div className="pu-ctas center">
            {registrationOpen ? (
              <Link href="/register" className="pbtn">
                Register your crew
              </Link>
            ) : (
              <Link href="/login" className="pbtn">
                Team login
              </Link>
            )}
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
                Earned by clearing missions. They drive the leaderboard and decide who makes the
                final cut. You can never spend them.
              </p>
            </div>
            <div className="pu-cur cash">
              <h3>
                <Coin size={28} /> Cash
              </h3>
              <p>
                Also earned from missions. Spend it on Dexter&rsquo;s clearance fee and other
                in-game deals. It never moves you up the board.
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter registrationOpen={registrationOpen} />
    </PublicShell>
  );
}
