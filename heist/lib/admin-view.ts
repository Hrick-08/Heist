import "server-only";

import { teamsCol } from "./collections";
import { getEventState, listPendingApprovals } from "./game";
import type { AdminSnap, TeamRow, TeamStatus } from "./types";

/**
 * Crew rows for the admin screens, built in the database so the big leader photo
 * is never loaded (the UI streams it from /api/photo/[teamId] instead).
 */
export async function listTeamRows(): Promise<TeamRow[]> {
  const col = await teamsCol();
  return col
    .aggregate<TeamRow>([
      { $sort: { createdAt: 1 } },
      {
        $project: {
          _id: 0,
          teamId: 1,
          name: 1,
          email: 1,
          leaderName: "$leader.name",
          status: 1,
          points: 1,
          money: 1,
          wanted: 1,
          round: 1,
          membersCount: { $add: [{ $size: { $ifNull: ["$members", []] } }, 1] },
          eliminatedInRound: { $ifNull: ["$eliminatedInRound", null] },
          createdAt: 1,
          finalPoints: { $ifNull: ["$finalPoints", null] },
          hasPhoto: {
            $gt: [{ $strLenCP: { $ifNull: ["$leader.photo", ""] } }, 0],
          },
        },
      },
    ])
    .toArray();
}

/** What the live-update layer diffs between refreshes. Cheap enough to poll. */
export async function getAdminSnapshot(): Promise<AdminSnap> {
  const [state, pending, rows] = await Promise.all([
    getEventState(),
    listPendingApprovals(),
    teamsCol().then((col) =>
      col
        .find({})
        .project<{ teamId: string; name: string; status: TeamStatus; createdAt: Date }>({
          teamId: 1,
          name: 1,
          status: 1,
          createdAt: 1,
        })
        .sort({ createdAt: 1 })
        .toArray(),
    ),
  ]);

  const latest = rows.length ? rows[rows.length - 1] : null;
  return {
    pending: pending.map((a) => ({
      id: a.id,
      teamId: a.teamId,
      crew: a.crewName,
      title: a.title,
      kind: a.kind,
      at: a.requestedAt.getTime(),
    })),
    crews: rows.length,
    waitlisted: rows.filter((r) => r.status === "waitlisted").length,
    latest: latest
      ? { teamId: latest.teamId, name: latest.name, status: latest.status }
      : null,
    round: state.currentRound,
    totalRounds: state.totalRounds,
    ended: state.eventEnded,
  };
}
