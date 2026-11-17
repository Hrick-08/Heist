import type { RankedCrew } from "@/lib/types";
import { TeamAvatar } from "./avatar";
import { count, money } from "./format";
import { Bolt, Crown } from "./icons";
import { Stars } from "./stars";

const statusClass = (s: RankedCrew["status"]) =>
  s === "champion" ? "badge gold tiny" : s === "eliminated" ? "badge mutebadge tiny" : "badge cyan tiny";

/** Ranks tab: podium of posters, your position, then everyone else. */
export function RanksView({ crews, meId }: { crews: RankedCrew[]; meId: string }) {
  if (crews.length === 0) {
    return (
      <div className="lbpage">
        <h1>Most wanted</h1>
        <p className="empty">No crews on the board yet.</p>
      </div>
    );
  }

  const me = crews.find((c) => c.teamId === meId);
  const top = crews[0];
  const gap = me ? top.points - me.points : 0;
  const fill = me && top.points > 0 ? Math.round((me.points / top.points) * 100) : 0;
  const podium = [1, 0, 2]
    .map((i) => ({ c: crews[i], rank: i + 1 }))
    .filter((x): x is { c: RankedCrew; rank: number } => Boolean(x.c));
  const rest = crews.slice(3);

  return (
    <div className="lbpage">
      <h1>Most wanted</h1>
      <p className="mute">
        The top 3 crews are Police targets in the next round. Top crews on the leaderboard are on
        the city&apos;s radar.
      </p>

      {me && (
        <div className="card you2">
          <div className="row">
            <TeamAvatar teamId={me.teamId} name={me.name} hasPhoto={me.hasPhoto} size={44} />
            <div className="grow">
              <b>{me.name}</b>
              <div className="mute small">
                {gap ? `${count(gap)} pts behind #1` : "You lead the board"} · {me.teamId}
              </div>
            </div>
            <span className="rankbig">
              #{me.rank}
              <small>of {crews.length}</small>
            </span>
          </div>
          <div className="bar"><i style={{ width: `${fill}%` }} /></div>
        </div>
      )}

      <div className="secdiv" role="separator">
        <span>Global wanted posters</span>
      </div>

      <div className="podium">
        {podium.map(({ c, rank }) => (
          <div key={c.teamId} className={`poster p${rank}${c.teamId === meId ? " me" : ""}`}>
            {rank === 1 && <span className="crown"><Crown size={26} /></span>}
            <span className="rk">{rank}</span>
            <span className="wanted">{c.isWanted ? "Wanted" : "Top crew"}</span>
            <span className="pcode">{c.teamId}</span>
            <div className="mug">
              <TeamAvatar
                teamId={c.teamId}
                name={c.name}
                hasPhoto={c.hasPhoto}
                size={rank === 1 ? 68 : 56}
                square
              />
            </div>
            <b className="pname">{c.name}</b>
            <div className="pmeta">{c.leaderName}</div>
            {c.isWanted && (
              <div className="bounty">
                <Bolt size={rank === 1 ? 24 : 19} color="#8a5a14" />
                {count(c.bounty)}
              </div>
            )}
            {c.isWanted && <Stars n={c.stars} size={rank === 1 ? 16 : 13} />}
            <div className="pts">
              {count(c.points)} pts · {c.membersCount} crew
            </div>
            {c.wantedSince && <div className="pmeta">Since {c.wantedSince}</div>}
          </div>
        ))}
      </div>

      {rest.length > 0 && (
        <>
          <h2>On the streets</h2>
          <p className="mute small" style={{ marginTop: -4 }}>
            Ranked on points only. Cash is deliberately hidden.
          </p>
          <ol>
            {rest.map((c) => (
              <li key={c.teamId} className={c.teamId === meId ? "lb me" : "lb"}>
                <span className="n">{c.rank}</span>
                <TeamAvatar teamId={c.teamId} name={c.name} hasPhoto={c.hasPhoto} size={40} />
                <div>
                  <b>
                    {c.name}
                    {c.teamId === meId ? " (you)" : ""}
                  </b>
                  {c.isWanted && <span className="badge red tiny" style={{ marginLeft: 6 }}>Wanted</span>}
                  <div className="mute small">
                    {count(c.points)} pts · {c.completed} {c.completed === 1 ? "task" : "tasks"} · {c.teamId}
                  </div>
                </div>
                <div className="r">
                  <span className={statusClass(c.status)}>{c.status}</span>
                  {c.isWanted && <Stars n={c.stars} size={12} />}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
