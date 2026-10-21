import {
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Path,
  PlaneGeometry,
  QuadraticBezierCurve3,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createNoise3D, createRng } from "@/lib/noise";

/**
 * Procedural prop geometry for the instanced scenery. Each prop is merged
 * into one smooth-shaded, vertex-coloured geometry (one draw call per prop
 * type per visible chunk). Vertex colours carry gradients and fake ambient
 * occlusion so the props read well without textures.
 */

type ColorFn = (p: Vector3, n: Vector3) => Color;

const _p = new Vector3();
const _n = new Vector3();

/** Indexed part with a per-vertex colour (constant or computed from position/normal). */
function part(g: BufferGeometry, color: string | ColorFn, tx = 0, ty = 0, tz = 0): BufferGeometry {
  let geo = g;
  geo.deleteAttribute("uv");
  if (!geo.index) {
    geo = mergeVertices(geo);
    g.dispose();
  }
  geo.translate(tx, ty, tz);
  geo.computeVertexNormals();
  const pos = geo.getAttribute("position");
  const nor = geo.getAttribute("normal");
  const colors = new Float32Array(pos.count * 3);
  const fixed = typeof color === "string" ? new Color(color) : null;
  for (let i = 0; i < pos.count; i++) {
    const c = fixed ?? (color as ColorFn)(_p.fromBufferAttribute(pos, i), _n.fromBufferAttribute(nor, i));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
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

/** Push vertices along their direction from `center` by smooth noise. */
function displace(g: BufferGeometry, amount: number, freq: number, seed: number, center = new Vector3()) {
  const noise = createNoise3D(seed);
  const pos = g.getAttribute("position");
  const v = new Vector3();
  const d = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    d.subVectors(v, center);
    const len = d.length() || 1;
    const n = noise(v.x * freq, v.y * freq, v.z * freq) * 0.7 + noise(v.x * freq * 2.3 + 5, v.y * freq * 2.3, v.z * freq * 2.3) * 0.3;
    v.addScaledVector(d.divideScalar(len), n * amount);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  return g;
}

const mix = (a: string, b: string, t: number) => new Color(a).lerp(new Color(b), Math.min(1, Math.max(0, t)));

/* ───────────── trees ───────────── */

export function pineGeometry() {
  const rng = createRng(11);
  const parts: BufferGeometry[] = [
    part(new CylinderGeometry(0.07, 0.15, 1.1, 8, 2), (p) => mix("#4a3424", "#6e4f36", p.y / 1.1), 0, 0.55, 0),
  ];
  const tiers = [
    { r: 1.05, h: 1.05, y: 0.75 },
    { r: 0.9, h: 0.95, y: 1.2 },
    { r: 0.74, h: 0.85, y: 1.62 },
    { r: 0.56, h: 0.75, y: 2.0 },
    { r: 0.36, h: 0.7, y: 2.36 },
  ];
  tiers.forEach((t, k) => {
    const cone = new ConeGeometry(t.r, t.h, 12, 2, false);
    // irregular, drooping branches
    const pos = cone.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const rim = y < -t.h / 2 + 0.01 ? 1 : 0;
      const ang = Math.atan2(z, x);
      const wob = 1 + Math.sin(ang * 7 + k * 2.1) * 0.08 + (rng() - 0.5) * 0.06;
      pos.setXYZ(i, x * wob, y - rim * (0.08 + Math.sin(ang * 5 + k) * 0.05), z * wob);
    }
    parts.push(
      part(cone, (p, n) => {
        const local = (p.y - t.y) / t.h; // 0 at the tier's skirt, 1 at its tip
        const outer = Math.hypot(p.x, p.z) / t.r;
        return mix("#1f4a2c", "#4f8d4f", local * 0.55 + outer * 0.35 + Math.max(0, n.y) * 0.25 + k * 0.03);
      }, 0, t.y + t.h / 2, 0),
    );
  });
  return merge(parts);
}

export function broadleafGeometry() {
  const parts: BufferGeometry[] = [
    part(new CylinderGeometry(0.08, 0.16, 1.5, 8, 3), (p) => mix("#4b3526", "#76563b", p.y / 1.5), 0, 0.75, 0),
  ];
  const branch = new CylinderGeometry(0.03, 0.05, 0.7, 6);
  branch.rotateZ(0.8);
  parts.push(part(branch, "#5f4430", 0.25, 1.35, 0));
  const blobs: [number, number, number, number][] = [
    [0, 2.05, 0, 0.82],
    [0.55, 1.8, 0.25, 0.6],
    [-0.5, 1.85, -0.2, 0.62],
    [0.15, 2.45, -0.3, 0.55],
    [-0.2, 2.3, 0.45, 0.5],
  ];
  blobs.forEach(([x, y, z, r], k) => {
    const g = displace(mergeVertices(new IcosahedronGeometry(r, 1)), r * 0.28, 2.2, 40 + k);
    parts.push(
      part(g, (p, n) => mix("#2f5a2a", "#86b85a", 0.45 + n.y * 0.4 + (p.y - 1.6) * 0.18), x, y, z),
    );
  });
  return merge(parts);
}

/* ───────────── ground props ───────────── */

export function rockGeometry() {
  const g = displace(mergeVertices(new IcosahedronGeometry(0.7, 2)), 0.22, 1.6, 9);
  g.scale(1, 0.62, 1);
  const noise = createNoise3D(91);
  return merge([
    part(g, (p, n) => {
      const base = mix("#7d7568", "#aaa196", 0.5 + noise(p.x * 3, p.y * 3, p.z * 3) * 0.5);
      return base.lerp(new Color("#5d7a3e"), Math.max(0, (n.y - 0.6) * 1.6)); // moss on top
    }, 0, 0.18, 0),
  ]);
}

export function tuftGeometry() {
  const rng = createRng(21);
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < 11; i++) {
    const h = 0.32 + rng() * 0.32;
    const blade = new PlaneGeometry(0.045, h, 1, 4);
    blade.translate(0, h / 2, 0);
    const bend = 0.08 + rng() * 0.14;
    const pos = blade.getAttribute("position");
    for (let v = 0; v < pos.count; v++) {
      const t = pos.getY(v) / h;
      pos.setX(v, pos.getX(v) * (1 - t * 0.9));
      pos.setZ(v, bend * t * t);
    }
    blade.rotateY(rng() * Math.PI * 2);
    parts.push(part(blade, (p) => mix("#3b6a2c", "#a9cd6c", p.y / h), (rng() - 0.5) * 0.22, 0, (rng() - 0.5) * 0.22));
  }
  return merge(parts);
}

export function flowerGeometry() {
  const parts: BufferGeometry[] = [
    part(new CylinderGeometry(0.012, 0.016, 0.38, 5), "#4f7f3b", 0, 0.19, 0),
    part(new SphereGeometry(0.03, 10, 8), "#f2c14e", 0, 0.4, 0),
  ];
  for (let k = 0; k < 6; k++) {
    const petal = new SphereGeometry(0.045, 10, 6);
    petal.scale(1, 0.25, 0.55);
    petal.translate(0.05, 0, 0);
    petal.rotateY((k / 6) * Math.PI * 2);
    parts.push(part(petal, "#ffffff", 0, 0.395, 0));
  }
  const leaf = new SphereGeometry(0.05, 8, 6);
  leaf.scale(1.6, 0.2, 0.6);
  leaf.rotateZ(0.5);
  parts.push(part(leaf, "#5c9445", 0.06, 0.1, 0));
  return merge(parts);
}

/** Street lamp: plinth, tapered pole and a swan-neck arm hanging over +z. The bulb is separate. */
export function lampGeometry() {
  const metal = (p: Vector3) => mix("#2c313b", "#4a5262", 0.3 + p.y * 0.05);
  const arm = new TubeGeometry(new QuadraticBezierCurve3(new Vector3(0, 3.25, 0), new Vector3(0, 3.7, 0.45), new Vector3(0, 3.42, 1.0)), 16, 0.035, 6);
  const head = new CylinderGeometry(0.12, 0.24, 0.16, 16);
  return merge([
    part(new CylinderGeometry(0.17, 0.22, 0.28, 12), metal, 0, 0.14, 0),
    part(new CylinderGeometry(0.045, 0.075, 3.3, 12), metal, 0, 1.9, 0),
    part(new CylinderGeometry(0.09, 0.09, 0.06, 12), metal, 0, 0.6, 0),
    part(arm, metal),
    part(head, metal, 0, 3.38, 1.05),
  ]);
}

export function lampBulbGeometry() {
  const g = new SphereGeometry(0.13, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  g.translate(0, 3.3, 1.05);
  return g;
}

export function postGeometry() {
  const cap = new SphereGeometry(0.065, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  return merge([
    part(new CylinderGeometry(0.06, 0.065, 0.6, 10), "#f2efe8", 0, 0.3, 0),
    part(new CylinderGeometry(0.066, 0.066, 0.09, 10), "#d8402a", 0, 0.48, 0),
    part(cap, "#2a2e37", 0, 0.6, 0),
  ]);
}

export function cloudGeometry() {
  const rng = createRng(77);
  const parts: BufferGeometry[] = [];
  const blobs = [
    [0, 0, 0, 1.6, 2],
    [1.5, -0.2, 0.2, 1.15, 1],
    [-1.4, -0.25, -0.1, 1.2, 1],
    [0.6, 0.55, -0.4, 1.0, 1],
    [-0.5, 0.35, 0.6, 0.95, 1],
    [2.5, -0.45, -0.2, 0.75, 1],
    [-2.3, -0.4, 0.3, 0.7, 1],
  ];
  for (const [x, y, z, r, d] of blobs) {
    const g = displace(mergeVertices(new IcosahedronGeometry(r, d)), r * 0.12, 1.2, Math.floor(rng() * 1000));
    parts.push(part(g, (p) => mix("#c9d3df", "#ffffff", 0.55 + (p.y + 0.4) * 0.5), x, y, z));
  }
  const g = merge(parts);
  g.scale(1, 0.6, 1);
  return g;
}

/** Bevelled hex nut — the collectible engineering token. Axis along z (stands upright). */
export function tokenGeometry() {
  const s = new Shape();
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(a) * 0.26;
    const y = Math.sin(a) * 0.26;
    if (k === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  const hole = new Path();
  hole.absarc(0, 0, 0.1, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const g = new ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3, curveSegments: 20 });
  g.translate(0, 0, -0.05);
  g.computeVertexNormals();
  return g;
}
