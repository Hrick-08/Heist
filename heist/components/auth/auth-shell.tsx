import Link from "next/link";
import type { ReactNode } from "react";

import { PublicLogo, PublicShell } from "@/components/public/shell";
import { AuthParallax } from "./parallax";

import "@/app/auth.css";

type Variant = "team" | "admin";

/** Deterministic skyline so the server and client always agree. */
function Skyline({ layer }: { layer: "far" | "near" }) {
  const buildings: [number, number, number][] =
    layer === "far"
      ? [[0, 110, 200], [110, 80, 260], [190, 120, 190], [310, 70, 300], [380, 130, 220], [510, 90, 270], [600, 120, 180], [720, 80, 310], [800, 130, 230], [930, 90, 190], [1020, 180, 260]]
      : [[0, 90, 120], [90, 70, 190], [160, 100, 150], [260, 60, 230], [320, 110, 140], [430, 80, 200], [510, 100, 120], [610, 70, 250], [680, 120, 170], [800, 80, 130], [880, 100, 210], [980, 70, 160], [1050, 150, 190]];
  let seed = layer === "far" ? 21 : 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const wins: { x: number; y: number; d: number; on: boolean }[] = [];
  for (const [x, w, h] of buildings) {
    for (let wx = x + 10; wx < x + w - 10; wx += 16) {
      for (let wy = 300 - h + 14; wy < 288; wy += 22) {
        if (rnd() > 0.64) wins.push({ x: wx, y: wy, d: Math.round(rnd() * 60) / 10, on: rnd() > 0.5 });
      }
    }
  }
  return (
    <svg className={`au-city ${layer}`} viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice">
      {buildings.map(([x, w, h], i) => (
        <rect key={i} className="bld" x={x} y={300 - h} width={w} height={h} />
      ))}
      {wins.map((w, i) => (
        <rect key={i} className={w.on ? "win on" : "win"} x={w.x} y={w.y} width="8" height="11" style={{ animationDelay: `${w.d}s` }} />
      ))}
    </svg>
  );
}

function Stars() {
  let seed = 3;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  return (
    <svg className="au-stars" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMin slice">
      {Array.from({ length: 70 }, (_, i) => (
        <circle key={i} cx={Math.round(rnd() * 1200)} cy={Math.round(rnd() * 420)} r={rnd() > 0.85 ? 2 : 1.2} style={{ animationDelay: `${(rnd() * 5).toFixed(1)}s` }} />
      ))}
    </svg>
  );
}

export function AuthShell({
  variant,
  children,
}: {
  variant: Variant;
  children: ReactNode;
}) {
  const team = variant === "team";
  return (
    <PublicShell className={`au au-${variant}`}>
      <AuthParallax>
        {team ? (
          <div className="lay" style={{ ["--d" as string]: 10 }}>
            <span className="au-beam" />
          </div>
        ) : (
          <>
            <div className="lay" style={{ ["--d" as string]: 5 }}>
              <Stars />
            </div>
            <div className="lay" style={{ ["--d" as string]: 8 }}>
              <span className="au-moon" />
            </div>
          </>
        )}
        <div className="lay" style={{ ["--d" as string]: 16 }}>
          <Skyline layer="far" />
        </div>
        <div className="lay" style={{ ["--d" as string]: 30 }}>
          <Skyline layer="near" />
        </div>
        <span className="au-fade" />
        {!team && <span className="au-tape top" />}
        {!team && <span className="au-tape" />}
      </AuthParallax>

      <main className="au-wrap">
        <section className="au-story">
          <PublicLogo />
          {team ? (
            <>
              <span className="au-eyebrow">Crew access</span>
              <h2 className="au-big">
                Forty crews.
                <br />
                <em>One vault.</em>
              </h2>
              <p className="au-lede">
                Four rounds, one prize and a city that is already watching. Sign in to see your
                tasks, your cash and who the Police want next.
              </p>
              <ul className="au-facts">
                <li><b>40</b><span>crews</span></li>
                <li><b>4</b><span>rounds</span></li>
                <li><b>1</b><span>vault</span></li>
              </ul>
            </>
          ) : (
            <>
              <span className="au-eyebrow">Restricted · event control</span>
              <h2 className="au-big">
                Control
                <br />
                <em>Room</em>
              </h2>
              <p className="au-lede">
                Sign off crew tasks, push Dexter missions, run the rounds and manage the task pool.
              </p>
              <ul className="au-facts chips">
                <li><span>Approvals</span></li>
                <li><span>Dexter missions</span></li>
                <li><span>Rounds</span></li>
                <li><span>Task pool</span></li>
              </ul>
            </>
          )}
        </section>

        <section className="au-side">
          <div className="au-top">
            <Link href="/">← Back to the briefing</Link>
            <Link href="/leaderboard">Leaderboard</Link>
          </div>

          {children}

          {team ? (
            <Link href="/admin/login" className="au-door">
              Control room login
              <span aria-hidden>→</span>
            </Link>
          ) : (
            <Link href="/login" className="au-door">
              <span aria-hidden>←</span>
              Back to crew login
            </Link>
          )}
        </section>
      </main>
    </PublicShell>
  );
}
