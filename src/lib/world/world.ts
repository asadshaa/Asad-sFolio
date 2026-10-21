import { Color, IcosahedronGeometry, Matrix4, Quaternion, Vector3 } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { DESTINATIONS, QUALITY, TOKENS, WORLD, type DestinationConfig, type QualityTier } from "@/config/world";
import type { SectionId } from "@/config/portfolio";
import { createNoise3D, createRng, lerp, smoothstep } from "@/lib/noise";

/**
 * Procedural planet generation. Everything here is plain math (no React) so it
 * can run once before the Canvas mounts and be shared by all scene components.
 *
 * Coordinate model: the planet is centred at the origin. A "dir" is a unit
 * vector from the centre; a surface point is dir * (R + height).
 */

const TAU = Math.PI * 2;
const R = WORLD.radius;
const HW = WORLD.road.halfWidth;

export interface Collider {
  x: number;
  y: number;
  z: number;
  r: number;
}

export interface LandmarkFrame {
  id: SectionId;
  config: DestinationConfig;
  /** Landmark-local → world. y = surface up, +z faces the road. */
  matrix: Matrix4;
  position: Vector3;
  up: Vector3;
  /** Road sample index at the landmark. */
  roadIndex: number;
  /** Centre of the interaction zone (on the road). */
  zoneCenter: Vector3;
}

export interface InstanceData {
  count: number;
  matrices: Float32Array;
  colors: Float32Array;
}

export interface SignData {
  id: SectionId;
  matrix: Matrix4;
}

export interface MilestoneData {
  /** Index into `journey` from the portfolio config. */
  stop: number;
  matrix: Matrix4;
}

export interface TokenData {
  position: Vector3;
  hidden: boolean;
}

export interface World {
  quality: QualityTier;
  road: {
    count: number;
    dirs: Float32Array;
    elev: Float32Array;
    tangents: Float32Array;
    sides: Float32Array;
    arc: Float32Array;
    length: number;
  };
  terrain: { positions: Float32Array; colors: Float32Array; index: Uint32Array };
  landmarks: LandmarkFrame[];
  colliders: Collider[];
  pines: InstanceData;
  broadleaf: InstanceData;
  rocks: InstanceData;
  tufts: InstanceData;
  flowers: InstanceData;
  lamps: InstanceData;
  posts: InstanceData;
  signs: SignData[];
  milestones: MilestoneData[];
  tokens: TokenData[];
  clouds: InstanceData;
}

/* ───────────────────────────── road ───────────────────────────── */

function roadDir(u: number, out: Vector3) {
  const a = u * TAU;
  const lon = a + 0.18 * Math.sin(3 * a + 0.5) + 0.05 * Math.sin(5 * a + 2.1);
  const lat = 0.34 * Math.sin(2 * a + 0.9) + 0.13 * Math.sin(5 * a + 0.3) + 0.055 * Math.sin(9 * a + 1.7);
  return out.set(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon));
}

function roadElevation(u: number) {
  const a = u * TAU;
  return 0.95 + 0.7 * Math.sin(3 * a + 0.4) + 0.32 * Math.sin(7 * a + 1.0);
}

function buildRoad() {
  const count = WORLD.road.samples;
  const dirs = new Float32Array(count * 3);
  const elev = new Float32Array(count);
  const tangents = new Float32Array(count * 3);
  const sides = new Float32Array(count * 3);
  const arc = new Float32Array(count + 1);
  const v = new Vector3();
  for (let i = 0; i < count; i++) {
    roadDir(i / count, v);
    dirs.set([v.x, v.y, v.z], i * 3);
    elev[i] = roadElevation(i / count);
  }
  const prev = new Vector3();
  const next = new Vector3();
  const up = new Vector3();
  const t = new Vector3();
  const s = new Vector3();
  let length = 0;
  for (let i = 0; i < count; i++) {
    const ip = (i - 1 + count) % count;
    const inx = (i + 1) % count;
    prev.fromArray(dirs, ip * 3);
    next.fromArray(dirs, inx * 3);
    up.fromArray(dirs, i * 3);
    t.subVectors(next, prev);
    t.addScaledVector(up, -t.dot(up)).normalize();
    s.crossVectors(t, up).normalize();
    tangents.set([t.x, t.y, t.z], i * 3);
    sides.set([s.x, s.y, s.z], i * 3);
    arc[i] = length;
    next.fromArray(dirs, inx * 3);
    length += next.distanceTo(up) * R;
  }
  arc[count] = length;
  return { count, dirs, elev, tangents, sides, arc, length };
}

/* ─────────────────────────── terrain ──────────────────────────── */

type Road = ReturnType<typeof buildRoad>;

export interface NearestRoad {
  index: number;
  dist: number;
  /** Signed lateral side (+1 along `sides`, -1 opposite). */
  side: number;
  /** Elevation interpolated along the road. */
  elev: number;
}

export interface TerrainSample {
  /** Height above radius R. */
  h: number;
  roadDist: number;
  roadIndex: number;
  mountain: number;
  pad: number;
  detail: number;
  water: boolean;
}

interface Pad {
  dir: Vector3;
  r: number;
  h: number;
}
interface Feature {
  dir: Vector3;
  r: number;
  depth: number;
}

export function createTerrainSampler(road: Road, seed: number) {
  const noise = createNoise3D(seed);
  const pads: Pad[] = [];
  const features: Feature[] = [];
  const nearest: NearestRoad = { index: 0, dist: 0, side: 1, elev: 0 };
  const sample: TerrainSample = { h: 0, roadDist: 0, roadIndex: 0, mountain: 0, pad: 0, detail: 0, water: false };
  const { dirs, elev, count, sides, tangents } = road;

  function nearestRoad(x: number, y: number, z: number, hint = -1): NearestRoad {
    let best = 0;
    let bestDot = -2;
    if (hint >= 0) {
      // Local search around the previous index (used by the vehicle every frame).
      for (let k = -24; k <= 24; k++) {
        const i = (hint + k + count) % count;
        const d = dirs[i * 3] * x + dirs[i * 3 + 1] * y + dirs[i * 3 + 2] * z;
        if (d > bestDot) {
          bestDot = d;
          best = i;
        }
      }
    }
    if (hint < 0 || bestDot < Math.cos(12 / R)) {
      bestDot = -2;
      for (let i = 0; i < count; i += 16) {
        const d = dirs[i * 3] * x + dirs[i * 3 + 1] * y + dirs[i * 3 + 2] * z;
        if (d > bestDot) {
          bestDot = d;
          best = i;
        }
      }
      const coarse = best;
      for (let k = -16; k <= 16; k++) {
        const i = (coarse + k + count) % count;
        const d = dirs[i * 3] * x + dirs[i * 3 + 1] * y + dirs[i * 3 + 2] * z;
        if (d > bestDot) {
          bestDot = d;
          best = i;
        }
      }
    }
    const i3 = best * 3;
    const dx = x - dirs[i3],
      dy = y - dirs[i3 + 1],
      dz = z - dirs[i3 + 2];
    const lateral = dx * sides[i3] + dy * sides[i3 + 1] + dz * sides[i3 + 2];
    const along = (dx * tangents[i3] + dy * tangents[i3 + 1] + dz * tangents[i3 + 2]) * R;
    const spacing = road.length / count;
    const f = Math.max(-1, Math.min(1, along / spacing));
    const j = (best + (f >= 0 ? 1 : -1) + count) % count;
    nearest.index = best;
    nearest.dist = Math.acos(Math.min(1, bestDot)) * R;
    nearest.side = lateral >= 0 ? 1 : -1;
    nearest.elev = lerp(elev[best], elev[j], Math.abs(f));
    return nearest;
  }

  function hills(x: number, y: number, z: number) {
    const n1 = noise(x * 2.1, y * 2.1, z * 2.1);
    const n2 = noise(x * 5.3 + 3, y * 5.3 + 3, z * 5.3 + 3);
    const n3 = noise(x * 13 + 7, y * 13 + 7, z * 13 + 7);
    sample.detail = n2;
    return 0.9 + n1 * 2.6 + n2 * 1.25 + n3 * 0.4;
  }

  function mountains(x: number, y: number, z: number) {
    const region = smoothstep(-0.1, 0.5, noise(x * 1.35 + 19, y * 1.35 + 19, z * 1.35 + 19));
    if (region <= 0) return 0;
    const r1 = 1 - Math.abs(noise(x * 3.4 + 5, y * 3.4 + 5, z * 3.4 + 5));
    const r2 = 1 - Math.abs(noise(x * 8 + 9, y * 8 + 9, z * 8 + 9));
    return region * (Math.pow(r1, 2.6) * 17 + r2 * r2 * 2.5);
  }

  function sampleTerrain(x: number, y: number, z: number, hint = -1): TerrainSample {
    const n = nearestRoad(x, y, z, hint);
    const d = n.dist;
    let base = hills(x, y, z);
    const mtn = mountains(x, y, z) * smoothstep(13, 40, d);
    base += mtn;
    for (const f of features) {
      const fd = Math.sqrt((x - f.dir.x) ** 2 + (y - f.dir.y) ** 2 + (z - f.dir.z) ** 2) * R;
      if (fd < f.r) {
        const q = 1 - (fd / f.r) ** 2;
        base -= f.depth * q * q + 0.0;
      }
    }
    const m = smoothstep(HW + 0.9, HW + 10, d);
    let h = lerp(n.elev - 0.03, base, m);
    let pad = 0;
    for (const p of pads) {
      const pd = Math.sqrt((x - p.dir.x) ** 2 + (y - p.dir.y) ** 2 + (z - p.dir.z) ** 2) * R;
      const pm = 1 - smoothstep(p.r, p.r + 5, pd);
      if (pm > 0) {
        h = lerp(h, p.h, pm);
        pad = Math.max(pad, pm);
      }
    }
    sample.h = h;
    sample.roadDist = d;
    sample.roadIndex = n.index;
    sample.mountain = mtn;
    sample.pad = pad;
    sample.water = h < WORLD.waterLevel + 0.12;
    return sample;
  }

  return { nearestRoad, sampleTerrain, pads, features };
}

/* ─────────────────────────── helpers ──────────────────────────── */

const _up = new Vector3(0, 1, 0);
const _q = new Quaternion();
const _q2 = new Quaternion();
const _v = new Vector3();
const _s = new Vector3();

/** Matrix for an object standing on the surface at `dir`, yawed around local up. */
function surfaceMatrix(dir: Vector3, height: number, yaw: number, scale: number, out: Matrix4) {
  _q.setFromUnitVectors(_up, dir);
  _q2.setFromAxisAngle(_up, yaw);
  _q.multiply(_q2);
  _v.copy(dir).multiplyScalar(R + height);
  _s.set(scale, scale, scale);
  return out.compose(_v, _q, _s);
}

/** Basis matrix (x, y=up, z) positioned at p. */
export function basisMatrix(x: Vector3, y: Vector3, z: Vector3, p: Vector3, out = new Matrix4()) {
  out.makeBasis(x, y, z);
  out.setPosition(p);
  return out;
}

function randomDir(rng: () => number, out: Vector3) {
  const z = rng() * 2 - 1;
  const phi = rng() * TAU;
  const r = Math.sqrt(1 - z * z);
  return out.set(r * Math.cos(phi), z, r * Math.sin(phi));
}

function makeInstances(capacity: number) {
  return { count: 0, matrices: new Float32Array(capacity * 16), colors: new Float32Array(capacity * 3) };
}

function pushInstance(set: InstanceData, m: Matrix4, r: number, g: number, b: number) {
  m.toArray(set.matrices, set.count * 16);
  set.colors[set.count * 3] = r;
  set.colors[set.count * 3 + 1] = g;
  set.colors[set.count * 3 + 2] = b;
  set.count++;
}

/* ─────────────────────────── build ──────────────────────────── */

let cached: World | null = null;
let sampler: ReturnType<typeof createTerrainSampler> | null = null;

export function getWorld(): World {
  if (!cached) throw new Error("World not built yet — call buildWorld() first.");
  return cached;
}

export function getSampler() {
  if (!sampler) throw new Error("World not built yet — call buildWorld() first.");
  return sampler;
}

export function isWorldBuilt() {
  return cached !== null;
}

export function buildWorld(quality: QualityTier): World {
  if (cached && cached.quality === quality) return cached;
  const q = QUALITY[quality];
  const road = buildRoad();
  const s = createTerrainSampler(road, WORLD.seed);
  sampler = s;
  const rng = createRng(WORLD.seed * 7 + 3);

  /* landmarks */
  const landmarks: LandmarkFrame[] = DESTINATIONS.map((cfg) => {
    const idx = Math.round(cfg.roadT * road.count) % road.count;
    const rd = new Vector3().fromArray(road.dirs, idx * 3);
    const side = new Vector3().fromArray(road.sides, idx * 3);
    const padH = road.elev[idx] + 0.02;
    const dir = rd
      .clone()
      .multiplyScalar(R)
      .addScaledVector(side, cfg.side * cfg.offset)
      .normalize();
    const up = dir.clone();
    const toRoad = rd.clone().sub(dir);
    toRoad.addScaledVector(up, -toRoad.dot(up)).normalize();
    const x = new Vector3().crossVectors(up, toRoad).normalize();
    const position = up.clone().multiplyScalar(R + padH);
    const matrix = basisMatrix(x, up, toRoad, position);
    const zoneCenter = rd
      .clone()
      .multiplyScalar(R)
      .addScaledVector(side, cfg.side * 1.0)
      .normalize()
      .multiplyScalar(R + road.elev[idx]);
    s.pads.push({ dir: up.clone(), r: cfg.padRadius, h: padH });
    if (cfg.feature) {
      const fp = position.clone().addScaledVector(x, cfg.feature.x).addScaledVector(toRoad, cfg.feature.z).normalize();
      s.features.push({ dir: fp, r: cfg.feature.radius, depth: cfg.feature.depth });
    }
    return { id: cfg.id, config: cfg, matrix, position, up, roadIndex: idx, zoneCenter };
  });

  /* terrain mesh */
  const detail = quality === "high" ? WORLD.terrainDetail.high : WORLD.terrainDetail.low;
  let geo = new IcosahedronGeometry(1, detail);
  geo.deleteAttribute("normal");
  geo.deleteAttribute("uv");
  geo = mergeVertices(geo) as IcosahedronGeometry;
  const pos = geo.getAttribute("position");
  const positions = new Float32Array(pos.count * 3);
  const colors = new Float32Array(pos.count * 3);
  const P = WORLD.palette;
  const cGrassA = new Color(P.grassA),
    cGrassB = new Color(P.grassB),
    cDark = new Color(P.grassDark),
    cDirt = new Color(P.dirt),
    cSand = new Color(P.sand),
    cRock = new Color(P.rock),
    cSnow = new Color(P.snow),
    cPad = new Color(P.pad);
  const col = new Color();
  const dir = new Vector3();
  // Extra colour-only noise: fine variation and dry-grass patches.
  const tint = createNoise3D(WORLD.seed + 5);
  const cDry = new Color("#b0aa62");
  for (let i = 0; i < pos.count; i++) {
    dir.fromBufferAttribute(pos, i).normalize();
    const t = s.sampleTerrain(dir.x, dir.y, dir.z);
    const r = R + t.h;
    positions[i * 3] = dir.x * r;
    positions[i * 3 + 1] = dir.y * r;
    positions[i * 3 + 2] = dir.z * r;

    col.copy(cGrassA).lerp(cGrassB, smoothstep(-0.5, 0.6, t.detail));
    col.lerp(cDry, smoothstep(0.35, 0.8, tint(dir.x * 9, dir.y * 9, dir.z * 9)) * 0.55);
    col.multiplyScalar(0.93 + tint(dir.x * 40 + 3, dir.y * 40, dir.z * 40) * 0.07);
    col.lerp(cDark, smoothstep(0.3, -1.2, t.h) * 0.7);
    col.lerp(cSand, smoothstep(WORLD.waterLevel + 0.7, WORLD.waterLevel + 0.1, t.h));
    col.lerp(cDirt, smoothstep(HW + 2.2, HW + 0.6, t.roadDist) * 0.85);
    col.lerp(cRock, smoothstep(1.2, 3.8, t.mountain));
    col.lerp(cSnow, smoothstep(8.5, 11, t.h));
    col.lerp(cPad, smoothstep(0.55, 0.85, t.pad));
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  const indexAttr = geo.getIndex()!;
  const index = new Uint32Array(indexAttr.array);
  geo.dispose();

  /* scatter */
  const colliders: Collider[] = [];
  const pines = makeInstances(q.trees);
  const broadleaf = makeInstances(q.trees);
  const rocks = makeInstances(q.rocks);
  const tufts = makeInstances(q.tufts);
  const flowers = makeInstances(q.flowers);
  const m = new Matrix4();
  const d = new Vector3();

  const nearLandmark = (v: Vector3, extra: number) =>
    landmarks.some((l) => v.distanceTo(l.up) * R < l.config.padRadius + extra);

  let guard = 0;
  while (pines.count + broadleaf.count < q.trees && guard++ < q.trees * 40) {
    randomDir(rng, d);
    const t = s.sampleTerrain(d.x, d.y, d.z);
    if (t.roadDist < HW + 3.2 || t.water || t.h < WORLD.waterLevel + 0.4 || t.h > 8.5) continue;
    if (t.pad > 0.02 || nearLandmark(d, 3)) continue;
    if (t.roadDist > 32 && rng() > 0.45) continue;
    if (t.mountain > 4 && rng() > 0.25) continue;
    const pine = t.mountain > 0.8 || rng() < 0.42;
    const scale = 0.75 + rng() * 0.75;
    surfaceMatrix(d, t.h - 0.12, rng() * TAU, scale, m);
    const tint = 0.86 + rng() * 0.22;
    const set = pine ? pines : broadleaf;
    if (set.count >= q.trees) continue;
    pushInstance(set, m, tint, tint * (0.95 + rng() * 0.1), tint);
    colliders.push({ x: d.x * (R + t.h), y: d.y * (R + t.h), z: d.z * (R + t.h), r: 0.32 * scale });
  }

  guard = 0;
  while (rocks.count < q.rocks && guard++ < q.rocks * 40) {
    randomDir(rng, d);
    const t = s.sampleTerrain(d.x, d.y, d.z);
    if (t.roadDist < HW + 2.2 || t.water || t.pad > 0.05 || nearLandmark(d, 1.5)) continue;
    const scale = 0.35 + Math.pow(rng(), 2) * 1.5;
    surfaceMatrix(d, t.h - 0.1 * scale, rng() * TAU, scale, m);
    const g = 0.85 + rng() * 0.25;
    pushInstance(rocks, m, g, g, g * (0.98 + rng() * 0.06));
    if (scale > 0.8) colliders.push({ x: d.x * (R + t.h), y: d.y * (R + t.h), z: d.z * (R + t.h), r: 0.7 * scale });
  }

  guard = 0;
  while (tufts.count < q.tufts && guard++ < q.tufts * 30) {
    randomDir(rng, d);
    const t = s.sampleTerrain(d.x, d.y, d.z);
    if (t.roadDist < HW + 0.9 || t.water || t.h < WORLD.waterLevel + 0.3 || t.mountain > 2 || t.pad > 0.6) continue;
    if (t.roadDist > 30 && rng() > 0.35) continue;
    surfaceMatrix(d, t.h - 0.02, rng() * TAU, 0.6 + rng() * 0.7, m);
    const g = 0.8 + rng() * 0.35;
    pushInstance(tufts, m, g, g, g);
  }

  const flowerColors = [
    new Color("#fff6e6"),
    new Color("#ffd35c"),
    new Color("#f59bb4"),
    new Color("#c6a8f0"),
    new Color("#ff8b6a"),
  ];
  guard = 0;
  while (flowers.count < q.flowers && guard++ < q.flowers * 30) {
    randomDir(rng, d);
    const t = s.sampleTerrain(d.x, d.y, d.z);
    if (t.roadDist < HW + 1.2 || t.water || t.h < WORLD.waterLevel + 0.4 || t.mountain > 1.5 || t.pad > 0.4) continue;
    if (t.roadDist > 26 && rng() > 0.3) continue;
    surfaceMatrix(d, t.h - 0.02, rng() * TAU, 0.7 + rng() * 0.6, m);
    const c = flowerColors[Math.floor(rng() * flowerColors.length)];
    pushInstance(flowers, m, c.r, c.g, c.b);
  }

  /* roadside lamps, posts and signs */
  const lampCount = Math.floor(road.length / 24);
  const lamps = makeInstances(lampCount);
  const posts = makeInstances(Math.floor(road.length / 9) * 2);
  const up = new Vector3();
  const tan = new Vector3();
  const sideV = new Vector3();
  const xAxis = new Vector3();
  const zAxis = new Vector3();
  const p = new Vector3();
  const nearZone = (v: Vector3, r: number) => landmarks.some((l) => v.distanceTo(l.zoneCenter) < r);

  const indexAtArc = (a: number) => {
    let lo = 0,
      hi = road.count - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (road.arc[mid] <= a) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };

  for (let k = 0; k < lampCount; k++) {
    const i = indexAtArc(10 + k * 24);
    const sideSign = k % 2 === 0 ? 1 : -1;
    up.fromArray(road.dirs, i * 3);
    sideV.fromArray(road.sides, i * 3);
    p.copy(up).multiplyScalar(R).addScaledVector(sideV, sideSign * (HW + 1.15));
    const dirL = p.clone().normalize();
    const surf = dirL.clone().multiplyScalar(R + road.elev[i] - 0.05);
    if (nearZone(surf, 13)) continue;
    // +z points from the lamp toward the road so the arm hangs over the lane.
    zAxis.copy(sideV).multiplyScalar(-sideSign);
    zAxis.addScaledVector(dirL, -zAxis.dot(dirL)).normalize();
    xAxis.crossVectors(dirL, zAxis).normalize();
    basisMatrix(xAxis, dirL, zAxis, surf, m);
    pushInstance(lamps, m, 1, 1, 1);
    colliders.push({ x: surf.x, y: surf.y, z: surf.z, r: 0.22 });
  }

  for (let a = 4; a < road.length; a += 9) {
    const i = indexAtArc(a);
    up.fromArray(road.dirs, i * 3);
    sideV.fromArray(road.sides, i * 3);
    tan.fromArray(road.tangents, i * 3);
    for (const sideSign of [1, -1]) {
      p.copy(up).multiplyScalar(R).addScaledVector(sideV, sideSign * (HW + 0.7));
      const dirP = p.clone().normalize();
      const surf = dirP.clone().multiplyScalar(R + road.elev[i] - 0.04);
      if (nearZone(surf, 11)) continue;
      basisMatrix(xAxis.copy(sideV).multiplyScalar(sideSign), dirP, zAxis.copy(tan), surf, m);
      pushInstance(posts, m, 1, 1, 1);
      colliders.push({ x: surf.x, y: surf.y, z: surf.z, r: 0.12 });
    }
  }

  const signs: SignData[] = landmarks.filter((l) => l.id !== "about").map((l) => {
    const i = (l.roadIndex - 26 + road.count) % road.count;
    up.fromArray(road.dirs, i * 3);
    sideV.fromArray(road.sides, i * 3);
    tan.fromArray(road.tangents, i * 3);
    p.copy(up).multiplyScalar(R).addScaledVector(sideV, l.config.side * (HW + 1.9));
    const dirS = p.clone().normalize();
    const surf = dirS.clone().multiplyScalar(R + road.elev[i] - 0.05);
    // Board faces incoming traffic (−tangent).
    const z = tan.clone().multiplyScalar(-1);
    z.addScaledVector(dirS, -z.dot(dirS)).normalize();
    const x = new Vector3().crossVectors(dirS, z).normalize();
    colliders.push({ x: surf.x, y: surf.y, z: surf.z, r: 0.35 });
    return { id: l.id, matrix: basisMatrix(x, dirS, z, surf, new Matrix4()) };
  });

  /* journey milestones: four posts along the road between Home and the Garage */
  const milestones: MilestoneData[] = [0, 1, 2, 3].map((stop) => {
    const home = landmarks.find((l) => l.id === "about")!;
    const i = (home.roadIndex + 30 + stop * 26) % road.count;
    up.fromArray(road.dirs, i * 3);
    sideV.fromArray(road.sides, i * 3);
    tan.fromArray(road.tangents, i * 3);
    const sideSign = stop % 2 === 0 ? 1 : -1;
    p.copy(up).multiplyScalar(R).addScaledVector(sideV, sideSign * (HW + 1.7));
    const dirS = p.clone().normalize();
    const surf = dirS.clone().multiplyScalar(R + road.elev[i] - 0.05);
    const z = tan.clone().multiplyScalar(-1);
    z.addScaledVector(dirS, -z.dot(dirS)).normalize();
    const x = new Vector3().crossVectors(dirS, z).normalize();
    colliders.push({ x: surf.x, y: surf.y, z: surf.z, r: 0.35 });
    return { stop, matrix: basisMatrix(x, dirS, z, surf, new Matrix4()) };
  });

  /* collectible engineering tokens */
  const tokens: TokenData[] = [];
  for (let k = 0; k < TOKENS.onRoad; k++) {
    const i = indexAtArc(((k + 0.5) / TOKENS.onRoad) * road.length);
    up.fromArray(road.dirs, i * 3);
    sideV.fromArray(road.sides, i * 3);
    const lateral = (k % 3 === 0 ? -1 : k % 3 === 1 ? 1 : 0) * 1.2;
    p.copy(up).multiplyScalar(R).addScaledVector(sideV, lateral).normalize();
    if (nearZone(p.clone().multiplyScalar(R + road.elev[i]), 9)) continue;
    tokens.push({ position: p.clone().multiplyScalar(R + road.elev[i] + 0.9), hidden: false });
  }
  // Hidden tokens: off-road spots behind landmarks (pure bonus — nothing is gated on them).
  for (const id of ["contact", "devops", "research", "creative"] as const) {
    if (tokens.filter((t) => t.hidden).length >= TOKENS.hidden) break;
    const l = landmarks.find((x) => x.id === id)!;
    const xAxis2 = new Vector3().setFromMatrixColumn(l.matrix, 0);
    const zAxis2 = new Vector3().setFromMatrixColumn(l.matrix, 2);
    const spot = l.position.clone().addScaledVector(xAxis2, l.config.padRadius - 1.5).addScaledVector(zAxis2, -(l.config.padRadius - 1)).normalize();
    const t = s.sampleTerrain(spot.x, spot.y, spot.z);
    tokens.push({ position: spot.multiplyScalar(R + Math.max(t.h, WORLD.waterLevel) + 0.9), hidden: true });
  }

  /* landmark colliders */
  for (const l of landmarks) {
    for (const [cx, cz, cr] of l.config.colliders) {
      const v = new Vector3(cx, 0, cz).applyMatrix4(l.matrix);
      colliders.push({ x: v.x, y: v.y, z: v.z, r: cr });
    }
  }

  /* clouds */
  const cloudCount = quality === "high" ? 46 : 28;
  const clouds = makeInstances(cloudCount);
  for (let k = 0; k < cloudCount; k++) {
    randomDir(rng, d);
    const sc = 1.4 + rng() * 2.2;
    surfaceMatrix(d, 26 + rng() * 14, rng() * TAU, sc, m);
    const w = 0.96 + rng() * 0.04;
    pushInstance(clouds, m, w, w, w);
  }

  cached = {
    quality,
    road,
    terrain: { positions, colors, index },
    landmarks,
    colliders,
    pines,
    broadleaf,
    rocks,
    tufts,
    flowers,
    lamps,
    posts,
    signs,
    milestones,
    tokens,
    clouds,
  };
  return cached;
}

/** Road frame at a sample index: position on the road surface and forward tangent. */
export function roadFrame(index: number, outPos: Vector3, outForward: Vector3) {
  const w = getWorld();
  const i = ((index % w.road.count) + w.road.count) % w.road.count;
  outPos.fromArray(w.road.dirs, i * 3).multiplyScalar(R + w.road.elev[i]);
  outForward.fromArray(w.road.tangents, i * 3);
  return i;
}
