"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  createTaskAction,
  deleteTaskAction,
  toggleTaskAction,
  updateTaskAction,
} from "@/lib/actions/admin-actions";
import type { TaskRow } from "@/lib/types";
import { money, num } from "./format";
import { EditIcon, PlusIcon, SearchIcon, TrashIcon } from "./icons";
import { useAdmin } from "./provider";
import { Chip, Drawer, Empty, PageHead, Panel, Stat, Toggle } from "./ui";

const PAGE = 12;
const COLS = "26px minmax(220px,1fr) 100px 56px 78px 88px 80px 60px 84px";

const blank = {
  title: "",
  type: "technical" as "technical" | "physical",
  description: "",
  round: 1,
  points: 150,
  money: 800,
  hintCost: 350,
  hint: "",
  active: true,
  isEndgame: false,
};
type Form = typeof blank;

function TaskForm({
  initial,
  submit,
  onSubmit,
  onCancel,
  saving,
}: {
  initial?: TaskRow;
  submit: string;
  onSubmit: (v: Form) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [t, setT] = useState<Form>(
    initial
      ? {
          title: initial.title,
          type: initial.type,
          description: initial.description,
          round: initial.round,
          points: initial.points,
          money: initial.money,
          hintCost: initial.hintCost,
          hint: initial.hint,
          active: initial.active,
          isEndgame: initial.isEndgame,
        }
      : blank,
  );
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setT((s) => ({ ...s, [k]: v }));
  const numField = (k: "round" | "points" | "money" | "hintCost") => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(k, Number(e.target.value) as never);
  const ok = t.title.trim().length > 0;

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onSubmit(t);
      }}
    >
      <label className="field">
        <span>Task title</span>
        <input type="text" placeholder="Task title" value={t.title} onChange={(e) => set("title", e.target.value)} autoFocus />
      </label>
      <label className="field">
        <span>Type</span>
        <select value={t.type} onChange={(e) => set("type", e.target.value as Form["type"])}>
          <option value="technical">Technical</option>
          <option value="physical">Physical</option>
        </select>
      </label>
      <label className="field full">
        <span>Description</span>
        <textarea placeholder="What has to be done?" value={t.description} onChange={(e) => set("description", e.target.value)} />
      </label>
      <div className="full quad">
        <label className="field">
          <span>Round</span>
          <input type="number" min={1} max={4} value={t.round} onChange={numField("round")} />
        </label>
        <label className="field">
          <span>Points</span>
          <input type="number" step={10} value={t.points} onChange={numField("points")} />
        </label>
        <label className="field">
          <span>Cash reward ($)</span>
          <input type="number" step={50} value={t.money} onChange={numField("money")} />
        </label>
        <label className="field">
          <span>Clue price ($)</span>
          <input type="number" step={50} value={t.hintCost} onChange={numField("hintCost")} />
        </label>
      </div>
      <label className="field full">
        <span>Clue</span>
        <textarea placeholder="Clue revealed when the crew pays" value={t.hint} onChange={(e) => set("hint", e.target.value)} />
      </label>
      <div className="full row wrap" style={{ gap: 22 }}>
        <label className="check">
          <input type="checkbox" checked={t.active} onChange={(e) => set("active", e.target.checked)} />
          Active in pool
        </label>
        <label className="check">
          <input type="checkbox" checked={t.isEndgame} onChange={(e) => set("isEndgame", e.target.checked)} />
          Endgame task
        </label>
      </div>
      <div className="full row" style={{ gap: 10 }}>
        <button className="btn" type="submit" disabled={!ok || saving}>
          {saving ? "Saving…" : submit}
        </button>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function TaskPoolView({ tasks }: { tasks: TaskRow[] }) {
  const { run, ask, toast } = useAdmin();
  const router = useRouter();
  const [round, setRound] = useState("all");
  const [kind, setKind] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<null | "new" | string>(null);
  const [saving, setSaving] = useState(false);
  const editing = drawer && drawer !== "new" ? tasks.find((t) => t.id === drawer) : undefined;

  const inRound = (t: TaskRow, r: string) =>
    r === "all" || (r === "endgame" ? t.isEndgame : !t.isEndgame && String(t.round) === r);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tasks
      .filter(
        (t) =>
          inRound(t, round) &&
          (kind === "all" || t.type === kind) &&
          (!needle || (t.title + " " + t.description).toLowerCase().includes(needle)),
      )
      .sort((a, b) => Number(a.isEndgame) - Number(b.isEndgame) || a.round - b.round);
  }, [tasks, round, kind, q]);

  useEffect(() => {
    setPage(0);
    setSel(new Set());
  }, [round, kind, q]);

  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const safePage = Math.min(page, pages - 1);
  const rows = shown.slice(safePage * PAGE, safePage * PAGE + PAGE);
  const n = (r: string) => tasks.filter((t) => inRound(t, r)).length;
  const roundStat = (r: number) => {
    const l = tasks.filter((t) => !t.isEndgame && t.round === r);
    return `${l.filter((t) => t.type === "physical").length} physical · ${l.filter((t) => t.type === "technical").length} technical`;
  };

  const allOn = rows.length > 0 && rows.every((t) => sel.has(t.id));
  const toggleSel = (id: string) =>
    setSel((s) => {
      const x = new Set(s);
      if (x.has(id)) x.delete(id);
      else x.add(id);
      return x;
    });
  const ids = [...sel];

  const bulk = async (label: string, fn: (t: TaskRow) => Promise<boolean>) => {
    const chosen = tasks.filter((t) => sel.has(t.id));
    let ok = 0;
    for (const t of chosen) if (await fn(t)) ok += 1;
    router.refresh();
    setSel(new Set());
    toast(`${label}: ${ok} of ${chosen.length} task${chosen.length === 1 ? "" : "s"}.`, ok === chosen.length ? "ok" : "err");
  };
  const setActive = (active: boolean) =>
    bulk(active ? "Enabled" : "Disabled", async (t) =>
      t.active === active ? true : (await run(toggleTaskAction, { id: t.id }, { quiet: true, refresh: false })).ok,
    );
  const del = (list: TaskRow[]) =>
    ask({
      title: list.length === 1 ? `Delete “${list[0].title}”?` : `Delete ${list.length} tasks?`,
      body: "They leave the pool for good and any crew allotments for them are removed too.",
      cta: "Delete",
      tone: "red",
      onYes: async () => {
        let ok = 0;
        for (const t of list) if ((await run(deleteTaskAction, { id: t.id }, { quiet: true, refresh: false })).ok) ok += 1;
        router.refresh();
        setSel(new Set());
        toast(`${ok} task${ok === 1 ? "" : "s"} deleted.`, ok === list.length ? "ok" : "err");
      },
    });

  const save = async (v: Form) => {
    setSaving(true);
    try {
      const res = editing
        ? await run(updateTaskAction, { id: editing.id, ...v })
        : await run(createTaskAction, { ...v });
      if (res.ok) setDrawer(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHead
        eyebrow="Task library"
        title="Task pool"
        actions={
          <button className="btn" onClick={() => setDrawer("new")}>
            <PlusIcon size={16} />
            Add a task
          </button>
        }
      >
        Physical tasks are handed to every crew in a round. Technical tasks are dealt one to one crew, so a task is never given to two teams at once.
      </PageHead>

      <div className="stats">
        {[1, 2, 3, 4].map((r) => (
          <Stat
            key={r}
            label={`Round ${r} tasks`}
            value={n(String(r))}
            tone={["red", "blue", "cash", "purple"][r - 1]}
            sub={roundStat(r)}
            onClick={() => setRound(String(r))}
            active={round === String(r)}
          />
        ))}
        <Stat label="Endgame tasks" value={n("endgame")} tone="gold" sub="Final night only" onClick={() => setRound("endgame")} active={round === "endgame"} />
      </div>

      <Panel title="Pool" sub="Edit, disable or delete any task." flush>
        <div className="toolbar">
          <label className="search">
            <SearchIcon size={18} />
            <input type="text" aria-label="Search tasks" placeholder="Search tasks…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <div className="seg" role="group" aria-label="Type">
            {[
              ["all", "All types"],
              ["physical", "Physical"],
              ["technical", "Technical"],
            ].map(([k, l]) => (
              <button key={k} type="button" className={kind === k ? "on" : ""} onClick={() => setKind(k)}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="toolbar" style={{ paddingTop: 10 }}>
          <div className="chips">
            <Chip on={round === "all"} onClick={() => setRound("all")} count={tasks.length}>
              All rounds
            </Chip>
            {[1, 2, 3, 4].map((r) => (
              <Chip key={r} on={round === String(r)} onClick={() => setRound(String(r))} count={n(String(r))}>
                Round {r}
              </Chip>
            ))}
            <Chip on={round === "endgame"} onClick={() => setRound("endgame")} count={n("endgame")}>
              Endgame
            </Chip>
          </div>
        </div>

        {sel.size > 0 && (
          <div className="bulk" role="status">
            <b>{sel.size} selected</b>
            <button className="btn ghost sm" onClick={() => setActive(true)}>
              Enable
            </button>
            <button className="btn ghost sm" onClick={() => setActive(false)}>
              Disable
            </button>
            <button className="btn danger sm" onClick={() => del(tasks.filter((t) => sel.has(t.id)))}>
              Delete
            </button>
            <button className="link" style={{ padding: 0 }} onClick={() => setSel(new Set())}>
              Clear
            </button>
          </div>
        )}

        {rows.length === 0 ? (
          <Empty title="No tasks match">Change the filters or add a task.</Empty>
        ) : (
          <div className="tbl" style={{ ["--cols" as string]: COLS, ["--stick" as string]: "64px" }}>
            <div className="tr th">
              <label className="check">
                <input
                  type="checkbox"
                  aria-label="Select this page"
                  checked={allOn}
                  onChange={() => setSel(allOn ? new Set() : new Set(rows.map((t) => t.id)))}
                />
              </label>
              <span>Task</span>
              <span>Type</span>
              <span>Round</span>
              <span className="r">Points</span>
              <span className="r">Cash</span>
              <span className="r">Clue</span>
              <span>Active</span>
              <span className="r">Actions</span>
            </div>
            {rows.map((t) => (
              <div key={t.id} className={`tr body${t.active ? "" : " off"}${sel.has(t.id) ? " sel" : ""}`}>
                <label className="check">
                  <input type="checkbox" aria-label={`Select ${t.title}`} checked={sel.has(t.id)} onChange={() => toggleSel(t.id)} />
                </label>
                <div className="t-main">
                  <b>{t.title}</b>
                  <span>{t.description}</span>
                </div>
                <span className="hide-m">
                  <span className={`tag ${t.type === "technical" ? "blue" : "red"}`}>{t.type}</span>
                </span>
                <span className="hide-m">
                  <span className="rb">{t.isEndgame ? "END" : `R${t.round}`}</span>
                </span>
                <span className="r num ptsv hide-m">{num(t.points)}</span>
                <span className="r num cashv hide-m">{money(t.money)}</span>
                <span className="r num mute hide-m">{money(t.hintCost)}</span>
                <span className="hide-m">
                  <Toggle on={t.active} label={`${t.title} active`} onChange={() => run(toggleTaskAction, { id: t.id })} />
                </span>
                <div className="rowacts">
                  <button className="icobtn" aria-label={`Edit ${t.title}`} onClick={() => setDrawer(t.id)}>
                    <EditIcon size={16} />
                  </button>
                  <button className="icobtn del" aria-label={`Delete ${t.title}`} onClick={() => del([t])}>
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pager">
          <span className="mute small">
            {shown.length === 0
              ? "0 tasks"
              : `Showing ${safePage * PAGE + 1}–${Math.min(shown.length, safePage * PAGE + PAGE)} of ${shown.length} task(s)`}{" "}
            · shared physical, one-crew technical
          </span>
          <span className="row" style={{ gap: 8 }}>
            <button className="btn ghost sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
              Prev
            </button>
            <span className="mute small num">
              {safePage + 1} / {pages}
            </span>
            <button className="btn ghost sm" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>
              Next
            </button>
          </span>
        </div>
      </Panel>

      <Drawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        wide
        title={editing ? "Edit task" : "Add a task to the pool"}
        sub={editing ? editing.title : "Goes into the pool for the round you choose."}
      >
        {drawer !== null && (
          <TaskForm
            key={drawer}
            initial={editing}
            submit={editing ? "Save changes" : "Add task"}
            saving={saving}
            onCancel={() => setDrawer(null)}
            onSubmit={save}
          />
        )}
      </Drawer>
    </>
  );
}
