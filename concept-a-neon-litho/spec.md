# VICE CITY: THE CAMPUS TAKEOVER — Platform SPEC v2.0

**GDG on Campus, Chitkara University × DGIT Gaming Club — one-day GTA-inspired campus challenge.**
City opens **Saturday 13 February 2027, 09:00 IST** · missions **10:00–14:15** · Big Heist **14:30–15:00** ·
awards **15:00–15:30** · Chitkara University, Punjab.

This is the contract between the people running the day and the platform that keeps it honest.
v2.0 replaces the v1.0 heist economy: **points decide the day, cash is only a tool**.
If a rule is ambiguous here, it is a documentation bug — raise it in Discord before the day, not during Round 2.

> Both demo builds (`concept-a-neon-litho/`, `concept-b-material-vice/`) implement the numbers in this file
> from a single `CONFIG` object at the top of `assets/js/main.js`. Change the number there, not in the copy.

---

## 0. What changed from v1.0 (read this first)

| v1.0 (dropped) | v2.0 (this spec) |
|---|---|
| Cash was the score (`wallet` → winner) | **Points are the score.** Cash is a tool spent on Dexter and strategy missions |
| 4 themed districts, one crew picked a lane | **5 mission categories**, every crew runs the same mixed shortlist |
| Bounty levels 1–5 stars, heat bought police attention | **Target list:** top 3 crews of each round become official police targets |
| Custody: frozen for N minutes | No custody. Wanted crews keep playing at **−20 %** per mission |
| Big Heist: everyone with a multiplier | **Big Heist: top 5 crews only**, fixed completion bonuses |
| Fines table (₹-style penalties) | Penalties are point deductions, only from the published rule list (§9) |

---

## 1. Nouns

| Noun | Meaning |
|---|---|
| **Crew** | 4–5 students, one crew ID, one wallet, one board row. The unit of every rule. |
| **Category** | One of five: tech & logic, physical team games, creative, clue hunt & observation, strategy. |
| **Mission** | A 3–8 minute task at a station, scored on the same sheet everywhere. |
| **Round** | One of three mission blocks (§8). All crews run the same shortlist in each round. |
| **Target list** | The three highest-scoring crews at the end of a round. Republished every round. |
| **Wanted** | Status set when an officer verifies a listed crew's ID **and** uploads a leader photo. |
| **Dexter** | The broker desk: issues bonus/strategy missions, collects the clearance fee, clears status. A role, not an API. |
| **Vice City PD** | Volunteer officers. They verify, photograph, mark. They never chase, touch, block or run. |
| **Control** | Event control. Owns the format, approves corrections, publishes the target list and the finalists. |
| **Big Heist** | The 14:30 finale for the top 5 crews. Completion order sets the bonus. |

---

## 2. Scoring (the only thing that decides the day)

Per mission, same sheet at every station, published before the event:

| Component | Max |
|---|---|
| Mission completion | **60** |
| Accuracy / quality | **25** |
| Speed bonus | **15** |
| Optional bonus task | **+10** |
| Each hint used | **−5** |
| **Best possible mission** | **110** |

```
mission_points = completion + quality + speed + bonus − (hints × 5)
mission_points = max(0, mission_points)
if crew.status == "wanted": mission_points = round(mission_points × 0.8)   // applied after awarding
```

- Creative and physical missions are judged on a **pre-decided checklist**, not taste.
- Timed missions store `completed_at`; the speed band is derived from it, never typed.
- A hint is logged at the moment it is given, by the station referee, against the crew ID.
- Status is checked **before** the mission starts, so the crew can choose to visit Dexter first.

Worked example from the brief: Crew A = 60 + 25 + 5 = **90**. Crew B = 60 + 25 + 15 = **100**.
Both finished; the clock is the difference.

---

## 3. Crew registration and crew ID

```
POST /api/crews
Content-Type: application/json

{
  "name": "The Neon Undertakers",     // 3–26 chars, trimmed, case-insensitively unique
  "members": ["a@chitkara.edu.in", "b@chitkara.edu.in", "c@…", "d@…"],   // 4–5
  "leader": "m_04",
  "zone": "picasso-block",            // optional flavour only, never scored on
  "contact": "+91-XXXXXXXXXX",
  "photo_opt_out": false
}
```

```
201 Created
{
  "crew_id": "VP-11-047",
  "qr": "vc://crew/VP-11-047/the-neon-undertakers",
  "wallet": 1000,                     // fictional in-game cash, identical for every crew
  "points": 0,
  "status": "clear",
  "photo_opt_out": false
}
```

- One entry per team. Members are registered so certificates can be issued individually.
- The QR payload is scanned at stations; the printed code is a fallback, never the primary record.
- A dead or lost phone does not end a crew's day: any referee can look the crew up by ID.
- `wallet` is **fictional**. No real money is ever collected, converted or refunded by the platform.

---

## 4. Mission attempt and scoring write

```
POST /api/missions/{missionId}/attempts
{
  "crew_id": "VP-11-047",
  "station_key": "st-07",             // who is writing this, for audit
  "completion": 60,                   // 0–60, awarded in published bands
  "quality": 25,                      // 0–25, from the station checklist
  "hints": 1,                         // 0–3
  "bonus_task": true,                 // +10 or 0
  "completed_at": "2027-02-13T10:41:07+05:30"
}
```

Server rules:

1. `speed` is **computed** from `completed_at` against the mission's window — never sent by the station.
2. `status_at_start` is frozen into the attempt, so a status change mid-mission cannot rewrite history.
3. The response returns the full breakdown, including the wanted multiplier line, and the crew's new totals.
4. **Idempotent** per `(crew_id, mission_id, station_key)`: a second identical POST returns the first result, it does not double-score.
5. Station UIs queue the write when campus wifi drops and replay on reconnect (4 s max, jittered).

```
201 Created
{
  "attempt_id": "at-0013-047-07",
  "breakdown": { "completion": 60, "quality": 25, "speed": 5, "bonus": 10, "hints": -5 },
  "wanted_multiplier": 0.8,
  "awarded": 76,
  "crew_points": 488
}
```

---

## 5. Target list, wanted status, clearance

### 5.1 Publication

```
POST /api/rounds/{roundNo}/publish-targets      // control only
→ 200 { "round": 2, "targets": ["VP-11-047", "VP-11-012", "VP-11-033"], "published_at": "…" }

GET /api/targets?round=2
→ 200 { "round": 2, "targets": [ { "crew_id": "…", "name": "…", "points": 412,
                                   "leader_photo": "op-only://photo/…", "status": "wanted" } ] }
```

- Exactly the **top three** crews on the points board at the end of a round. Ties break on §9.
- Control pushes the list to officer phones. Officers may act **only** on the current list.
- Any other listing needs an explicit control authorisation (`POST /api/targets/override` with a reason string).

### 5.2 Setting wanted

```
POST /api/crews/{crewId}/wanted
{ "officer_id": "op-03", "photo_id": "ph-118", "verified_id": true, "round": 2 }
```

Both conditions are required by the server: `verified_id == true` **and** a `photo_id` for a crew on the current list.
Exception: a crew with `photo_opt_out: true` is verified by ID alone plus an officer-entered crew-code — no photo is taken.

### 5.3 Clearance at Dexter's

```
POST /api/crews/{crewId}/clearance
{ "dexter_operator": "dx-01", "amount": 100 }
→ 200 { "status": "clear", "wallet": 900, "cleared_at": "2027-02-13T12:51:04+05:30" }
```

- One broker, one desk, one published price: **100 in-game cash**.
- Every clearance is logged with time and operator and announced, so nobody can "clear quietly".
- If the crew cannot pay, it keeps playing at −20 %. That is a legitimate strategy, not a failure state.
- Wanted status is wiped for **all** crews before the Big Heist.

### 5.4 Police never

chase · touch · block · run · enter non-event areas · mark an unlisted crew · keep a photo after the event.

---

## 6. Photo privacy

| Rule | Implementation |
|---|---|
| Purpose | Wanted board only. Shown on the operator view, optional on the public crew card. |
| Consent | Disclosed at registration; `photo_opt_out: true` switches that crew to ID-only verification. |
| Access | Officers and control only. Not in the public board payload, not in the SSE stream. |
| Retention | Deleted within 7 days of the event; `GET /api/photos?crew=` returns `[]` afterwards, auditable. |
| Re-use | None. No social post uses a wanted photo without a separate written release from that student. |

The public site never embeds a real photo: the builds show a placeholder poster and say so.

---

## 7. Big Heist

```
POST /api/heist/qualify        // control, 14:15
→ 200 { "finalists": ["VP-11-012","VP-11-047","VP-11-033","VP-11-004","VP-11-058"] }
```

- Top 5 on the points board after Round 3. No early elimination anywhere else in the day.
- One heist built from the day's skills: a clue to decode, a physical task, a puzzle, a creative act.
- Scored live on the main board; the clock is public.

| Finish position | Bonus |
|---|---|
| 1st crew to complete | **+150** |
| 2nd | **+120** |
| 3rd | **+100** |
| every other finalist that completes | **+75** |

```
final_score = mission_points + heist_bonus − penalties
```

Winner = highest `final_score`. The formula is published at 09:30 and does not change at 15:00.

---

## 8. Run of day (IST)

| Time | What the platform does |
|---|---|
| 09:00–09:30 | Check-in: crew IDs issued, QR printed, wallets seeded at 1 000 |
| 09:30–10:00 | Briefing. Scoring sheet and rules locked read-only |
| 10:00–11:30 | **Round 1** — starter missions, board live |
| 11:30–11:45 | Round 1 banked → **target list published** to officers |
| 11:45–12:45 | **Round 2** — main missions |
| 12:45–13:15 | Lunch · **Dexter's desk** busiest window · strategy missions |
| 13:15–14:15 | **Round 3** — final regular missions + bonus tasks |
| 14:15–14:30 | Leaderboard locked · **top 5 announced** · status wiped |
| 14:30–15:00 | **The Big Heist** — bonuses applied on completion |
| 15:00–15:30 | Audit, prizes, photos, dispersal |

---

## 9. Penalties and tie-breaks

**Penalties** (control-approved, always written with a reason):

| Case | Deduction |
|---|---|
| Cheating, answer sharing, tampering with props | −50, or disqualification for repeat |
| Unsafe play — running, rough play, leaving the zone | −25 |
| Disturbing a real class or campus operation | −25 |
| Missions banked after the station window | attempt rejected, not scored |

**Tie-break order** (applied top-down, first difference wins):

1. Big Heist completion time (finalists), then
2. missions banked, then
3. fewer hints used, then
4. written control-room decision, published to the board.

---

## 10. Board and realtime

```
GET  /api/board?view=points|targets|clean&round=2
SSE  GET /api/stream/board        // events: attempt, target_list, clearance, heist_finish, lock
```

`view=points` is the only ordering that decides anything. `targets` is what control sends to officers;
`clean` (fewest hints) exists for tie-breaks and the awards photo.
Row shape: `rank, crew_id, name, points, cash, missions, hints, status, delta`.

- The board is a **read model over the append-only ledger**. Nothing edits it directly.
- Projector mode: one fullscreen board page, no CDN, works on campus wifi with the internet down.
- Every state change is replayable: `GET /api/audit?crew=VP-11-047` returns the crew's full history.

---

## 11. Non-functional

- **Offline first.** No CDN, no external API, no Google Fonts request. Fonts are vendored in every build; three.js
  ships with Concept A only (Concept B's reel and board are DOM + canvas).
- **No build step.** Hand-written HTML/CSS/JS; a folder copy served by any static server works.
- **Relative paths only**, so the folder deploys under any subpath unchanged.
- Loads and stays interactive on a 4-year-old mid-range phone on campus wifi.
- Write burst budget: 60 crews × 5 phones × ~18 attempts, worst case ~12 writes/second for 90 s.
- Station UI shows "queued" rather than losing a score when the network drops.
- Accessibility: real landmarks, visible focus rings, no colour-only status, `prefers-reduced-motion` respected.

---

## 12. Pre-flight checklist

- [ ] `GET /health` → `{"status":"ok","ledger_writable":true,"sse_clients":<n>}` before 08:45
- [ ] `POST /api/crews` issues a unique `crew_id` + QR and seeds `wallet: 1000`
- [ ] `POST /api/missions/{id}/attempts` is idempotent per `(crew, mission, station)`
- [ ] Speed is derived from `completed_at`; no station can type it in
- [ ] Target list publishes exactly 3 crews per round, with a reason string for any override
- [ ] `wanted` requires verified ID **and** photo, or ID + crew-code for `photo_opt_out` crews
- [ ] Clearance is 100 cash, logged with operator + timestamp, and announced
- [ ] Heist qualification takes exactly the top 5 and wipes all wanted status
- [ ] Bonuses applied +150 / +120 / +100 / +75 on heist completion, then final formula re-run
- [ ] Audit export (`csv`) available to control before the awards walk-up
- [ ] Photo retention job verified: all images deleted after the event, `GET /api/photos` empty
- [ ] Everything rehearsed on campus wifi with the WAN cable pulled

---

## 13. Decisions still open (from the brief, §11)

| Open | Default in these builds |
|---|---|
| Crew count / participant cap | 42 crews shown, placeholder |
| Missions per category | 3 shown per category, shortlist pending review |
| Station layout | 4 named areas: Picasso Block, Ocean Drive, Campus Quarter, The Marina |
| Clearance fee | **100** in-game cash |
| Wanted deduction | **20 %** |
| Target count per round | **3** |
| Heist concept, props, prize budget | 4 stages, prizes marked "Proposed" |
| Opening wallet | **1 000** in-game cash |

Change a number → change `CONFIG` in `assets/js/main.js` and this file in the same commit.
