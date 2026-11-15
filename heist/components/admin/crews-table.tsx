"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { setWantedAction } from "@/lib/actions/admin-actions";
import type { TeamRow } from "@/lib/types";

const STATUS_STYLE: Record<string, string> = {
  selected: "chip border-cyan/40 bg-cyan/10 text-cyan",
  champion: "chip-done",
  eliminated: "chip-eliminated",
  waitlisted: "chip border-amber/40 bg-amber/10 text-amber",
  registered: "chip border-white/12 bg-white/5 text-white/45",
};

export function CrewsTable({ crews }: { crews: TeamRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return crews.filter(
      (c) =>
        (status === "all" || c.status === status) &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          c.teamId.toLowerCase().includes(q) ||
          c.leaderName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)),
    );
  }, [crews, query, status]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-white/8 px-5 py-4">
        <input
          className="field max-w-sm"
          placeholder="Search crew, TEAM ID, leader or email…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="field max-w-[170px]"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">All crews</option>
          <option value="selected">In play</option>
          <option value="waitlisted">Waitlisted</option>
          <option value="eliminated">Eliminated</option>
          <option value="champion">Champion</option>
        </select>
        <span className="text-xs text-white/40">
          {filtered.length} of {crews.length} shown
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-white/35">
          No crews match that search.
        </p>
      ) : (
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/8 text-[10px] uppercase tracking-[0.2em] text-white/35">
                <th className="px-5 py-3 font-semibold">Team</th>
                <th className="px-3 py-3 font-semibold">Leader</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Round</th>
                <th className="px-3 py-3 text-right font-semibold">Points</th>
                <th className="px-3 py-3 text-right font-semibold">Cash</th>
                <th className="px-3 py-3 font-semibold">Wanted</th>
                <th className="px-5 py-3 text-right font-semibold">Desk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((crew) => (
                <tr
                  key={crew.teamId}
                  className="border-b border-white/5 text-sm transition hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/teams/${crew.teamId}`}
                      className="font-semibold text-white hover:text-cyan"
                    >
                      {crew.name}
                    </Link>
                    <p className="font-mono-display text-[10px] text-white/35">
                      {crew.teamId} · {crew.membersCount} crew
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-white/75">{crew.leaderName}</p>
                    <p className="text-[11px] text-white/35">{crew.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={STATUS_STYLE[crew.status] ?? STATUS_STYLE.registered}>
                      {crew.status}
                    </span>
                    {crew.eliminatedInRound && (
                      <p className="mt-1 text-[10px] text-white/30">
                        out in R{crew.eliminatedInRound}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono-display text-white/60">
                    {crew.round}
                  </td>
                  <td className="px-3 py-3 text-right font-mono-display text-white">
                    {crew.points.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-3 text-right font-mono-display text-amber">
                    ${crew.money.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-3">
                    <ActionForm
                      action={setWantedAction}
                      submitLabel={crew.wanted ? "Clear" : "Post"}
                      submitClassName={
                        crew.wanted
                          ? "btn-ghost btn-sm"
                          : "btn-pink btn-sm"
                      }
                    >
                      <input type="hidden" name="teamId" value={crew.teamId} />
                      <input
                        type="hidden"
                        name="wanted"
                        value={crew.wanted ? "false" : "true"}
                      />
                    </ActionForm>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/teams/${crew.teamId}`}
                      className="btn-cyan btn-sm"
                    >
                      Verify
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
