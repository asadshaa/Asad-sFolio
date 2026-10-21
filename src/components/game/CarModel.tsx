"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import {
  CanvasTexture,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  LatheGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
  SRGBColorSpace,
  Vector2,
  type Group,
  type Mesh,
  type Object3D,
} from "three";
import { vehicle } from "@/state/runtime";
import { useGame } from "@/state/gameStore";

/** Node names used by custom car models too (see README → Editing the 3D models). */
export const WHEEL_NAMES = ["Wheel_FL", "Wheel_FR", "Wheel_RL", "Wheel_RR"];

const WHEEL_R = 0.3;
const WHEEL_Z = 0.74;
const WHEEL_X = 0.56;
const WHEEL_POS: [number, number, number][] = [
  [WHEEL_X, WHEEL_R, WHEEL_Z], // front-left (+x is the car's left)
  [-WHEEL_X, WHEEL_R, WHEEL_Z], // front-right
  [WHEEL_X, WHEEL_R, -WHEEL_Z],
  [-WHEEL_X, WHEEL_R, -WHEEL_Z],
];

const BODY_BEVEL = 0.09;
/** Outer extents of the bevelled body (front, rear, half-width). */
const FRONT_Z = 1.15 + BODY_BEVEL;
const REAR_Z = -1.12 - BODY_BEVEL;
const HALF_W = 0.5 + BODY_BEVEL;

const PAINT = "#c8442c";
const GOLD = "#d6a72c";

function useMaterials() {
  return useMemo(() => {
    const paint = new MeshPhysicalMaterial({ color: PAINT, roughness: 0.32, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.06, name: "Paint" });
    const roof = new MeshPhysicalMaterial({ color: "#f1e7d3", roughness: 0.3, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08, name: "RoofPaint" });
    const glass = new MeshPhysicalMaterial({ color: "#16212e", roughness: 0.04, metalness: 0.2, clearcoat: 1, envMapIntensity: 1.8, name: "Glass" });
    const chrome = new MeshStandardMaterial({ color: "#e6e9ee", roughness: 0.1, metalness: 1, name: "Chrome" });
    const trim = new MeshStandardMaterial({ color: "#20232a", roughness: 0.55, name: "Trim" });
    const tire = new MeshStandardMaterial({ color: "#1b1d22", roughness: 0.92, name: "Tyre" });
    const rim = new MeshStandardMaterial({ color: "#c9ced6", roughness: 0.22, metalness: 0.9, name: "Rim" });
    const rimDark = new MeshStandardMaterial({ color: "#3a3f48", roughness: 0.5, metalness: 0.6, name: "RimInner" });
    const head = new MeshStandardMaterial({ color: "#fffaf0", emissive: "#fff1cc", emissiveIntensity: 1.8, roughness: 0.1, name: "HeadLight" });
    const lens = new MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.02, clearcoat: 1, transparent: true, opacity: 0.35, name: "Lens" });
    return { paint, roof, glass, chrome, trim, tire, rim, rimDark, head, lens };
  }, []);
}

/* ───────────── geometry ───────────── */

/** Extrude a (z, y) side-profile shape across the car's width (x), centred. */
function extrudeAcross(shape: Shape, width: number, bevel: number) {
  const g = new ExtrudeGeometry(shape, {
    depth: width,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 18,
  });
  g.rotateY(-Math.PI / 2);
  g.translate(width / 2, 0, 0);
  g.computeVertexNormals();
  return g;
}

/** Lower body: side profile with wheel arches, extruded across the width. */
function bodyGeometry() {
  // The bevel grows the outline by BODY_BEVEL, so the profile is drawn that much
  // smaller and the wheel arches that much larger.
  const s = new Shape();
  const cy = WHEEL_R;
  const r = 0.36 + BODY_BEVEL;
  const bottom = 0.17 + BODY_BEVEL;
  const a0 = Math.asin((cy - bottom) / r);
  const half = Math.cos(a0) * r;
  s.moveTo(-1.08, bottom + 0.04);
  s.lineTo(-WHEEL_Z - half, bottom);
  s.absarc(-WHEEL_Z, cy, r, Math.PI + a0, -a0, true);
  s.lineTo(WHEEL_Z - half, bottom);
  s.absarc(WHEEL_Z, cy, r, Math.PI + a0, -a0, true);
  s.lineTo(1.02, bottom);
  s.quadraticCurveTo(1.15, bottom + 0.02, 1.15, 0.33);
  s.quadraticCurveTo(1.15, 0.5, 1.0, 0.57);
  s.lineTo(0.42, 0.62);
  s.lineTo(-0.92, 0.62);
  s.quadraticCurveTo(-1.1, 0.61, -1.12, 0.45);
  s.lineTo(-1.11, bottom + 0.06);
  s.closePath();
  return extrudeAcross(s, 1.0, BODY_BEVEL);
}

/** Glass house: windshield, roof line and rear hatch. */
function cabinGeometry() {
  const s = new Shape();
  s.moveTo(0.4, 0.66);
  s.quadraticCurveTo(0.12, 0.88, 0.0, 0.97);
  s.lineTo(-0.62, 0.99);
  s.quadraticCurveTo(-0.82, 0.96, -0.98, 0.66);
  s.closePath();
  return extrudeAcross(s, 0.92, 0.05);
}

/** Painted roof panel capping the glass house. */
function roofGeometry() {
  const s = new Shape();
  s.moveTo(0.02, 0.975);
  s.lineTo(-0.63, 0.995);
  s.quadraticCurveTo(-0.7, 0.99, -0.72, 0.97);
  s.lineTo(-0.72, 1.02);
  s.lineTo(0.0, 1.0);
  s.closePath();
  return extrudeAcross(s, 0.98, 0.03);
}

/** Tyre with a rounded sidewall (lathe), axle along x. */
function tyreGeometry() {
  const pts = [
    [0.19, -0.115],
    [0.255, -0.125],
    [0.29, -0.108],
    [0.302, -0.06],
    [0.305, 0],
    [0.302, 0.06],
    [0.29, 0.108],
    [0.255, 0.125],
    [0.19, 0.115],
  ].map(([x, y]) => new Vector2(x, y));
  const g = new LatheGeometry(pts, 36);
  g.rotateZ(Math.PI / 2);
  return g;
}

function plateTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f7f5ef";
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = "#1d2230";
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 56);
  ctx.fillStyle = "#1d2230";
  ctx.font = "800 38px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AS · 2026", 128, 34);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** Soft blob shadow under the car (kept separate so it also sits under custom car models). */
export function ContactShadow() {
  const shadowTex = useShadowTexture();
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} renderOrder={2} name="ContactShadow">
      <planeGeometry args={[2.0, 3.0]} />
      <meshBasicMaterial map={shadowTex} transparent depthWrite={false} opacity={0.75} />
    </mesh>
  );
}

function useShadowTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    g.addColorStop(0, "rgba(0,0,0,0.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new CanvasTexture(c);
  }, []);
}

/**
 * A procedural modern-retro hatchback. Local frame: +z forward, +y up, +x left.
 * Animated from the shared `vehicle` runtime state (wheel spin, steering, body
 * roll, brake lights).
 */
export function CarModel() {
  const m = useMaterials();
  const geo = useMemo(
    () => ({ body: bodyGeometry(), cabin: cabinGeometry(), roof: roofGeometry(), tyre: tyreGeometry(), plate: plateTexture() }),
    [],
  );
  useEffect(
    () => () => {
      geo.body.dispose();
      geo.cabin.dispose();
      geo.roof.dispose();
      geo.tyre.dispose();
      geo.plate.dispose();
    },
    [geo],
  );
  const tail = useMemo(
    () => new MeshStandardMaterial({ color: "#a01812", emissive: "#ff2a1a", emissiveIntensity: 0.6, roughness: 0.2, name: "TailLight" }),
    [],
  );
  const body = useRef<Group>(null);
  const wheels = useRef<Group>(null);

  useFrame(() => {
    body.current?.rotation.set(vehicle.bodyPitch, 0, vehicle.bodyRoll);
    wheels.current?.children.forEach((wheel, i) => {
      const steerGroup = wheel.children[0];
      steerGroup.rotation.y = i < 2 ? vehicle.steer * 1.4 : 0;
      steerGroup.children[0].rotation.x = vehicle.wheelSpin;
    });
    tail.emissiveIntensity = vehicle.braking ? 3.2 : 0.6;
    // Easter egg: the Konami code earns a gold paint job.
    const gold = useGame.getState().goldPaint;
    if (gold !== (m.paint.userData.gold ?? false)) {
      m.paint.userData.gold = gold;
      m.paint.color.set(gold ? GOLD : PAINT);
      m.paint.metalness = gold ? 0.8 : 0.25;
    }
  });

  /** A or C pillar running along a glass slope between two (z, y) points. */
  const pillar = (z0: number, y0: number, z1: number, y1: number, x: number, key: string) => {
    const len = Math.hypot(z1 - z0, y1 - y0);
    const ang = Math.atan2(z1 - z0, y1 - y0);
    return (
      <mesh key={key} position={[x, (y0 + y1) / 2, (z0 + z1) / 2]} rotation={[ang, 0, 0]} material={m.paint} castShadow>
        <boxGeometry args={[0.06, len, 0.07]} />
      </mesh>
    );
  };

  return (
    <group>
      <group ref={body}>
        <mesh geometry={geo.body} material={m.paint} castShadow receiveShadow />
        <mesh geometry={geo.cabin} material={m.glass} castShadow />
        <mesh geometry={geo.roof} material={m.roof} castShadow />

        {/* pillars */}
        {[0.485, -0.485].flatMap((x) => [
          pillar(0.4, 0.68, 0.0, 0.97, x, `a${x}`),
          pillar(-0.98, 0.68, -0.66, 0.98, x, `c${x}`),
          <mesh key={`b${x}`} position={[x, 0.83, -0.27]} material={m.paint} castShadow>
            <boxGeometry args={[0.06, 0.32, 0.08]} />
          </mesh>,
        ])}

        {/* side trim: rocker panels, door seams, handles, mirrors */}
        {[1, -1].map((side) => (
          <group key={side}>
            <mesh position={[side * HALF_W, 0.3, 0]} material={m.trim}>
              <boxGeometry args={[0.03, 0.08, 0.66]} />
            </mesh>
            {[0.36, -0.3].map((z) => (
              <mesh key={z} position={[side * (HALF_W + 0.004), 0.47, z]} material={m.trim}>
                <boxGeometry args={[0.006, 0.4, 0.008]} />
              </mesh>
            ))}
            <mesh position={[side * (HALF_W + 0.008), 0.58, 0.05]} material={m.chrome}>
              <boxGeometry args={[0.02, 0.025, 0.12]} />
            </mesh>
            <group position={[side * 0.58, 0.72, 0.33]}>
              <mesh position={[side * 0.05, 0, 0]} material={m.trim}>
                <boxGeometry args={[0.08, 0.025, 0.04]} />
              </mesh>
              <RoundedBox args={[0.07, 0.09, 0.13]} radius={0.025} smoothness={3} position={[side * 0.11, 0.02, 0]} material={m.paint} castShadow />
            </group>
          </group>
        ))}

        {/* front: grille, projector headlights, bumper, plate */}
        <group position={[0, 0, FRONT_Z]}>
          <mesh position={[0, 0.33, 0.01]} material={m.trim}>
            <boxGeometry args={[0.5, 0.13, 0.03]} />
          </mesh>
          {[0.3, 0.335, 0.37].map((y) => (
            <mesh key={y} position={[0, y, 0.03]} material={m.chrome}>
              <boxGeometry args={[0.46, 0.012, 0.012]} />
            </mesh>
          ))}
          {[0.37, -0.37].map((x) => (
            <group key={x} position={[x, 0.43, -0.03]}>
              <mesh material={m.chrome}>
                <torusGeometry args={[0.105, 0.018, 10, 28]} />
              </mesh>
              <mesh rotation-x={Math.PI / 2} position={[0, 0, -0.005]} material={m.head}>
                <cylinderGeometry args={[0.095, 0.095, 0.02, 28]} />
              </mesh>
              <mesh rotation-x={Math.PI / 2} position={[0, 0, 0.005]} material={m.lens}>
                <sphereGeometry args={[0.097, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.6]} />
              </mesh>
            </group>
          ))}
          <RoundedBox args={[1.2, 0.08, 0.08]} radius={0.03} smoothness={3} position={[0, 0.2, 0.02]} material={m.chrome} />
          <mesh position={[0, 0.27, 0.065]}>
            <planeGeometry args={[0.3, 0.075]} />
            <meshStandardMaterial map={geo.plate} roughness={0.4} />
          </mesh>
        </group>

        {/* rear: tail lights, bumper, plate, exhaust */}
        <group position={[0, 0, REAR_Z]}>
          {[0.41, -0.41].map((x) => (
            <RoundedBox key={x} args={[0.24, 0.1, 0.04]} radius={0.015} smoothness={2} position={[x, 0.5, -0.01]} material={tail} />
          ))}
          <RoundedBox args={[1.2, 0.08, 0.08]} radius={0.03} smoothness={3} position={[0, 0.22, -0.01]} material={m.chrome} />
          <mesh position={[0, 0.36, -0.04]} rotation-y={Math.PI}>
            <planeGeometry args={[0.32, 0.08]} />
            <meshStandardMaterial map={geo.plate} roughness={0.4} side={DoubleSide} />
          </mesh>
          <mesh position={[-0.32, 0.14, -0.03]} rotation-x={Math.PI / 2} material={m.chrome}>
            <cylinderGeometry args={[0.035, 0.035, 0.12, 16, 1, true]} />
          </mesh>
        </group>

        {/* roof rails + antenna */}
        {[0.38, -0.38].map((x) => (
          <mesh key={x} position={[x, 1.03, -0.33]} material={m.trim}>
            <boxGeometry args={[0.03, 0.025, 0.62]} />
          </mesh>
        ))}
      </group>

      <group ref={wheels}>
        {WHEEL_POS.map((p, i) => {
          const out = p[0] > 0 ? 1 : -1;
          return (
            <group key={i} position={p} name={WHEEL_NAMES[i]}>
              <group>
                <group>
                  <mesh geometry={geo.tyre} material={m.tire} castShadow />
                  {/* rim barrel + face */}
                  <mesh rotation-z={Math.PI / 2} material={m.rimDark}>
                    <cylinderGeometry args={[0.19, 0.19, 0.2, 28, 1, true]} />
                  </mesh>
                  <mesh rotation-z={Math.PI / 2} position={[out * 0.085, 0, 0]} material={m.rimDark}>
                    <cylinderGeometry args={[0.185, 0.185, 0.02, 28]} />
                  </mesh>
                  <mesh rotation-y={Math.PI / 2} position={[out * 0.1, 0, 0]} material={m.rim}>
                    <torusGeometry args={[0.18, 0.016, 8, 32]} />
                  </mesh>
                  {[0, 1, 2, 3, 4].map((k) => (
                    <mesh key={k} position={[out * 0.1, 0, 0]} rotation-x={(k / 5) * Math.PI * 2} material={m.rim}>
                      <boxGeometry args={[0.025, 0.17, 0.04]} />
                    </mesh>
                  ))}
                  <mesh rotation-z={Math.PI / 2} position={[out * 0.11, 0, 0]} material={m.chrome}>
                    <cylinderGeometry args={[0.05, 0.05, 0.03, 20]} />
                  </mesh>
                </group>
              </group>
            </group>
          );
        })}
      </group>
    </group>
  );
}

/**
 * Brings a custom car .glb to life: spins/steers nodes named Wheel_FL/FR/RL/RR
 * (origin at the wheel centre), brightens materials named "TailLight" when
 * braking and repaints "Paint" materials for the gold easter egg.
 */
export function CustomCarRig({ scene }: { scene: Object3D }) {
  const rig = useMemo(() => {
    const wheels: { node: Object3D; front: boolean }[] = [];
    const tails: MeshStandardMaterial[] = [];
    const paints: { m: MeshStandardMaterial; color: Color }[] = [];
    scene.traverse((o) => {
      if (/^wheel[_ ]?(f|r)/i.test(o.name)) {
        o.rotation.order = "YXZ";
        wheels.push({ node: o, front: /^wheel[_ ]?f/i.test(o.name) });
      }
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const std = mat as MeshStandardMaterial;
        if (!std.isMeshStandardMaterial) continue;
        if (/tail|brake/i.test(std.name)) tails.push(std);
        if (/^paint$/i.test(std.name)) paints.push({ m: std, color: std.color.clone() });
      }
    });
    return { wheels, tails, paints };
  }, [scene]);

  useFrame(() => {
    for (const w of rig.wheels) w.node.rotation.set(vehicle.wheelSpin, w.front ? vehicle.steer * 1.4 : 0, 0);
    for (const t of rig.tails) t.emissiveIntensity = vehicle.braking ? 3.2 : 0.6;
    const gold = useGame.getState().goldPaint;
    for (const p of rig.paints) {
      if (gold) p.m.color.set(GOLD);
      else p.m.color.copy(p.color);
    }
  });
  return null;
}
