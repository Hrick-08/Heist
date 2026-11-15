import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { EmptyState, Panel, PanelHeader, StatCard } from "@/components/ui";
import {
  adjustScoreAction,
  completeMissionAction,
  markTaskAction,
  resetPasswordAction,
  setTeamStatusAction,
  setWantedAction,
  unmarkTaskAction,
} from "@/lib/actions/admin-actions";
import {
  getEventState,
  getTeam,
  getTeamTasks,
  listMissions,
} from "@/lib/game";

export const instant = false;

export default function AdminTeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <TeamDetail params={params} />
    </Suspense>
  );
}

async function TeamDetail({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const team = await getTeam(teamId);
  if (!team) notFound();

  const [state, tasks, missions] = await Promise.all([
    getEventState(),
    getTeamTasks(team.teamId),
    listMissions(),
  ]);

  const completed = tasks.filter((t) => t.status === "completed").length;
  const rounds = [...new Set(tasks.map((t) => t.round))].sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/teams" className="eyebrow hover:text-cyan">
            ← All crews
          </Link>
          <h1 className="headline mt-2 text-4xl text-white">{team.name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/45">
            <span className="font-mono-display text-white/70">{team.teamId}</span>
            <span className="chip border-cyan/40 bg-cyan/10 text-cyan">
              {team.status}
            </span>
            {team.wanted && <span className="chip-wanted">Wanted</span>}
            <span>Round {team.round}</span>
            {team.eliminatedInRound && (
              <span>Eliminated in round {team.eliminatedInRound}</span>
            )}
          </p>
        </div>
        <Link href={`/leaderboard`} className="btn-ghost btn-sm">
          Public board
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Points" value={team.points.toLocaleString("en-IN")} tone="cyan" />
        <StatCard label="Cash" value={"$" + team.money.toLocaleString("en-IN")} tone="amber" />
        <StatCard
          label="Targets cleared"
          value={`${completed}/${tasks.length}`}
          tone="lime"
        />
        <StatCard
          label="Clues bought"
          value={team.hintsUsed}
          hint={team.endgameUnlocked ? "Endgame armed" : "Endgame not funded"}
          tone="violet"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Crew identity */}
        <Panel>
          <PanelHeader title="Crew record" accent="pink" />
          <div className="space-y-5 p-5">
            <div className="flex flex-wrap items-center gap-5">
              <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/12 bg-white/5">
                {team.leader.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={team.leader.photo}
                    alt={`${team.leader.name} leader photo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-mono-display text-[10px] text-white/25">
                    NO PHOTO
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="eyebrow">Team leader</p>
                <p className="headline mt-1 text-xl text-white">
                  {team.leader.name}
                </p>
                <p className="mt-1 text-sm text-white/50">{team.leader.email}</p>
                {team.leader.phone && (
                  <p className="text-sm text-white/35">{team.leader.phone}</p>
                )}
                <p className="mt-2 font-mono-display text-[11px] text-white/30">
                  Login: {team.email}
                </p>
              </div>
            </div>

            <div>
              <p className="field-label">Crew members</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {team.members.map((member, index) => (
                  <li
                    key={`${member.name}-${index}`}
                    className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm"
                  >
                    <p className="text-white">{member.name}</p>
                    <p className="text-[11px] text-white/35">
                      {member.email || "no email"}
                      {member.phone ? ` · ${member.phone}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>

        {/* Controls */}
        <Panel>
          <PanelHeader title="Control" accent="cyan" />
          <div className="space-y-6 p-5">
            <div>
              <p className="field-label">Adjust score</p>
              <ActionForm
                action={adjustScoreAction}
                submitLabel="Apply"
                submitClassName="btn-cyan btn-sm"
                className="space-y-2"
              >
                <input type="hidden" name="teamId" value={team.teamId} />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="points"
                    type="number"
                    className="field"
                    placeholder="Points delta"
                  />
                  <input
                    name="money"
                    type="number"
                    className="field"
                    placeholder="Cash delta"
                  />
                </div>
              </ActionForm>
              <p className="mt-2 text-[11px] text-white/35">
                Cash never counts towards the leaderboard.
              </p>
            </div>

            <div>
              <p className="field-label">Wanted poster</p>
              <ActionForm
                action={setWantedAction}
                submitLabel={team.wanted ? "Clear wanted" : "Post wanted"}
                submitClassName={team.wanted ? "btn-ghost btn-sm" : "btn-pink btn-sm"}
              >
                <input type="hidden" name="teamId" value={team.teamId} />
                <input
                  type="hidden"
                  name="wanted"
                  value={team.wanted ? "false" : "true"}
                />
              </ActionForm>
              <p className="mt-2 text-[11px] text-white/35">
                Bribe to clear: ${state.wantedRemovalCost.toLocaleString("en-IN")}
              </p>
            </div>

            <div>
              <p className="field-label">Status</p>
              <ActionForm
                action={setTeamStatusAction}
                submitLabel="Update status"
                submitClassName="btn-ghost btn-sm"
                className="space-y-2"
              >
                <input type="hidden" name="teamId" value={team.teamId} />
                <select name="status" className="field" defaultValue={team.status}>
                  <option value="selected">selected</option>
                  <option value="waitlisted">waitlisted</option>
                  <option value="eliminated">eliminated</option>
                  <option value="champion">champion</option>
                </select>
              </ActionForm>
            </div>

            <div>
              <p className="field-label">Reset passcode</p>
              <ActionForm
                action={resetPasswordAction}
                submitLabel="Reset"
                submitClassName="btn-ghost btn-sm"
                className="space-y-2"
              >
                <input type="hidden" name="teamId" value={team.teamId} />
                <input
                  name="password"
                  className="field font-mono-display"
                  placeholder="blank = auto-generate"
                />
              </ActionForm>
            </div>
          </div>
        </Panel>
      </div>

      {/* Targets */}
      <Panel>
        <PanelHeader
          title="Verification desk"
          subtitle="Crews visit the desk — mark each target off here."
          accent="lime"
        />
        {rounds.length === 0 ? (
          <EmptyState
            title="No targets allocated to this crew"
            description="Targets are allocated when a round opens."
          />
        ) : (
          rounds.map((round) => (
            <div key={round} className="border-b border-white/6 last:border-0">
              <p className="eyebrow px-5 pt-5">Round {round}</p>
              <div className="divide-y divide-white/6">
                {tasks
                  .filter((t) => t.round === round)
                  .map((allotment) => {
                    const done = allotment.status === "completed";
                    return (
                      <div
                        key={String(allotment._id)}
                        className="flex flex-wrap items-center gap-3 px-5 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white">
                            {allotment.task?.title ?? "Target"}
                          </p>
                          <p className="mt-0.5 text-[11px] text-white/35">
                            {allotment.type === "physical" ? "Physical" : "Technical"}
                            {allotment.isEndgame ? " · Endgame" : ""} ·{" "}
                            {allotment.points} pts · ${allotment.money}
                            {done && allotment.completedAt && (
                              <>
                                {" "}
                                · marked by {allotment.completedBy} on{" "}
                                {allotment.completedAt.toLocaleString("en-IN")}
                              </>
                            )}
                          </p>
                        </div>
                        {done ? (
                          <ActionForm
                            action={unmarkTaskAction}
                            submitLabel="Revert"
                            submitClassName="btn-ghost btn-sm"
                          >
                            <input
                              type="hidden"
                              name="teamId"
                              value={team.teamId}
                            />
                            <input
                              type="hidden"
                              name="teamTaskId"
                              value={String(allotment._id)}
                            />
                          </ActionForm>
                        ) : (
                          <ActionForm
                            action={markTaskAction}
                            submitLabel="Mark complete"
                            submitClassName="btn-lime btn-sm"
                          >
                            <input
                              type="hidden"
                              name="teamId"
                              value={team.teamId}
                            />
                            <input
                              type="hidden"
                              name="teamTaskId"
                              value={String(allotment._id)}
                            />
                          </ActionForm>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))
        )}
      </Panel>

      {/* Dexter */}
      <Panel>
        <PanelHeader
          title="Dexter missions"
          subtitle="Close out a Dexter mission for this crew to pay the bounty."
          accent="violet"
        />
        {missions.length === 0 ? (
          <EmptyState title="No Dexter missions yet" />
        ) : (
          <div className="divide-y divide-white/6">
            {missions.map((mission) => {
              const done = team.dexterCompleted.includes(String(mission._id));
              return (
                <div
                  key={String(mission._id)}
                  className="flex flex-wrap items-center gap-3 px-5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">
                      {mission.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/35">
                      Round {mission.round} · {mission.difficulty} ·{" "}
                      {mission.points} pts · ${mission.money} ·{" "}
                      {mission.scope === "all"
                        ? "all crews"
                        : `${mission.teamIds.length} crew(s)`}
                    </p>
                  </div>
                  {done ? (
                    <span className="chip-done">Completed</span>
                  ) : (
                    <ActionForm
                      action={completeMissionAction}
                      submitLabel="Mark done"
                      submitClassName="btn-violet btn-sm"
                    >
                      <input
                        type="hidden"
                        name="missionId"
                        value={String(mission._id)}
                      />
                      <input
                        type="hidden"
                        name="teamId"
                        value={team.teamId}
                      />
                    </ActionForm>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
