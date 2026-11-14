/* ==========================================================================
   VICE CITY · THE CAMPUS TAKEOVER — Concept B behaviour
   GDG on Campus Chitkara × DGIT Gaming Club

   A working mock of the event platform in ../spec.md: no network, no build
   step, no framework. Theme, drawer, search, HUD, scoring sheet, Dexter
   trade-off, city board (with FLIP reordering), crew file QR, idea lab card
   builder, tabs, ripples and snackbar.

   Module map
     01 config + helpers      08 heist final-score
     02 theme (day / night)   09 city board simulator
     03 appbar, scrollspy     10 crew file + canvas QR
     04 drawer                11 mission category filter
     05 reveals + countdown   12 mission lab card builder
     06 HUD                   13 search over the whole page
     07 scoring sheet         14 tabs, copy, ripple, snackbar, links
   ========================================================================== */
(() => {
  'use strict';

  /* ── 01 · config + helpers ──────────────────────────────────────────── */
  const CONFIG = {
    eventDate: '2027-02-13T09:00:00+05:30',
    openingWallet: 1000,
    dexterFee: 100,
    wantedCut: 0.2,
    hintCost: 5,
    links: {
      discord: 'https://discord.gg/gdgchitkara',
      register: 'https://gdg.community.dev/gdg-on-campus-chitkara-university-punjab-india/'
    }
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const num = (v, f = 0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : f; };
  const fmt = n => Math.round(n).toLocaleString('en-IN');
  const money = n => '$' + fmt(n);
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nowIST = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

  /* ── 02 · theme ─────────────────────────────────────────────────────── */
  const KEY = 'vc-theme';
  const root = document.documentElement;
  const themeBtn = $('#themeToggle');
  const stored = (() => { try { return localStorage.getItem(KEY); } catch (e) { return null; } })();
  if (stored === 'light' || stored === 'dark') root.dataset.theme = stored;
  const paintTheme = () => {
    if (!themeBtn) return;
    const dark = root.dataset.theme !== 'light';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to day theme' : 'Switch to night theme');
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0f0a17' : '#fbf6ff');
  };
  paintTheme();
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      root.dataset.theme = next;
      try { localStorage.setItem(KEY, next); } catch (e) { /* private mode */ }
      paintTheme();
      snack(next === 'dark' ? 'Night drive · neon theme' : 'Daylight · light theme');
    });
  }

  /* ── 03 · appbar, scrollspy, progress ───────────────────────────────── */
  const appbar = $('#appbar');
  const rail = $('#progressBar');
  const fab = $('#fab');
  const spyTargets = $$('main section[id]');
  const navA = (id, sel) => $(sel + ' a[href="#' + id + '"]');
  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const y = window.scrollY;
      if (appbar) appbar.classList.toggle('is-stuck', y > 12);
      const doc = document.documentElement;
      const p = clamp(y / Math.max(1, doc.scrollHeight - window.innerHeight), 0, 1);
      if (rail) rail.style.inlineSize = (p * 100).toFixed(2) + '%';

      let current = spyTargets[0];
      spyTargets.forEach(s => { if (s.offsetTop <= y + 150) current = s; });
      $$('main section[id]').forEach(s => s.classList.toggle('is-current', s === current));
      $$('.appnav a, .drawer-list a').forEach(a => a.removeAttribute('aria-current'));
      if (current) {
        [navA(current.id, '.appnav'), navA(current.id, '.drawer')].forEach(a => { if (a) a.setAttribute('aria-current', 'true'); });
      }
      if (fab) fab.classList.toggle('is-hidden', y < 420);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ── 04 · drawer ────────────────────────────────────────────────────── */
  const drawer = $('#drawer');
  const scrim = $('#drawerScrim');
  const navToggle = $('#navToggle');
  let lastFocus = null;
  const openDrawer = open => {
    if (!drawer || !scrim) return;
    if (open) lastFocus = document.activeElement;
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    scrim.hidden = !open;
    if (navToggle) navToggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { const first = $('a, button', drawer); if (first) first.focus(); }
    else if (lastFocus) lastFocus.focus();
  };
  if (navToggle) navToggle.addEventListener('click', () => openDrawer(!drawer.classList.contains('is-open')));
  const drawerClose = $('#drawerClose');
  if (drawerClose) drawerClose.addEventListener('click', () => openDrawer(false));
  if (scrim) scrim.addEventListener('click', () => openDrawer(false));
  if (drawer) drawer.addEventListener('click', e => { if (e.target.closest('a')) openDrawer(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('is-open')) openDrawer(false);
  });

  /* ── 05 · reveals + countdown ───────────────────────────────────────── */
  const revealEls = $$('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const i = Array.from(el.parentElement.children).indexOf(el) % 5;
        el.style.transitionDelay = (i * 70) + 'ms';
        el.classList.add('is-in');
        obs.unobserve(el);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    revealEls.forEach(el => io.observe(el));
  }

  const target = new Date(CONFIG.eventDate).getTime();
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    let ms = target - Date.now();
    if (ms < 0) ms = 0;
    const set = (u, v) => {
      const el = document.querySelector('[data-unit="' + u + '"]');
      if (el && el.textContent !== v) el.textContent = v;
    };
    set('days', pad(Math.floor(ms / 864e5)));
    set('hours', pad(Math.floor(ms / 36e5) % 24));
    set('minutes', pad(Math.floor(ms / 6e4) % 60));
    set('seconds', pad(Math.floor(ms / 1e3) % 60));
  };
  tick();
  setInterval(tick, 1000);

  /* ── 06 · HUD ───────────────────────────────────────────────────────── */
  const hud = { points: $('#hudPoints'), cash: $('#hudCash'), stars: $('#hudStars') };
  const setHUD = state => {
    if (hud.points) hud.points.textContent = fmt(state.points);
    if (hud.cash) hud.cash.textContent = money(state.cash);
    if (hud.stars) $$('i', hud.stars).forEach((s, i) => s.classList.toggle('on', i < state.stars));
  };

  /* ── 07 · scoring sheet ─────────────────────────────────────────────── */
  const sc = ['scDone', 'scQuality', 'scSpeed', 'scBonus', 'scHints'].map(id => document.getElementById(id));
  function calcScore() {
    const total = $('#scTotal');
    if (!total || sc.some(el => !el)) return;
    const [done, q, sp, bo, hints] = sc.map(el => num(el.value));
    const raw = done + q + sp + bo - hints * CONFIG.hintCost;
    const out = Math.max(0, raw);
    const write = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v); };
    write('scDoneOut', done); write('scQualityOut', q); write('scSpeedOut', sp);
    write('scBonusOut', bo); write('scHintsOut', hints ? '−' + hints * CONFIG.hintCost : '0');
    total.textContent = fmt(out);
    const bar = $('#scBar');
    if (bar) bar.style.inlineSize = clamp(out / 110 * 100, 0, 100) + '%';

    let verdict, tone;
    if (raw >= 110) {
      verdict = 'Textbook run';
      tone = '110 of 110 — perfect quality, fastest slot, bonus task taken, no hints. This is the number every station brief is written against.';
    } else if (hints > 0 && done >= 55) {
      verdict = 'Finished, paid for help';
      tone = 'Completed, but ' + (hints * CONFIG.hintCost) + ' points went on hints. A crew that finishes clean at ' + fmt(out + hints * CONFIG.hintCost) + ' beats this run.';
    } else if (done < 30) {
      verdict = 'Partial credit';
      tone = 'Stations award completion in bands. Half a mission is half of 60 — take the partial, then chase the speed window next round.';
    } else if (sp < 5) {
      verdict = 'Accurate, slow';
      tone = 'Quality is there; the speed window is not. Fifteen points are sitting in the clock, and most crews lose those, not the 60.';
    } else {
      verdict = 'Crew A finishes the job';
      tone = 'Same mission as Crew B — two seconds slower on the relay, ten points quieter on the board.';
    }
    $('#scVerdict').textContent = verdict;
    $('#scTone').textContent = tone;
  }
  sc.forEach(el => { if (el) el.addEventListener('input', calcScore); });
  calcScore();

  /* ── 08 · Dexter trade-off + final score ────────────────────────────── */
  const wnIds = ['wnMissions', 'wnPoints', 'wnCash'];
  function calcWanted() {
    const out = $('#wnLoss');
    if (!out) return;
    const m = num($('#wnMissions').value), p = num($('#wnPoints').value), c = num($('#wnCash').value);
    $('#wnMissionsOut').textContent = m;
    $('#wnPointsOut').textContent = p;
    $('#wnCashOut').textContent = money(c);
    const lost = Math.round(m * p * CONFIG.wantedCut);
    out.textContent = '−' + lost;
    const afford = c >= CONFIG.dexterFee, worth = lost >= CONFIG.dexterFee;
    let verdict, tone;
    if (!afford) {
      verdict = 'You cannot cover the fee';
      tone = 'Clearance is ' + money(CONFIG.dexterFee) + ' and you hold ' + money(c) + '. Win a strategy mission, or play the rest of the round at 80%.';
    } else if (worth) {
      verdict = 'Pay Dexter now';
      tone = 'Staying wanted across ' + m + ' missions costs ' + lost + ' points. The fee is ' + money(CONFIG.dexterFee) + ' cash — you earn that back inside a round.';
    } else if (m <= 1) {
      verdict = 'Probably ride it out';
      tone = 'One mission left and the cut is only ' + lost + ' points. Pay only if you expect to be listed again next round.';
    } else {
      verdict = 'Close call — check the clock';
      tone = 'The cut is ' + lost + ' points against ' + money(CONFIG.dexterFee) + ' cash. If rounds remain, the walk to the desk is usually the better trade.';
    }
    $('#wnVerdict').textContent = verdict;
    $('#wnTone').textContent = tone;
    out.classList.toggle('big-num--warn', lost >= CONFIG.dexterFee);
  }
  wnIds.forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', calcWanted); });
  calcWanted();

  const fIds = ['fPoints', 'fHeist', 'fPenalty', 'fRivals'];
  function calcFinal() {
    const out = $('#heistScore');
    if (!out) return;
    const p = num($('#fPoints').value), h = num($('#fHeist').value), pen = num($('#fPenalty').value), r = num($('#fRivals').value);
    const total = Math.max(0, p + h - pen);
    out.textContent = fmt(total);
    const bar = $('#scoreBar');
    if (bar) bar.style.inlineSize = (total / Math.max(total, r, 1) * 100).toFixed(1) + '%';
    const diff = total - r;
    let v;
    if (diff > 0) v = 'Ahead by ' + fmt(diff) + '.' + (diff <= 10 ? ' One hint in the last round would have lost this.' : ' Comfortable — but the heist bonus is still the biggest swing on the sheet.');
    else if (diff === 0) v = 'Dead level with ' + fmt(r) + '. Tie-break: heist completion time, then missions banked.';
    else v = 'Behind by ' + fmt(-diff) + '.' + (h >= 150 ? ' You won the heist and still trail — the morning cost you the day.' : ' Only the heist bonus closes this: +150 for first across the line.');
    $('#heistVerdict').textContent = v;
    out.style.color = diff >= 0 ? '' : 'var(--cop-red)';
  }
  fIds.forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', calcFinal); });
  calcFinal();

  /* ── 09 · city board simulator ──────────────────────────────────────── */
  const board = {
    body: $('#ledgerBody'), msg: $('#ledgerMsg'), card: $('.table-card'),
    round: 1, view: 'overall', busy: false,
    crews: [
      { id: 'VP-11-047', name: 'The Neon Undertakers', zone: 'Picasso Block', points: 412, cash: 1240, missions: 7, hints: 1, wanted: false, heist: false, delta: 0 },
      { id: 'VP-11-012', name: 'Sunset Repo', zone: 'Ocean Drive', points: 398, cash: 1510, missions: 7, hints: 0, wanted: false, heist: false, delta: 0 },
      { id: 'VP-11-033', name: 'Locksmith Aunties', zone: 'Campus Quarter', points: 386, cash: 990, missions: 6, hints: 2, wanted: false, heist: false, delta: 0 },
      { id: 'VP-11-004', name: 'Tippecanoe Kids', zone: 'The Marina', points: 355, cash: 1180, missions: 6, hints: 1, wanted: false, heist: false, delta: 0 },
      { id: 'VP-11-058', name: 'No Credit Given', zone: 'Picasso Block', points: 341, cash: 1350, missions: 6, hints: 0, wanted: false, heist: false, delta: 0 },
      { id: 'VP-11-021', name: 'Backend Bandits', zone: 'Campus Quarter', points: 322, cash: 870, missions: 5, hints: 3, wanted: false, heist: false, delta: 0 },
      { id: 'VP-11-077', name: 'The Ledger Cleaners', zone: 'The Marina', points: 310, cash: 1020, missions: 5, hints: 1, wanted: false, heist: false, delta: 0 },
      { id: 'VP-11-090', name: 'Malibu Slow', zone: 'Ocean Drive', points: 284, cash: 1460, missions: 5, hints: 0, wanted: false, heist: false, delta: 0 },
      { id: 'VP-11-016', name: 'Print Queue Mafia', zone: 'Campus Quarter', points: 265, cash: 940, missions: 4, hints: 2, wanted: false, heist: false, delta: 0 },
      { id: 'VP-11-069', name: 'Five Star Problem', zone: 'Picasso Block', points: 243, cash: 760, missions: 4, hints: 4, wanted: false, heist: false, delta: 0 }
    ]
  };
  const focusCrew = () => board.crews.find(c => c.id === 'VP-11-047') || board.crews[0];

  function sorted() {
    const list = board.crews.slice();
    if (board.view === 'targets') list.sort((a, b) => (b.wanted - a.wanted) || (b.points - a.points));
    else if (board.view === 'clean') list.sort((a, b) => (a.hints - b.hints) || (b.points - a.points));
    else list.sort((a, b) => b.points - a.points);
    return list;
  }
  function statusOf(c) {
    if (c.heist) return ['status--heist', 'Heist finalist'];
    if (c.wanted) return ['status--wanted', 'Wanted'];
    if (board.view === 'targets') return ['status--clear', 'Clear'];
    return ['status--live', 'Live'];
  }
  function render() {
    if (!board.body) return;
    const before = new Map($$('.tr', board.body).map(r => [r.dataset.id, r.getBoundingClientRect().top]));
    const frag = document.createDocumentFragment();
    sorted().forEach((c, i) => {
      const [cls, text] = statusOf(c);
      const row = document.createElement('div');
      row.className = 'tr' + (c.delta ? ' is-flash' : '') + (i === 0 && board.view === 'overall' ? ' is-top' : '');
      row.setAttribute('role', 'row');
      row.dataset.id = c.id;
      row.innerHTML =
        '<span class="rank" role="cell">' + (i + 1) + '</span>' +
        '<span class="crew" role="cell"><b>' + c.name + '</b><span>' + c.id + ' · ' + c.zone + '</span></span>' +
        '<span class="num num--points" role="cell">' + fmt(c.points) + '</span>' +
        '<span class="num num--cash" role="cell">' + money(c.cash) + '</span>' +
        '<span class="num" role="cell">' + c.missions + '</span>' +
        '<span class="num" role="cell">' + c.hints + '</span>' +
        '<span role="cell"><i class="status ' + cls + '">' + text + '</i></span>' +
        '<span class="num ' + (c.delta > 0 ? 'num--up' : c.delta < 0 ? 'num--down' : '') + '" role="cell">' +
          (c.delta > 0 ? '+' + fmt(c.delta) : c.delta < 0 ? fmt(c.delta) : '—') + '</span>';
      frag.appendChild(row);
    });
    board.body.replaceChildren(frag);
    if (reduce) return;
    $$('.tr', board.body).forEach(r => {
      const prev = before.get(r.dataset.id);
      if (prev == null) return;
      const dy = prev - r.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) return;
      r.style.transition = 'none';
      r.style.transform = 'translateY(' + dy + 'px)';
      requestAnimationFrame(() => {
        r.style.transition = 'transform .55s cubic-bezier(.2,0,0,1)';
        r.style.transform = '';
      });
    });
  }
  function syncHUD() {
    const list = sorted();
    const me = focusCrew();
    const rank = list.indexOf(me) + 1;
    setHUD({
      points: me.points, cash: me.cash,
      // stars are police attention: only a listed crew can light 4 or 5
      stars: me.wanted ? 5 : (rank <= 3 ? 3 : rank <= 6 ? 2 : 1)
    });
  }
  const say = html => { if (board.msg) board.msg.innerHTML = html; };
  const glitch = () => {
    if (!board.card || reduce) return;
    board.card.classList.remove('is-glitch'); void board.card.offsetWidth; board.card.classList.add('is-glitch');
  };

  function runRound() {
    if (board.busy) return;
    if (board.round > 3) { say('That was <b>Round 3</b> — the board is locked. Press <b>Big Heist · top 5</b>.'); snack('Board locked', 'Final points'); return; }
    board.busy = true;
    const n = board.round;
    board.crews.forEach(c => {
      const plays = 1 + Math.floor(Math.random() * 3);
      let gained = 0;
      for (let i = 0; i < plays; i++) {
        const base = 55 + Math.random() * 50;
        const hint = Math.random() < 0.28 ? 1 : 0;
        gained += Math.max(0, base - hint * CONFIG.hintCost);
        c.hints += hint;
      }
      gained = Math.round(gained);
      if (c.wanted) gained = Math.round(gained * (1 - CONFIG.wantedCut));
      c.delta = gained;
      c.points += gained;
      c.missions += plays;
      c.cash += Math.round(200 + Math.random() * 520);
    });
    board.round = n + 1;
    glitch(); render(); syncHUD();
    const leader = sorted()[0];
    say(n < 3
      ? '<b>Round ' + n + ' banked.</b> Points are live and the <b>top three</b> are now police targets — press <b>Publish targets</b> to hand the list to the officers.'
      : '<b>Round 3 banked — final round over.</b> ' + leader.name + ' leads on ' + fmt(leader.points) + ' points. Press <b>Big Heist · top 5</b> to pick the finalists.');
    snack('Round ' + n + ' banked', leader.name + ' leads');
    board.busy = false;
  }

  function publishTargets() {
    if (board.crews.some(c => c.heist)) {
      say('The finalists are already picked — the board is locked for the finale. No new target list after the Big Heist.');
      snack('Board locked', 'no targets now');
      return;
    }
    const top3 = board.crews.slice().sort((a, b) => b.points - a.points).slice(0, 3);
    const ids = new Set(top3.map(c => c.id));
    board.crews.forEach(c => { c.wanted = ids.has(c.id); });
    glitch(); render(); syncHUD();
    say('<b>Target list for Round ' + board.round + ':</b> ' + top3.map(c => c.name).join(', ') +
      '. Verified crew ID plus a leader photo sets <b>WANTED</b> — every mission then pays <b>20% less</b> until Dexter clears it for ' + money(CONFIG.dexterFee) + '.');
    snack('Target list published', '3 crews listed');
  }

  function dexterClear() {
    if (board.crews.some(c => c.heist)) {
      say('Status was wiped when the finalists were picked. Nobody owes Dexter anything now.');
      snack('Season over', 'status wiped');
      return;
    }
    const t = board.crews.slice().sort((a, b) => b.points - a.points).find(c => c.wanted && c.cash >= CONFIG.dexterFee);
    if (!t) {
      const any = board.crews.some(c => c.wanted);
      say(any
        ? 'Nobody on the list can cover the ' + money(CONFIG.dexterFee) + ' fee right now — they play on at 80% and come back after the next station.'
        : 'No crew is wanted at this moment. Press <b>Publish targets</b> first: the list is what makes somebody a target.');
      snack(any ? 'Fee unaffordable' : 'Nobody is listed', 'Dexter stays open');
      return;
    }
    t.wanted = false;
    t.cash -= CONFIG.dexterFee;
    t.delta = -CONFIG.dexterFee;
    glitch(); render(); syncHUD();
    say('<b>' + t.name + '</b> paid Dexter ' + money(CONFIG.dexterFee) + ' at ' + nowIST() +
      '. Logged, timed, announced — from the next mission they score full points again.');
    snack('Status cleared · ' + t.name, '−' + money(CONFIG.dexterFee));
  }

  function bigHeist() {
    const top5 = board.crews.slice().sort((a, b) => b.points - a.points).slice(0, 5);
    const ids = new Set(top5.map(c => c.id));
    board.crews.forEach(c => { c.heist = ids.has(c.id); c.wanted = false; c.delta = 0; });
    glitch(); render(); syncHUD();
    say('<b>14:15 — qualified for The Big Heist:</b> ' + top5.map((c, i) => (i + 1) + '. ' + c.name).join(' · ') +
      '. Wanted status is wiped before the finale. Bonuses: <b>+150</b> first to finish, <b>+120</b>, <b>+100</b>, <b>+75</b> for every finalist.');
    snack('Top 5 qualified', 'the heist is live');
  }

  [['runRound', runRound], ['raid', publishTargets], ['alert', dexterClear], ['heistBtn', bigHeist]].forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  });
  $$('.seg-btn[data-board]').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.seg-btn[data-board]').forEach(b => b.setAttribute('aria-selected', String(b === btn)));
      board.view = btn.dataset.board;
      render(); syncHUD();
      say({
        overall: 'Default view: <b>points</b>, highest first. This is the only ordering that decides anything.',
        targets: 'Target view: listed crews first — this is what control pushes to the officer phones after every round.',
        clean: 'Least hints first: a tie-break view, and the one the awards photo gets taken from.'
      }[board.view]);
    });
  });
  render(); syncHUD();

  /* ── 10 · crew file + canvas QR ─────────────────────────────────────── */
  function hash32(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  }
  const prng = seed => () => {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  function drawQR(canvas, payload) {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const N = 25, S = canvas.width / N, rnd = prng(hash32(payload));
    ctx.fillStyle = '#fdf6ea';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const grid = Array.from({ length: N }, () => Array(N).fill(false));
    const finder = (x, y) => {
      for (let dy = 0; dy < 7; dy++) for (let dx = 0; dx < 7; dx++) {
        const edge = dx === 0 || dy === 0 || dx === 6 || dy === 6;
        const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        grid[y + dy][x + dx] = edge || core;
      }
    };
    finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
    for (let i = 8; i < N - 8; i++) { grid[6][i] = i % 2 === 0; grid[i][6] = i % 2 === 0; }
    const reserved = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (reserved(x, y) || x === 6 || y === 6) continue;
      grid[y][x] = rnd() > 0.52;
    }
    ctx.fillStyle = '#150a20';
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (grid[y][x]) ctx.fillRect(x * S, y * S, S, S);
  }

  const ZONES = ['Picasso Block', 'Ocean Drive', 'Campus Quarter', 'The Marina'];
  const crewForm = $('#crewForm');
  const crewInput = $('#crewNameInput');
  const crewMsg = $('#crewFormMsg');
  function applyCrew(raw) {
    const name = (raw || '').trim().replace(/\s+/g, ' ');
    if (name.length < 3) {
      crewMsg.textContent = 'Three characters minimum — a speaker has to read it out.';
      crewMsg.className = 'form-msg is-bad';
      return false;
    }
    const idn = pad(1 + (hash32(name) % 99));
    const members = 4 + (hash32(name + 'm') % 2);
    const zone = ZONES[hash32(name + 'z') % ZONES.length];
    $('#qrCrewName').textContent = name.toUpperCase();
    $('#crewMeta').textContent = 'VP-11-' + idn + ' · ' + members + ' members · ' + zone;
    drawQR($('#crewQR'), 'vc://crew/VP-11-' + idn + '/' + name);
    crewMsg.textContent = 'File stamped · vc://crew/VP-11-' + idn + ' — the real code is issued at check-in.';
    crewMsg.className = 'form-msg is-good';
    snack('Crew file created', name);
    return true;
  }
  if (crewForm) {
    crewForm.addEventListener('submit', e => {
      e.preventDefault();
      if (!applyCrew(crewInput.value)) { crewInput.focus(); return; }
      crewInput.blur();
    });
  }
  drawQR($('#crewQR'), 'vc://crew/VP-11-047/THE NEON UNDERTAKERS');

  /* ── 11 · mission category filter ───────────────────────────────────── */
  const missionCards = $$('.card--mission[data-zone]');
  $$('.chip-btn[data-zone]').forEach(btn => {
    btn.addEventListener('click', () => {
      const z = btn.dataset.zone;
      $$('.chip-btn[data-zone]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      let shown = 0;
      missionCards.forEach(c => {
        const on = z === 'all' || c.dataset.zone === z;
        c.classList.toggle('is-hidden', !on);
        if (on) shown++;
      });
      say(z === 'all'
        ? 'All five categories. Every crew runs the same shortlist — three rounds, one scoring sheet.'
        : shown + ' category shown. The shortlist mixes all five so a single strength cannot win the day.');
    });
  });

  /* ── 12 · mission lab card builder ──────────────────────────────────── */
  const ideaForm = $('#ideaForm');
  const ifTime = $('#ifTime'), ifTimeOut = $('#ifTimeOut'), ifMsg = $('#ifMsg');
  if (ifTime) {
    const tOut = () => { ifTimeOut.textContent = ifTime.value + ' min'; };
    ifTime.addEventListener('input', tOut); tOut();
  }
  const ideaData = () => ({
    name: ($('#ifName').value || '').trim(),
    problem: ($('#ifProblem').value || '').trim(),
    category: $('#ifCategory').value,
    time: ifTime ? ifTime.value : '5',
    materials: ($('#ifMaterials').value || '').trim(),
    win: ($('#ifWin').value || '').trim()
  });
  const ideaText = d => [
    'MISSION CARD · ' + (d.name || 'Untitled'),
    'Category: ' + d.category,
    'Time: ' + d.time + ' minutes',
    'Problem: ' + d.problem,
    'Materials: ' + d.materials,
    'How to win: ' + d.win,
    'Scoring: 60 completion / 25 quality / 15 speed / +10 bonus / −5 per hint',
    'Submitted to GDG Chitkara · Vice City mission review'
  ].join('\n');
  if (ideaForm) {
    ideaForm.addEventListener('submit', e => {
      e.preventDefault();
      const d = ideaData();
      const missing = ['name', 'problem', 'materials', 'win'].filter(k => !d[k]);
      if (missing.length) {
        ifMsg.textContent = 'Still needed: ' + missing.join(', ') + '.';
        ifMsg.className = 'form-msg is-bad';
        const el = document.getElementById('if' + missing[0][0].toUpperCase() + missing[0].slice(1));
        if (el) el.focus();
        return;
      }
      $('#icName').textContent = d.name;
      $('#icProblem').textContent = d.problem;
      $('#icCategory').textContent = d.category;
      $('#icTime').textContent = d.time + ' minutes';
      $('#icMaterials').textContent = d.materials;
      $('#icWin').textContent = d.win;
      const mins = num(d.time, 5);
      $('#icNote').textContent = mins > 8
        ? 'Over the 3–8 minute window — control will ask you to split it before the shortlist.'
        : mins < 3
          ? 'Under the window — pair it with another idea or add a quality check.'
          : 'Inside the window. Now nail the two things a judge needs: the exact pass condition, and what a hint costs.';
      $('#ideaCard').classList.add('is-in');
      ifMsg.textContent = 'Card built. Copy it and drop it in the mission review channel.';
      ifMsg.className = 'form-msg is-good';
      snack('Mission card built', d.name);
    });
    const copy = $('#ifCopy');
    if (copy) copy.addEventListener('click', async () => {
      const text = ideaText(ideaData());
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; }
      catch (err) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
        ta.remove();
      }
      ifMsg.textContent = ok ? 'Copied — paste it into the review form.' : 'Clipboard blocked — select the card and copy manually.';
      ifMsg.className = 'form-msg ' + (ok ? 'is-good' : 'is-bad');
    });
  }

  /* ── 13 · search ────────────────────────────────────────────────────── */
  const searchInput = $('#searchInput');
  const results = $('#searchResults');
  const searchNote = $('#searchNote');
  const searchClear = $('#searchClear');
  const searchToggle = $('#searchToggle');
  const INDEX = [
    { s: 'briefing', t: 'What is this event', b: 'A GTA-inspired campus challenge: three mission rounds, a police target list, Dexter\'s clearance desk and one Big Heist for the top five crews.' },
    { s: 'briefing', t: 'When and where', b: 'Saturday 13 February 2027, 09:00 to 15:30 IST, Chitkara University Punjab. Crews of 4 to 5 students with valid ID cards.' },
    { s: 'crew', t: 'Crew size and crew ID', b: 'Four or five students, one registration per team, one team ID issued at check-in. Points only land against that ID.' },
    { s: 'crew', t: 'Team leader photo and privacy', b: 'Officers photograph the team leader for the internal wanted board only. Every image is deleted after the event and you can opt out at registration.' },
    { s: 'crew', t: 'Opening wallet in-game cash', b: 'Every crew starts with the same fictional wallet, proposed at one thousand in-game dollars. No real money is ever exchanged.' },
    { s: 'roles', t: 'Police rules and safety', b: 'Volunteer officers never chase, touch, block or run. Approved zones only, verify the ID before marking anyone wanted.' },
    { s: 'roles', t: 'Dexter clearance desk', b: 'One broker, one desk, one fee of one hundred in-game cash to remove a wanted status. The same fee for every crew, logged, timed and announced.' },
    { s: 'roles', t: 'Coordinators and control room', b: 'Station referees verify crew IDs, check wanted status before a mission, judge on the printed checklist and enter points. Control approves every correction.' },
    { s: 'missions', t: 'Mission categories', b: 'Tech and logic, physical team games, creative tasks, clue hunt and observation, strategy and decision making. The shortlist mixes all five.' },
    { s: 'missions', t: 'Mission length and examples', b: 'Missions run three to eight minutes: decode the message, blindfold navigation, crew poster, hidden clue search, risk or reward, the negotiation.' },
    { s: 'missions', t: 'Safe by design', b: 'Physical missions are walked and supervised, water at every station, no stunts and no restricted areas.' },
    { s: 'scoring', t: 'How points are scored', b: 'Mission completion up to sixty, accuracy and quality up to twenty five, speed bonus up to fifteen, optional bonus task plus ten, every hint minus five.' },
    { s: 'scoring', t: 'Best possible mission', b: 'One hundred and ten points. Perfect quality, fastest slot, bonus task taken and no hints used.' },
    { s: 'scoring', t: 'Wanted penalty twenty percent', b: 'A wanted crew keeps only eighty percent of a mission\'s points. Status is checked before the mission starts.' },
    { s: 'scoring', t: 'Tie-breakers', b: 'Heist completion time, then missions banked, then fewer hints, then a written control room decision.' },
    { s: 'targets', t: 'How the target list works', b: 'After every round the top three crews on the leaderboard become official police targets. The list is republished every round.' },
    { s: 'targets', t: 'How to stop being wanted', b: 'Pay Dexter one hundred in-game cash at his desk, or wait for the next round when the list is recalculated.' },
    { s: 'board', t: 'City board views', b: 'Points decides the day. Target list view shows who the police are sent to, least hints view is the tie-break and awards photo view.' },
    { s: 'schedule', t: 'Run of day timeline', b: 'Registration 09:00, briefing 09:30, Round 1 at 10:00, first target list 11:30, Round 2 at 11:45, lunch 12:45, Round 3 at 13:15, top five at 14:15, Big Heist 14:30.' },
    { s: 'heist', t: 'Big Heist qualification', b: 'The top five crews on the leaderboard after the final mission round qualify. Wanted status is wiped before the finale.' },
    { s: 'heist', t: 'Heist bonus points', b: 'First crew to complete plus one hundred and fifty, second plus one hundred and twenty, third plus one hundred, every other finalist plus seventy five.' },
    { s: 'heist', t: 'Final score formula', b: 'Mission points from three rounds, plus heist bonus, minus penalties, verified against the control room sheet.' },
    { s: 'prizes', t: 'Prizes and awards', b: 'Trophies for the top three, certificates for every participant, plus best heist crew, best strategy play and cleanest crew.' },
    { s: 'platform', t: 'Platform API and spec', b: 'Crew registration, mission attempt scoring, target list publication, clearance ledger, heist bonuses and a realtime board stream. Full contract in spec.md.' },
    { s: 'control', t: 'Control room operations', b: 'One operator channel, one mirrored spreadsheet, corrections approved in writing, and a stop button that beats every schedule.' },
    { s: 'lab', t: 'Submit a mission idea', b: 'Every team member submits one or two mission ideas with problem statement, category, time, materials and how to win. Cards go to the group review.' },
    { s: 'faq', t: 'Rules and code of conduct', b: 'Respect the zone, no running or rough play, no touching, one crew ID per team, coordinators final, no real money, photos deleted after the event.' },
    { s: 'faq', t: 'Phone battery or lost crew ID', b: 'Coordinators can look your crew up and control keeps a printed mirror of the board. Screenshot your crew ID anyway.' }
  ];
  const norm = s => s.toLowerCase().replace(/[’']/g, "'");
  function highlight(text, q) {
    if (!q) return text;
    // Only plain words are highlighted; anything with punctuation is skipped.
    const words = q.split(/\s+/).filter(w => /^[a-z0-9']{2,}$/.test(w));
    if (!words.length) return text;
    return text.replace(new RegExp('\\b(' + words.join('|') + ')\\b', 'gi'), '<mark>$1</mark>');
  }

  function runSearch() {
    if (!searchInput || !results) return;
    const q = norm(searchInput.value.trim());
    if (searchClear) searchClear.hidden = !q;
    results.replaceChildren();
    const allSections = $$('main section[id]');

    if (q.length < 2) {
      if (searchNote) {
        searchNote.textContent = 'Rules, scoring, timings, Dexter’s fee — one field.';
        searchNote.className = 'search-note';
      }
      allSections.forEach(s => s.classList.remove('search-dim'));
      return;
    }

    const tokens = q.split(/\s+/).filter(Boolean);
    let hits = INDEX.filter(row => {
      const hay = norm(row.t + ' ' + row.b + ' ' + row.s);
      return tokens.every(t => hay.includes(t));
    }).slice(0, 6);

    if (!hits.length) {
      // Nothing in the curated index: fall back to the page text so the field never lies.
      allSections.forEach(sec => {
        const hay = norm(sec.textContent).replace(/\s+/g, ' ');
        const at = tokens.every(t => hay.includes(t)) ? hay.indexOf(tokens[0]) : -1;
        if (at < 0) return;
        const from = Math.max(0, at - 45);
        const title = sec.getAttribute('data-search-title') ||
          (sec.querySelector('h2') && sec.querySelector('h2').textContent) || sec.id;
        hits.push({ s: sec.id, t: title.trim(), b: (from ? '…' : '') + hay.slice(from, from + 150).trim() + '…' });
      });
      hits = hits.slice(0, 4);
    }

    if (searchNote) {
      searchNote.textContent = hits.length
        ? hits.length + (hits.length === 1 ? ' match' : ' matches') + ' — jump to a section.'
        : 'Nothing in the brief matches “' + searchInput.value.trim() + '”. Try Dexter, hints, heist, photo, cash.';
      searchNote.className = 'search-note' + (hits.length ? '' : ' is-bad');
    }

    const hitSections = new Set(hits.map(r => r.s));
    allSections.forEach(s => s.classList.toggle('search-dim', !hitSections.has(s.id)));

    const seen = new Set();
    hits.forEach(row => {
      if (seen.has(row.s + row.t)) return;
      seen.add(row.s + row.t);
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + row.s;
      a.innerHTML = '<b>' + row.s + '</b><p><strong>' + highlight(row.t, q) + '</strong> — ' + highlight(row.b, q) + '</p>';
      li.appendChild(a);
      results.appendChild(li);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', runSearch);
    searchInput.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const first = $('a', results);
      if (first) { first.click(); searchNote.textContent = 'Jumped. The board itself opens at check-in.'; }
    });
  }
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = ''; runSearch(); searchInput.focus();
    });
  }
  if (searchToggle) {
    searchToggle.addEventListener('click', () => {
      if (!searchInput) return;
      const open = searchInput.getBoundingClientRect().top < window.innerHeight;
      if (!open) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      searchInput.focus({ preventScroll: true });
      searchToggle.setAttribute('aria-expanded', 'true');
    });
  }

  /* ── 14 · tabs, copy, ripple, snackbar, links, FAB ──────────────────── */
  $$('.tabs').forEach(group => {
    const tabs = $$('.tab', group);
    const panels = $$('.panel-tab', group);
    const select = idx => {
      tabs.forEach((t, i) => { t.setAttribute('aria-selected', String(i === idx)); t.tabIndex = i === idx ? 0 : -1; });
      panels.forEach((p, i) => { p.hidden = i !== idx; });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        tabs[n].focus(); select(n);
      });
    });
    select(0);
  });

  let snackEl = $('#snackbar'), snackText = $('#snackText'), snackTimer = 0;
  function snack(title, sub) {
    if (!snackEl || !snackText) return;
    snackText.textContent = sub ? title + ' — ' + sub : title;
    snackEl.classList.add('is-in');
    clearTimeout(snackTimer);
    snackTimer = setTimeout(() => snackEl.classList.remove('is-in'), 3600);
  }
  const snackClose = $('#snackClose');
  if (snackClose) snackClose.addEventListener('click', () => snackEl.classList.remove('is-in'));

  if (!reduce) {
    $$('.btn, .fab, .seg-btn, .chip-btn').forEach(el => {
      el.addEventListener('pointerdown', e => {
        const r = el.getBoundingClientRect();
        const size = Math.max(r.width, r.height);
        const span = document.createElement('span');
        span.className = 'ripple';
        span.style.cssText = 'inline-size:' + size + 'px;block-size:' + size + 'px;left:' + (e.clientX - r.left - size / 2) + 'px;top:' + (e.clientY - r.top - size / 2) + 'px';
        el.appendChild(span);
        setTimeout(() => span.remove(), 540);
      });
    });
  }

  $$('[data-link]').forEach(a => {
    const key = a.dataset.link;
    if (CONFIG.links[key]) a.href = CONFIG.links[key];
    if (/^https?:/.test(a.href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  });

  if (fab) fab.addEventListener('click', () => {
    const el = document.getElementById('board');
    if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  const year = $('[data-year]');
  if (year) year.textContent = '2027';

  
  // ── run-of-day strip · drag, keys and a designed rail (no browser scrollbar)
  (function dayStrip() {
    const strip = $('.timeline');
    if (!strip) return;
    const rail = $('.tl-rail i');
    const step = () => Math.max(240, strip.clientWidth * 0.75);
    function paint() {
      if (!rail) return;
      const max = strip.scrollWidth - strip.clientWidth;
      const w = Math.min(1, Math.max(0.12, strip.clientWidth / strip.scrollWidth));
      const x = max > 0 ? strip.scrollLeft / max : 0;
      rail.style.width = (w * 100).toFixed(2) + '%';
      rail.style.left = (x * (1 - w) * 100).toFixed(2) + '%';
    }
    let drag = null;
    strip.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') return;      // touch already scrolls natively
      drag = { x: e.clientX, left: strip.scrollLeft, id: e.pointerId };
      strip.setPointerCapture(e.pointerId);
      strip.classList.add('is-dragging');
    });
    strip.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      strip.scrollLeft = drag.left - (e.clientX - drag.x);
    });
    const end = e => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      strip.classList.remove('is-dragging');
    };
    strip.addEventListener('pointerup', end);
    strip.addEventListener('pointercancel', end);
    strip.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      strip.scrollLeft += (e.key === 'ArrowRight' ? 1 : -1) * step();
    });
    strip.addEventListener('scroll', paint, { passive: true });
    window.addEventListener('resize', paint);
    paint();
  })();

  /* ── 15 · dispatch reel (five moments) ──────────────────────────────── */
  (function dispatchReel() {
    const shell = $('#reel'), stack = $('#reelStack'), list = $('#reelList'), track = $('#reelTrack');
    const panel = $('#reelPanel'), tag = $('#reelTag'), title = $('#reelTitle'), cap = $('#reelCap');
    const prev = $('#reelPrev'), next = $('#reelNext'), play = $('#reelPlay');
    if (!shell || !stack || !list || !track) return;

    const MOMENTS = [
      { t: '09:00', h: 'Check-in & crew IDs', img: 'assets/img/crew-identity.jpg',
        cap: 'One crew, one ID, one wallet. The board opens and the city starts moving.' },
      { t: '10:00', h: 'Round 1 · starter missions', img: 'assets/img/neon-club-front.jpg',
        cap: 'Short missions, one scoring sheet, the first points banked before anyone can overthink it.' },
      { t: '11:30', h: 'The target list goes out', img: 'assets/img/police-arrest.jpg',
        cap: 'Top three crews become official targets. Officers get the crew IDs and the leader photos.' },
      { t: '12:45', h: 'Dexter’s desk', img: 'assets/img/billiard-negotiation.jpg',
        cap: 'One hundred in-game cash takes the wanted status off the board. Somebody always pays.' },
      { t: '14:30', h: 'The Big Heist', img: 'assets/img/customs-garage.jpg',
        cap: 'Five crews, one final job, +150 for whoever finishes first. The day is decided here.' }
    ];
    const DWELL = 6400;
    let i = 0, timer = null, playing = !reduce, swipe = null;

    MOMENTS.forEach((m, n) => {
      const im = new Image();
      im.src = m.img; im.alt = ''; im.decoding = 'async';
      im.loading = n === 0 ? 'eager' : 'lazy';
      stack.appendChild(im);

      const li = document.createElement('li');
      const row = document.createElement('button');
      row.className = 'reel-row'; row.type = 'button'; row.id = 'reelRow' + n;
      row.setAttribute('role', 'tab');
      row.setAttribute('aria-selected', String(n === 0));
      row.setAttribute('aria-controls', 'reelPanel');
      row.tabIndex = n === 0 ? 0 : -1;
      row.innerHTML = '<span class="reel-time">' + m.t + '</span>' +
        '<span><b class="reel-row-t">' + m.h + '</b><small>' + m.cap + '</small></span>' +
        '<span class="reel-num">0' + (n + 1) + '</span>';
      li.appendChild(row); list.appendChild(li);

      const seg = document.createElement('button');
      seg.className = 'reel-seg'; seg.type = 'button';
      seg.setAttribute('aria-label', 'Jump to ' + m.t + ' — ' + m.h);
      seg.appendChild(document.createElement('i'));
      track.appendChild(seg);
    });

    const layers = Array.prototype.slice.call(stack.children);
    const rows = Array.prototype.slice.call(list.querySelectorAll('.reel-row'));
    const segs = Array.prototype.slice.call(track.children);

    function paintSegs(run) {
      segs.forEach(function (s, k) {
        const bar = s.firstChild;
        bar.style.transition = 'none';
        bar.style.width = k < i ? '100%' : '0%';
        if (k === i && run) {
          void bar.offsetWidth;
          bar.style.transition = 'width ' + DWELL + 'ms linear';
          bar.style.width = '100%';
        }
      });
    }
    function arm() {
      clearTimeout(timer);
      if (!playing) return;
      timer = setTimeout(function () { show(i + 1); }, DWELL);
    }
    function show(n, moveFocus) {
      i = (n + MOMENTS.length) % MOMENTS.length;
      layers.forEach(function (im, k) { im.classList.toggle('is-live', k === i); });
      rows.forEach(function (r, k) {
        r.setAttribute('aria-selected', String(k === i));
        r.tabIndex = k === i ? 0 : -1;
      });
      if (moveFocus) rows[i].focus();
      panel.setAttribute('aria-labelledby', 'reelRow' + i);
      tag.textContent = '0' + (i + 1) + ' / 0' + MOMENTS.length;
      title.textContent = MOMENTS[i].t + ' · ' + MOMENTS[i].h;
      cap.textContent = MOMENTS[i].cap;
      paintSegs(playing);
      arm();
    }
    function setPlaying(on) {
      playing = on && !reduce;
      play.setAttribute('aria-pressed', String(playing));
      play.setAttribute('aria-label', playing ? 'Pause the reel' : 'Play the reel');
      paintSegs(playing);
      arm();
    }

    rows.forEach(function (r, n) { r.addEventListener('click', function () { show(n); }); });
    segs.forEach(function (s, n) { s.addEventListener('click', function () { show(n); }); });
    prev.addEventListener('click', function () { show(i - 1); });
    next.addEventListener('click', function () { show(i + 1); });
    play.addEventListener('click', function () { setPlaying(!playing); });

    function arrow(e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      show(i + (e.key === 'ArrowRight' ? 1 : -1), e.currentTarget === list);
    }
    list.addEventListener('keydown', arrow);
    panel.addEventListener('keydown', arrow);

    panel.addEventListener('pointerdown', function (e) { swipe = { x: e.clientX, id: e.pointerId }; });
    panel.addEventListener('pointerup', function (e) {
      if (!swipe || e.pointerId !== swipe.id) return;
      const dx = e.clientX - swipe.x;
      swipe = null;
      if (Math.abs(dx) > 48) show(i + (dx < 0 ? 1 : -1));
    });

    // a reel nobody is looking at should not be moving
    ['mouseenter', 'focusin'].forEach(function (ev) {
      shell.addEventListener(ev, function () { clearTimeout(timer); });
    });
    ['mouseleave', 'focusout'].forEach(function (ev) {
      shell.addEventListener(ev, function () { if (playing) arm(); });
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearTimeout(timer);
      else if (playing) show(i);
    });

    if (reduce) setPlaying(false);
    show(0);
  })();

  /* ── 16 · section identity ────────────────────────────────────────────
     Each band carries data-motif (a sprite id) and data-stat. The motif becomes
     an oversized outline watermark in the band's accent; the band lights up
     once, the first time its header is on screen. */
  (() => {
    const NS = 'http://www.w3.org/2000/svg';
    const bands = $$('section[data-tone]');
    bands.forEach(band => {
      const id = band.dataset.motif;
      if (id && document.getElementById(id)) {
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'band-wm');
        svg.setAttribute('aria-hidden', 'true');
        const use = document.createElementNS(NS, 'use');
        use.setAttribute('href', '#' + id);
        svg.appendChild(use);
        band.insertBefore(svg, band.firstChild);
      }
      // the stat chip is data, not decoration: keep it in the DOM, next to the title
      const stat = band.dataset.stat;
      const head = band.querySelector('.band-head');
      if (stat && head && !head.querySelector('.band-stat')) {
        const chip = document.createElement('span');
        chip.className = 'band-stat';
        chip.textContent = stat;
        head.appendChild(chip);
      }
    });
    if (reduce || !('IntersectionObserver' in window)) {
      bands.forEach(b => b.classList.add('is-lit'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-lit');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });
    bands.forEach(b => io.observe(b));
  })();

  setTimeout(() => snack('Welcome to Vice City', 'demo board · press Run round'), 1800);
})();
