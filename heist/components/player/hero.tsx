import type { Team } from "@/lib/types";
import { TeamAvatar } from "./avatar";
import { Caret } from "./icons";

/**
 * Team hero. The top is an aged-paper band (same paper as the wanted poster) with the
 * team name; the dark body below holds the leader, crew and status badges.
 */
export function Hero({
  team,
  totalRounds,
  rank,
  done,
  total,
}: {
  team: Team;
  totalRounds: number;
  rank: number;
  done: number;
  total: number;
}) {
  const members = team.members.map((m) => m.name).filter(Boolean);
  return (
    <section className="card hero">
      <div className="herohead paperband">
        <TeamAvatar
          teamId={team.teamId}
          name={team.name}
          hasPhoto={Boolean(team.leader.photo)}
          size={72}
          square
        />
        <div className="grow">
          <span className="p-eyebrow">
            {team.teamId} · Round {team.round} of {totalRounds}
          </span>
          <h1>{team.name}</h1>
        </div>
      </div>

      <div className="herobody">
        <p className="mute">
          Leader <b className="lead">{team.leader.name}</b> · {team.members.length + 1} crew
          members · {done} of {total} tasks cleared.
        </p>

        <details className="crew">
          <summary>
            <span className="stack" aria-hidden>
              {[team.leader.name, ...members].slice(0, 5).map((n, i) => (
                <i key={`${n}-${i}`} className={i === 0 ? "lead" : ""}>{n.trim().charAt(0).toUpperCase()}</i>
              ))}
            </span>
            <span className="crewlbl">View crew</span>
            <Caret />
          </summary>
          <ul className="crewlist">
            <li className="lead">{team.leader.name} <small>Leader</small></li>
            {members.map((n, i) => (
              <li key={`${n}-${i}`}>{n}</li>
            ))}
          </ul>
        </details>

        <div className="badges">
          {team.status === "champion" && <span className="badge gold">Champion</span>}
          {team.wanted ? (
            <span className="badge red">Wanted</span>
          ) : (
            <span className="badge cyan">Clean</span>
          )}
          <span className="badge gold">Rank #{rank || "-"}</span>
          {team.endgameUnlocked && <span className="badge purple">Endgame armed</span>}
        </div>
      </div>
    </section>
  );
}
