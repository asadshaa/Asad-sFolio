import { projectsIn, type SectionId } from "./portfolio";

/** Global world / planet settings. Distances are in world units (≈ metres at toy scale). */
export const WORLD = {
  seed: 1337,
  radius: 80,
  road: {
    samples: 1024,
    halfWidth: 2.7,
    /** Visual texture repeat length along the road. */
    tileLength: 12,
  },
  /** Water sphere height relative to the planet radius. */
  waterLevel: -1.25,
  terrainDetail: { high: 70, low: 48 },
  /** Scenery grows in between `far` and `near` distance from the car. */
  reveal: { near: 40, far: 56 },
  fog: { near: 24, far: 118 },
  palette: {
    skyZenith: "#5f93c9",
    skyMid: "#a6c8e4",
    skyHorizon: "#f6d9bd",
    fog: "#efd6bf",
    sun: "#fff0d4",
    grassA: "#86b25a",
    grassB: "#5f9446",
    grassDark: "#3f713b",
    dirt: "#d8b98d",
    sand: "#e6cf9f",
    rock: "#9b91a6",
    snow: "#f4f1ec",
    pad: "#cdbfa5",
    water: "#2f7ea6",
  },
} as const;

export const QUALITY = {
  high: { trees: 1500, rocks: 280, tufts: 2600, flowers: 900, shadowMap: 2048, dpr: [1, 1.5] as [number, number] },
  low: { trees: 800, rocks: 150, tufts: 1100, flowers: 400, shadowMap: 1024, dpr: [1, 1.25] as [number, number] },
} as const;

export type QualityTier = keyof typeof QUALITY;

export const VEHICLE = {
  maxSpeed: 17,
  maxReverse: 6,
  acceleration: 11,
  reverseAcceleration: 7,
  brakeDeceleration: 26,
  handbrakeDeceleration: 18,
  dragLinear: 0.32,
  rolling: 1.2,
  offroadSpeedFactor: 0.62,
  offroadDrag: 1.1,
  steerMax: 0.55,
  steerRate: 2.6,
  steerReturnRate: 4.2,
  /** Fraction of steering lost at top speed (keeps high-speed steering calm). */
  steerSpeedFalloff: 0.62,
  wheelbase: 2.1,
  collisionRadius: 0.95,
  wheelRadius: 0.3,
  /** Height the chassis origin sits above the ground. */
  rideHeight: 0.02,
  /** Max climb slope before terrain behaves like a wall. */
  maxSlope: 0.95,
  /** Visual km/h multiplier for the speedometer. */
  speedoFactor: 7,
} as const;

export const CAMERA = {
  follow: { distance: 6.4, height: 2.7, lookAhead: 4.2, lookHeight: 0.7, speedPullback: 1.4 },
  intro: { distance: 12.5, height: 5.2, orbitSpeed: 0.07 },
  fov: { base: 55, speedBoost: 7 },
  damping: { position: 5, look: 8, transition: 1.9 },
  minGroundClearance: 0.9,
} as const;

export interface DestinationConfig {
  id: SectionId;
  /** Position along the road loop, 0..1 */
  roadT: number;
  /** Which side of the road the landmark sits on (+1 / -1). */
  side: 1 | -1;
  /** Distance from road centre to landmark centre. */
  offset: number;
  /** Radius of the flattened pad under the landmark. */
  padRadius: number;
  /** Interaction zone radius around the zone centre on the road. */
  zoneRadius: number;
  /** Discovery radius (landmark counts as discovered inside this). */
  discoverRadius: number;
  /** Max speed at which "Press E" is offered. */
  maxInteractSpeed: number;
  accent: string;
  /** Camera shot while the panel is open — landmark-local coordinates (y up, +z towards road). */
  shot: { pos: [number, number, number]; look: [number, number, number] };
  /** Circular colliders in landmark-local coordinates: [x, z, radius]. */
  colliders: [number, number, number][];
  /** Optional terrain feature near the landmark (e.g. a lake), landmark-local x/z. */
  feature?: { x: number; z: number; radius: number; depth: number };
}

/**
 * Displays laid out on an arc in front of a landmark (landmark-local x/z),
 * one per project. Adding a project to the config adds a display.
 */
export function displayArc(n: number, radius = 4.2, depth = 3.1, maxSpread = 1.25): [number, number][] {
  const out: [number, number][] = [];
  const spread = Math.min(maxSpread, 0.32 * Math.max(1, n - 1));
  for (let k = 0; k < n; k++) {
    const a = n === 1 ? 0 : -spread + (2 * spread * k) / (n - 1);
    out.push([Math.sin(a) * radius, 0.2 + Math.cos(a) * depth]);
  }
  return out;
}

/** Projects shown as interactive displays at each landmark. */
export const displayedProjects = (section: SectionId) => projectsIn(section);

const displayColliders = (section: SectionId, radius?: number, depth?: number, r = 0.55) =>
  displayArc(displayedProjects(section).length, radius, depth).map(([x, z]) => [x, z, r] as [number, number, number]);

/** Layout parameters per landmark for its project displays. */
export const DISPLAY_LAYOUT: Partial<Record<SectionId, { radius: number; depth: number }>> = {
  projects: { radius: 4.2, depth: 3.1 },
  devops: { radius: 5.2, depth: 3.4 },
  research: { radius: 4.0, depth: 3.0 },
  creative: { radius: 5.4, depth: 3.6 },
};

export const DESTINATIONS: DestinationConfig[] = [
  {
    id: "about",
    roadT: 0.014,
    side: 1,
    offset: 10.5,
    padRadius: 6.5,
    zoneRadius: 7.5,
    discoverRadius: 30,
    maxInteractSpeed: 9,
    accent: "#f0a35e",
    shot: { pos: [-8.5, 4.2, 9.5], look: [0, 1.8, 0] },
    colliders: [
      [0, -0.6, 2.9],
      [3.6, 1.6, 0.6],
      [-3.4, 2.2, 0.5],
    ],
  },
  {
    id: "projects",
    roadT: 0.19,
    side: -1,
    offset: 12,
    padRadius: 8,
    zoneRadius: 8,
    discoverRadius: 32,
    maxInteractSpeed: 9,
    accent: "#f2b84b",
    shot: { pos: [6.5, 4.4, 11], look: [0, 1.6, 1.5] },
    colliders: [[0, -2.2, 3.6], ...displayColliders("projects", 4.2, 3.1)],
  },
  {
    id: "devops",
    roadT: 0.37,
    side: 1,
    offset: 12.5,
    padRadius: 8.5,
    zoneRadius: 8,
    discoverRadius: 34,
    maxInteractSpeed: 9,
    accent: "#5ab0f0",
    shot: { pos: [-7.5, 5.5, 12], look: [0, 2.6, 0.5] },
    colliders: [
      [-1.8, -2.6, 2.6],
      [2.6, -2.4, 2.0],
      [-4.6, -0.2, 0.6],
      ...displayColliders("devops", 5.2, 3.4, 0.9),
    ],
  },
  {
    id: "research",
    roadT: 0.55,
    side: -1,
    offset: 11,
    padRadius: 7.5,
    zoneRadius: 7.5,
    discoverRadius: 36,
    maxInteractSpeed: 9,
    accent: "#7fc6d8",
    shot: { pos: [7, 5.2, 10.5], look: [0, 2.6, 0] },
    colliders: [[0, -0.5, 3.2], [3.9, -2.2, 0.8], ...displayColliders("research", 4.0, 3.0)],
    feature: { x: 0, z: -3, radius: 20, depth: 5.5 },
  },
  {
    id: "creative",
    roadT: 0.73,
    side: 1,
    offset: 12.5,
    padRadius: 8.5,
    zoneRadius: 8,
    discoverRadius: 34,
    maxInteractSpeed: 9,
    accent: "#e86a9a",
    shot: { pos: [-7, 4.6, 11.5], look: [0, 2.0, 0.8] },
    colliders: [[0, -2.6, 3.4], [4.6, -1.6, 0.9], ...displayColliders("creative", 5.4, 3.6, 0.5)],
  },
  {
    id: "contact",
    roadT: 0.9,
    side: -1,
    offset: 11,
    padRadius: 6,
    zoneRadius: 7.5,
    discoverRadius: 40,
    maxInteractSpeed: 9,
    accent: "#ff7a59",
    shot: { pos: [9, 4.5, 9], look: [0, 5.5, -1] },
    colliders: [
      [0, -0.5, 1.8],
      [2.9, 1.6, 1.4],
      [-2.6, 2.4, 0.4],
    ],
    feature: { x: 0, z: -15, radius: 13, depth: 4.5 },
  },
];

/* ─────────────────────────── time of day ─────────────────────────── */

export type TimeOfDay = "day" | "sunset" | "night";

export interface LightingPreset {
  skyZenith: string;
  skyMid: string;
  skyHorizon: string;
  fog: string;
  /** Sun / moon disc colour in the sky. */
  disc: string;
  sunColor: string;
  sunIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  /** 0 = day, 1 = full night (lamps, windows, stars, headlights). */
  night: number;
}

export const TIME_PRESETS: Record<TimeOfDay, LightingPreset> = {
  day: {
    skyZenith: "#3f86d2",
    skyMid: "#93c2ea",
    skyHorizon: "#e2eef4",
    fog: "#d9e7ef",
    disc: "#fffaf0",
    sunColor: "#fff5e4",
    sunIntensity: 3.0,
    hemiSky: "#dcecff",
    hemiGround: "#6f8b54",
    hemiIntensity: 1.15,
    night: 0,
  },
  sunset: {
    skyZenith: "#5f93c9",
    skyMid: "#a6c8e4",
    skyHorizon: "#f6d9bd",
    fog: "#efd6bf",
    disc: "#fff0d4",
    sunColor: "#ffe6c2",
    sunIntensity: 2.7,
    hemiSky: "#d4e6f7",
    hemiGround: "#6f8b54",
    hemiIntensity: 1.05,
    night: 0.08,
  },
  night: {
    skyZenith: "#070d22",
    skyMid: "#142146",
    skyHorizon: "#2c3a66",
    fog: "#222d55",
    disc: "#dfe6ff",
    sunColor: "#9db0ff",
    sunIntensity: 0.6,
    hemiSky: "#41538f",
    hemiGround: "#161d2c",
    hemiIntensity: 0.55,
    night: 1,
  },
};

export const TIME_ORDER: TimeOfDay[] = ["sunset", "day", "night"];

/* ─────────────────────────── collectibles ─────────────────────────── */

export const TOKENS = {
  /** Tokens spaced evenly along the road. */
  onRoad: 18,
  /** Extra tokens hidden off-road (optional easter eggs). */
  hidden: 4,
  pickupRadius: 1.8,
};
