/* ==========================================================================
   VICE CITY · scene3d.js — the evidence case
   A physical VP-11 attaché case floating over the skyline: drag it, click it
   to flip from the front plate (case photo, stamp, barcode) to the manifest
   on the back. Behind it, official GTA VI art shards drift like polaroids on
   a detective's wall.

   Everything is painted at runtime from the site's own art and self-hosted
   fonts, so there is no CDN and no baked texture to lose. Degrades to the
   flat cover when WebGL is unavailable, when the visitor prefers reduced
   motion (one still frame), and below 900px wide (touch devices get the art).
   ========================================================================== */
(function () {
  "use strict";

  var stage = document.getElementById("case-stage");
  var canvas = document.getElementById("case-canvas");
  var sfx = document.getElementById("case-sfx");
  if (!stage || !canvas || !window.THREE) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  } catch (e) {
    stage.classList.add("is-off");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));

  var INK = 0x150a20, LITHO = 0xf7ecda;
  var C_INK = "#150a20", C_LITHO = "#f7ecda", C_PINK = "#ff2a6d",
      C_CYAN = "#22d9f5", C_AMBER = "#ffb02e", C_MONEY = "#16c98d";

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 6.4);

  /* ------------------------------------------------------------------ fonts
     Canvas lettering has to wait for Anton / Bungee / Chakra Petch or the
     stencil comes out in Times and the whole case reads cheap. */
  var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();

  function img(src) {
    return new Promise(function (res) {
      var i = new Image();
      i.onload = function () { res(i); };
      i.onerror = function () { res(null); };
      i.src = src;
    });
  }

  function rr(x, X, Y, W, H, r) {
    x.beginPath();
    x.moveTo(X + r, Y);
    x.arcTo(X + W, Y, X + W, Y + H, r);
    x.arcTo(X + W, Y + H, X, Y + H, r);
    x.arcTo(X, Y + H, X, Y, r);
    x.arcTo(X, Y, X + W, Y, r);
    x.closePath();
  }

  function stamp(x, text, cx, cy, w, h, col, rot) {
    x.save();
    x.translate(cx, cy);
    x.rotate(rot || 0);
    x.lineWidth = 5;
    x.strokeStyle = col;
    x.globalAlpha = 0.92;
    rr(x, -w / 2, -h / 2, w, h, 8);
    x.stroke();
    x.fillStyle = col;
    x.font = "400 " + Math.floor(h * 0.5) + "px Bungee, Anton, sans-serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(text, 0, 2);
    x.restore();
    x.globalAlpha = 1;
  }

  function barcode(x, X, Y, W, H) {
    x.save();
    x.fillStyle = C_LITHO;
    x.fillRect(X, Y, W, H);
    x.fillStyle = C_INK;
    var px = X + 5;
    while (px < X + W - 5) {
      var w = 1 + Math.floor(Math.random() * 3);
      if (Math.random() > 0.32) x.fillRect(px, Y + 4, w, H - 8);
      px += w + 1.6;
    }
    x.restore();
  }

  /* --------------------------------------------------------- case front plate */
  function frontPlate(photo) {
    var W = 760, H = 520;
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var x = c.getContext("2d");

    // case body: dark metal with a violet sheen
    var g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#241041");
    g.addColorStop(0.5, "#150a20");
    g.addColorStop(1, "#2b0f3f");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = "rgba(255,42,109,.10)";
    for (var i = 0; i < H; i += 6) x.fillRect(0, i, W, 2);

    x.strokeStyle = C_INK; x.lineWidth = 16;
    x.strokeRect(8, 8, W - 16, H - 16);
    x.strokeStyle = "rgba(253,246,234,.22)"; x.lineWidth = 2;
    x.strokeRect(26, 26, W - 52, H - 52);

    // photo plate
    var px = 48, py = 96, pw = 330, ph = 336;
    x.fillStyle = C_LITHO;
    x.save(); x.translate(px, py); x.rotate(-0.02);
    x.fillRect(-8, -8, pw + 16, ph + 16);
    if (photo) {
      var s = Math.max(pw / photo.width, ph / photo.height);
      var dw = photo.width * s, dh = photo.height * s;
      x.save();
      x.beginPath(); x.rect(0, 0, pw, ph); x.clip();
      x.drawImage(photo, (pw - dw) / 2, (ph - dh) / 2 - 10, dw, dh);
      // duotone wash so the photo matches the graded plates
      x.globalCompositeOperation = "color";
      x.fillStyle = "#b23a7a"; x.globalAlpha = 0.35; x.fillRect(0, 0, pw, ph);
      x.globalCompositeOperation = "multiply";
      x.fillStyle = "#3b1450"; x.globalAlpha = 0.22; x.fillRect(0, 0, pw, ph);
      x.globalAlpha = 1;
      x.restore();
    }
    x.strokeStyle = C_INK; x.lineWidth = 5; x.strokeRect(0, 0, pw, ph);
    x.restore();

    // header stencil
    x.fillStyle = C_CYAN;
    x.font = "400 26px Bungee, sans-serif";
    x.textBaseline = "alphabetic";
    x.textAlign = "left";
    x.fillText("VICE CITY PD", 400, 128);
    x.fillStyle = C_LITHO;
    x.font = "400 74px Anton, Impact, sans-serif";
    x.fillText("EVIDENCE", 400, 196);
    x.fillStyle = C_AMBER;
    x.font = "700 20px 'Chakra Petch', monospace";
    x.fillText("OPERATION VP-11 · TAKEOVER", 400, 232);
    x.fillStyle = "rgba(253,246,234,.8)";
    x.font = "500 19px 'Chakra Petch', monospace";
    x.fillText("4-5 PER CREW · 3 ROUNDS · FICTIONAL CASH", 400, 262);
    x.fillText("TOP 5 EARN THE BIG HEIST", 400, 288);

    stamp(x, "SEALED", 470, 372, 214, 62, C_PINK, -0.12);
    barcode(x, 400, 420, 300, 56);

    // corner protectors
    x.fillStyle = "rgba(253,246,234,.14)";
    [[18, 18], [W - 58, 18], [18, H - 58], [W - 58, H - 58]].forEach(function (p) {
      x.fillRect(p[0], p[1], 40, 40);
    });

    var t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }

  /* --------------------------------------------------------- case back plate */
  function backPlate() {
    var W = 760, H = 520;
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var x = c.getContext("2d");

    x.fillStyle = "#100620"; x.fillRect(0, 0, W, H);
    x.strokeStyle = C_INK; x.lineWidth = 16; x.strokeRect(8, 8, W - 16, H - 16);

    x.fillStyle = C_AMBER;
    x.font = "400 24px Bungee, sans-serif";
    x.fillText("MANIFEST", 48, 78);
    x.fillStyle = C_LITHO;
    x.font = "400 54px Anton, sans-serif";
    x.fillText("WHAT IS IN THE FILE", 48, 132);

    var lines = [
      ["01", "Crew IDs + leader photo consent"],
      ["02", "$1,000 opening wallet (fictional)"],
      ["03", "3 mission rounds · 5 categories"],
      ["04", "Points: 60 / 25 / 15 / +10 / -5 per hint"],
      ["05", "Top 3 crews become the target list"],
      ["06", "Wanted = 20% off · Dexter clears $100"],
      ["07", "Top 5 crews · Big Heist at 14:30"],
    ];
    x.font = "500 22px 'Chakra Petch', monospace";
    lines.forEach(function (l, i) {
      var y = 190 + i * 40;
      x.fillStyle = C_MONEY;
      x.fillText(l[0], 52, y);
      x.fillStyle = "rgba(253,246,234,.92)";
      x.fillText(l[1], 108, y);
      x.strokeStyle = "rgba(253,246,234,.16)";
      x.lineWidth = 1;
      x.beginPath(); x.moveTo(52, y + 12); x.lineTo(W - 52, y + 12); x.stroke();
    });

    stamp(x, "VP-11", 620, 452, 168, 56, C_CYAN, 0.1);
    var t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }

  function edgePlate() {
    var c = document.createElement("canvas");
    c.width = 128; c.height = 128;
    var x = c.getContext("2d");
    x.fillStyle = "#0d0518"; x.fillRect(0, 0, 128, 128);
    x.fillStyle = "rgba(255,42,109,.55)"; x.fillRect(0, 56, 128, 16);
    var t = new THREE.CanvasTexture(c);
    return t;
  }

  /* ------------------------------------------------------------------ build */
  var group = new THREE.Group();
  var caseMesh = null;
  var shards = [];
  var ready = false;

  Promise.all([img("assets/img/evidence-robbery.jpg"), fontsReady]).then(function (res) {
    var photo = res[0];
    var W = 3.4, H = 2.34, D = 0.28;
    var geo = new THREE.BoxGeometry(W, H, D);
    var edge = edgePlate();
    var mats = [
      new THREE.MeshBasicMaterial({ map: edge }),
      new THREE.MeshBasicMaterial({ map: edge }),
      new THREE.MeshBasicMaterial({ map: edge }),
      new THREE.MeshBasicMaterial({ map: edge }),
      new THREE.MeshBasicMaterial({ map: frontPlate(photo) }),
      new THREE.MeshBasicMaterial({ map: backPlate() }),
    ];
    caseMesh = new THREE.Mesh(geo, mats);
    group.add(caseMesh);

    // handle on the top edge
    var handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.045, 10, 26, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xf7ecda })
    );
    handle.position.set(0, H / 2 + 0.02, 0);
    group.add(handle);

    // latches
    [-0.95, 0.95].forEach(function (px) {
      var latch = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.12, 0.34),
        new THREE.MeshBasicMaterial({ color: 0xffb02e })
      );
      latch.position.set(px, H / 2 - 0.06, 0);
      group.add(latch);
    });

    scene.add(group);
    ready = true;
  });

  /* ------------------------------------------------------- drifting shards */
  var SHARDS = [
    ["assets/img/shard-heli.png", -2.9, 1.5, -3.4],
    ["assets/img/shard-boat.png", 2.8, 1.2, -3.0],
    ["assets/img/shard-car.png", -2.4, -1.6, -2.6],
    ["assets/img/shard-jetski.png", 3.1, -1.4, -3.6],
    ["assets/img/shard-bike.png", 2.2, 2.1, -4.2],
  ];
  SHARDS.forEach(function (s) {
    img(s[0]).then(function (im) {
      if (!im) return;
      var tex = new THREE.Texture(im);
      tex.needsUpdate = true;
      var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
      var w = 1.15, h = (im.height / im.width) * w;
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.position.set(s[1], s[2], s[3]);
      m.userData = { baseY: s[2], phase: Math.random() * 6.28, spin: (Math.random() - 0.5) * 0.12 };
      scene.add(m);
      shards.push(m);
    });
  });

  /* -------------------------------------------------------------- interaction */
  var target = { x: -0.16, y: 0.5 };
  var current = { x: -0.16, y: 0.5 };
  var dragging = false, last = { x: 0, y: 0 }, moved = 0;
  var flip = 0, flipTarget = 0;

  function say(text) {
    if (!sfx) return;
    sfx.textContent = text;
    sfx.classList.remove("pop");
    void sfx.offsetWidth;
    sfx.classList.add("pop");
  }

  if (fine) {
    canvas.addEventListener("pointerdown", function (e) {
      dragging = true; moved = 0;
      last = { x: e.clientX, y: e.clientY };
      stage.classList.add("is-grabbing");
      say("GRABBED");
    });
    addEventListener("pointermove", function (e) {
      if (dragging) {
        var dx = e.clientX - last.x, dy = e.clientY - last.y;
        moved += Math.abs(dx) + Math.abs(dy);
        target.y += dx * 0.008;
        target.x += dy * 0.004;
        target.x = Math.max(-0.6, Math.min(0.6, target.x));
        last = { x: e.clientX, y: e.clientY };
      } else {
        var r = stage.getBoundingClientRect();
        target.x = -((e.clientY - r.top) / r.height - 0.5) * 0.34;
        if (!reduce) target.y += 0;
      }
    });
    addEventListener("pointerup", function () {
      if (dragging && moved < 8) {
        flipTarget = flipTarget === 0 ? Math.PI : 0;
        say(flipTarget === 0 ? "SEALED" : "CASE OPEN");
      }
      dragging = false;
      stage.classList.remove("is-grabbing");
    });
  }

  /* ------------------------------------------------------------------ render */
  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize);

  var t0 = 0, running = false;
  function frame(t) {
    if (!running) return;
    var dt = Math.min(0.05, (t - t0) / 1000 || 0.016);
    t0 = t;
    if (ready) {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      flip += (flipTarget - flip) * 0.1;
      var drift = dragging || reduce ? 0 : Math.sin(t / 2600) * 0.10;
      group.rotation.x = current.x;
      group.rotation.y = current.y + drift + flip;
      group.position.y = reduce ? 0 : Math.sin(t / 2200) * 0.06;
      shards.forEach(function (m) {
        m.position.y = m.userData.baseY + (reduce ? 0 : Math.sin(t / 3000 + m.userData.phase) * 0.16);
        m.rotation.z = reduce ? 0 : Math.sin(t / 4200 + m.userData.phase) * 0.08;
        m.rotation.y = m.userData.spin * Math.sin(t / 5200 + m.userData.phase);
      });
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduce) return;
    running = true;
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  resize();
  renderer.render(scene, camera);      // always show at least one frame

  if (reduce) {
    setTimeout(function () { renderer.render(scene, camera); }, 400);
  } else if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0.05 }).observe(stage);
  } else {
    start();
  }
})();
