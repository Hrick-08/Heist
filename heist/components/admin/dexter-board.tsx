"use client";

import { useState } from "react";

import { ActionForm } from "@/components/admin/action-form";
import {
  createMissionAction,
  deleteMissionAction,
  toggleMissionAction,
  updateMissionAction,
} from "@/lib/actions/admin-actions";
import type { MissionRow, TeamRow } from "@/lib/types";

function MissionFields({
  mission,
  crews,
}: {
  mission?: Partial<MissionRow>;
  crews: TeamRow[];
}) {
  return (
    <>
      <input
        name="title"
        className="field"
        placeholder="Dexter Spotted: …"
        defaultValue={mission?.title ?? ""}
        required
      />
      <textarea
        name="description"
        className="field min-h-[80px]"
        placeholder="What is Dexter onto?"
        defaultValue={mission?.description ?? ""}
      />
      <div className="grid gap-2 sm:grid-cols-4">
        <input
          name="round"
          type="number"
          min={1}
          max={4}
          className="field"
          placeholder="Round"
          defaultValue={mission?.round ?? 1}
        />
        <select
          name="difficulty"
          className="field"
          defaultValue={mission?.difficulty ?? "medium"}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <input
          name="points"
          type="number"
          className="field"
          placeholder="Points"
          defaultValue={mission?.points ?? 200}
        />
        <input
          name="money"
          type="number"
          className="field"
          placeholder="Cash"
          defaultValue={mission?.money ?? 1500}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          name="scope"
          className="field"
          defaultValue={mission?.scope ?? "all"}
        >
          <option value="all">Every crew</option>
          <option value="selected">Selected crews</option>
        </select>
        <select
          name="teamIds"
          multiple
          className="field min-h-[96px]"
          defaultValue={mission?.teamIds ?? []}
        >
          {crews.map((crew) => (
            <option key={crew.teamId} value={crew.teamId}>
              {crew.teamId} — {crew.name}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-xs text-white/60">
        <input
          type="checkbox"
          name="active"
          defaultChecked={mission?.active ?? true}
          className="h-4 w-4 accent-pink"
        />
        Live on the dashboard
      </label>
    </>
  );
}

export function DexterBoard({
  missions,
  crews,
}: {
  missions: MissionRow[];
  crews: TeamRow[];
}) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="divide-y divide-white/6">
        {missions.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-white/35">
            No Dexter missions yet. Push one below.
          </p>
        )}

        {missions.map((mission) => (
          <div key={mission.id} className="px-5 py-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                  {mission.title}
                  <span className="chip border-pink/50 bg-pink/15 text-pink">
                    Round {mission.round}
                  </span>
                  <span className="chip border-violet/40 bg-violet/10 text-violet">
                    {mission.difficulty}
                  </span>
                  <span
                    className={
                      mission.active
                        ? "chip border-lime/40 bg-lime/10 text-lime"
                        : "chip-eliminated"
                    }
                  >
                    {mission.active ? "Live" : "Pulled"}
                  </span>
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-white/45">
                  {mission.description}
                </p>
                <p className="mt-1.5 text-[11px] text-white/35">
                  {mission.points} pts · ${mission.money.toLocaleString("en-IN")} ·{" "}
                  {mission.scope === "all"
                    ? "every crew"
                    : `${mission.teamIds.length} crew(s) targeted`}{" "}
                  · {mission.completions} completion(s)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() =>
                    setEditing(editing === mission.id ? null : mission.id)
                  }
                >
                  {editing === mission.id ? "Close" : "Edit"}
                </button>
                <ActionForm
                  action={toggleMissionAction}
                  submitLabel={mission.active ? "Pull" : "Push"}
                  submitClassName="btn-ghost btn-sm"
                >
                  <input type="hidden" name="id" value={mission.id} />
                </ActionForm>
                <ActionForm
                  action={deleteMissionAction}
                  submitLabel="Delete"
                  submitClassName="btn-danger btn-sm"
                  confirm={`Delete "${mission.title}"?`}
                >
                  <input type="hidden" name="id" value={mission.id} />
                </ActionForm>
              </div>
            </div>

            {editing === mission.id && (
              <div className="mt-3 rounded-xl border border-white/10 bg-ink/60 p-4">
                <ActionForm
                  action={updateMissionAction}
                  submitLabel="Save mission"
                  submitClassName="btn-pink btn-sm"
                  className="space-y-2"
                >
                  <input type="hidden" name="id" value={mission.id} />
                  <MissionFields mission={mission} crews={crews} />
                </ActionForm>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-white/8 p-5">
        <p className="field-label">Push a new Dexter mission</p>
        <ActionForm
          action={createMissionAction}
          submitLabel="Push mission"
          submitClassName="btn-pink btn-sm"
          className="space-y-2"
        >
          <MissionFields crews={crews} />
        </ActionForm>
      </div>
    </div>
  );
}
