"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Matrix4,
  Quaternion,
  ShaderMaterial,
  Vector3,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from "three";
import { journey, sectionMeta } from "@/config/portfolio";
import { travelTo } from "@/lib/travel";
import { getWorld, type LandmarkFrame, type MilestoneData } from "@/lib/world/world";
import { vehicle } from "@/state/runtime";
import { useGame } from "@/state/gameStore";
import { Cabin, CloudDistrict, CreativeStudio, LandmarkInteractives, Lighthouse, Observatory, Workshop } from "./Landmarks";
import { ModelSlot } from "./ModelSlot";
import { LANDMARK_MODEL } from "@/config/models";
import { landmarkMaterials, textTexture } from "./landmarkMaterials";

const _up = new Vector3(0, 1, 0);

function LandmarkModel({ landmark }: { landmark: LandmarkFrame }) {
  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  switch (landmark.id) {
    case "about":
      return <Cabin accent={landmark.config.accent} />;
    case "projects":
      return <Workshop />;
    case "devops":
      return <CloudDistrict accent={landmark.config.accent} />;
    case "research":
      return <Observatory accent={landmark.config.accent} />;
    case "creative":
      return <CreativeStudio />;
    case "contact":
      return <Lighthouse reducedMotion={reducedMotion} />;
  }
}

/** A soft column of light that marks undiscovered destinations from afar. */
function Beacon({ landmark }: { landmark: LandmarkFrame }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        uniforms: { uColor: { value: new Color(landmark.config.accent) }, uOpacity: { value: 0.0 }, uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uOpacity; uniform float uTime;
          varying vec2 vUv;
          void main() {
            float fade = pow(1.0 - vUv.y, 1.6) * smoothstep(0.0, 0.04, vUv.y);
            float shimmer = 0.85 + 0.15 * sin(vUv.y * 30.0 - uTime * 2.0);
            gl_FragColor = vec4(uColor * 1.4, fade * uOpacity * shimmer);
          }`,
      }),
    [landmark],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }, dt) => {
    const discovered = useGame.getState().discovered.includes(landmark.id);
    const d = vehicle.position.distanceTo(landmark.position);
    // Visible in the mid distance (curiosity), fades out up close and once discovered.
    const target = (discovered ? 0.18 : 0.75) * Math.min(1, Math.max(0, (d - 12) / 20));
    const u = material.uniforms;
    u.uOpacity.value += (target - u.uOpacity.value) * Math.min(1, dt * 2);
    u.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh position={[0, 16, 0]} material={material} renderOrder={5}>
      <cylinderGeometry args={[0.9, 1.6, 32, 16, 1, true]} />
    </mesh>
  );
}

/** Pulsing ring painted on the road marking the interaction zone. */
function ZoneMarker({ landmark }: { landmark: LandmarkFrame }) {
  const ring = useRef<Mesh>(null);
  const matrix = useMemo(() => {
    const up = landmark.zoneCenter.clone().normalize();
    const q = new Quaternion().setFromUnitVectors(_up, up);
    return new Matrix4().compose(landmark.zoneCenter.clone().addScaledVector(up, 0.07), q, new Vector3(1, 1, 1));
  }, [landmark]);

  useFrame(({ clock }) => {
    if (!ring.current) return;
    const g = useGame.getState();
    const near = g.nearDestination === landmark.id;
    const d = vehicle.position.distanceTo(landmark.zoneCenter);
    const base = Math.max(0, 1 - (d - 8) / 22);
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * (near ? 5 : 2.5));
    const mat = ring.current.material as MeshBasicMaterial;
    mat.opacity = base * (near ? 0.65 + pulse * 0.35 : 0.25 + pulse * 0.25);
    const s = near ? 1 + pulse * 0.06 : 1;
    ring.current.scale.set(s, s, s);
  });

  return (
    <group matrix={matrix} matrixAutoUpdate={false}>
      <mesh ref={ring} rotation-x={-Math.PI / 2} renderOrder={3}>
        <ringGeometry args={[2.0, 2.35, 48]} />
        <meshBasicMaterial color={landmark.config.accent} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function RoadSign({ id, matrix }: { id: LandmarkFrame["id"]; matrix: Matrix4 }) {
  const m = landmarkMaterials();
  const meta = sectionMeta[id];
  const tex = useMemo(
    () =>
      textTexture(
        [
          { text: meta.place.toUpperCase(), size: 54, color: "#f7efe0", weight: 800 },
          { text: `${meta.title}  →`, size: 40, color: "#f2c14e", weight: 600 },
        ],
        { width: 512, height: 220, bg: "#355b4a", border: "#f7efe0" },
      ),
    [meta],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <group matrix={matrix} matrixAutoUpdate={false}>
      {[-0.75, 0.75].map((x) => (
        <mesh key={x} position={[x, 0.9, 0]} material={m.woodDark} castShadow>
          <boxGeometry args={[0.1, 1.8, 0.1]} />
        </mesh>
      ))}
      <mesh position={[0, 1.65, 0.06]} castShadow>
        <boxGeometry args={[2.0, 0.86, 0.06]} />
        <meshStandardMaterial color="#2c4a3d" />
      </mesh>
      <mesh position={[0, 1.65, 0.095]}>
        <planeGeometry args={[1.9, 0.8]} />
        <meshStandardMaterial map={tex} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** Career-journey posts along the road after Home — environmental storytelling. */
function Milestone({ data }: { data: MilestoneData }) {
  const m = landmarkMaterials();
  const stop = journey[data.stop];
  const tex = useMemo(
    () =>
      textTexture(
        [
          { text: `0${data.stop + 1} · JOURNEY`, size: 30, color: "#f2c14e", weight: 700 },
          { text: stop.title.toUpperCase(), size: 46, color: "#f7efe0", weight: 800 },
        ],
        { width: 512, height: 200, bg: "#3b3346", border: "#f7efe0" },
      ),
    [stop, data.stop],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  const open = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const g = useGame.getState();
    if (g.phase !== "driving" && g.phase !== "panel") return;
    g.setJourneyStop(data.stop);
    travelTo("about", { tab: "journey" });
  };
  return (
    <group matrix={data.matrix} matrixAutoUpdate={false}>
      <mesh position={[0, 0.25, 0]} material={m.stoneDark} castShadow>
        <dodecahedronGeometry args={[0.4, 0]} />
      </mesh>
      <mesh position={[0, 0.85, 0]} material={m.woodDark} castShadow>
        <boxGeometry args={[0.12, 1.4, 0.12]} />
      </mesh>
      <mesh
        position={[0, 1.55, 0.08]}
        onClick={open}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <planeGeometry args={[1.4, 0.55]} />
        <meshStandardMaterial map={tex} roughness={0.7} />
      </mesh>
    </group>
  );
}

export function Destinations() {
  const world = getWorld();
  const groups = useRef<(Group | null)[]>([]);

  // Landmarks past the horizon are skipped entirely (no draw calls).
  useFrame(() => {
    world.landmarks.forEach((l, i) => {
      const g = groups.current[i];
      if (g) g.visible = l.position.distanceTo(vehicle.position) < 125;
    });
  });
  return (
    <>
      {world.landmarks.map((l, i) => (
        <group key={l.id}>
          <group
            ref={(g) => {
              groups.current[i] = g;
            }}
            matrix={l.matrix}
            matrixAutoUpdate={false}
          >
            <ModelSlot name={LANDMARK_MODEL[l.id]}>
              <LandmarkModel landmark={l} />
            </ModelSlot>
            <LandmarkInteractives id={l.id} />
            <Beacon landmark={l} />
          </group>
          <ZoneMarker landmark={l} />
        </group>
      ))}
      {world.signs.map((s) => (
        <RoadSign key={s.id} id={s.id} matrix={s.matrix} />
      ))}
      {world.milestones.map((ms) => (
        <Milestone key={ms.stop} data={ms} />
      ))}
    </>
  );
}
