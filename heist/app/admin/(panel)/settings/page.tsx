import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Panel, PanelHeader, StatCard } from "@/components/ui";
import { seedAction, updateSettingsAction } from "@/lib/actions/admin-actions";
import { getEventState } from "@/lib/game";

export const instant = false;

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  const state = await getEventState();

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Event configuration</p>
        <h1 className="headline mt-2 text-4xl text-white">Settings</h1>
        <p className="mt-2 text-sm text-white/45">
          Tune the slots, the economy and the task counts.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Crew slots"
          value={state.maxTeams}
          hint="First come first served"
          tone="pink"
        />
        <StatCard
          label="Tasks per round"
          value={`${state.physicalPerRound} + ${state.technicalPerRound}`}
          hint="Physical (shared) + technical (unique)"
          tone="cyan"
        />
        <StatCard
          label="Bribe cost"
          value={"$" + state.wantedRemovalCost.toLocaleString("en-IN")}
          hint="To leave the wanted list"
          tone="amber"
        />
        <StatCard
          label="Endgame cost"
          value={"$" + state.endgameCost.toLocaleString("en-IN")}
          hint="To fund the final heist"
          tone="violet"
        />
      </section>

      <Panel>
        <PanelHeader title="Game rules" accent="cyan" />
        <div className="p-5">
          <ActionForm
            action={updateSettingsAction}
            submitLabel="Save settings"
            submitClassName="btn-cyan"
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="field-label" htmlFor="maxTeams">
                  Crew slots
                </label>
                <input
                  id="maxTeams"
                  name="maxTeams"
                  type="number"
                  min={1}
                  className="field"
                  defaultValue={state.maxTeams}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="totalRounds">
                  Total rounds
                </label>
                <input
                  id="totalRounds"
                  name="totalRounds"
                  type="number"
                  min={1}
                  max={8}
                  className="field"
                  defaultValue={state.totalRounds}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="physicalPerRound">
                  Physical tasks per round
                </label>
                <input
                  id="physicalPerRound"
                  name="physicalPerRound"
                  type="number"
                  min={0}
                  className="field"
                  defaultValue={state.physicalPerRound}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="technicalPerRound">
                  Technical tasks per round
                </label>
                <input
                  id="technicalPerRound"
                  name="technicalPerRound"
                  type="number"
                  min={0}
                  className="field"
                  defaultValue={state.technicalPerRound}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="hintCostMultiplier">
                  Clue price multiplier
                </label>
                <input
                  id="hintCostMultiplier"
                  name="hintCostMultiplier"
                  type="number"
                  step="0.1"
                  min={0}
                  className="field"
                  defaultValue={state.hintCostMultiplier}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="wantedRemovalCost">
                  Bribe cost to clear a wanted poster
                </label>
                <input
                  id="wantedRemovalCost"
                  name="wantedRemovalCost"
                  type="number"
                  min={0}
                  className="field"
                  defaultValue={state.wantedRemovalCost}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="endgameCost">
                  Endgame funding cost
                </label>
                <input
                  id="endgameCost"
                  name="endgameCost"
                  type="number"
                  min={0}
                  className="field"
                  defaultValue={state.endgameCost}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    name="eventLive"
                    defaultChecked={state.eventLive}
                    className="h-4 w-4 accent-pink"
                  />
                  Event is live
                </label>
              </div>
            </div>
          </ActionForm>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Maintenance"
          subtitle="Seed the starter task pool and Dexter missions (only fills what is empty)."
          accent="amber"
        />
        <div className="space-y-3 p-5">
          <ActionForm
            action={seedAction}
            submitLabel="Seed task pool"
            submitClassName="btn-ghost"
          />
          <p className="text-[11px] leading-relaxed text-white/35">
            Seeds the task pool and the six starter Dexter missions. Existing
            records are never overwritten, so it is safe to run more than once.
          </p>
        </div>
      </Panel>
    </div>
  );
}
