import type { Team } from "@/lib/types";
import { BribeButton } from "./actions";
import { TeamAvatar } from "./avatar";
import { count } from "./format";
import { Bolt } from "./icons";
import { SharePosterButton } from "./share-poster";
import { Stars } from "./stars";
import { WantedTitle } from "./wanted-title";

/**
 * "Your poster": a proper wanted poster. Aged paper, torn bottom edge, taped
 * corners, a mugshot and the bounty. Wanted crews can share it as an image, and the
 * bribe lives underneath. The home screen's "See poster" button scrolls here.
 */
export function PosterCard({
  team,
  stars,
  bribeCost,
  bounty,
  since,
}: {
  team: Team;
  stars: number;
  bribeCost: number;
  bounty: number;
  since: string;
}) {
  const wanted = team.wanted;
  const crew = team.members.length + 1;
  const shown = count(bounty);
  // Size is picked by how many digits there are, never by screen width.
  const rewardSize = shown.length <= 5 ? 42 : shown.length <= 7 ? 34 : 28;

  return (
    <section id="poster" className="postersec">
      <h2 style={{ margin: "0 0 14px" }}>Your poster</h2>

      <div className="wp-wrap">
        <article className={wanted ? "wp" : "wp clear"} aria-label={`Wanted poster for ${team.name}`}>
          <i className="tape t1" aria-hidden />
          <i className="tape t2" aria-hidden />

          <div className="wp-in">
            <span className="wp-code">No. {team.teamId}</span>
            <WantedTitle />
            <div className="wp-rule" aria-hidden>
              <span />
              <i>★</i>
              <span />
            </div>
            <p className="wp-sub">For crimes against the city</p>

            <div className="wp-mug">
              <TeamAvatar
                teamId={team.teamId}
                name={team.name}
                hasPhoto={Boolean(team.leader.photo)}
                size={150}
                square
              />
            </div>

            <b className="wp-name">{team.name}</b>
            <span className="wp-lead">
              Led by {team.leader.name} · {crew} {crew === 1 ? "member" : "crew"}
            </span>

            <Stars n={stars} size={20} />

            <div className="wp-reward">
              <small>Reward</small>
              <b style={{ fontSize: rewardSize }}>
                <Bolt size={Math.round(rewardSize * 0.8)} color="#8a5a14" />
                {shown}
              </b>
            </div>

            <p className="wp-fine">
              {wanted
                ? `Wanted since ${since || "today"}. Approach with caution.`
                : "No active warrant. Stay off the radar."}
            </p>
          </div>

          {!wanted && <span className="wp-stamp" aria-hidden>Not wanted</span>}
        </article>
      </div>

      {wanted ? (
        <div className="wp-act">
          <SharePosterButton
            teamId={team.teamId}
            name={team.name}
            leaderName={team.leader.name}
            crew={crew}
            stars={stars}
            bounty={bounty}
            since={since}
            hasPhoto={Boolean(team.leader.photo)}
          />
          <p className="note err">
            The Police are after your crew. Pay the bribe and the heat dies down.
          </p>
          <BribeButton cost={bribeCost} />
        </div>
      ) : (
        <p className="note">
          You are not on the wanted list. The top crews get posters after every round, so keep
          your head down.
        </p>
      )}
    </section>
  );
}
