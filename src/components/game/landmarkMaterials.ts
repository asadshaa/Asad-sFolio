import { CanvasTexture, MeshPhysicalMaterial, MeshStandardMaterial, SRGBColorSpace, type Texture } from "three";
import { metalSheetTexture, plasterTexture, roofTexture, stoneTexture, woodTexture } from "@/lib/three/textures";

/** Shared materials for all landmarks (created lazily, once). Smooth PBR with procedural textures. */
let cache: ReturnType<typeof create> | null = null;

function create() {
  type Opts = Partial<ConstructorParameters<typeof MeshStandardMaterial>[0]>;
  const std = (color: string, extra: Opts = {}) => new MeshStandardMaterial({ color, roughness: 0.78, ...extra });
  const tex = (map: Texture, extra: Opts = {}) => new MeshStandardMaterial({ map, roughness: 0.82, ...extra });
  return {
    stone: tex(stoneTexture("#c9bca4", "pave", 6), { roughness: 0.9 }),
    stoneDark: tex(stoneTexture("#958a79", "rubble", 4), { roughness: 0.95 }),
    wood: tex(woodTexture("#b07a50"), { roughness: 0.75 }),
    woodDark: tex(woodTexture("#6f4a33", "wooddark"), { roughness: 0.8 }),
    roofRed: tex(roofTexture("#a8473a"), { roughness: 0.7 }),
    cream: tex(plasterTexture("#efe5d2"), { roughness: 0.88 }),
    white: tex(plasterTexture("#f4f1ea"), { roughness: 0.85 }),
    slate: std("#4f5767", { roughness: 0.55, metalness: 0.25 }),
    metal: tex(metalSheetTexture("#a9b2bd"), { metalness: 0.75, roughness: 0.35 }),
    chrome: std("#dfe3e8", { metalness: 1, roughness: 0.12 }),
    dark: std("#2a2e37", { roughness: 0.6 }),
    green: std("#5d9447", { roughness: 0.9 }),
    red: std("#c23b2e", { roughness: 0.45, metalness: 0.1 }),
    trim: std("#fbf8f1", { roughness: 0.5 }),
    glass: new MeshPhysicalMaterial({ color: "#7aa7c2", metalness: 0.1, roughness: 0.06, envMapIntensity: 1.6, clearcoat: 1, emissive: "#24485e", emissiveIntensity: 0.25 }),
    windowWarm: new MeshStandardMaterial({ color: "#ffd99a", emissive: "#ffc46b", emissiveIntensity: 1.4, roughness: 0.2 }),
    windowCool: new MeshStandardMaterial({ color: "#cfe6ff", emissive: "#9ccaf5", emissiveIntensity: 0.9, roughness: 0.2 }),
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
