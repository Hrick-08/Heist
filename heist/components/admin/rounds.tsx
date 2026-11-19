"use client";

import Link from "next/link";

import {
  advanceRoundAction,
  allocateRoundAction,
  crownChampionAction,
  syncWantedAction,
} from "@/lib/actions/admin-actions";
import { Avatar } from "./avatar";
import { num } from "./format";
import { Bolt } from "./icons";
import { useAdmin } from "./provider";
import { RewindControl } from "./rewind-control";
import { Stars } from "./stars";
import { UndoButton } from "./undo-button";
import { Empty, PageHead, Panel, Stat } from "./ui";

export interface RoundsProps {
  round: number;
  totalRounds: number;
  ended: boolean;
  slots: number;
  inPlay: number;
  eliminated: number;
  plan: number[];
  wanted: { teamId: string; name: string; points: number; rank: number; stars: number; hasPhoto: boolean }[];
  wantedTotal: number;
  history: { round: number; crews: { teamId: string; name: string; points: number }[] }[];
  standings: { rank: number; teamId: string; name: string; points: number }[];
}

export function RoundsView(p: RoundsProps) {
  const { run, ask } = useAdmin();
  const last = p.round >= p.totalRounds;
  const noHistory = p.history.every((h) => h.crews.length === 0);

  return (
    <>
      <PageHead eyebrow="The funnel" title="Rounds">
        Closing a round knocks out the bottom half of the standings and allocates the next round&apos;s tasks to the survivors.
      </PageHead>

      <div className="stats">
        <Stat label="Current round" value={`${p.round} / ${p.totalRounds}`} tone="gold" sub={p.ended ? "Event closed" : "Live"} />
        <Stat label="Crews in play" value={p.inPlay} tone="blue" sub={`${p.slots} slots originally`} />
        <Stat label="Eliminated" value={p.eliminated} tone="purple" />
        <Stat label="On the wanted list" value={p.wantedTotal} tone="gold" />
      </div>

      <Panel title="Round flow" sub="Where the field stands and what happens when a round closes." accent="red">
        <div className="tiles">
          {p.plan.map((crews, i) => {
            const r = i + 1;
            const st = p.ended || r < p.round ? "done" : r === p.round ? "now" : "";
            return (
              <div key={r} className={`tile ${st}`}>
                <span className="mute small cap">Round {r}</span>
                <b>
                  {crews}
                  <small>crews</small>
                </b>
                <span className="mute small">{st === "done" ? "closed" : st === "now" ? "in play" : "upcoming"}</span>
              </div>
            );
          })}
        </div>
        <div className="row wrap" style={{ marginTop: 18, gap: 10 }}>
          <button className="btn violet" disabled={p.ended} onClick={() => run(allocateRoundAction, {})}>
            Allocate round {p.round} tasks
          </button>
          <button
            className="btn red"
            disabled={p.ended}
            onClick={() =>
              ask({
                title: last ? "Close the final round?" : `Advance to round ${p.round + 1}?`,
                body: `This eliminates ${Math.floor(p.inPlay / 2)} crew(s) and allocates the next round. A mispress? Use Undo to roll straight back.`,
                cta: last ? "Close the final round" : `Advance to round ${p.round + 1}`,
                tone: "red",
                onYes: async () => void (await run(advanceRoundAction, {})),
              })
            }
          >
            {last ? "Close the final round" : `Advance to round ${p.round + 1}`}
          </button>
          <button
            className="btn green"
            disabled={p.ended}
            onClick={() =>
              ask({
                title: "Crown the champion?",
                body: "End the event now. The top crew wins, every other crew is eliminated and scores are locked.",
                cta: "Crown the champion",
                tone: "green",
                onYes: async () => void (await run(crownChampionAction, {})),
              })
            }
          >
            {p.ended ? "Champion crowned" : "Crown the champion"}
          </button>
          <button className="btn ghost" onClick={() => run(syncWantedAction, {})}>
            Sync wanted (top 3)
          </button>
          <UndoButton />
          <RewindControl current={p.round} />
        </div>
      </Panel>

      <div style={{ height: 14 }} />
      <Panel title="Wanted board" sub="The top three crews on the leaderboard are the ones the city wants." accent="gold">
        {p.wanted.length === 0 ? (
          <p className="mute">Nobody is wanted yet. Sync wanted to post the top three.</p>
        ) : (
          <div className="posters">
            {p.wanted.map((c) => (
              <article key={c.teamId} className="poster">
                <span className="wanted">Wanted</span>
                <span className="mug">
                  <Avatar teamId={c.teamId} hasPhoto={c.hasPhoto} size={84} label={c.name} />
                </span>
                <Link href={`/admin/teams/${c.teamId}`} className="pn">
                  {c.name}
                </Link>
                <span className="code">{c.teamId}</span>
                <Stars n={c.stars} size={16} />
                <span className="bounty">
                  <Bolt size={20} color="#8a5a14" />
                  {num(c.points)}
                </span>
                <span className="pts">
                  {c.rank ? `#${c.rank} · ` : ""}
                  {num(c.points)} pts
                </span>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <div style={{ height: 14 }} />
      <Panel title="Elimination history" sub="Who was knocked out, round by round." accent="purple" flush={!noHistory}>
        {noHistory ? (
          <Empty title="Nobody has been knocked out yet">Close round one to see the eliminations roll in.</Empty>
        ) : (
          p.history.map((h) =>
            h.crews.length === 0 ? null : (
              <div key={h.round} className="hround">
                <span className="cap mute">Round {h.round}</span>
                <ul className="chips">
                  {h.crews.map((c) => (
                    <li key={c.teamId} className="chip static">
                      <span className="mute">{c.teamId}</span> {c.name} · {num(c.points)} pts
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )
        )}
      </Panel>

      <div style={{ height: 14 }} />
      <Panel title="Standings" sub="Points only." accent="blue" flush>
        {p.standings.length === 0 ? (
          <Empty title="No crews yet" />
        ) : (
          <ol>
            {p.standings.map((c) => (
              <li key={c.teamId} className="lb slim">
                <span className={`n ${c.rank <= 3 ? `r${c.rank}` : ""}`}>{c.rank}</span>
                <div className="nmx">
                  <Link href={`/admin/teams/${c.teamId}`}>
                    <b>{c.name}</b>
                  </Link>
                  <span className="code">{c.teamId}</span>
                </div>
                <span className="pts">{num(c.points)}</span>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </>
  );
}
