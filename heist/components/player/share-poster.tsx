"use client";

import { useState } from "react";

import { Share } from "./icons";

interface PosterData {
  teamId: string;
  name: string;
  leaderName: string;
  crew: number;
  stars: number;
  bounty: number;
  since: string;
  hasPhoto: boolean;
}

const INK = "#2a2215";
const W = 1080;
const H = 1500;

/** Draw text with manual letter-spacing (ctx.letterSpacing is not everywhere yet). */
function spaced(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, spacing: number) {
  const widths = [...text].map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = "left";
  [...text].forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += widths[i] + spacing;
  });
}

/** Largest font size (up to `start`) whose text fits `maxW`. */
function fit(ctx: CanvasRenderingContext2D, text: string, family: string, maxW: number, start: number, spacingEm = 0) {
  let size = start;
  while (size > 18) {
    ctx.font = `${size}px ${family}`;
    const w = [...text].reduce((a, c) => a + ctx.measureText(c).width, 0) + spacingEm * size * (text.length - 1);
    if (w <= maxW) break;
    size -= 2;
  }
  return size;
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 === 0 ? r : r * 0.46;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Cover-crop the photo into a square and give it the aged black-and-white sepia look. */
function mugshot(img: HTMLImageElement | null, size: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d")!;
  if (!img) {
    g.fillStyle = "#cdbf9b";
    g.fillRect(0, 0, size, size);
    g.fillStyle = "#8a7a55";
    g.beginPath();
    g.arc(size / 2, size * 0.38, size * 0.17, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(size / 2, size * 0.95, size * 0.34, size * 0.3, 0, Math.PI, 0);
    g.fill();
    return c;
  }
  const side = Math.min(img.width, img.height);
  g.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
  const data = g.getImageData(0, 0, size, size);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    let v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    v = Math.max(0, Math.min(255, (v - 128) * 1.15 + 128 - 8));
    d[i] = Math.min(255, v * 1.07 + 18);
    d[i + 1] = Math.min(255, v * 0.92 + 8);
    d[i + 2] = v * 0.7;
  }
  g.putImageData(data, 0, 0);
  return c;
}

async function renderPoster(p: PosterData): Promise<Blob> {
  const root = getComputedStyle(document.documentElement);
  const display = root.getPropertyValue("--font-pl-display").trim() || "Impact, sans-serif";
  const body = root.getPropertyValue("--font-pl-body").trim() || "system-ui, sans-serif";
  try {
    await Promise.all([document.fonts.load(`60px ${display}`), document.fonts.load(`700 28px ${body}`)]);
  } catch {
    /* fall back to whatever is loaded */
  }

  const photo = p.hasPhoto ? await loadImage(`/api/photo/${encodeURIComponent(p.teamId)}`) : null;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // backdrop
  ctx.fillStyle = "#1c1e20";
  ctx.fillRect(0, 0, W, H);

  // torn paper outline
  const path = new Path2D();
  path.moveTo(60, 40);
  path.lineTo(1020, 40);
  path.lineTo(1020, 1425);
  for (let x = 1020, up = false; x > 60; x -= 40, up = !up) {
    path.lineTo(x - 20, up ? 1425 : 1455);
    path.lineTo(x - 40, 1425);
  }
  path.lineTo(60, 1425);
  path.closePath();

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.55)";
  ctx.shadowOffsetY = 18;
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#e6d8b2";
  ctx.fill(path);
  ctx.restore();

  ctx.save();
  ctx.clip(path);
  const hi = ctx.createRadialGradient(540, 40, 0, 540, 40, 900);
  hi.addColorStop(0, "rgba(255,255,255,.4)");
  hi.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hi;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(120,90,40,.05)";
  for (let y = 40; y < H; y += 6) ctx.fillRect(60, y, 960, 2);
  const vig = ctx.createRadialGradient(540, 740, 420, 540, 740, 960);
  vig.addColorStop(0, "rgba(130,95,40,0)");
  vig.addColorStop(1, "rgba(130,95,40,.5)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // double border
  ctx.strokeStyle = "rgba(42,34,21,.6)";
  ctx.lineWidth = 6;
  ctx.strokeRect(96, 80, 888, 1315);
  ctx.lineWidth = 2;
  ctx.strokeRect(110, 94, 860, 1287);

  ctx.textBaseline = "alphabetic";

  // code
  ctx.fillStyle = "#6a5a3a";
  ctx.font = `700 28px ${body}`;
  spaced(ctx, `NO. ${p.teamId}`, 540, 160, 9);

  // WANTED
  const tSize = fit(ctx, "WANTED", display, 780, 190, 0.03);
  ctx.font = `${tSize}px ${display}`;
  ctx.fillStyle = "rgba(168,116,26,.4)";
  spaced(ctx, "WANTED", 546, 316, tSize * 0.03);
  ctx.fillStyle = INK;
  spaced(ctx, "WANTED", 540, 310, tSize * 0.03);

  // rule + star
  ctx.fillStyle = INK;
  ctx.fillRect(210, 358, 270, 5);
  ctx.fillRect(600, 358, 270, 5);
  star(ctx, 540, 361, 24, "#8a5a14");

  // subtitle
  ctx.fillStyle = "#4a3d24";
  ctx.font = `700 30px ${body}`;
  spaced(ctx, "FOR CRIMES AGAINST THE CITY", 540, 424, 6);

  // mugshot
  ctx.fillStyle = "rgba(42,34,21,.35)";
  ctx.fillRect(338, 478, 410, 410);
  ctx.fillStyle = "#f3ead0";
  ctx.fillRect(330, 470, 410, 410);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.strokeRect(330, 470, 410, 410);
  ctx.drawImage(mugshot(photo, 370), 350, 490);

  // name + leader
  ctx.fillStyle = INK;
  const nSize = fit(ctx, p.name.toUpperCase(), display, 760, 66);
  ctx.font = `${nSize}px ${display}`;
  ctx.textAlign = "center";
  ctx.fillText(p.name.toUpperCase(), 540, 972);
  ctx.fillStyle = "#5a4b2e";
  ctx.font = `600 34px ${body}`;
  ctx.fillText(`Led by ${p.leaderName} · ${p.crew} ${p.crew === 1 ? "member" : "crew"}`, 540, 1022);

  // stars
  for (let i = 0; i < 3; i += 1) {
    star(ctx, 540 + (i - 1) * 70, 1078, 28, i < p.stars ? "#a8741a" : "#c5b78f");
  }

  // reward
  ctx.fillStyle = INK;
  ctx.fillRect(220, 1130, 640, 6);
  ctx.fillRect(220, 1290, 640, 6);
  ctx.fillStyle = "#6a5a3a";
  ctx.font = `700 26px ${body}`;
  spaced(ctx, "REWARD", 540, 1176, 10);

  const amount = p.bounty.toLocaleString("en-IN");
  const aSize = fit(ctx, amount, display, 440, 92);
  ctx.font = `${aSize}px ${display}`;
  const aW = ctx.measureText(amount).width;
  const boltSize = Math.round(aSize * 0.9);
  const gap = 18;
  const startX = 540 - (aW + boltSize + gap) / 2;
  ctx.save();
  ctx.translate(startX, 1270 - boltSize * 0.92);
  ctx.scale(boltSize / 24, boltSize / 24);
  ctx.fillStyle = "#8a5a14";
  ctx.fill(new Path2D("M13 2 4 14h6l-1 8 9-12h-6z"));
  ctx.restore();
  ctx.fillStyle = "#7a4e12";
  ctx.textAlign = "left";
  ctx.fillText(amount, startX + boltSize + gap, 1270);

  // fine print
  ctx.textAlign = "center";
  ctx.fillStyle = "#6a5a3a";
  ctx.font = `italic 600 28px ${body}`;
  ctx.fillText(`Wanted since ${p.since || "today"}. Approach with caution.`, 540, 1336);
  ctx.font = `700 21px ${body}`;
  spaced(ctx, "THE LAST HEIST · GDG CHITKARA", 540, 1368, 5);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not make the image"))), "image/png");
  });
}

/** "Share poster": builds the wanted poster as a PNG, then opens the share sheet or downloads it. */
export function SharePosterButton(props: PosterData) {
  const [state, setState] = useState<"idle" | "busy" | "saved" | "error">("idle");

  async function onShare() {
    if (state === "busy") return;
    setState("busy");
    try {
      const blob = await renderPoster(props);
      const file = new File([blob], `wanted-${props.teamId}.png`, { type: "image/png" });
      const text = `${props.name} is WANTED in The Last Heist. Reward: ${props.bounty.toLocaleString("en-IN")} pts.`;
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `WANTED: ${props.name}`, text });
        setState("idle");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      setState("saved");
      window.setTimeout(() => setState("idle"), 3500);
    } catch (err) {
      // Closing the share sheet is not an error.
      if (err instanceof DOMException && err.name === "AbortError") setState("idle");
      else {
        setState("error");
        window.setTimeout(() => setState("idle"), 3500);
      }
    }
  }

  return (
    <>
      <button type="button" className="pbtn ghost shareposter" onClick={onShare} disabled={state === "busy"}>
        <Share size={18} />
        {state === "busy"
          ? "Printing poster…"
          : state === "saved"
            ? "Saved to your downloads"
            : state === "error"
              ? "Could not make the image. Try again"
              : "Share poster"}
      </button>
    </>
  );
}
