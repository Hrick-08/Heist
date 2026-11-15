/* ==========================================================================
   VICE CITY · THE CAMPUS TAKEOVER — Concept A behaviour
   GDG on Campus Chitkara × DGIT Gaming Club

   Everything here is a DEMO of the platform described in ../spec.md.
   No network calls, no storage beyond a theme-free localStorage opt-out,
   no dependencies except the vendored three.js used by scene3d.js.

   Modules:
     01 config + helpers        07 wanted calculator
     02 reveals                 08 heist calculator
     03 countdown               09 city board simulator (FLIP)
     04 nav + scrollspy        10 crew file + QR
     05 HUD                    11 mission category filter
     06 scoring sheet calc     12 mission lab card builder
                               13 spec tabs + copy + links + toast
   ========================================================================== */
(() => {
  'use strict';

  /* ── 01 · config + helpers ──────────────────────────────────────────── */
  const CONFIG = {
    eventDate: '2027-02-13T09:00:00+05:30',   // Saturday 13 February 2027, 09:00 IST
    openingWallet: 1000,                       // in-game cash per crew (proposed)
    dexterFee: 100,                            // clearance fee — spec §5
    wantedCut: 0.2,                            // 20% of points while wanted — spec §4
    heistBonus: { 1: 150, 2: 120, 3: 100, finish: 75 },
    hintCost: 5,                               // points per hint — spec §3
    links: {
      discord: 'https://discord.gg/gdgchitkara',
      register: 'https://gdg.community.dev/gdg-on-campus-chitkara-university-punjab-india/'
    }
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const num = (v, fallback = 0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : fallback; };
  const fmt = n => Math.round(n).toLocaleString('en-IN');
  const money = n => '$' + fmt(n);
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 02 · reveals ───────────────────────────────────────────────────── */
  const revealEls = $$('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e, i) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const sib = Array.from(el.parentElement.children).indexOf(el) % 6;
        el.style.transitionDelay = (sib * 60) + 'ms';
        el.classList.add('is-in');
        obs.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(el => io.observe(el));
  }

  /* ── 03 · countdown ─────────────────────────────────────────────────── */
  const clock = $('#countdown');
  const target = new Date(CONFIG.eventDate).getTime();
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    if (!clock) return;
    let ms = target - Date.now();
    if (ms < 0) ms = 0;
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24,
          m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
    // the alert strip and the hero chip both carry data-unit: tick them together
    const set = (unit, val) => $$('[data-unit="' + unit + '"]').forEach(el => {
      if (el.textContent !== val) el.textContent = val;
    });
    set('days', pad(d)); set('hours', pad(h)); set('minutes', pad(m)); set('seconds', pad(s));
  };
  tick();
  setInterval(tick, 1000);

  /* ── 04 · chapter rail + scrollspy ──────────────────────────────────── */
  const rail = $('#navRail');
  const railProg = $('#railProg');
  let dragEnd = 0;
  if (rail) {
    let drag = null;
    rail.addEventListener('pointerdown', e => {
      drag = { x: e.clientX, left: rail.scrollLeft, moved: 0 };
      rail.classList.add('is-dragging');
      try { rail.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    });
    rail.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      rail.scrollLeft = drag.left - dx;
    });
    const endDrag = () => {
      if (!drag) return;
      if (drag.moved > 6) dragEnd = performance.now();
      drag = null;
      rail.classList.remove('is-dragging');
    };
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => rail.addEventListener(t, endDrag));
    // a drag must not also follow the chapter it started on
    rail.addEventListener('click', e => {
      if (performance.now() - dragEnd < 200) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    // keys move the strip instantly: a keyboard user should never wait on an animation
    const nudge = dx => { rail.scrollLeft += dx; };
    rail.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      nudge((e.key === 'ArrowRight' ? 1 : -1) * Math.round(rail.clientWidth * 0.55));
    });
  }
  // keep the live chapter inside the rail without yanking the strip around
  function keepInView(a) {
    if (!rail || !a) return;
    const r = a.getBoundingClientRect(), box = rail.getBoundingClientRect();
    if (r.left < box.left + 18 || r.right > box.right - 18) {
      rail.scrollTo({
        left: rail.scrollLeft + (r.left - box.left) - (box.width - r.width) / 2,
        behavior: prefersReduced ? 'auto' : 'smooth'
      });
    }
  }
  function setRailProgress(p) {
    if (!railProg) return;
    const view = clamp(window.innerHeight / Math.max(1, document.body.scrollHeight), 0.08, 0.42);
    railProg.style.width = (view * 100).toFixed(2) + '%';
    railProg.style.left = (clamp(p, 0, 1) * (100 - view * 100)).toFixed(2) + '%';
  }

  const masthead = $('.masthead');
  const sections = $$('main [data-page]');
  const linkFor = id => $('.site-nav a[href="#' + id + '"]');
  let spyTick = false;
  const spy = () => {
    if (spyTick) return;
    spyTick = true;
    requestAnimationFrame(() => {
      spyTick = false;
      const y = window.scrollY + 140;
      let current = sections[0];
      sections.forEach(s => { if (s.offsetTop <= y) current = s; });
      if (masthead) masthead.classList.toggle('is-stuck', window.scrollY > 260);
      const p = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
      $$('.site-nav a').forEach(a => a.removeAttribute('aria-current'));
      if (current) {
        const a = linkFor(current.id);
        if (a) { a.setAttribute('aria-current', 'true'); keepInView(a); }
      }
      setRailProgress(p);
      setHUDProgress(p);
    });
  };
  window.addEventListener('scroll', spy, { passive: true });
  window.addEventListener('resize', spy);

  /* ── 05 · HUD ───────────────────────────────────────────────────────── */
  const hud = {
    points: $('#hudPoints'),
    cash: $('#hudCash'),
    stars: $('#hudStars'),
    round: $('#hudRound'),
    shell: $('#hud')
  };
  function bump(el, text) {
    if (!el || el.textContent === text) return;
    el.textContent = text;
    if (prefersReduced) return;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }
  function setStars(level) {
    if (!hud.stars) return;
    $$('i', hud.stars).forEach((s, i) => s.classList.toggle('on', i < level));
  }
  function setHUDProgress(p) {
    if (!hud.shell) return;
    hud.shell.style.setProperty('--scroll', clamp(p, 0, 1).toFixed(3));
  }
  function setHUD(state) {
    bump(hud.points, fmt(state.points));
    bump(hud.cash, money(state.cash));
    if (hud.round) hud.round.innerHTML = state.round + '<span class="hud-of">/3</span>';
    setStars(state.stars);
  }
  // step aside when the reader reaches the colophon
  const footer = $('.backcover');
  if (footer && hud.shell && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      entries.forEach(e => hud.shell.classList.toggle('is-away', e.isIntersecting));
    }, { threshold: 0.06 }).observe(footer);
  }

  /* ── 06 · scoring sheet calculator ──────────────────────────────────── */
  const sc = {
    done: $('#scDone'), quality: $('#scQuality'), speed: $('#scSpeed'),
    bonus: $('#scBonus'), hints: $('#scHints'),
    total: $('#scTotal'), verdict: $('#scVerdict'), tone: $('#scTone')
  };
  function calcScore() {
    if (!sc.total) return;
    const done = num(sc.done.value), q = num(sc.quality.value), sp = num(sc.speed.value),
          bo = num(sc.bonus.value), hi = num(sc.hints.value);
    const raw = done + q + sp + bo - hi * CONFIG.hintCost;
    const out = Math.max(0, raw);
    [['scDoneOut', done], ['scQualityOut', q], ['scSpeedOut', sp], ['scBonusOut', bo],
     ['scHintsOut', hi ? '−' + (hi * CONFIG.hintCost) : '0']].forEach(([id, v]) => {
      const el = document.getElementById(id); if (el) el.textContent = String(v);
    });
    sc.total.textContent = fmt(out);
    const maxed = raw >= 110;
    let verdict, tone;
    if (maxed) {
      verdict = 'Textbook run';
      tone = '110 of 110. Perfect quality, fastest slot, bonus task taken, no hints. This is the number every station brief is written against.';
    } else if (hi > 0 && done >= 55) {
      verdict = 'Finished, paid for help';
      tone = 'You completed the mission and spent ' + (hi * CONFIG.hintCost) + ' points on hints. A crew that finishes clean at 95 beats this run.';
    } else if (done < 30) {
      verdict = 'Partial credit';
      tone = 'Stations award completion in bands. Half a mission is half of 60 — take the partial, then chase the speed bonus next round.';
    } else if (sp < 5) {
      verdict = 'Accurate, slow';
      tone = 'Quality is there, the speed window is not. Fifteen points are sitting in the clock — most crews lose them, not the 60.';
    } else {
      verdict = 'Crew A finishes the job';
      tone = 'Same mission as Crew B — two seconds slower on the relay, ten points quieter on the board.';
    }
    sc.verdict.textContent = verdict;
    sc.tone.textContent = tone;
    sc.total.classList.toggle('big-total--warn', out < 40);
  }
  ['scDone', 'scQuality', 'scSpeed', 'scBonus', 'scHints'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcScore);
  });
  calcScore();

  /* ── 07 · wanted calculator (pay Dexter, or eat the 20%) ────────────── */
  const wn = {
    missions: $('#wnMissions'), points: $('#wnPoints'), cash: $('#wnCash'),
    loss: $('#wnLoss'), verdict: $('#wnVerdict'), tone: $('#wnTone')
  };
  function calcWanted() {
    if (!wn.loss) return;
    const m = num(wn.missions.value), p = num(wn.points.value), c = num(wn.cash.value);
    document.getElementById('wnMissionsOut').textContent = m;
    document.getElementById('wnPointsOut').textContent = p;
    document.getElementById('wnCashOut').textContent = money(c);
    const gross = m * p;
    const lost = Math.round(gross * CONFIG.wantedCut);
    wn.loss.textContent = '−' + lost;
    const affordable = c >= CONFIG.dexterFee;
    const worthIt = lost >= CONFIG.dexterFee;
    let verdict, tone;
    if (!affordable) {
      verdict = 'You cannot pay the fee';
      tone = 'Clearance costs ' + money(CONFIG.dexterFee) + ' and you hold ' + money(c) + '. Win a strategy mission, sell something to Dexter, or play the rest of the round at 80%.';
    } else if (worthIt) {
      verdict = 'Pay Dexter now';
      tone = 'Playing wanted across ' + m + ' missions costs you ' + lost + ' points. The fee is ' + money(CONFIG.dexterFee) + ' cash — a number you earn back inside a round.';
    } else if (m <= 1) {
      verdict = 'Probably ride it out';
      tone = 'One mission left and the cut is only ' + lost + ' points. Pay the fee only if you expect to be on the list again next round.';
    } else {
      verdict = 'Close call — check the clock';
      tone = 'The cut is ' + lost + ' points against ' + money(CONFIG.dexterFee) + ' cash. If rounds remain, the walk to Dexter is usually the better trade.';
    }
    wn.verdict.textContent = verdict;
    wn.tone.textContent = tone;
    wn.loss.classList.toggle('big-total--warn', lost >= CONFIG.dexterFee);
  }
  ['wnMissions', 'wnPoints', 'wnCash'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcWanted);
  });
  calcWanted();

  /* ── 08 · final score / heist calculator ────────────────────────────── */
  const fh = {
    points: $('#fPoints'), heist: $('#fHeist'), penalty: $('#fPenalty'), rivals: $('#fRivals'),
    out: $('#heistScore'), bar: $('#scoreBar'), verdict: $('#heistVerdict')
  };
  function calcFinal() {
    if (!fh.out) return;
    const p = num(fh.points.value), h = num(fh.heist.value), pen = num(fh.penalty.value), r = num(fh.rivals.value);
    const total = Math.max(0, p + h - pen);
    fh.out.textContent = fmt(total);
    const top = Math.max(total, r, 1);
    fh.bar.style.width = (total / top * 100).toFixed(1) + '%';
    const diff = total - r;
    let v;
    if (diff > 0) {
      v = 'Ahead by ' + fmt(diff) + '.';
      v += diff <= 10 ? ' One hint in the last round would have lost this.' : ' Comfortable — but the heist bonus is still the biggest single swing on the sheet.';
    } else if (diff === 0) {
      v = 'Dead level with ' + fmt(r) + '. Tie-break: heist completion time, then total missions banked.';
    } else {
      v = 'Behind by ' + fmt(-diff) + '.';
      v += h >= 150 ? ' You won the heist and still trail — the morning cost you the day.' : ' Only the heist bonus can close this: +150 for being first across the line.';
    }
    fh.verdict.textContent = v;
    fh.out.style.color = diff >= 0 ? '' : 'var(--pink)';
  }
  ['fPoints', 'fHeist', 'fPenalty', 'fRivals'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcFinal);
  });
  calcFinal();

  /* ── 09 · city board simulator ──────────────────────────────────────── */
  const CATS = ['Tech & logic', 'Physical', 'Creative', 'Clue hunt', 'Strategy'];
  const board = {
    body: $('#ledgerBody'), msg: $('#ledgerMsg'), shell: $('.ledger-shell'),
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
    if (board.view === 'targets') {
      list.sort((a, b) => (b.wanted - a.wanted) || (b.points - a.points));
    } else if (board.view === 'clean') {
      list.sort((a, b) => (a.hints - b.hints) || (b.points - a.points));
    } else {
      list.sort((a, b) => b.points - a.points);
    }
    return list;
  }
  function statusOf(c) {
    if (c.heist) return { cls: 'badge--heist', text: 'Heist finalist' };
    if (c.wanted) return { cls: 'badge--wanted', text: 'Wanted' };
    if (board.view === 'targets') return { cls: 'badge--clear', text: 'Clear' };
    return { cls: 'badge--live', text: 'Live' };
  }
  function renderBoard() {
    if (!board.body) return;
    const first = new Map($$('.lrow:not(.lrow--head)', board.body).map(r => [r.dataset.id, r.getBoundingClientRect().top]));
    const list = sorted();
    const frag = document.createDocumentFragment();
    list.forEach((c, i) => {
      const st = statusOf(c);
      const row = document.createElement('div');
      row.className = 'lrow' + (c.delta ? ' is-flash' : '');
      row.setAttribute('role', 'row');
      row.dataset.id = c.id;
      row.innerHTML =
        '<span role="cell" class="rank">' + (i + 1) + '</span>' +
        '<span role="cell" class="crew"><b>' + c.name + '</b><span>' + c.id + ' · ' + c.zone + '</span></span>' +
        '<span role="cell" class="num points">' + fmt(c.points) + '</span>' +
        '<span role="cell" class="num cash">' + money(c.cash) + '</span>' +
        '<span role="cell" class="num">' + c.missions + '</span>' +
        '<span role="cell" class="num">' + c.hints + '</span>' +
        '<span role="cell"><i class="badge ' + st.cls + '">' + st.text + '</i></span>' +
        '<span role="cell" class="num ' + (c.delta > 0 ? 'delta-up' : c.delta < 0 ? 'delta-down' : '') + '">' +
          (c.delta > 0 ? '+' + fmt(c.delta) : c.delta < 0 ? fmt(c.delta) : '—') + '</span>';
      frag.appendChild(row);
    });
    board.body.replaceChildren(frag);
    if (prefersReduced) return;
    $$('.lrow', board.body).forEach(r => {
      const prev = first.get(r.dataset.id);
      if (prev == null) return;
      const dy = prev - r.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) return;
      r.style.transform = 'translateY(' + dy + 'px)';
      r.style.transition = 'none';
      requestAnimationFrame(() => {
        r.style.transition = 'transform .55s cubic-bezier(.2,.8,.2,1)';
        r.style.transform = '';
      });
    });
  }
  function syncHUD() {
    const list = sorted();
    const me = focusCrew();
    const rank = list.indexOf(me) + 1;
    setHUD({
      points: me.points, cash: me.cash, round: Math.min(board.round, 3),
      // stars are police attention: only a listed crew can light 4 or 5
      stars: me.wanted ? 5 : (rank <= 3 ? 3 : rank <= 6 ? 2 : 1)
    });
  }
  function say(html) { if (board.msg) { board.msg.innerHTML = html; } }
  function glitch() {
    if (!board.shell || prefersReduced) return;
    board.shell.classList.remove('glitch'); void board.shell.offsetWidth; board.shell.classList.add('glitch');
  }

  // Round runner — every crew plays the round, cut for wanted, points land
  function runRound() {
    if (board.busy) return;
    if (board.round > 3) {
      say('That was <b>Round 3</b> — the board is locked. <b>Publish targets</b> is closed, the top five go to the Big Heist.');
      press('BOARD LOCKED', 'final points');
      return;
    }
    board.busy = true;
    const n = board.round;
    board.crews.forEach(c => {
      const plays = 1 + Math.floor(Math.random() * 3);
      let gained = 0;
      for (let i = 0; i < plays; i++) {
        const base = 55 + Math.random() * 50;
        const hints = Math.random() < 0.28 ? 1 : 0;
        gained += Math.max(0, base - hints * CONFIG.hintCost);
        c.hints += hints;
      }
      gained = Math.round(gained);
      if (c.wanted) gained = Math.round(gained * (1 - CONFIG.wantedCut));
      c.delta = gained;
      c.points += gained;
      c.missions += plays;
      c.cash += Math.round(200 + Math.random() * 520);
    });
    board.round = n + 1;
    glitch(); renderBoard(); syncHUD();
    const list = sorted();
    say(n < 3
      ? '<b>Round ' + n + ' banked.</b> Points are live. The current <b>top three</b> are now police targets — press <b>Publish targets</b> to hand the list to the officers.'
      : '<b>Round 3 banked — that is the final round.</b> Points are locked at ' + fmt(list[0].points) + ' for ' + list[0].name + '. Press <b>Big Heist · top 5</b> to pick the finalists.');
    press('ROUND ' + n + ' BANKED', list[0].name + ' leads');
    board.busy = false;
  }

  // Publish targets — top three become the police target list
  function publishTargets() {
    if (board.crews.some(c => c.heist)) {
      say('The finalists are already picked — the board is locked for the finale. No new target list after the Big Heist.');
      press('BOARD LOCKED', 'no targets now');
      return;
    }
    const top3 = board.crews.slice().sort((a, b) => b.points - a.points).slice(0, 3);
    const ids = new Set(top3.map(c => c.id));
    board.crews.forEach(c => { c.wanted = ids.has(c.id); });
    glitch(); renderBoard(); syncHUD();
    say('<b>Target list for Round ' + board.round + ':</b> ' +
      top3.map(c => c.name).join(', ') +
      '. Verified ID plus a leader photo sets <b>WANTED</b> — every mission then pays <b>20% less</b> until Dexter clears it for ' + money(CONFIG.dexterFee) + '.');
    press('TARGETS PUBLISHED', '3 crews listed');
  }

  // Dexter clears the highest-listed crew that can afford the fee
  function dexterClear() {
    if (board.crews.some(c => c.heist)) {
      say('Status was wiped when the finalists were picked. Nobody owes Dexter anything now.');
      press('SEASON OVER', 'status wiped');
      return;
    }
    const target = board.crews.slice().sort((a, b) => b.points - a.points).find(c => c.wanted && c.cash >= CONFIG.dexterFee);
    if (!target) {
      const anyWanted = board.crews.some(c => c.wanted);
      say(anyWanted
        ? 'Nobody on the list can cover the ' + money(CONFIG.dexterFee) + ' fee right now. They play the round at 80% and try again after the next station.'
        : 'No crew is wanted at this moment. Press <b>Publish targets</b> first — the list is what makes somebody a target.');
      press(anyWanted ? 'FEE UNAFFORDABLE' : 'NOBODY LISTED', 'dexter stays open');
      return;
    }
    target.wanted = false;
    target.cash -= CONFIG.dexterFee;
    target.delta = -CONFIG.dexterFee;
    glitch(); renderBoard(); syncHUD();
    say('<b>' + target.name + '</b> paid Dexter ' + money(CONFIG.dexterFee) + '. Status removed at ' +
      new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) +
      ', logged and announced. From the next mission they score full points again.');
    press('STATUS CLEARED', target.name + ' · −' + money(CONFIG.dexterFee));
  }

  // Big Heist qualification — top five
  function bigHeist() {
    const top5 = board.crews.slice().sort((a, b) => b.points - a.points).slice(0, 5);
    const ids = new Set(top5.map(c => c.id));
    board.crews.forEach(c => { c.heist = ids.has(c.id); c.wanted = false; c.delta = 0; });
    glitch(); renderBoard(); syncHUD();
    say('<b>14:15 — qualified for The Big Heist:</b> ' + top5.map((c, i) => (i + 1) + '. ' + c.name).join(' · ') +
      '. Wanted status is wiped before the finale. Bonuses: <b>+150</b> first crew to finish, <b>+120</b>, <b>+100</b>, then <b>+75</b> for every finalist.');
    press('TOP 5 QUALIFIED', 'the heist is live');
  }

  [['runRound', runRound], ['raid', publishTargets], ['alert', dexterClear], ['heistBtn', bigHeist]].forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  });

  $$('.seg-btn[data-board]').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.seg-btn[data-board]').forEach(b => b.setAttribute('aria-selected', String(b === btn)));
      board.view = btn.dataset.board;
      renderBoard(); syncHUD();
      const note = {
        overall: 'Default view: <b>points</b>, highest first. This is the only ordering that decides anything.',
        targets: 'Target view: listed crews first. Control publishes this to the officers after every round.',
        clean: 'Least hints first — a tie-break view, and the one the awards photo gets taken from.'
      }[board.view];
      say(note);
    });
  });

  renderBoard(); syncHUD();

  /* ── 10 · crew file + pseudo QR ─────────────────────────────────────── */
  function hash32(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  }
  function mulberry(seed) {
    return () => {
      seed = (seed + 0x6D2B79F5) >>> 0;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), 1 | t);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function qrPath(seedStr) {
    const N = 21, rnd = mulberry(hash32(seedStr || 'vice-city'));
    const finder = (x, y, on) => {
      for (let dy = 0; dy < 7; dy++) for (let dx = 0; dx < 7; dx++) {
        const edge = dx === 0 || dy === 0 || dx === 6 || dy === 6;
        const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        on[y + dy][x + dx] = edge || core;
      }
    };
    const reserved = (x, y) =>
      (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
    const grid = Array.from({ length: N }, () => Array(N).fill(false));
    finder(0, 0, grid); finder(N - 7, 0, grid); finder(0, N - 7, grid);
    for (let i = 8; i < N - 8; i++) { grid[6][i] = i % 2 === 0; grid[i][6] = i % 2 === 0; }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (reserved(x, y) || (x === 6) || (y === 6)) continue;
      grid[y][x] = rnd() > 0.52;
    }
    let d = '';
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (grid[y][x]) d += 'M' + x + ' ' + y + 'h1v1h-1z';
    return d;
  }

  const crewForm = $('#crewClaim');
  const crewInput = $('#crewNameInput');
  const crewMsg = $('#crewClaimMsg');
  const ZONES = ['Picasso Block', 'Ocean Drive', 'Campus Quarter', 'The Marina'];
  function applyCrew(raw) {
    const name = raw.trim().replace(/\s+/g, ' ');
    if (name.length < 3) {
      crewMsg.textContent = 'Three characters minimum — a speaker has to be able to read it out.';
      crewMsg.className = 'crew-claim-msg is-bad';
      return false;
    }
    const idNum = 1 + (hash32(name) % 99);
    const members = 4 + (hash32(name + 'm') % 2);            // 4 or 5
    const zone = ZONES[hash32(name + 'z') % ZONES.length];
    const missions = 14 + (hash32(name + 'x') % 8);
    $('#crewIdOut').textContent = name.toUpperCase();
    $('#crewMetaOut').textContent = 'ID VP-11-' + pad(idNum) + ' · ' + members + ' members · ' + zone;
    $('#crewQRPath').setAttribute('d', qrPath('vc://crew/VP-11-' + pad(idNum) + '/' + name));
    crewMsg.textContent = 'File stamped · vc://crew/VP-11-' + pad(idNum) + ' · ' + missions + ' missions banked · the platform issues the real code at check-in.';
    crewMsg.className = 'crew-claim-msg is-good';
    press('CREW FILED', name);
    return true;
  }
  if (crewForm) {
    crewForm.addEventListener('submit', e => {
      e.preventDefault();
      if (!applyCrew(crewInput.value)) { crewInput.focus(); return; }
      crewInput.blur();
    });
  }

  /* ── 11 · mission category filter ───────────────────────────────────── */
  const zoneCards = $$('.zone[data-zone]');
  const zoneWrap = $('.zones');
  $$('.zone-filter[data-zone]').forEach(btn => {
    btn.addEventListener('click', () => {
      const zone = btn.dataset.zone;
      if (zoneWrap) zoneWrap.classList.toggle('is-filtered', zone !== 'all');
      $$('.zone-filter[data-zone]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      let shown = 0;
      zoneCards.forEach(card => {
        const show = zone === 'all' || card.dataset.zone === zone;
        card.classList.toggle('is-hidden', !show);
        if (show) shown++;
      });
      const msg = zone === 'all'
        ? 'All five categories. Every crew runs the same set — short starters, then the main list, then the final round.'
        : shown + ' category shown. The final shortlist mixes all five so no single strength wins the day.';
      say(msg);
    });
  });

  /* ── 12 · mission lab card builder ──────────────────────────────────── */
  const ideaForm = $('#ideaForm');
  const ifTime = $('#ifTime'), ifTimeOut = $('#ifTimeOut');
  const ifMsg = $('#ifMsg');
  const ideaCard = $('#ideaCard');
  if (ifTime) {
    const tOut = () => { ifTimeOut.textContent = ifTime.value + ' min'; };
    ifTime.addEventListener('input', tOut); tOut();
  }
  const ideaFields = () => ({
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
      const d = ideaFields();
      const missing = ['name', 'problem', 'materials', 'win'].filter(k => !d[k]);
      if (missing.length) {
        ifMsg.textContent = 'Still needed: ' + missing.join(', ') + '.';
        ifMsg.className = 'if-msg is-bad';
        const first = document.getElementById('if' + missing[0][0].toUpperCase() + missing[0].slice(1));
        if (first) first.focus();
        return;
      }
      $('#icName').textContent = d.name;
      $('#icProblem').textContent = d.problem;
      $('#icCategory').textContent = d.category;
      $('#icTime').textContent = d.time + ' minutes';
      $('#icMaterials').textContent = d.materials;
      $('#icWin').textContent = d.win;
      const minutes = num(d.time, 5);
      $('#icNote').textContent = minutes > 8
        ? 'Over the 3–8 minute window — control will ask you to split it before the shortlist.'
        : minutes < 3 ? 'Under the window — pair it with another idea or add a quality check.'
        : 'Inside the window. Now add the two things a judge needs: the exact pass condition, and what a hint costs.';
      ideaCard.classList.add('is-in');
      ifMsg.textContent = 'Card built. Copy it and drop it in the mission review channel.';
      ifMsg.className = 'if-msg is-good';
      press('IDEA DRAFTED', d.name);
    });
    const copyBtn = $('#ifCopy');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const d = ideaFields();
        const text = ideaText(d);
        try {
          await navigator.clipboard.writeText(text);
          ifMsg.textContent = 'Copied to clipboard — paste it straight into the review form.';
          ifMsg.className = 'if-msg is-good';
        } catch (err) {
          const ta = document.createElement('textarea');
          ta.value = text; ta.setAttribute('readonly', 'aria-hidden');
          ta.style.cssText = 'position:fixed;left:-9999px';
          document.body.appendChild(ta); ta.select();
          let ok = false;
          try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
          ta.remove();
          ifMsg.textContent = ok ? 'Copied to clipboard.' : 'Clipboard blocked by the browser — select the card text and copy manually.';
          ifMsg.className = 'if-msg ' + (ok ? 'is-good' : 'is-bad');
        }
      });
    }
  }

  /* ── 13 · spec tabs, copy, links, toast ─────────────────────────────── */
  $$('.tabs').forEach(group => {
    const tabs = $$('.tab', group);
    const panels = $$('.panel', group);
    const select = idx => {
      tabs.forEach((t, i) => {
        t.setAttribute('aria-selected', String(i === idx));
        t.tabIndex = i === idx ? 0 : -1;
      });
      panels.forEach((p, i) => { p.hidden = i !== idx; });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        tabs[next].focus(); select(next);
      });
    });
    select(0);
  });

  $$('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const code = btn.parentElement.querySelector('code, pre');
      if (!code) return;
      const text = code.innerText;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; }
      catch (err) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
        ta.remove();
      }
      const label = btn.dataset.label || btn.textContent;
      btn.textContent = ok ? 'Copied' : 'Press Ctrl+C';
      setTimeout(() => { btn.textContent = label; }, 1600);
    });
  });

  $$('[data-link]').forEach(a => {
    const key = a.dataset.link;
    if (CONFIG.links[key]) a.href = CONFIG.links[key];
    if (a.href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  });

  // toast — one at a time, never blocks the page
  let toastEl = null, toastTimer = 0;
  function press(title, sub) {
    if (prefersReduced) return;
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.innerHTML = '<b></b><span></span>';
      document.body.appendChild(toastEl);
    }
    $('b', toastEl).textContent = title;
    $('span', toastEl).textContent = sub || '';
    requestAnimationFrame(() => toastEl.classList.add('is-in'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-in'), 2400);
  }

  
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
      strip.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * step(), behavior: prefersReduced ? 'auto' : 'smooth' });
    });
    strip.addEventListener('scroll', paint, { passive: true });
    window.addEventListener('resize', paint);
    paint();
  })();

  /* ── 17 · horizon: the sky drifts a hair when the pointer does ── */
  (() => {
    const hero = $('.horizon');
    if (!hero || prefersReduced) return;
    const sun = $('.hz-sun');
    const palm = $('.hz-palm');
    const grid = $('.hz-grid');
    let raf = null, mx = 0, my = 0;
    const paint = () => {
      raf = null;
      if (sun) sun.style.translate = (mx * 22).toFixed(1) + 'px ' + (my * 10).toFixed(1) + 'px';
      if (palm) palm.style.translate = (mx * -34).toFixed(1) + 'px 0px';
      if (grid) grid.style.translate = (mx * -16).toFixed(1) + 'px 0px';
    };
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - .5;
      my = (e.clientY - r.top) / r.height - .5;
      if (!raf) raf = requestAnimationFrame(paint);
    });
    hero.addEventListener('pointerleave', () => {
      mx = 0; my = 0;
      if (!raf) raf = requestAnimationFrame(paint);
    });
  })();
})();
