import {
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  BoxGeometry,
  SphereGeometry,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createRng } from "@/lib/noise";

/**
 * Procedural low-poly prop geometry. Each prop is merged into a single
 * vertex-coloured BufferGeometry so a whole forest is one draw call.
 */

function prep(g: BufferGeometry, color: string, tx = 0, ty = 0, tz = 0): BufferGeometry {
  const geo = g.index ? g.toNonIndexed() : g;
  if (geo !== g) g.dispose();
  geo.deleteAttribute("uv");
  geo.translate(tx, ty, tz);
  const c = new Color(color);
  const count = geo.getAttribute("position").count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) colors.set([c.r, c.g, c.b], i * 3);
  geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return geo;
}

function merge(parts: BufferGeometry[]) {
  const merged = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  return merged;
}

function jitter(g: BufferGeometry, amount: number, seed: number) {
  const rng = createRng(seed);
  const pos = g.getAttribute("position");
  // Jitter shared vertices consistently so faces stay closed.
  const map = new Map<string, [number, number, number]>();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    let o = map.get(key);
    if (!o) {
      o = [(rng() - 0.5) * amount, (rng() - 0.5) * amount, (rng() - 0.5) * amount];
      map.set(key, o);
    }
    pos.setXYZ(i, pos.getX(i) + o[0], pos.getY(i) + o[1], pos.getZ(i) + o[2]);
  }
  pos.needsUpdate = true;
  return g;
}

export function pineGeometry() {
  return merge([
    prep(new CylinderGeometry(0.11, 0.16, 0.9, 6), "#7a5236", 0, 0.45, 0),
    prep(jitter(new ConeGeometry(0.95, 1.4, 7), 0.08, 1), "#3f7d4f", 0, 1.35, 0),
    prep(jitter(new ConeGeometry(0.75, 1.2, 7), 0.07, 2), "#4b8f56", 0, 2.0, 0),
    prep(jitter(new ConeGeometry(0.5, 1.0, 7), 0.06, 3), "#5aa25e", 0, 2.6, 0),
  ]);
}

export function broadleafGeometry() {
  return merge([
    prep(new CylinderGeometry(0.1, 0.17, 1.3, 6), "#81573a", 0, 0.65, 0),
    prep(jitter(new IcosahedronGeometry(0.85, 0), 0.18, 4), "#7fb55a", 0, 1.75, 0),
    prep(jitter(new IcosahedronGeometry(0.6, 0), 0.14, 5), "#95c463", 0.45, 2.15, 0.2),
    prep(jitter(new IcosahedronGeometry(0.55, 0), 0.14, 6), "#6ea64f", -0.4, 2.05, -0.25),
  ]);
}

export function rockGeometry() {
  const g = jitter(new DodecahedronGeometry(0.7, 0), 0.25, 9);
  g.scale(1, 0.62, 1);
  return merge([prep(g, "#a49bb0", 0, 0.2, 0)]);
}

export function tuftGeometry() {
  const parts: BufferGeometry[] = [];
  const rng = createRng(21);
  for (let i = 0; i < 5; i++) {
    const h = 0.32 + rng() * 0.3;
    const blade = new ConeGeometry(0.05, h, 3);
    blade.rotateZ((rng() - 0.5) * 0.6);
    blade.rotateX((rng() - 0.5) * 0.6);
    parts.push(prep(blade, i % 2 ? "#79ae55" : "#94c565", (rng() - 0.5) * 0.25, h / 2, (rng() - 0.5) * 0.25));
  }
  return merge(parts);
}

export function flowerGeometry() {
  return merge([
    prep(new CylinderGeometry(0.015, 0.02, 0.36, 4), "#5f8f45", 0, 0.18, 0),
    prep(new IcosahedronGeometry(0.075, 0), "#ffffff", 0, 0.38, 0),
    prep(new ConeGeometry(0.045, 0.14, 3), "#6aa152", 0.05, 0.08, 0),
  ]);
}

/** Street lamp: pole + arm hanging over +z. The bulb is a separate emissive mesh. */
export function lampGeometry() {
  const arm = new BoxGeometry(0.08, 0.08, 1.1);
  const head = new BoxGeometry(0.34, 0.12, 0.42);
  return merge([
    prep(new CylinderGeometry(0.16, 0.2, 0.25, 8), "#4a4f5c", 0, 0.125, 0),
    prep(new CylinderGeometry(0.06, 0.08, 3.4, 8), "#5a6070", 0, 1.7, 0),
    prep(arm, "#5a6070", 0, 3.38, 0.5),
    prep(head, "#3e4350", 0, 3.34, 1.05),
  ]);
}

export function lampBulbGeometry() {
  const g = new SphereGeometry(0.13, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  g.translate(0, 3.27, 1.05);
  return g;
}

export function postGeometry() {
  return merge([
    prep(new BoxGeometry(0.12, 0.62, 0.12), "#f4efe6", 0, 0.31, 0),
    prep(new BoxGeometry(0.13, 0.1, 0.13), "#e9603f", 0, 0.5, 0),
    prep(new BoxGeometry(0.13, 0.05, 0.13), "#2f3340", 0, 0.64, 0),
  ]);
}

export function cloudGeometry() {
  const rng = createRng(77);
  const parts: BufferGeometry[] = [];
  const blobs = [
    [0, 0, 0, 1.6],
    [1.5, -0.2, 0.2, 1.15],
    [-1.4, -0.25, -0.1, 1.2],
    [0.6, 0.55, -0.4, 1.0],
    [-0.5, 0.35, 0.6, 0.95],
    [2.5, -0.45, -0.2, 0.75],
  ];
  for (const [x, y, z, r] of blobs) {
    parts.push(prep(jitter(new IcosahedronGeometry(r, 1), 0.12 * r, Math.floor(rng() * 1000)), "#ffffff", x, y, z));
  }
  const g = merge(parts);
  g.scale(1, 0.62, 1);
  return g;
}
