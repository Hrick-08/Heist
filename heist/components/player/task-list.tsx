"use client";

import Link from "next/link";
import { useState } from "react";

import type { PlayerTask, TaskType } from "@/lib/types";
import { ClueButton, FundHeistButton, SignoffButton } from "./actions";
import { money } from "./format";
import { Bolt, Coin, Pin } from "./icons";

/** Backend only knows two kinds of task, so those are the filter chips. */
const KIND: Record<TaskType, { label: string; color: string }> = {
  physical: { label: "Physical", color: "#c8503e" },
  technical: { label: "Technical", color: "#6c93cf" },
};

export interface EndgameVault {
  cost: number;
  canAfford: boolean;
}

export function TaskList({
  tasks,
  cash,
  currentRound,
  vault,
}: {
  tasks: PlayerTask[];
  cash: number;
  currentRound: number;
  /** Set while the endgame is still sealed. */
  vault: EndgameVault | null;
}) {
  const [f, setF] = useState<TaskType | "all">("all");
  // The endgame is pinned above the filters, so it never scrolls away or gets filtered out.
  const endgame = tasks.find((t) => t.isEndgame) ?? null;
  const regular = tasks.filter((t) => !t.isEndgame);
  const list = regular.filter((t) => f === "all" || t.type === f);
  const kinds = (Object.keys(KIND) as TaskType[]).filter((k) =>
    regular.some((t) => t.type === k),
  );

  return (
    <>
      {(vault || endgame) && (
        <div className="pinned" aria-label="Pinned endgame task">
          <span className="pintag">
            <Pin /> Pinned · Endgame
          </span>
          {vault ? (
            <div className="mcard sealed" style={{ ["--c" as string]: "#a58bc9" }}>
              <div className="mlink">
                <div className="chiprow">
                  <span className="tag">Endgame</span>
                  <span className="badge purple tiny">Sealed</span>
                </div>
                <h3>The Big Heist</h3>
                <p className="mute">
                  One vault. One shot. Funding the endgame costs real cash, and cash is the
                  only currency the final door accepts. Points decide who walks away with the
                  prize, but cash decides who gets to try.
                </p>
              </div>
              <div className="mact">
                <p className="mute small">
                  One payment opens the vault and assigns your final task.
                </p>
                <FundHeistButton cost={vault.cost} canAfford={vault.canAfford} />
              </div>
            </div>
          ) : endgame ? (
            <TaskCard task={endgame} cash={cash} currentRound={currentRound} pinned />
          ) : null}
        </div>
      )}

      <div className="fchips" aria-label="Filter tasks">
        <button className={f === "all" ? "fchip on" : "fchip"} onClick={() => setF("all")}>
          All tasks
        </button>
        {kinds.map((k) => (
          <button key={k} className={f === k ? "fchip on" : "fchip"} onClick={() => setF(k)}>
            {KIND[k].label}
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <p className="empty">
          No tasks here yet. Tasks are allocated when a round opens - the control room will post them.
        </p>
      )}

      <ul className="list">
        {list.map((t) => (
          <li key={t.id}>
            <TaskCard task={t} cash={cash} currentRound={currentRound} />
          </li>
        ))}
      </ul>
    </>
  );
}

function TaskCard({
  task: t,
  cash,
  currentRound,
  pinned = false,
}: {
  task: PlayerTask;
  cash: number;
  currentRound: number;
  pinned?: boolean;
}) {
  const done = t.status === "completed";
  const kind = KIND[t.type];
  const color = t.isEndgame ? "#a58bc9" : kind.color;
  return (
    <div className={`mcard ${done ? "done" : "open"}${pinned ? " endgame" : ""}`} style={{ ["--c" as string]: color }}>
      <Link href={`/tasks/${t.id}`} className="mlink">
        <div className="row sp">
          <div className="chiprow">
            <span className="tag">{t.isEndgame ? "Endgame" : kind.label}</span>
            <span className="badge tiny">
              {done ? "Cleared" : t.round === currentRound ? "Live task" : "Open"}
            </span>
            <span className="badge tiny">Round {t.round}</span>
          </div>
          {t.minutes ? <span className="mute small">{t.minutes} min</span> : null}
        </div>
        <h3>{t.title}</h3>
        <p className="mute">{t.description}</p>
        <div className="row sp mfoot">
          <span className="mute small">{t.station}</span>
          <div className="rewards" style={{ margin: 0 }}>
            <span className={done ? "reward ok" : "reward"}>
              <Bolt size={13} />
              {done ? `Done, +${t.points} pts` : `+${t.points} pts`}
            </span>
            <span className={done ? "reward ok" : "reward"}>
              <Coin size={13} />+{money(t.money)}
            </span>
          </div>
        </div>
      </Link>

      {done ? (
        <p className="mute small" style={{ marginTop: 10 }}>
          Verified at the desk by {t.completedBy ?? "control"}
          {t.completedLabel ? ` · ${t.completedLabel}` : ""}
        </p>
      ) : (
        <div className="mact">
          <p className="mute small">Finished the task? Send it to the desk for approval.</p>
          {t.hintPurchased ? (
            <div className="cluebox">
              <span className="p-eyebrow">Clue</span>
              <p>{t.hint}</p>
            </div>
          ) : (
            <ClueButton teamTaskId={t.id} cost={t.clueCost} canAfford={cash >= t.clueCost} />
          )}
          <SignoffButton
            kind="target"
            refId={t.id}
            requested={t.requested}
            label="Task completed? Request sign-off"
          />
        </div>
      )}
    </div>
  );
}
