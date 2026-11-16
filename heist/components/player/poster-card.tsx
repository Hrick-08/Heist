import type { Team } from "@/lib/types";
import { BribeButton } from "./actions";
import { TeamAvatar } from "./avatar";
import { Stars } from "./stars";

/** "Your poster": the bribe lives here, the banner's "View poster" jumps to it. */
export function PosterCard({
  team,
  stars,
  bribeCost,
}: {
  team: Team;
  stars: number;
  bribeCost: number;
}) {
  return (
    <section id="poster" className="card poster-card">
      <h2 style={{ margin: "0 0 10px" }}>Your poster</h2>
      <div className="row" style={{ marginBottom: 10 }}>
        <TeamAvatar
          teamId={team.teamId}
          name={team.name}
          hasPhoto={Boolean(team.leader.photo)}
          size={40}
        />
        <div className="grow">
          <b>{team.name}</b>
          <div className="mute small">
            {team.teamId} · <Stars n={stars} size={11} />
          </div>
        </div>
      </div>
      {team.wanted ? (
        <>
          <p className="note err" style={{ marginBottom: 12 }}>
            Your crew is wanted. Pay the bribe and the heat dies down.
          </p>
          <BribeButton cost={bribeCost} />
        </>
      ) : (
        <p className="note">
          You are not on the wanted list. Stay off the radar and the posters stay empty.
        </p>
      )}
    </section>
  );
}
