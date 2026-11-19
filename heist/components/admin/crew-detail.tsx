"use client";

import Link from "next/link";
import { useState } from "react";

import {
  adjustScoreAction,
  completeMissionAction,
  markTaskAction,
  resetPasswordAction,
  revertMissionAction,
  setTeamAdmissionAction,
  setTeamStatusAction,
  setWantedAction,
  unmarkTaskAction,
} from "@/lib/actions/admin-actions";
import { Avatar } from "./avatar";
import { ApprovalList, type ApprovalItem } from "./approvals";
import { money, num, STATUS_TAG } from "./format";
import { Bolt, Coin, CopyIcon, UndoIcon } from "./icons";
import { useAdmin } from "./provider";
import { Empty, Panel, Stat } from "./ui";

export interface CrewDetailProps {
  team: {
    teamId: string;
    name: string;
    status: string;
    wanted: boolean;
    round: number;
    eliminatedInRound: number | null;
    points: number;
    money: number;
    hintsUsed: number;
    endgameUnlocked: boolean;
    loginEmail: string;
    hasPhoto: boolean;
    leader: { name: string; email: string; phone: string };
    members: { name: string; email: string; phone: string }[];
  };
  bribe: number;
  tasks: {
    id: string;
    title: string;
    type: "physical" | "technical";
    round: number;
    isEndgame: boolean;
    points: number;
    money: number;
    done: boolean;
    by: string;
    at: string;
  }[];
  missions: {
    id: string;
    title: string;
    round: number;
    difficulty: string;
    points: number;
    money: number;
    scope: string;
    crews: number;
    done: boolean;
  }[];
  approvals: ApprovalItem[];
}

export function CrewDetail({ team, bribe, tasks, missions, approvals }: CrewDetailProps) {
  const { run, ask, toast } = useAdmin();
  const [pts, setPts] = useState("");
  const [cash, setCash] = useState("");
  const [status, setStatus] = useState(team.status);
  const [pass, setPass] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const [label, tone] = STATUS_TAG[team.status] ?? STATUS_TAG.registered;
  const cleared = tasks.filter((t) => t.done).length;
  const rounds = [...new Set(tasks.map((t) => t.round))].sort((a, b) => a - b);

  const step = async (key: string, fn: () => Promise<unknown>) => {
    setWorking(key);
    try {
      await fn();
    } finally {
      setWorking(null);
    }
  };

  return (
    <>
      <header className="phead">
        <div className="row" style={{ gap: 16, alignItems: "center" }}>
          <Avatar teamId={team.teamId} hasPhoto={team.hasPhoto} size={72} label={team.name} />
          <div>
            <Link href="/admin/teams" className="eyebrow back">
              ← All crews
            </Link>
            <h1>{team.name}</h1>
            <div className="row wrap" style={{ gap: 8 }}>
              <span className="mute num" style={{ fontWeight: 700 }}>
                {team.teamId}
              </span>
              <span className={`tag ${tone}`}>{label}</span>
              {team.wanted && <span className="tag red">Wanted</span>}
              <span className="tag">Round {team.round}</span>
              {team.eliminatedInRound && <span className="mute small">Out in round {team.eliminatedInRound}</span>}
            </div>
          </div>
        </div>
        <div className="pactions">
          <Link href="/leaderboard" className="btn ghost sm">
            Public board
          </Link>
        </div>
      </header>

      <div className="stats">
        <Stat label="Points" value={num(team.points)} tone="blue" />
        <Stat label="Cash" value={money(team.money)} tone="gold" />
        <Stat label="Tasks cleared" value={`${cleared}/${tasks.length}`} tone="cash" />
        <Stat label="Clues bought" value={team.hintsUsed} tone="purple" sub={team.endgameUnlocked ? "Endgame armed" : "Endgame not funded"} />
      </div>

      <div className="grid2 even" style={{ marginBottom: 14 }}>
        <Panel title="Crew record" sub="Who is on the team." accent="red">
          <div className="row" style={{ gap: 14, marginBottom: 16, alignItems: "flex-start" }}>
            <Avatar teamId={team.teamId} hasPhoto={team.hasPhoto} size={64} label={team.leader.name} />
            <div className="grow">
              <span className="eyebrow">Team leader</span>
              <b style={{ fontFamily: "var(--display)", fontWeight: 400, fontSize: 20 }}>{team.leader.name}</b>
              <div className="mute">{team.leader.email}</div>
              {team.leader.phone && <div className="mute small">{team.leader.phone}</div>}
              <div className="mute small" style={{ marginTop: 6 }}>
                Login: {team.loginEmail}
              </div>
            </div>
          </div>
          <div className="section-t" style={{ marginBottom: 8 }}>
            Crew members
          </div>
          <ul className="members">
            {team.members.map((m, i) => (
              <li key={`${m.name}-${i}`} className="mrow">
                <b>{m.name}</b>
                <span className="mute small">
                  {m.email || "no email"}
                  {m.phone ? ` · ${m.phone}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Control" sub="Score, wanted poster, status and passcode." accent="blue">
          <div className="ctl">
            <div>
              <span className="section-t">Adjust score</span>
              <form
                className="duo"
                style={{ marginTop: 8 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!pts && !cash) return;
                  step("score", async () => {
                    const res = await run(adjustScoreAction, { teamId: team.teamId, points: pts || 0, money: cash || 0 });
                    if (res.ok) {
                      setPts("");
                      setCash("");
                    }
                  });
                }}
              >
                <label className="field">
                  <span>Points delta</span>
                  <input type="number" placeholder="+50 or -50" value={pts} onChange={(e) => setPts(e.target.value)} />
                </label>
                <label className="field">
                  <span>Cash delta</span>
                  <input type="number" placeholder="+500 or -500" value={cash} onChange={(e) => setCash(e.target.value)} />
                </label>
                <button className="btn sm" type="submit" disabled={working === "score" || (!pts && !cash)}>
                  {working === "score" ? "Applying…" : "Apply"}
                </button>
              </form>
              <p className="mute small" style={{ marginTop: 6 }}>
                Cash never counts towards the leaderboard.
              </p>
            </div>

            <div>
              <span className="section-t">Wanted poster</span>
              <div className="row wrap" style={{ marginTop: 8, gap: 10 }}>
                {team.wanted ? (
                  <button
                    className="btn ghost sm"
                    onClick={() =>
                      ask({
                        title: `Clear ${team.name}'s wanted poster?`,
                        body: `Takes the crew off the wanted board. The bribe a crew pays is ${money(bribe)}.`,
                        cta: "Clear poster",
                        tone: "gold",
                        onYes: async () => void (await run(setWantedAction, { teamId: team.teamId, wanted: "false" })),
                      })
                    }
                  >
                    Clear wanted
                  </button>
                ) : (
                  <button className="btn sm" onClick={() => run(setWantedAction, { teamId: team.teamId, wanted: "true" })}>
                    Post wanted
                  </button>
                )}
                <span className="mute small">Bribe to clear: {money(bribe)}</span>
              </div>
            </div>

            <div>
              <span className="section-t">Heist entry &amp; status</span>
              <div className="row" style={{ marginTop: 8, gap: 10 }}>
                <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="registered">Not in heist</option>
                  <option value="selected">In heist (selected)</option>
                  <option value="waitlisted">Waitlisted</option>
                  <option value="eliminated">Eliminated</option>
                  <option value="champion">Champion</option>
                </select>
                <button
                  className="btn ghost sm"
                  disabled={status === team.status || working === "status"}
                  onClick={() =>
                    step("status", async () => {
                      // Entry/removal goes through the same switch as the Crews page.
                      const enteringOrLeaving =
                        (status === "selected" || status === "registered") &&
                        status !== team.status;
                      if (enteringOrLeaving) {
                        const res = await run(setTeamAdmissionAction, {
                          teamId: team.teamId,
                          admitted: status === "selected",
                        });
                        if (!res.ok) setStatus(team.status);
                      } else {
                        const res = await run(setTeamStatusAction, { teamId: team.teamId, status });
                        if (!res.ok) setStatus(team.status);
                      }
                    })
                  }
                >
                  Update
                </button>
              </div>
              <p className="mute small" style={{ marginTop: 6 }}>
                Switching a crew in deals the current round's board. Switching it out signs the leader out and keeps their score.
              </p>
            </div>

            <div>
              <span className="section-t">Reset passcode</span>
              <form
                className="row"
                style={{ marginTop: 8, gap: 10 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  ask({
                    title: "Reset this crew's passcode?",
                    body: "The old passcode stops working straight away. Hand the new one to the leader.",
                    cta: "Reset passcode",
                    tone: "gold",
                    onYes: async () => {
                      const res = await run(resetPasswordAction, { teamId: team.teamId, password: pass });
                      if (res.ok && res.data) {
                        setFresh(res.data.passcode);
                        setPass("");
                      }
                    },
                  });
                }}
              >
                <input type="text" placeholder="blank = auto-generate" value={pass} onChange={(e) => setPass(e.target.value)} />
                <button className="btn ghost sm" type="submit">
                  Reset
                </button>
              </form>
              {fresh && (
                <div className="ticket" style={{ marginTop: 12 }}>
                  <div>
                    <span className="k">New passcode for {team.teamId}</span>
                    <div className="v">{fresh}</div>
                  </div>
                  <button
                    className="btn ghost sm"
                    style={{ color: "var(--ink)", borderColor: "#a89a76" }}
                    onClick={() => {
                      void navigator.clipboard?.writeText(`TEAM ID: ${team.teamId}\nPasscode: ${fresh}`);
                      toast("Credentials copied");
                    }}
                  >
                    <CopyIcon size={15} />
                    Copy
                  </button>
                </div>
              )}
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Waiting on the desk"
        sub="Requests this crew has raised. Approving signs them off and pays out."
        accent="gold"
        flush={approvals.length > 0}
        action={
          <Link href="/admin/approvals" className="btn ghost sm">
            Full queue
          </Link>
        }
      >
        {approvals.length === 0 ? (
          <Empty title="Nothing waiting">This crew has no open requests.</Empty>
        ) : (
          <ApprovalList items={approvals} showCrew={false} />
        )}
      </Panel>

      <div style={{ height: 14 }} />
      <Panel title="Verification desk" sub="Crews visit the desk. Mark each task off here." accent="cash" flush={rounds.length > 0}>
        {rounds.length === 0 ? (
          <Empty title="No tasks allocated to this crew">Tasks are allocated when a round opens.</Empty>
        ) : (
          rounds.map((round) => (
            <div key={round} className="hround">
              <span className="cap mute">Round {round}</span>
              <ul>
                {tasks
                  .filter((t) => t.round === round)
                  .map((t) => (
                    <li key={t.id} className="vrow">
                      <div className="grow">
                        <b>{t.title}</b>
                        <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
                          <span className={`tag ${t.type === "technical" ? "blue" : "red"}`}>{t.type}</span>
                          {t.isEndgame && <span className="tag purple">endgame</span>}
                          <span className="reward pts">
                            <Bolt size={12} />
                            {num(t.points)}
                          </span>
                          <span className="reward cashr">
                            <Coin size={13} />
                            {money(t.money)}
                          </span>
                          {t.done && t.by && (
                            <span className="mute small">
                              marked by {t.by}
                              {t.at ? ` · ${t.at}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      {t.done ? (
                        <button
                          className="btn ghost sm"
                          disabled={working === t.id}
                          onClick={() =>
                            ask({
                              title: `Revert “${t.title}”?`,
                              body: "Takes back the points and cash this task paid.",
                              cta: "Revert",
                              tone: "red",
                              onYes: async () => void (await run(unmarkTaskAction, { teamId: team.teamId, teamTaskId: t.id })),
                            })
                          }
                        >
                          <UndoIcon size={14} />
                          Revert
                        </button>
                      ) : (
                        <button
                          className="btn green sm"
                          disabled={working === t.id}
                          onClick={() => step(t.id, () => run(markTaskAction, { teamId: team.teamId, teamTaskId: t.id }))}
                        >
                          {working === t.id ? "Working…" : "Mark complete"}
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          ))
        )}
      </Panel>

      <div style={{ height: 14 }} />
      <Panel title="Dexter missions" sub="Close out a Dexter mission for this crew to pay the bounty." accent="purple" flush={missions.length > 0}>
        {missions.length === 0 ? (
          <Empty title="No Dexter missions yet" />
        ) : (
          <ul className="hround" style={{ paddingTop: 0, paddingBottom: 0 }}>
            {missions.map((m) => (
              <li key={m.id} className="vrow">
                <div className="grow">
                  <b>{m.title}</b>
                  <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
                    <span className="tag red">Round {m.round}</span>
                    <span className={`tag ${m.difficulty}`}>{m.difficulty}</span>
                    <span className="reward pts">
                      <Bolt size={12} />
                      {num(m.points)}
                    </span>
                    <span className="reward cashr">
                      <Coin size={13} />
                      {money(m.money)}
                    </span>
                    <span className="mute small">{m.scope === "all" ? "all crews" : `${m.crews} crew(s)`}</span>
                  </div>
                </div>
                {m.done ? (
                  <div className="row" style={{ gap: 8 }}>
                    <span className="tag cash">Completed</span>
                    <button
                      className="btn ghost sm"
                      disabled={working === m.id}
                      onClick={() =>
                        ask({
                          title: `Revert “${m.title}”?`,
                          body: "Takes back the points and cash this Dexter mission paid, and marks it not done for this crew.",
                          cta: "Revert",
                          tone: "red",
                          onYes: async () => void (await run(revertMissionAction, { missionId: m.id, teamId: team.teamId })),
                        })
                      }
                    >
                      <UndoIcon size={14} />
                      Revert
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn violet sm"
                    disabled={working === m.id}
                    onClick={() => step(m.id, () => run(completeMissionAction, { missionId: m.id, teamId: team.teamId }))}
                  >
                    {working === m.id ? "Working…" : "Mark done"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
