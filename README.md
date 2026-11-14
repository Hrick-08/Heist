# Vice City: THE CAMPUS TAKEOVER — two event sites, one brief

Two complete, self-contained sites for **VICE CITY: THE CAMPUS TAKEOVER** (GDG on Campus, Chitkara University
× DGIT Gaming Club) — the GTA-inspired campus challenge from the internal brief: crews of 4–5, three mission
rounds across five categories, a police **target list**, one broker called **Dexter**, and a **Big Heist for the
top five**. Same content, same numbers, two art directions that share almost no code.

Open `index.html` in this folder to compare them side by side.

> **v2.0 matches the new brief.** Points are the score; in-game cash is a tool (Dexter's fee, strategy
> missions), not the win condition. The old cash-economy spec is gone.

```
vice-city/
├── index.html                    ← chooser / hand-off page
├── spec.md                       ← platform + rules contract v2.0 (copied into both builds)
├── concept-a-neon-litho/         ← "NEON VICE"  (comic cover / neon night press)
│   ├── index.html                cover + 12 chapters + back cover
│   ├── spec.md
│   └── assets/{css,js,fonts,img}
├── concept-b-material-vice/      ← "NEON MATERIAL"  (Google Material 3, lit like a Vice City night)
│   ├── index.html                app bar + 16 sections + drawer
│   ├── spec.md
│   └── assets/{css,js,fonts,img}
└── _source/                      ← asset pipeline + evidence (not needed to deploy)
    ├── fetch_official.sh         Rockstar's own GTA VI press plates
    ├── fetch_wiki.sh             official screenshots mirrored on the GTA Wiki (Fandom)
    ├── fetch_fonts.py            self-hosted Google Fonts subsets
    ├── prepare_assets.py         one manifest → two graded art directions + textures
    ├── raw/ raw2/                originals (only needed to re-run the pipeline)
    ├── qa/                       QA screenshots (desktop + mobile, both builds)
    └── provenance.tsv            every image: source, licence, where it is used
```

Deploy `concept-a-neon-litho/` and/or `concept-b-material-vice/`. `_source/` is the workshop — originals, the
grading script and QA shots — leave it off the host.

## Run it

No build step, no npm, no CDN, no framework.

```bash
cd vice-city
python -m http.server 8123
# → http://localhost:8123/                       chooser
# → http://localhost:8123/concept-a-neon-litho/  Concept A
# → http://localhost:8123/concept-b-material-vice/
```

Double-clicking `index.html` also works: every path is relative, so a folder can be dropped onto any static
host (`/vice-city/a/`, a GitHub Pages project path, a USB stick) and keep working. **Both builds run fully
offline** — fonts, three.js (Concept A only), images and icons are local. That is deliberate: the day-of campus network is not
something to bet the runway on.

## The rules both sites teach (from the brief)

| | |
|---|---|
| Mission score | completion **60** + quality **25** + speed **15** + bonus task **+10** − **5** per hint (max **110**) |
| Rounds | 3, all crews run the same shortlist, mixed from **five categories** (tech & logic, physical, creative, clue hunt, strategy) |
| Target list | the **top 3** crews after each round become official police targets; the list changes every round |
| Wanted | officer verifies the crew ID **and** photographs the team leader → status set; every mission then pays **−20 %** |
| Dexter | one desk, one published fee: **100 in-game cash** clears the status, logged and announced |
| Big Heist | **top 5** after Round 3; status wiped; **+150 / +120 / +100 / +75** by finish position |
| Final score | mission points + heist bonus − penalties |
| Photos | internal wanted board only, opt-out honoured (ID-only verification), deleted after the event |
| Money | fictional wallet seeded at **1 000** for every crew; **no real money** anywhere |

## Concept A — NEON VICE

A crime chronicle printed on a hot night press. Comic cover and back cover, twelve numbered chapters, Anton
display caps, Bungee signage, Monoton neon wordmark, Chakra Petch HUD, Archivo body. Everything is dark glass
with a 1px neon hairline and a glow — no paper texture, no cream panels — plus CRT scanlines, film grain,
vignette and a wire-frame horizon on the dark sections.

* **The cover is the GTA pause screen.** Blurred city behind frosted glass, a game-state bar across the top
  (`PAUSED`, cash `$1,000`, respect `0`, rounds `0/3`, wanted ★☆☆☆☆), the seven chapters as a real menu on the
  left with the `▸` selector and per-line hints, and the campus drawn as a vector sector map on the right —
  five zones, the control room, two patrols on `animateMotion`, a sweeping radar arm, the Big Heist marker.
  Menu and map talk to each other: hover or focus a menu line and the matching layer of the map heats up
  (zones / routes / hub / patrol / heist) while the strip under the map re-types itself; hover a zone and the
  menu answers back. Reading the page does the same thing — the map follows the chapter you are in.
  Keyboard: ↑ ↓ ← → Home End walk the menu (roving tabindex), `Esc` blurs it and toasts `RESUMED`.
  Reduced motion parks the patrols and stops the sweep instead of hiding them.
* **3D evidence case** (`scene3d.js`) now lives in File 08 as **Exhibit A** — the same attaché (front/back labels
  painted to canvas textures, art shards, drag to rotate, click to flip) but placed where it means something:
  the thing the five finalists walk out with. Falls back to nothing below 820 px, and to a still frame under
  reduced motion.
* **Two-band masthead**: name plate + event wire (live board chip, date, organisers) on top, and below it a
  single-line **chapter rail** — twelve numbered chapters that drag, scroll or arrow-key sideways with the live
  chapter auto-centred, a scan line that sweeps the rule and a page-progress bar built into the rail. The strip's
  own scrollbar is hidden on purpose.
* **Corner HUD** — points, cash, wanted stars, round. Idle at 58 % opacity, wakes on hover, and parks itself
  (fades out) once the back cover is on screen.
* **Calculators**: the mission scoring sheet (live sliders → verdict), pay-Dexter-or-eat-the-20 %, and the
  final-score formula against the closest rival.
* **City board simulator**: 10 crews, three views (points / target list / least hints), run round · publish
  targets · Dexter clears one · Big Heist top 5, with FLIP row reordering and a RESPECT-style toast.
* **Mission Lab**: submit a mission idea (name, problem, category, time, materials, how to win) and it builds a
  shareable card + plain-text version for the review channel.
* **Run of the day**: a horizontal strip of the eleven schedule beats. The native scrollbar is hidden; it
  moves by drag, trackpad, or arrow keys (the strip is `tabindex="0"` with an `aria-label`) and a thin neon
  rail under it shows scroll position and width.
* Wanted posters on the back cover, print stylesheet, `prefers-reduced-motion` respected.

## Concept B — NEON MATERIAL

Google's actual Material 3 system — colour roles (`primary` / `-container` / `on-*`, `surface-container`
low→highest, `outline-variant`), the shape scale (6/10/14/20/28/36), elevation levels, state layers, emphasized
easing, data table, segmented buttons, expansion panels, snackbar, FAB, scrim — **lit like a Vice City night**:
neon title gradient, ambient radial wash, scanlines and grain, wanted stars in the app-bar HUD chip, siren-pulse
badges, money-green numbers.

* **Night is the default.** The light theme is "Leonida morning" (colour roles remapped, `--neon: 0`), and the
  choice persists in `localStorage`.
* **Search** indexes 28 curated rules/scoring/timing entries, tokenises the query, highlights matches and dims
  the non-matching sections — and if nothing in the index matches, it falls back to searching the page text so
  the field never lies.
* **Dispatch reel** (the five moments): a media surface with cross-fading stills and a slow Ken Burns push, a
  five-segment scrubber that doubles as the autoplay timer, prev / play / next controls, and a moment list
  (time chip + title + supporting line, live row flagged). Arrow keys, swipe, `role=tablist`, pauses on hover,
  on blur and on a hidden tab, and never autoplays under `prefers-reduced-motion`. No WebGL here by choice —
  Concept A is the build that carries three.js.
* Same four calculators, the same board simulator and the same idea lab, expressed in Material parts: sliders in
  a tonal panel, a real sticky-header data table, segmented buttons for the views, a snackbar instead of a toast.
* **Section identity.** Every band declares `data-tone` (pink / cyan / amber / money / cop-blue / violet),
  `data-motif` (a sprite id, injected as an oversized outline watermark with a soft accent wash) and `data-stat`
  (a mono HUD chip that answers "what do I need to know here" before the first paragraph). The accent rule above
  each header draws itself the first time the section is on screen, and the title gets one neon strike. Three
  header shapes are in rotation — default, centred (postcards) and split with the lede beside the title (awards,
  control room) — so the page never reads as one repeated template. Watermarks, washes and chips drop out in
  print, and the blue/violet tones swap to ink in the morning theme to stay above 6:1 contrast.
* **One layout per section — deliberately.** Briefing is a dividers list with trailing key values, staffing is a
  feature panel plus a thumbnail list, awards is a data table, control room is a split panel of guardrails and
  open questions, run of the day is the drag/rail strip. Only the mission catalogue is a card grid (it is a real
  catalogue with a filter). Please keep it that way: four identical icon-title-paragraph cards in a row is the
  single fastest way to make this page look generated.

## What to edit before publishing

| What | Where |
|---|---|
| Date / countdown | `CONFIG.eventDate` in each build's `assets/js/main.js` (13 Feb 2027 is a placeholder) |
| Event numbers | `CONFIG.dexterFee`, `CONFIG.wantedCut`, `CONFIG.heistBonus`, `CONFIG.hintCost`, `CONFIG.openingWallet` — same file, and mirror them in `spec.md` |
| Registration + Discord | `CONFIG.links.register` / `CONFIG.links.discord` (placeholders) |
| Crew file codes | `vc://crew/…` payloads are demo values; the real ones are issued at check-in |
| Host logos | `assets/img/gdg-logo.svg` — swap for the locked GDG / DGIT lockups |
| Key art | `assets/img/cover-walk.jpg` in each build (hero + chooser) — replace with your own art if you would rather not run the franchise poster |
| Mission list | the five category cards + sample missions in both builds; shortlist comes out of the idea review |
| Prizes | `#payoff` (A) / `#prizes` (B) — everything there is marked **Proposed** |
| Real board feed | replace the demo crews array in `main.js` with `GET /api/board` — the row shape matches `spec.md` §10 |

`spec.md` is the source of truth: nouns, the points formula, attempt payload and idempotency, target-list
publication, wanted/clearance rules, photo privacy, heist bonuses, run of day, penalties, tie-breaks, board +
realtime, non-functional limits and the pre-flight checklist — plus §13, the list of numbers the team has not
frozen yet.

## Content and asset notes

* **Art is curated for a college audience.** Nobody holds a weapon, nothing sexualised, and no Rockstar key art
  with its own logo/date burned in. `assets/img` therefore holds only what the page actually shows; the rest of
  the fetched pool sits in `_source/unused-img/` so nobody accidentally re-wires a bad one. Two stills that used
  to appear (`city-wall.jpg`, `crew-drip.jpg`) were retired by the organizers and are gone from both builds —
  the rules spread now uses `skyline-night.jpg`, the assemble band `radio-mural.jpg`, the back-cover wall gained
  a blue **CAUGHT IN ROUND 2 · NEVER CLEARED** poster (`in-custody.jpg`, 1 540 → 1 232 = the 20 % cut shown as
  maths), and Concept B's creative card uses the Leonida sticker collage.

* **All event content** comes from the internal brief (structure, categories, idea-submission fields, scoring
  table, police/Dexter flow, photo handling, qualification, timeline, rules, responsibilities). Anything the
  brief leaves open is labelled on the page: **Proposed**, **placeholder**, or **this board is a demo**.
* **Art** is official Rockstar GTA VI promotional material plus GTA Wiki screenshots, re-graded per concept
  (neon night press for A, clean saturated grade for B) — `_source/provenance.tsv` lists source URL, licence and
  usage for every file. Nothing was generated. Both footers carry the fan-event disclaimer.
* Imagery was screened for taste: crime, weapons and arrest art stay (it is the theme); nothing sexualised.
* **Privacy on the page itself**: the builds never show a real participant photo — the wanted poster is a
  placeholder, the opt-out is stated twice, and `spec.md` §6 restricts access, retention and re-use.
* **Accessibility**: skip links, landmarks, labelled controls, `aria-live` on async regions, tab semantics with
  arrow-key movement, visible focus rings, status never colour-only, `prefers-reduced-motion` honoured, print
  stylesheet in both.
* **Verification**: zero console errors, no broken image/JS/CSS references, no page-level horizontal overflow at
  390 / 768 / 1440 px, and every widget exercised in Chromium — search, filters, sliders, board simulator,
  calculators, tabs, drawer, theme toggle, crew QR, the dispatch reel (segments, controls, keys), Concept A's
  3D case and both chapter/timeline rails, idea form validation and copy.
