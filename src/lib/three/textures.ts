import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { createRng } from "@/lib/noise";

/**
 * Procedural, seamless canvas textures for buildings and props — generated in
 * the browser (no downloads). Each is created once and cached.
 */

type Painter = (ctx: CanvasRenderingContext2D, size: number, rnd: () => number) => void;

const cache = new Map<string, Texture>();

function make(key: string, size: number, paint: Painter, repeat: [number, number] = [1, 1]): Texture {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  paint(ctx, size, createRng(key.length * 9973 + key.charCodeAt(0)));
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
}

/** Sprinkle fine grain so flat colours never look like plastic. */
function grain(ctx: CanvasRenderingContext2D, size: number, rnd: () => number, amount: number, alpha = 0.06) {
  for (let i = 0; i < amount; i++) {
    const v = rnd() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha * rnd()})`;
    ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2, 1 + rnd() * 2);
  }
}

/** Horizontal wooden planks with grain lines. `base` is the mid tone. */
export function woodTexture(base: string, key = "wood") {
  return make(key + base, 512, (ctx, s, rnd) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    const rows = 8;
    const h = s / rows;
    for (let r = 0; r < rows; r++) {
      const shade = (rnd() - 0.5) * 0.18;
      ctx.fillStyle = shade > 0 ? `rgba(255,240,220,${shade})` : `rgba(40,20,5,${-shade})`;
      ctx.fillRect(0, r * h, s, h);
      // grain
      for (let g = 0; g < 14; g++) {
        const y = r * h + rnd() * h;
        ctx.strokeStyle = `rgba(50,25,8,${0.05 + rnd() * 0.08})`;
        ctx.lineWidth = 0.6 + rnd();
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= s; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.02 + g) * 1.6);
        ctx.stroke();
      }
      // plank seams (staggered butt joints)
      ctx.fillStyle = "rgba(30,15,5,0.55)";
      ctx.fillRect(0, r * h, s, 2);
      const joint = ((r * 0.37) % 1) * s;
      ctx.fillRect(joint, r * h, 2, h);
    }
    grain(ctx, s, rnd, 3000);
  });
}

/** Paving / masonry blocks in a running bond. */
export function stoneTexture(base: string, key = "stone", rows = 6) {
  return make(key + base + rows, 512, (ctx, s, rnd) => {
    ctx.fillStyle = "#8f8676";
    ctx.fillRect(0, 0, s, s);
    const h = s / rows;
    for (let r = 0; r < rows; r++) {
      const cols = 4;
      const w = s / cols;
      const off = r % 2 ? w / 2 : 0;
      for (let c = -1; c < cols + 1; c++) {
        const x = c * w + off;
        const tone = (rnd() - 0.5) * 22;
        ctx.fillStyle = base;
        ctx.fillRect(x + 3, r * h + 3, w - 6, h - 6);
        ctx.fillStyle = tone > 0 ? `rgba(255,255,255,${tone / 160})` : `rgba(0,0,0,${-tone / 160})`;
        ctx.fillRect(x + 3, r * h + 3, w - 6, h - 6);
        // bevel highlight / shade
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(x + 3, r * h + 3, w - 6, 3);
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(x + 3, r * h + h - 6, w - 6, 3);
      }
    }
    grain(ctx, s, rnd, 6000, 0.08);
  });
}

/** Clay roof tiles (rows of rounded tabs). */
export function roofTexture(base: string) {
  return make("roof" + base, 512, (ctx, s, rnd) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    const rows = 10;
    const h = s / rows;
    for (let r = 0; r < rows; r++) {
      const w = s / 8;
      for (let c = -1; c < 9; c++) {
        const x = c * w + (r % 2 ? w / 2 : 0);
        const g = ctx.createLinearGradient(0, r * h, 0, r * h + h);
        const t = (rnd() - 0.5) * 0.15;
        g.addColorStop(0, `rgba(255,255,255,${0.1 + t})`);
        g.addColorStop(1, `rgba(0,0,0,${0.28 - t})`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x + 1, r * h);
        ctx.lineTo(x + w - 1, r * h);
        ctx.lineTo(x + w - 1, r * h + h * 0.7);
        ctx.quadraticCurveTo(x + w / 2, r * h + h * 1.15, x + 1, r * h + h * 0.7);
        ctx.fill();
      }
    }
    grain(ctx, s, rnd, 2500);
  });
}

/** Smooth painted plaster / render with soft mottling. */
export function plasterTexture(base: string) {
  return make("plaster" + base, 256, (ctx, s, rnd) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) {
      const x = rnd() * s;
      const y = rnd() * s;
      const r = 10 + rnd() * 40;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const d = rnd() > 0.5;
      g.addColorStop(0, d ? "rgba(0,0,0,0.035)" : "rgba(255,255,255,0.05)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    grain(ctx, s, rnd, 2500, 0.05);
  });
}

/** Corrugated / standing-seam metal. */
export function metalSheetTexture(base: string) {
  return make("metal" + base, 256, (ctx, s, rnd) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    const n = 16;
    const w = s / n;
    for (let i = 0; i < n; i++) {
      const g = ctx.createLinearGradient(i * w, 0, i * w + w, 0);
      g.addColorStop(0, "rgba(255,255,255,0.16)");
      g.addColorStop(0.5, "rgba(0,0,0,0.05)");
      g.addColorStop(1, "rgba(0,0,0,0.2)");
      ctx.fillStyle = g;
      ctx.fillRect(i * w, 0, w, s);
    }
    // weathering streaks
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(60,50,40,${rnd() * 0.05})`;
      ctx.fillRect(rnd() * s, 0, 1 + rnd() * 3, s * (0.3 + rnd() * 0.7));
    }
  });
}

/** Painted brick. */
export function brickTexture(base: string) {
  return make("brick" + base, 512, (ctx, s, rnd) => {
    ctx.fillStyle = "#d9d2c5";
    ctx.fillRect(0, 0, s, s);
    const rows = 16;
    const h = s / rows;
    for (let r = 0; r < rows; r++) {
      const w = s / 6;
      for (let c = -1; c < 7; c++) {
        const x = c * w + (r % 2 ? w / 2 : 0);
        const t = (rnd() - 0.5) * 0.12;
        ctx.fillStyle = base;
        ctx.fillRect(x + 2, r * h + 2, w - 4, h - 4);
        ctx.fillStyle = t > 0 ? `rgba(255,255,255,${t})` : `rgba(0,0,0,${-t})`;
        ctx.fillRect(x + 2, r * h + 2, w - 4, h - 4);
      }
    }
    grain(ctx, s, rnd, 5000, 0.07);
  });
}
