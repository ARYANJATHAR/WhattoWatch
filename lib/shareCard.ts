/* Shareable picks card — drawn on canvas in the Flying Papers theme,
   shared as a PNG via the native share sheet (or downloaded).
   No dependencies, works fully client-side. */

import type { Pick } from "./quiz";

const W = 1080;
const H = 1350;
const BG = "#8584bd";
const YELLOW = "#f4ed36";
const BUTTER = "#f9cc73";
const BONE = "#f9f5f2";
const INK = "#1a1a1a";
const BLACK = "#000000";

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 4 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

export async function picksCardFile(picks: Pick[]): Promise<File | null> {
  try {
    // Use the real brand fonts when they're ready; fall back silently.
    await Promise.all([
      document.fonts.load('400 120px Anton'),
      document.fonts.load('700 40px Archivo'),
      document.fonts.load('600 30px "JetBrains Mono"'),
    ]).catch(() => {});
  } catch {
    /* fonts API unavailable — system fallbacks below */
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Stage
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Confetti dots
  const dots: Array<[number, number, number, string]> = [
    [90, 120, 16, YELLOW],
    [990, 180, 20, "#f8c1ba"],
    [940, 1180, 14, "#b5c995"],
    [120, 1120, 18, BUTTER],
    [1010, 700, 12, BONE],
    [70, 640, 12, "#c94245"],
  ];
  for (const [x, y, r, c] of dots) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = BLACK;
    ctx.stroke();
  }

  // Wordmark
  ctx.textAlign = "center";
  ctx.fillStyle = YELLOW;
  ctx.font = '600 34px "JetBrains Mono", monospace';
  ctx.fillText("★ WHATOWATCH", W / 2, 120);

  // Headline
  ctx.font = '400 150px Anton, "Arial Narrow", sans-serif';
  ctx.fillStyle = YELLOW;
  ctx.fillText("MY FIVE", W / 2, 280);
  ctx.fillStyle = BONE;
  ctx.fillText("PICKS.", W / 2, 425);

  // Pick rows — bone cards, ink text
  const top = 500;
  const rowH = 128;
  const gap = 22;
  picks.slice(0, 5).forEach((p, i) => {
    const y = top + i * (rowH + gap);
    rr(ctx, 80, y, W - 160, rowH, 12);
    ctx.fillStyle = BONE;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = BLACK;
    ctx.stroke();

    // Rank
    ctx.textAlign = "left";
    ctx.fillStyle = INK;
    ctx.font = '400 64px Anton, "Arial Narrow", sans-serif';
    ctx.fillText(String(i + 1).padStart(2, "0"), 116, y + 84);

    // Title (year)
    ctx.font = '700 40px Archivo, sans-serif';
    const title = fitText(ctx, `${p.title} (${p.year || "—"})`, 560);
    ctx.fillText(title, 230, y + 58);

    // Rating + genres
    ctx.font = '600 28px "JetBrains Mono", monospace';
    const sub = fitText(
      ctx,
      `★ ${p.rating.toFixed(1)} · ${(p.genres.slice(0, 2).join(" + ") || "Crowd-pleaser").toUpperCase()}`,
      560,
    );
    ctx.fillText(sub, 230, y + 100);

    // Media tag
    ctx.textAlign = "right";
    ctx.font = '600 26px "JetBrains Mono", monospace';
    ctx.fillText(p.mediaType === "tv" ? "SERIES" : "FILM", W - 116, y + 84);
  });

  // Footer
  ctx.textAlign = "center";
  ctx.fillStyle = BONE;
  ctx.font = '600 30px "JetBrains Mono", monospace';
  ctx.fillText("STOP SCROLLING · START WATCHING", W / 2, H - 70);

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  if (!blob) return null;
  return new File([blob], "whatowatch-picks.png", { type: "image/png" });
}
