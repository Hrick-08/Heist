"use client";

import Link from "next/link";

import {
  advanceRoundAction,
  allocateRoundAction,
  crownChampionAction,
  seedAction,
  syncWantedAction,
} from "@/lib/actions/admin-actions";
import { Avatar } from "./avatar";
import { money, num, STATUS_TAG } from "./format";
import { Bolt, CheckIcon, Coin, CrownIcon } from "./icons";
import { useAdmin } from "./provider";
import { RewindControl } from "./rewind-control";
import { Stars } from "./stars";
import { UndoButton } from "./undo-button";
import { Empty, PageHead, Panel, Stat } from "./ui";

export interface OverviewProps {
  round: number;
  totalRounds: number;
  ended: boolean;
  live: boolean;
  slots: number;
  counts: { registered: number; inPlay: number; out: number; waiting: number };
  pending: { count: number; crew?: string; title?: string };
  points: number;
  cash: number;
  missionsLive: number;
  missionsTotal: number;
  champion: { name: string; teamId: string; points: number; money: number; hasPhoto: boolean } | null;
  feed: { key: string; teamName: string; title: string; points: number; money: number; at: string }[];
  standings: {
    rank: number;
    teamId: string;
    name: string;
    points: number;
    completed: number;
    status: string;
    stars: number;
    hasPhoto: boolean;
  }[];
}

export function OverviewView(p: OverviewProps) {
  const { run, ask } = useAdmin();
  const last = p.round >= p.totalRounds;
  const rounds = Array.from({ length: p.totalRounds }, (_, i) => i + 1);

  return (
    <>
      <PageHead
        eyebrow="Event control"
        title="Overview"
        actions={
          <>
            <button className="btn ghost" onClick={() => run(syncWantedAction, {})}>
              Sync wanted (top 3)
            </button>
            <button className="btn ghost" onClick={() => run(seedAction, {})}>
              Seed pool
            </button>
          </>
        }
      >
        Round {p.round} of {p.totalRounds} · {p.ended ? "event closed" : p.live ? "event live" : "event paused"} · {p.slots} crew slots
      </PageHead>

      {p.champion && (
        <section className="champ">
          <Avatar teamId={p.champion.teamId} hasPhoto={p.champion.hasPhoto} size={64} label={p.champion.name} />
          <div className="grow">
            <span className="cap t-cash">Champion</span>
            <h2>
              {p.champion.name} <span className="mute">({p.champion.teamId})</span>
            </h2>
            <p className="mute small">
              {num(p.champion.points)} points · {money(p.champion.money)} cash left in the pocket.
            </p>
          </div>
          <CrownIcon size={34} />
        </section>
      )}

      {p.pending.count > 0 && (
        <div className="alert" role="status">
          <b className="grow">
            {p.pending.count} request{p.pending.count > 1 ? "s are" : " is"} waiting at the desk
          </b>
          <span className="mute">
            {p.pending.crew} · {p.pending.title}
            {p.pending.count > 1 ? ` +${p.pending.count - 1} more` : ""}
          </span>
          <Link href="/admin/approvals" className="btn sm">
            Review now
          </Link>
        </div>
      )}

      <div className="stats">
        <Stat label="Crews registered" value={p.counts.registered} tone="gold" sub={`${p.counts.inPlay} in play · ${p.counts.out} out · ${p.counts.waiting} waiting`} />
        <Stat
          label="Waiting on the desk"
          value={p.pending.count}
          tone="red"
          sub={p.pending.count ? `${p.pending.count} approval${p.pending.count > 1 ? "s" : ""} queued` : "No approvals queued"}
        />
        <Stat label="Points on the board" value={num(p.points)} tone="blue" sub="Drives every elimination" />
        <Stat label="Cash in play" value={money(p.cash)} tone="cash" sub="Clues, bribes, endgame" />
        <Stat label="Dexter missions live" value={p.missionsLive} tone="purple" sub={`${p.missionsTotal} total in the archive`} />
      </div>

      <div className="dash">
        <Panel title="Round control" sub="Half the crews are knocked out when a round closes." accent="red">
          <div className="rounds" role="list" aria-label="Rounds">
            {rounds.map((r) => {
              const cls = p.ended && r === p.round ? "done" : r < p.round ? "done" : r === p.round ? "now" : "";
              return (
                <div key={r} role="listitem" className={`rtile ${cls}`} aria-current={r === p.round ? "step" : undefined}>
                  <span>R {r}</span>
                  <span className="dot">{cls === "done" && <CheckIcon size={10} />}</span>
                </div>
              );
            })}
          </div>

          <div className="actions">
            <p className="hint">
              Hands this round&apos;s board to every crew that does not have one yet. Physical tasks are shared, technical tasks are dealt one to one crew.
            </p>
            <button className="btn violet block" disabled={p.ended} onClick={() => run(allocateRoundAction, {})}>
              Allocate round {p.round} tasks
            </button>

            <p className="hint" style={{ marginTop: 14 }}>
              Ranking by points, then tasks cleared. The bottom half of the board is eliminated and the next round&apos;s tasks are allocated to the survivors.
            </p>
            <button
              className="btn red block"
              disabled={p.ended}
              onClick={() =>
                ask({
                  title: last ? "Close the final round?" : `Advance to round ${p.round + 1}?`,
                  body: last
                    ? "This closes the final round. Crown the champion afterwards."
                    : `This eliminates ${Math.floor(p.counts.inPlay / 2)} crew(s) and allocates the next round. A mispress? Use Undo in the top bar to roll straight back.`,
                  cta: last ? "Close the final round" : `Advance to round ${p.round + 1}`,
                  tone: "red",
                  onYes: async () => void (await run(advanceRoundAction, {})),
                })
              }
            >
              {last ? "Close the final round" : `Advance to round ${p.round + 1}`}
            </button>
            <UndoButton />
            <RewindControl current={p.round} />

            <p className="hint" style={{ marginTop: 14 }}>
              Ends the event, eliminates the rest and locks the final scores.
            </p>
            <button
              className="btn green block"
              disabled={p.ended}
              onClick={() =>
                ask({
                  title: "Crown the champion?",
                  body: "End the event and crown the top crew. Every other crew is eliminated and scores are locked.",
                  cta: "Crown the champion",
                  tone: "green",
                  onYes: async () => void (await run(crownChampionAction, {})),
                })
              }
            >
              {p.ended ? "Champion crowned" : "Crown the champion"}
            </button>
          </div>
        </Panel>

        <Panel
          title="Desk activity"
          sub="Tasks verified at the desk."
          accent="blue"
          flush
          action={
            p.pending.count > 0 ? (
              <Link href="/admin/approvals" className="btn sm">
                {p.pending.count} waiting
              </Link>
            ) : undefined
          }
        >
          {p.feed.length === 0 ? (
            <Empty title="Nothing verified yet">As crews reach the desk and you mark their tasks, the activity shows up here.</Empty>
          ) : (
            <ul className="feed">
              {p.feed.map((a) => (
                <li key={a.key}>
                  <span className="ic">
                    <CheckIcon size={18} />
                  </span>
                  <div className="grow">
                    <b>{a.title}</b>
                    <div className="mute small">
                      {a.teamName}
                      {a.at ? ` · verified ${a.at}` : ""}
                    </div>
                  </div>
                  <span className="reward pts">
                    <Bolt size={13} />+{a.points}
                  </span>
                  <span className="reward cashr">
                    <Coin size={14} />
                    {num(a.money)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Standings"
        sub="Points only. Cash never affects the order."
        flush
        action={
          <Link href="/admin/teams" className="btn ghost sm">
            Manage crews
          </Link>
        }
      >
        {p.standings.length === 0 ? (
          <Empty title="No crews yet">Register a crew to start the board.</Empty>
        ) : (
          <>
            <div className="lb head">
              <span>Rank</span>
              <span />
              <span>Crew</span>
              <span className="cols">
                <span className="hide-m">Wanted</span>
                <span className="hide-m">Tasks</span>
                <span>Status</span>
                <span>Points</span>
              </span>
            </div>
            <ol>
              {p.standings.map((c) => {
                const [label, tone] = STATUS_TAG[c.status] ?? STATUS_TAG.registered;
                return (
                  <li key={c.teamId} className="lb">
                    <span className={`n ${c.rank <= 3 ? `r${c.rank}` : ""}`}>{c.rank}</span>
                    <Avatar teamId={c.teamId} hasPhoto={c.hasPhoto} size={40} label={c.name} />
                    <div className="nmx">
                      <Link href={`/admin/teams/${c.teamId}`}>
                        <b>{c.name}</b>
                      </Link>
                      <span className="code">{c.teamId}</span>
                    </div>
                    <div className="cols">
                      <span className="hide-m">
                        <Stars n={c.stars} size={12} />
                      </span>
                      <span className="hide-m num mute">{c.completed}</span>
                      <span>
                        <span className={`tag ${tone}`}>{label}</span>
                      </span>
                      <span className="pts">{num(c.points)}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </Panel>
    </>
  );
}
