import Link from "next/link";

import type { DexterMission } from "@/lib/types";
import { SignoffButton } from "./actions";
import { money } from "./format";
import { Bolt, Coin } from "./icons";

const LEVEL = { easy: "Easy", medium: "Medium", hard: "Hard" } as const;

/** Dexter missions aimed at this crew. The alert popup is gone - missions only. */
export function DexterMissions({
  missions,
  requestedIds,
}: {
  missions: DexterMission[];
  requestedIds: Set<string>;
}) {
  return (
    <section>
      <h2 style={{ marginTop: 8 }}>Dexter missions</h2>
      {missions.length === 0 ? (
        <p className="note ok">No active Dexter missions for this round. Stay sharp.</p>
      ) : (
        <ul className="list">
          {missions.map((d) => {
            const id = String(d._id);
            return (
              <li key={id}>
                <div className="mcard dmis open">
                  <Link href={`/missions/${id}`} className="mlink">
                    <div className="chiprow">
                      <span className="badge red">Dexter spotted</span>
                      <span className="badge">Round {d.round}</span>
                      <span className="badge purple">{LEVEL[d.difficulty]}</span>
                    </div>
                    <h3>{d.title}</h3>
                    <p className="mute">{d.description}</p>
                    <div className="rewards">
                      <span className="reward"><Bolt size={20} />+{d.points} pts</span>
                      <span className="reward"><Coin size={20} />+{money(d.money)}</span>
                    </div>
                    <span className="openhint">Open mission →</span>
                  </Link>
                  <div className="mact">
                    <SignoffButton
                      kind="dexter"
                      refId={id}
                      requested={requestedIds.has(id)}
                      label="Dexter mission done? Request sign-off"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
