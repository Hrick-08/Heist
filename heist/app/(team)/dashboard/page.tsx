import { Suspense } from "react";

import { DexterMissions } from "@/components/player/dexter-missions";
import { Funnel } from "@/components/player/funnel";
import { money } from "@/components/player/format";
import { Hero } from "@/components/player/hero";
import { HomeSkeleton } from "@/components/player/skeleton";
import { Bolt } from "@/components/player/icons";
import { PosterCard } from "@/components/player/poster-card";
import { Stars } from "@/components/player/stars";
import { TaskList } from "@/components/player/task-list";
import {
  getEventState,
  getLeaderboard,
  getVisibleMissions,
  listApprovalsForTeam,
} from "@/lib/game";
import { formatTime, getFunnel, getPlayerTasks, wantedStars } from "@/lib/player";
import { requireTeam } from "@/lib/session";

export const instant = false;

export const metadata = { title: "Home" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const { team } = await requireTeam();
  const state = await getEventState();
  const [board, visible, approvals] = await Promise.all([
    getLeaderboard(),
    getVisibleMissions(team.teamId, state.currentRound),
    listApprovalsForTeam(team.teamId),
  ]);
  const tasks = await getPlayerTasks(team, state, approvals);

  const rank = board.findIndex((row) => row.teamId === team.teamId) + 1;
  const survivors = board.filter(
    (row) => row.status === "selected" || row.status === "champion",
  ).length;
  const stars = wantedStars(team.wanted, rank);

  const done = tasks.filter((t) => t.status === "completed").length;
  const roundTasks = tasks.filter(
    (t) => t.round === state.currentRound && !t.isEndgame,
  );
  const roundDone = roundTasks.filter((t) => t.status === "completed").length;
  const roundLeft = roundTasks.length - roundDone;

  const pendingMissions = visible.filter(
    (m) => !team.dexterCompleted.includes(String(m._id)),
  );
  const requestedIds = new Set(approvals.map((a) => String(a.refId)));
  const hasMissions = visible.length > 0;

  const cost = state.endgameCost;
  const vault = team.endgameUnlocked
    ? null
    : { cost, canAfford: team.money >= cost };

  return (
    <div className="home" data-dex={hasMissions ? "1" : "0"}>
      <div className="a-hero">
        <Hero
          team={team}
          totalRounds={state.totalRounds}
          rank={rank}
          done={done}
          total={tasks.length}
        />
      </div>

      <section className={team.wanted ? "heat hot a-heat" : "heat a-heat"}>
        <div className="row sp">
          <Stars n={stars} size={28} />
          {team.wanted && (
            <a href="#poster" className="seeposter">
              See poster ↓
            </a>
          )}
        </div>
        <h2>
          {team.wanted ? "The Police are looking for you" : "You're off the radar"}
        </h2>
        <p>
          {team.wanted
            ? `Pay the ${money(state.wantedRemovalCost)} bribe at your poster to clear your status.`
            : "Stay low. The top 3 crews are targeted after every round."}
        </p>
      </section>

      <div className="stats a-stats">
        <div className="card">
          <span className="mute small">Rank</span>
          <b>#{rank || "-"}</b>
        </div>
        <div className="card">
          <span className="mute small">Bounty</span>
          <b className="c-pts bnt">
            <Bolt size={20} color="#dcab3c" />
            {(team.wanted ? team.points : 0).toLocaleString("en-IN")}
          </b>
        </div>
        <div className="card">
          <span className="mute small">Points</span>
          <b className="c-pts">{team.points.toLocaleString("en-IN")}</b>
          <span className="mute small">Drives the leaderboard and survival</span>
        </div>
        <div className="card">
          <span className="mute small">Cash</span>
          <b className="cash">{money(team.money)}</b>
          <span className="mute small">Clues, bribes and the endgame</span>
        </div>
        <div className="card">
          <span className="mute small">Tasks cleared</span>
          <b className="c-task">
            {done}/{tasks.length}
          </b>
          <span className="mute small">Approved by the desk</span>
        </div>
        <div className="card">
          <span className="mute small">Clues bought</span>
          <b className="c-clue">{team.hintsUsed}</b>
          <span className="mute small">Cash spent on hints</span>
        </div>
      </div>

      <div className="card a-round">
        <div className="row sp">
          <b>Round {state.currentRound} is live</b>
          <span className="mute small">
            {roundDone} of {roundTasks.length} cleared
          </span>
        </div>
        <div className="bar">
          <i
            style={{
              width: `${roundTasks.length ? (roundDone / roundTasks.length) * 100 : 0}%`,
            }}
          />
        </div>
        <span className="mute small">
          {roundLeft} {roundLeft === 1 ? "task" : "tasks"} left this round
        </span>
      </div>

      <div className="a-funnel">
        <Funnel steps={getFunnel(state, survivors)} />
      </div>

      {hasMissions && (
        <div className="a-dmis">
          <DexterMissions missions={pendingMissions} requestedIds={requestedIds} />
        </div>
      )}

      <section className="a-missions">
        <h2 style={{ marginTop: 8 }}>Live tasks · Round {state.currentRound}</h2>
        <p className="mute small">
          Finish a task and request sign-off from the desk, just like Dexter missions.
        </p>
        <TaskList
          tasks={tasks}
          cash={team.money}
          currentRound={state.currentRound}
          vault={vault}
        />
      </section>

      <div className="a-poster">
        <PosterCard
          team={team}
          stars={stars}
          bribeCost={state.wantedRemovalCost}
          bounty={team.wanted ? team.points : 0}
          since={formatTime(team.wantedAt)}
        />
      </div>
    </div>
  );
}
