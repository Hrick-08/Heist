"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { getCrewDeskAction, type CrewDesk } from "@/lib/actions/admin-read";
import { markTaskAction, registerTeamAction, unmarkTaskAction } from "@/lib/actions/admin-actions";
import { Avatar } from "./avatar";
import { money, num } from "./format";
import { Bolt, CheckIcon, Coin, CopyIcon, UndoIcon } from "./icons";
import { PhotoField } from "./photo-field";
import { useAdmin } from "./provider";
import { Drawer } from "./ui";

const MEMBER_SLOTS = 4;
const blank = { name: "", email: "", leaderName: "", leaderPhone: "", leaderEmail: "", password: "" };
const blankMembers = () => Array.from({ length: MEMBER_SLOTS }, () => ({ name: "", email: "", phone: "" }));

interface Done {
  name: string;
  teamId: string;
  status: string;
  passcode: string;
}

export function RegisterDrawer({
  open,
  onClose,
  full,
  slots,
}: {
  open: boolean;
  onClose: () => void;
  full: boolean;
  slots: number;
}) {
  const { run, toast } = useAdmin();
  const [f, setF] = useState(blank);
  const [members, setMembers] = useState(blankMembers);
  const [photo, setPhoto] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const [saving, setSaving] = useState(false);

  const named = members.filter((m) => m.name.trim()).length;
  const ok = f.name.trim() && /\S+@\S+/.test(f.email) && f.leaderName.trim() && named >= 3;
  const reset = () => {
    setF(blank);
    setMembers(blankMembers());
    setPhoto("");
    setDone(null);
  };
  const close = () => {
    onClose();
    window.setTimeout(reset, 250);
  };
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const setM = (i: number, k: "name" | "email" | "phone", v: string) =>
    setMembers((l) => l.map((m, j) => (j === i ? { ...m, [k]: v } : m)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok || saving) return;
    setSaving(true);
    try {
      const res = await run(registerTeamAction, {
        name: f.name,
        email: f.email,
        leaderName: f.leaderName,
        leaderPhone: f.leaderPhone,
        leaderEmail: f.leaderEmail,
        leaderPhoto: photo,
        password: f.password,
        memberName: members.map((m) => m.name),
        memberEmail: members.map((m) => m.email),
        memberPhone: members.map((m) => m.phone),
      });
      if (res.ok && res.data) {
        setDone({ name: res.data.name, teamId: res.data.teamId, status: res.data.status, passcode: res.data.passcode });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={close}
      wide
      title={done ? "Crew registered" : "Register a crew"}
      sub={done ? "Hand these over to the crew leader, then switch them into the heist on the Crews page." : "New crews get credentials but only enter the heist when you switch them in."}
    >
      {done ? (
        <div className="stack">
          <div className="ticket">
            <div className="row" style={{ gap: 14 }}>
              <Avatar teamId={done.teamId} hasPhoto={Boolean(photo)} size={56} label={done.name} />
              <div>
                <div className="v">{done.name}</div>
                <span className="k">
                  {done.status === "waitlisted"
                    ? "Waitlisted"
                    : done.status === "registered"
                      ? "Not in heist"
                      : "In play"}
                </span>
              </div>
            </div>
            <div>
              <span className="k">Team ID</span>
              <div className="v">{done.teamId}</div>
            </div>
            <div>
              <span className="k">Passcode</span>
              <div className="v">{done.passcode}</div>
            </div>
          </div>
          <button
            className="btn ghost"
            onClick={() => {
              void navigator.clipboard?.writeText(`TEAM ID: ${done.teamId}\nPasscode: ${done.passcode}`);
              toast("Credentials copied");
            }}
          >
            <CopyIcon size={16} />
            Copy credentials
          </button>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn" style={{ flex: 1 }} onClick={reset}>
              Register another
            </button>
            <button className="btn ghost" onClick={close}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form className="form" onSubmit={submit}>
          {full && <div className="full note">All {slots} slots are filled. You can register the crew, but switch it into the heist once a slot opens.</div>}
          <label className="field">
            <span>Crew name</span>
            <input type="text" placeholder="Crew name" value={f.name} onChange={set("name")} autoFocus />
          </label>
          <label className="field">
            <span>Leader login email</span>
            <input type="text" inputMode="email" placeholder="Leader email" value={f.email} onChange={set("email")} />
          </label>
          <label className="field">
            <span>Leader name</span>
            <input type="text" value={f.leaderName} onChange={set("leaderName")} />
          </label>
          <label className="field">
            <span>Leader phone</span>
            <input type="text" inputMode="tel" value={f.leaderPhone} onChange={set("leaderPhone")} />
          </label>
          <PhotoField value={photo} onChange={setPhoto} />
          <label className="field full">
            <span>Leader email (optional, defaults to login email)</span>
            <input type="text" inputMode="email" value={f.leaderEmail} onChange={set("leaderEmail")} />
          </label>
          <label className="field full">
            <span>Passcode (blank = auto-generate)</span>
            <input type="text" placeholder="auto" value={f.password} onChange={set("password")} />
          </label>
          <div className="full section-t">Crew members (leader + at least 3, up to 4)</div>
          {members.map((m, i) => (
            <div key={i} className="full mrow">
              <input type="text" placeholder={`Member ${i + 1} name`} value={m.name} onChange={(e) => setM(i, "name", e.target.value)} />
              <div className="row" style={{ gap: 8 }}>
                <input type="text" placeholder="email" value={m.email} onChange={(e) => setM(i, "email", e.target.value)} />
                <input type="text" placeholder="phone" value={m.phone} onChange={(e) => setM(i, "phone", e.target.value)} />
              </div>
            </div>
          ))}
          <div className="full row wrap" style={{ gap: 10 }}>
            <button className="btn" type="submit" disabled={!ok || saving}>
              {saving ? "Registering…" : "Register crew"}
            </button>
            <button className="btn ghost" type="button" onClick={close}>
              Cancel
            </button>
            {!ok && (
              <span className="mute small">
                Needs a crew name, a valid login email, the leader&apos;s name and at least 3 members.
              </span>
            )}
          </div>
        </form>
      )}
    </Drawer>
  );
}

export function VerifyDrawer({ teamId, onClose }: { teamId: string | null; onClose: () => void }) {
  const { run, toast } = useAdmin();
  const [desk, setDesk] = useState<CrewDesk | null>(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(
    async (id: string) => {
      const data = await getCrewDeskAction(id);
      if (!data) toast("That crew could not be found.", "err");
      setDesk(data);
    },
    [toast],
  );

  useEffect(() => {
    if (!teamId) {
      setDesk(null);
      return;
    }
    setLoading(true);
    load(teamId).finally(() => setLoading(false));
  }, [teamId, load]);

  const act = async (action: typeof markTaskAction, taskId: string) => {
    if (!desk) return;
    setWorking(taskId);
    try {
      const res = await run(action, { teamId: desk.team.teamId, teamTaskId: taskId });
      if (res.ok) await load(desk.team.teamId);
    } finally {
      setWorking(null);
    }
  };

  const done = desk ? desk.tasks.filter((t) => t.done).length : 0;
  const total = desk?.tasks.length ?? 0;

  return (
    <Drawer
      open={Boolean(teamId)}
      onClose={onClose}
      title={desk ? `Verify ${desk.team.name}` : "Verification desk"}
      sub={desk ? `${desk.team.teamId} · round ${desk.team.round} · ${done}/${total} cleared` : "Loading the crew's board…"}
    >
      {loading && !desk && <div className="skl" style={{ height: 220 }} />}
      {desk && (
        <>
          <div className="row" style={{ gap: 14, marginBottom: 14 }}>
            <Avatar teamId={desk.team.teamId} hasPhoto={desk.team.hasPhoto} size={52} label={desk.team.name} />
            <div className="grow">
              <b>{desk.team.leaderName}</b>
              <div className="mute small">
                {desk.team.email}
                {desk.team.phone ? ` · ${desk.team.phone}` : ""}
              </div>
            </div>
            <div className="r">
              <b className="num" style={{ fontFamily: "var(--display)", fontWeight: 400, fontSize: 22 }}>
                {num(desk.team.points)}
              </b>
              <div className="mute small">pts</div>
            </div>
          </div>
          <div className="bar green">
            <i style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </div>
          <ul style={{ marginTop: 8 }}>
            {desk.tasks.length === 0 && (
              <li className="mute" style={{ padding: "20px 0" }}>
                No tasks allocated yet. Allocate the round from the overview.
              </li>
            )}
            {desk.tasks.map((t) => (
              <li key={t.id} className="vrow">
                <div className="grow">
                  <b>
                    {t.title}{" "}
                    <span className={`tag ${t.type === "technical" ? "blue" : "red"}`} style={{ marginLeft: 6 }}>
                      {t.type}
                    </span>
                    {t.isEndgame && (
                      <span className="tag purple" style={{ marginLeft: 6 }}>
                        endgame
                      </span>
                    )}
                  </b>
                  <div className="mute small">{t.description}</div>
                  <div className="row" style={{ gap: 6, marginTop: 6 }}>
                    <span className="reward pts">
                      <Bolt size={12} />
                      {t.points}
                    </span>
                    <span className="reward cashr">
                      <Coin size={13} />
                      {money(t.money)}
                    </span>
                    <span className="tag">R{t.round}</span>
                  </div>
                </div>
                {t.done ? (
                  <span className="row" style={{ gap: 6 }}>
                    <span className="tag cash">
                      <CheckIcon size={11} /> Verified
                    </span>
                    <button className="icobtn" aria-label={`Revert ${t.title}`} disabled={working === t.id} onClick={() => act(unmarkTaskAction, t.id)}>
                      <UndoIcon size={16} />
                    </button>
                  </span>
                ) : (
                  <button className="btn green sm" disabled={working === t.id} onClick={() => act(markTaskAction, t.id)}>
                    {working === t.id ? "Working…" : "Mark complete"}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 16 }}>
            <Link href={`/admin/teams/${desk.team.teamId}`} className="btn ghost block">
              Open the full crew record
            </Link>
          </div>
        </>
      )}
    </Drawer>
  );
}
