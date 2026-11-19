"use client";

import { useState } from "react";

import {
  createMissionAction,
  deleteMissionAction,
  toggleMissionAction,
  updateMissionAction,
} from "@/lib/actions/admin-actions";
import type { MissionRow, TeamRow } from "@/lib/types";
import { money, num } from "./format";
import { Bolt, Coin, PlusIcon } from "./icons";
import { useAdmin } from "./provider";
import { UndoButton } from "./undo-button";
import { Drawer, Empty, PageHead, Panel, Stat } from "./ui";

type Diff = "easy" | "medium" | "hard";
const blank = {
  title: "",
  description: "",
  round: 1,
  difficulty: "medium" as Diff,
  points: 200,
  money: 1500,
  scope: "all" as "all" | "selected",
  teamIds: [] as string[],
  active: true,
};
type Form = typeof blank;

function MissionForm({
  initial,
  crews,
  submit,
  onSubmit,
  onCancel,
  saving,
}: {
  initial?: MissionRow;
  crews: TeamRow[];
  submit: string;
  onSubmit: (m: Form) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [m, setM] = useState<Form>(
    initial
      ? {
          title: initial.title,
          description: initial.description,
          round: initial.round,
          difficulty: initial.difficulty,
          points: initial.points,
          money: initial.money,
          scope: initial.scope === "all" ? "all" : "selected",
          teamIds: initial.teamIds,
          active: initial.active,
        }
      : blank,
  );
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setM((s) => ({ ...s, [k]: v }));
  const ok = m.title.trim() && m.description.trim() && (m.scope === "all" || m.teamIds.length > 0);

  return (
    <form
      className="form one"
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onSubmit(m);
      }}
    >
      <label className="field">
        <span>Mission title</span>
        <input type="text" placeholder="Dexter Spotted: …" value={m.title} onChange={(e) => set("title", e.target.value)} autoFocus />
      </label>
      <label className="field">
        <span>Brief</span>
        <textarea placeholder="What is Dexter onto?" value={m.description} onChange={(e) => set("description", e.target.value)} />
      </label>
      <div className="duo">
        <label className="field">
          <span>Round</span>
          <input type="number" min={1} max={4} value={m.round} onChange={(e) => set("round", Number(e.target.value))} />
        </label>
        <label className="field">
          <span>Difficulty</span>
          <select value={m.difficulty} onChange={(e) => set("difficulty", e.target.value as Diff)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label className="field">
          <span>Points</span>
          <input type="number" step={10} value={m.points} onChange={(e) => set("points", Number(e.target.value))} />
        </label>
        <label className="field">
          <span>Cash ($)</span>
          <input type="number" step={50} value={m.money} onChange={(e) => set("money", Number(e.target.value))} />
        </label>
      </div>
      <label className="field">
        <span>Who sees it</span>
        <select value={m.scope} onChange={(e) => set("scope", e.target.value as Form["scope"])}>
          <option value="all">Every crew</option>
          <option value="selected">Pick crews</option>
        </select>
      </label>
      {m.scope === "selected" && (
        <div className="crewpick" role="group" aria-label="Pick crews">
          {crews.length === 0 && <span className="mute small">No crews registered yet.</span>}
          {crews.map((c) => (
            <label key={c.teamId} className="check">
              <input
                type="checkbox"
                checked={m.teamIds.includes(c.teamId)}
                onChange={(e) => set("teamIds", e.target.checked ? [...m.teamIds, c.teamId] : m.teamIds.filter((x) => x !== c.teamId))}
              />
              {c.teamId} — {c.name}
            </label>
          ))}
        </div>
      )}
      <label className="check">
        <input type="checkbox" checked={m.active} onChange={(e) => set("active", e.target.checked)} />
        Live on the dashboard
      </label>
      <div className="row" style={{ gap: 10 }}>
        <button className="btn" type="submit" disabled={!ok || saving}>
          {saving ? "Saving…" : submit}
        </button>
        <button className="btn ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function DexterView({ missions, crews }: { missions: MissionRow[]; crews: TeamRow[] }) {
  const { run, ask } = useAdmin();
  const [drawer, setDrawer] = useState<null | "new" | string>(null);
  const [f, setF] = useState<"all" | "live" | "pulled">("all");
  const [saving, setSaving] = useState(false);
  const editing = drawer && drawer !== "new" ? missions.find((d) => d.id === drawer) : undefined;

  const live = missions.filter((d) => d.active).length;
  const closures = missions.reduce((s, d) => s + d.completions, 0);
  const list = missions
    .filter((d) => f === "all" || (f === "live" ? d.active : !d.active))
    .sort((a, b) => a.round - b.round);
  const aud = (d: MissionRow) =>
    d.scope === "all"
      ? "every crew"
      : d.teamIds.map((id) => crews.find((x) => x.teamId === id)?.name ?? id).join(", ") || "no crews picked";

  const save = async (v: Form) => {
    setSaving(true);
    try {
      const res = editing
        ? await run(updateMissionAction, { id: editing.id, ...v })
        : await run(createMissionAction, { ...v });
      if (res.ok) setDrawer(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHead
        eyebrow="Special targets"
        title="Dexter missions"
        actions={
          <div className="row wrap" style={{ gap: 8 }}>
            <UndoButton />
            <button className="btn" onClick={() => setDrawer("new")}>
              <PlusIcon size={16} />
              Push a mission
            </button>
          </div>
        }
      >
        Dexter missions pop up on the crew dashboard. Close one out at the desk and the crew banks the extra points and cash. Target every crew or pick who sees it.
      </PageHead>

      <div className="stats">
        <Stat label="Missions live" value={live} tone="red" onClick={() => setF("live")} active={f === "live"} />
        <Stat label="Archive" value={missions.length} tone="purple" sub="All missions" onClick={() => setF("all")} active={f === "all"} />
        <Stat label="Closures" value={closures} tone="cash" sub="Closed out at the desk" />
      </div>

      <Panel title="Mission board" sub="Push, edit or pull a mission." accent="purple" flush>
        <div className="toolbar">
          <div className="seg" role="group" aria-label="Show">
            {(
              [
                ["all", "All"],
                ["live", "Live"],
                ["pulled", "Pulled"],
              ] as const
            ).map(([k, l]) => (
              <button key={k} type="button" className={f === k ? "on" : ""} onClick={() => setF(k)}>
                {l}
              </button>
            ))}
          </div>
          <span className="mute small">
            {list.length} mission{list.length === 1 ? "" : "s"}
          </span>
        </div>
        {list.length === 0 ? (
          <Empty title="Nothing here">No missions match this filter.</Empty>
        ) : (
          <ul>
            {list.map((d) => (
              <li key={d.id} className="mrowline">
                <div className="grow">
                  <div className="row wrap" style={{ gap: 8 }}>
                    <b className="mtitle">{d.title}</b>
                    <span className="tag red">Round {d.round}</span>
                    <span className={`tag ${d.difficulty}`}>{d.difficulty}</span>
                    <span className={`tag ${d.active ? "cash" : ""}`}>{d.active ? "Live" : "Pulled"}</span>
                  </div>
                  <p className="mute" style={{ margin: "4px 0 8px" }}>
                    {d.description}
                  </p>
                  <div className="row wrap" style={{ gap: 6 }}>
                    <span className="reward pts">
                      <Bolt size={13} />
                      {num(d.points)} pts
                    </span>
                    <span className="reward cashr">
                      <Coin size={14} />
                      {money(d.money)}
                    </span>
                    <span className="reward">{aud(d)}</span>
                    <span className="reward">
                      {d.completions} completion{d.completions === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <div className="rowacts">
                  <button className="btn ghost sm" onClick={() => setDrawer(d.id)}>
                    Edit
                  </button>
                  <button className="btn ghost sm" onClick={() => run(toggleMissionAction, { id: d.id })}>
                    {d.active ? "Pull" : "Push"}
                  </button>
                  <button
                    className="btn danger sm"
                    onClick={() =>
                      ask({
                        title: `Delete “${d.title}”?`,
                        body: "It leaves the archive for good, including its completion count.",
                        cta: "Delete mission",
                        tone: "red",
                        onYes: async () => void (await run(deleteMissionAction, { id: d.id })),
                      })
                    }
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Drawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        title={editing ? "Edit mission" : "Push a new Dexter mission"}
        sub="Crews see it on their dashboard the moment it is live."
      >
        {drawer !== null && (
          <MissionForm
            key={drawer}
            initial={editing}
            crews={crews}
            saving={saving}
            submit={editing ? "Save changes" : "Push mission"}
            onCancel={() => setDrawer(null)}
            onSubmit={save}
          />
        )}
      </Drawer>
    </>
  );
}
