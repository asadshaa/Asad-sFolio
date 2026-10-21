import { CanvasTexture, MeshStandardMaterial, SRGBColorSpace } from "three";

/** Shared materials for all landmarks (created lazily, once). */
let cache: ReturnType<typeof create> | null = null;

function create() {
  const std = (color: string, extra: Partial<ConstructorParameters<typeof MeshStandardMaterial>[0]> = {}) =>
    new MeshStandardMaterial({ color, roughness: 0.82, flatShading: true, ...extra });
  return {
    stone: std("#cdbfa6"),
    stoneDark: std("#9d917f"),
    wood: std("#b98258"),
    woodDark: std("#7c5238"),
    roofRed: std("#b24f3c"),
    cream: std("#f1e8d6"),
    white: std("#f5f2ea"),
    slate: std("#5d6575"),
    metal: std("#aeb7c2", { metalness: 0.55, roughness: 0.38 }),
    dark: std("#2d313b"),
    green: std("#6aa152"),
    red: std("#d8473a"),
    glass: std("#9cc7dd", { metalness: 0.3, roughness: 0.15, emissive: "#3b6f8c", emissiveIntensity: 0.25 }),
    windowWarm: new MeshStandardMaterial({ color: "#ffd99a", emissive: "#ffc46b", emissiveIntensity: 1.4 }),
    windowCool: new MeshStandardMaterial({ color: "#cfe6ff", emissive: "#9ccaf5", emissiveIntensity: 0.9 }),
    lamp: new MeshStandardMaterial({ color: "#fff3cf", emissive: "#ffe2a0", emissiveIntensity: 3, toneMapped: false }),
  };
}

export function landmarkMaterials() {
  if (!cache) cache = create();
  return cache;
}

/** Text drawn onto a canvas (fully local — no font downloads). */
export function textTexture(
  lines: { text: string; size: number; color: string; weight?: number }[],
  { width = 512, height = 256, bg = "#7c5238", border }: { width?: number; height?: number; bg?: string; border?: string } = {},
) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, width - 28, height - 28);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const total = lines.reduce((s, l) => s + l.size * 1.25, 0);
  let y = height / 2 - total / 2;
  for (const l of lines) {
    y += (l.size * 1.25) / 2;
    ctx.font = `${l.weight ?? 700} ${l.size}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.fillStyle = l.color;
    ctx.fillText(l.text, width / 2, y, width - 40);
    y += (l.size * 1.25) / 2;
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
