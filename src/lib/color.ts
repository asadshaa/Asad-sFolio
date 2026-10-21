/**
 * Colour helpers that keep text readable (WCAG AA) on the site's surfaces.
 * Accent colours are lovely as fills but too light for text on cream, so text
 * always goes through these.
 */

export const PAPER = "#fbf6ee";
export const INK = "#1d2230";

function channel(v: number) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function parse(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

function toHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
}

export function luminance(hex: string) {
  const [r, g, b] = parse(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** White or ink — whichever reads better on the given background. */
export function textOn(bg: string) {
  return contrast("#ffffff", bg) >= contrast(INK, bg) ? "#ffffff" : INK;
}

/**
 * The accent hue, darkened just enough to reach `min` contrast on `bg`
 * (default 4.5:1 on the cream paper colour) — for accent-coloured text/icons.
 */
export function readableAccent(hex: string, bg = PAPER, min = 4.5) {
  let rgb = parse(hex);
  for (let i = 0; i < 40 && contrast(toHex(rgb), bg) < min; i++) {
    rgb = rgb.map((v) => v * 0.93) as [number, number, number];
  }
  return toHex(rgb);
}
