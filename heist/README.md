# The Last Heist

A GTA VI themed campus heist event built by **GDG Campus Chitkara**.

Crews register and get a **TEAM ID** and passcode, but nobody enters the heist
automatically — control flips each crew's **In heist** switch and sends its
login details. The leader signs in, works a board of targets, buys clues with
cash, and survives four elimination rounds — **40 → 20 → 10 → 5** — before the
last crew standing empties the vault.

| | |
| --- | --- |
| **Stack** | Next.js 16 (App Router, Turbopack, Cache Components) · React 19 · Tailwind v4 · MongoDB · `jose` (signed session cookie) |
| **Roles** | Team leader (`/login`) and event control (`/admin/login`) |
| **Currencies** | **Points** drive the leaderboard and survival. **Cash** buys clues, bribes the police and funds the endgame. Cash never appears on the leaderboard. |

---

## Getting started

```bash
npm install
cp .env.example .env     # then fill in your own values
npm run dev              # http://localhost:3000
```

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE` | MongoDB connection string (`mongodb://…` or `mongodb+srv://…`) |
| `DATABASE_NAME` | Database name. Defaults to `last-heist`. |
| `AUTH_SECRET` | Secret used to sign the session cookie (≥ 16 characters). |
| `ADMIN_USERNAME` | Control-room operator username. Defaults to `admin`. |
| `ADMIN_PASSWORD` | Control-room operator password. Defaults to `heist-control`. |

The starter target pool and the six starter Dexter missions are seeded from
**Control room → Settings → Seed target pool**. Seeding never overwrites
existing records, so it is safe to run more than once.

---

## Running the event

### 1. Register the crews

**Control room → Crews → Register a crew.** For every crew enter:

- crew name and the **leader's login email** (the login id),
- leader name, phone and **leader photo** (resized to 480px in the browser and
  stored on the crew record),
- 3–4 further members (4–5 people per crew including the leader),
- an optional passcode — leave it blank and one is generated.

The panel returns the generated **TEAM ID** and **passcode**. New crews start
as **not in the heist** and cannot sign in yet — registration never enters a
crew automatically.

**Control room → Crews → In heist.** Flip the switch for every crew you want in
the heist (up to the slot limit in Settings). Admitting a crew gives it the
current round's board. Click **Login** on the same row to reveal its Team ID,
login email and passcode, then **Copy** or **Email** to send them to the leader
by hand — the control room does not send mail itself. Switching a crew off
signs it out immediately but keeps its score and tasks. If a crew was created
by mistake, **Delete** on the row removes it and returns its sign-up to pending
so you can generate fresh credentials (crews in the heist must be switched out
first).

### 2. Open round 1

**Control room → Overview → Allocate round 1 targets.**

- **Physical** targets go to every crew — they are the same for all.
- **Technical** targets are dealt **one crew at a time** and are never handed
  to two crews in the same round.

Crews admitted later get the current round's board when their switch is turned on.

### 3. Verify targets at the desk

Crews come to the desk and show their work. Two ways to sign it off:

- **Direct** — open the crew (**Control room → Crews → Verify**) and hit
  **Mark complete**. Points and cash land immediately. **Revert** takes a target
  back and removes the reward.
- **Via a request** — the crew taps **“Done at the desk? Request approval”** on
  the target (or **“Dexter mission done? Request sign-off”** on a Dexter
  mission) and it lands in **Control room → Approvals**. The queue shows the
  crew, the target and the reward, with **Approve & pay** and **Dismiss**.

Approving is what pays out, and it is recorded against the operator who
approved it. Dismissing closes the request without a reward — the crew can
raise it again. Signing a target off directly also closes any request the crew
had queued for it, so the queue never goes stale.

The sidebar shows a live count of requests waiting, and the overview links
straight to the queue.

### 4. Push Dexter missions

**Control room → Dexter.** Push a mission, choose the round, the difficulty and
whether it targets every crew or selected crews. It appears on the crew
dashboards as a **“Dexter Spotted”** banner. Close it out from the crew page
and the crew banks the extra points and cash. A mistaken sign-off can be
**Revert**ed there too — that removes the claim, the payout and the mission's
completion count.

### 5. Run the rounds

**Control room → Rounds → Advance to round N.** On every round close:

- the bottom half of the standings (ranked on points, then targets cleared) is
  eliminated,
- the survivors move to the next round and get that round's board,
- the **top three crews are posted as wanted** (and can be re-synced manually
  with **Sync wanted (top 3)**).

When the final round is done, hit **Crown the champion**.

### 6. Wanted posters and the endgame

- A crew on the wanted list can **pay a bribe** (cash, price in Settings) to go
  dark. The next round's sync will post them again.
- Cash can **buy a clue** on any pending target — the clue is revealed
  instantly.
- Cash can **fund the endgame**, which opens the vault and deals that crew its
  final, endgame-only target.

---

## Pages

| Route | Who | What |
| --- | --- | --- |
| `/` | everyone | Event briefing and live stats |
| `/login` | crew leader | Team sign-in |
| `/dashboard` | crew | Board, stats, Dexter banners, wanted posters, leaderboard |
| `/tasks` | crew | Every target, grouped by round |
| `/endgame` | crew | Fund and open the final vault |
| `/leaderboard` | everyone | Public standings (points only) |
| `/admin/login` | operator | Control-room sign-in |
| `/admin` | operator | Overview, round control, desk activity |
| `/admin/approvals` | operator | Approve or dismiss mission/target requests |
| `/admin/teams` | operator | Register crews, search, post wanted posters |
| `/admin/teams/[teamId]` | operator | Crew record, verification desk, Dexter payouts |
| `/admin/tasks` | operator | Target pool CRUD |
| `/admin/dexter` | operator | Dexter mission CRUD |
| `/admin/rounds` | operator | Advance rounds, elimination history, wanted board |
| `/admin/settings` | operator | Slots, target counts, prices, seeding |

---

## Project structure

```text
app/
  page.tsx                    event briefing (public)
  login/                      team login
  leaderboard/                public standings
  (team)/                     crew area: dashboard, tasks, endgame
  admin/
    login/                    control-room login (outside the panel layout)
    (panel)/                  guarded control room
  not-found.tsx
components/                   UI, crew dashboard widgets, admin widgets
lib/
  db.ts                       Mongo connection (+ io() so the driver stays out of prerender)
  token.ts                    signed session cookie
  auth.ts                     password hashing (scrypt) + session helpers
  game.ts                     all game logic: crews, targets, rounds, money, wanted
  seed.ts                     starter target pool and Dexter missions
  session.ts                  requireTeam() / requireAdmin() guards
  actions/                    server actions (auth, team, admin)
proxy.ts                      route guards for /dashboard, /tasks, /endgame, /admin
```

### Data model (MongoDB)

| Collection | Contents |
| --- | --- |
| `teams` | Crew record, login email, passcode, leader photo, status (`registered` = not in the heist), points, cash, wanted flag, round, completed Dexter missions |
| `tasks` | Target pool — type (`physical` / `technical`), round, points, cash, hint and hint price, endgame flag |
| `teamTasks` | Allotments — one row per crew per target, with completion and payout state |
| `dexterMissions` | Dexter missions — reward, round, difficulty, target crews, completions |
| `approvals` | Crew requests waiting on the desk, with who approved or dismissed them |
| `eventState` | Current round, slot count, prices, target counts, live/closed flag, champion |
| `admins` | Control-room operators |

---

## Notes

- Sessions are signed with `jose` (`HS256`) and stored in an `httpOnly`
  cookie for 12 hours. Passwords are hashed with `scrypt` and a per-user salt.
- Route protection lives in `proxy.ts`; every server action re-checks the
  session itself before touching data.
- The app is built with **Cache Components** enabled. Data reads call
  `await io()` inside the Mongo layer so the driver never runs during
  prerendering.
