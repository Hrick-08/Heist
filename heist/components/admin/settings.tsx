"use client";

import { useState } from "react";

import { seedAction, syncWantedAction, updateSettingsAction } from "@/lib/actions/admin-actions";
import { money } from "./format";
import { useAdmin } from "./provider";
import { PageHead, Panel, Stat } from "./ui";

export interface SettingsValues {
  maxTeams: number;
  totalRounds: number;
  physicalPerRound: number;
  technicalPerRound: number;
  hintCostMultiplier: number;
  wantedRemovalCost: number;
  endgameCost: number;
  eventLive: boolean;
}

const DEFAULTS: SettingsValues = {
  maxTeams: 40,
  totalRounds: 4,
  physicalPerRound: 3,
  technicalPerRound: 1,
  hintCostMultiplier: 1,
  wantedRemovalCost: 2500,
  endgameCost: 5000,
  eventLive: true,
};

type NumKey = Exclude<keyof SettingsValues, "eventLive">;
const FIELDS: { k: NumKey; label: string; step?: number; min?: number; max?: number; help?: string }[] = [
  { k: "maxTeams", label: "Crew slots", min: 1, help: "Crews past this are waitlisted." },
  { k: "totalRounds", label: "Total rounds", min: 1, max: 8 },
  { k: "physicalPerRound", label: "Physical tasks per round", min: 0, help: "Shared by every crew." },
  { k: "technicalPerRound", label: "Technical tasks per round", min: 0, help: "Dealt one to one crew." },
  { k: "hintCostMultiplier", label: "Clue price multiplier", step: 0.1, min: 0 },
  { k: "wantedRemovalCost", label: "Bribe cost to clear a wanted poster", step: 100, min: 0 },
  { k: "endgameCost", label: "Endgame funding cost", step: 100, min: 0 },
];

export function SettingsView({ saved }: { saved: SettingsValues }) {
  const { run } = useAdmin();
  const [s, setS] = useState<SettingsValues>(saved);
  const [base, setBase] = useState<SettingsValues>(saved);
  const [saving, setSaving] = useState(false);

  // If the saved values change underneath us (another operator, or after saving), reset the baseline.
  const savedKey = JSON.stringify(saved);
  const [seenKey, setSeenKey] = useState(savedKey);
  if (savedKey !== seenKey) {
    setSeenKey(savedKey);
    setBase(saved);
    if (JSON.stringify(s) === JSON.stringify(base)) setS(saved);
  }

  const dirty = JSON.stringify(s) !== JSON.stringify(base);
  const invalid = FIELDS.some((f) => !Number.isFinite(s[f.k]));
  const save = async () => {
    setSaving(true);
    try {
      const res = await run(updateSettingsAction, { ...s });
      if (res.ok) setBase(s);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHead eyebrow="Event configuration" title="Settings">
        Tune the slots, the economy and the task counts.
      </PageHead>

      <div className="stats">
        <Stat label="Crew slots" value={s.maxTeams} tone="red" sub="First come first served" />
        <Stat label="Tasks per round" value={`${s.physicalPerRound} + ${s.technicalPerRound}`} tone="blue" sub="Physical (shared) + technical (unique)" />
        <Stat label="Bribe cost" value={money(s.wantedRemovalCost)} tone="gold" sub="To leave the wanted list" />
        <Stat label="Endgame cost" value={money(s.endgameCost)} tone="purple" sub="To fund the final heist" />
      </div>

      <Panel title="Game rules" sub="Changes apply from the moment you save." accent="blue">
        <div className="form" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          {FIELDS.map((f) => (
            <label key={f.k} className="field">
              <span>{f.label}</span>
              <input
                type="number"
                min={f.min}
                max={f.max}
                step={f.step ?? 1}
                value={Number.isFinite(s[f.k]) ? s[f.k] : ""}
                onChange={(e) => setS({ ...s, [f.k]: e.target.value === "" ? NaN : Number(e.target.value) })}
              />
              {f.help && <small className="mute">{f.help}</small>}
            </label>
          ))}
          <label className="check" style={{ alignSelf: "center" }}>
            <input type="checkbox" checked={s.eventLive} onChange={(e) => setS({ ...s, eventLive: e.target.checked })} />
            Event is live
          </label>
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          <button className="link" style={{ padding: 0 }} onClick={() => setS(DEFAULTS)}>
            Fill in the starting defaults
          </button>
        </div>
      </Panel>

      <div style={{ height: 14 }} />
      <Panel title="Maintenance" sub="Seed the starter pool or re-post the wanted board." accent="gold" flush>
        <div className="setrow">
          <div>
            <b>Seed the task pool</b>
            <div className="mute small">
              Adds the starter tasks and six Dexter missions. Existing records are never overwritten, so it is safe to run more than once.
            </div>
          </div>
          <button className="btn ghost sm" onClick={() => run(seedAction, {})}>
            Seed pool
          </button>
        </div>
        <div className="setrow">
          <div>
            <b>Sync wanted (top 3)</b>
            <div className="mute small">Posts the top three crews on the leaderboard to the wanted board.</div>
          </div>
          <button className="btn ghost sm" onClick={() => run(syncWantedAction, {})}>
            Sync wanted
          </button>
        </div>
      </Panel>

      {dirty && (
        <div className="savebar" role="status">
          <span>{invalid ? "Fill in every number before saving" : "You have unsaved changes"}</span>
          <span className="row" style={{ gap: 8 }}>
            <button className="btn ghost sm" onClick={() => setS(base)} disabled={saving}>
              Discard
            </button>
            <button className="btn sm" style={{ background: "var(--ink)", color: "var(--paper)" }} onClick={save} disabled={saving || invalid}>
              {saving ? "Saving…" : "Save settings"}
            </button>
          </span>
        </div>
      )}
    </>
  );
}
