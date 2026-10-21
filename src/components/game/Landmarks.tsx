"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { AdditiveBlending, DoubleSide, type Group, type Mesh, type MeshBasicMaterial } from "three";
import { cvLink, type Project, type SectionId } from "@/config/portfolio";
import { DISPLAY_LAYOUT, displayArc, displayedProjects } from "@/config/world";
import { travelTo } from "@/lib/travel";
import { useGame } from "@/state/gameStore";
import { landmarkMaterials, textTexture } from "./landmarkMaterials";
import { textOn } from "@/lib/color";

/*
 * Procedural landmark models. Local frame: y = up, +z faces the road,
 * x runs along the road. Each landmark has a distinct silhouette so it is
 * recognisable from a distance.
 */

type V3 = [number, number, number];

function Box({ args, position, material, rotation, cast = true }: { args: V3; position: V3; material: unknown; rotation?: V3; cast?: boolean }) {
  return (
    <mesh position={position} rotation={rotation} material={material as never} castShadow={cast} receiveShadow>
      <boxGeometry args={args} />
    </mesh>
  );
}

function Cyl({
  args,
  position,
  material,
  rotation,
  cast = true,
}: {
  args: [number, number, number, number?];
  position: V3;
  material: unknown;
  rotation?: V3;
  cast?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation} material={material as never} castShadow={cast} receiveShadow>
      <cylinderGeometry args={[args[0], args[1], args[2], Math.max(args[3] ?? 24, 16)]} />
    </mesh>
  );
}

function MiniTree({ position, scale = 1 }: { position: V3; scale?: number }) {
  const m = landmarkMaterials();
  return (
    <group position={position} scale={scale}>
      <Cyl args={[0.08, 0.12, 0.8, 6]} position={[0, 0.4, 0]} material={m.woodDark} />
      <mesh position={[0, 1.15, 0]} material={m.green} castShadow>
        <icosahedronGeometry args={[0.6, 0]} />
      </mesh>
    </group>
  );
}

function Smoke({ position }: { position: V3 }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    group.current?.children.forEach((child, i) => {
      const puff = child as Mesh;
      const t = (clock.elapsedTime * 0.35 + i / 3) % 1;
      puff.position.set(Math.sin(t * 4 + i) * 0.15, t * 2.2, t * 0.4);
      puff.scale.setScalar(0.25 + t * 0.55);
      (puff.material as MeshBasicMaterial).opacity = 0.5 * (1 - t);
    });
  });
  return (
    <group ref={group} position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <icosahedronGeometry args={[0.5, 0]} />
          <meshBasicMaterial color="#f4efe8" transparent depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Sign({ text, bg, color, position, width = 3.2, height = 0.62 }: { text: string; bg: string; color: string; position: V3; width?: number; height?: number }) {
  const [tex] = useState(() =>
    textTexture([{ text, size: 110, color, weight: 900 }], { width: 1024, height: Math.max(64, Math.round(1024 * (height / width))), bg }),
  );
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={position}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.25} roughness={0.6} />
    </mesh>
  );
}

/** A framed window: trim surround, sill, glazing and a cross mullion. */
function Window({ position, width, height, cool = false }: { position: V3; width: number; height: number; cool?: boolean }) {
  const m = landmarkMaterials();
  const t = 0.05;
  return (
    <group position={position}>
      <Box args={[width, height, 0.04]} position={[0, 0, 0.01]} material={cool ? m.windowCool : m.windowWarm} cast={false} />
      <Box args={[width + t * 2, t, 0.08]} position={[0, height / 2 + t / 2, 0.03]} material={m.trim} cast={false} />
      <Box args={[width + t * 2, t, 0.08]} position={[0, -height / 2 - t / 2, 0.03]} material={m.trim} cast={false} />
      <Box args={[t, height, 0.08]} position={[-width / 2 - t / 2, 0, 0.03]} material={m.trim} cast={false} />
      <Box args={[t, height, 0.08]} position={[width / 2 + t / 2, 0, 0.03]} material={m.trim} cast={false} />
      <Box args={[0.025, height, 0.05]} position={[0, 0, 0.035]} material={m.trim} cast={false} />
      <Box args={[width, 0.025, 0.05]} position={[0, 0, 0.035]} material={m.trim} cast={false} />
      <Box args={[width + 0.2, 0.05, 0.14]} position={[0, -height / 2 - t, 0.07]} material={m.trim} cast={false} />
    </group>
  );
}

/* ───────────── Interactive project displays ───────────── */

type DisplayStyle = "screen" | "container" | "holo" | "frame";

function useHoverCursor() {
  const [hover, setHover] = useState(false);
  useEffect(
    () => () => {
      document.body.style.cursor = "";
    },
    [],
  );
  return {
    hover,
    handlers: {
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      },
      onPointerOut: () => {
        setHover(false);
        document.body.style.cursor = "";
      },
    },
  };
}

function ProjectDisplay({
  project,
  index,
  position,
  section,
  style,
}: {
  project: Project;
  index: number;
  position: V3;
  section: SectionId;
  style: DisplayStyle;
}) {
  const m = landmarkMaterials();
  const { hover, handlers } = useHoverCursor();
  const selected = useGame((s) => s.activeSection === section && s.selectedProjectId === project.id);
  const texture = useMemo(
    () =>
      textTexture(
        [
          { text: style === "frame" ? "CONCEPT" : `0${index + 1}`.slice(-2), size: 30, color: textOn(project.accent), weight: 700 },
          { text: project.name, size: project.name.length > 22 ? 38 : 50, color: textOn(project.accent), weight: 800 },
        ],
        { width: 512, height: 320, bg: project.accent },
      ),
    [project, index, style],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  const holo = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (holo.current) {
      holo.current.rotation.y = clock.elapsedTime * 0.6 + index;
      holo.current.position.y = 2.25 + Math.sin(clock.elapsedTime * 1.4 + index) * 0.08;
    }
  });

  const open = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const g = useGame.getState();
    if (g.phase === "driving" || g.phase === "panel") travelTo(section, { projectId: project.id });
  };
  const glow = hover || selected ? 0.75 : 0.4;
  const face = <meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={glow} roughness={0.35} />;
  const yaw = -position[0] * 0.09;

  if (style === "container") {
    return (
      <group position={position} rotation={[0, yaw, 0]}>
        <mesh position={[0, 0.62, 0]} castShadow receiveShadow onClick={open} {...handlers}>
          <boxGeometry args={[1.5, 1.2, 1.1]} />
          <meshStandardMaterial color={project.accent} roughness={0.6} metalness={0.25} flatShading />
        </mesh>
        {[-0.55, -0.27, 0, 0.27, 0.55].map((x) => (
          <Box key={x} args={[0.05, 1.12, 1.14]} position={[x, 0.62, 0]} material={m.slate} cast={false} />
        ))}
        <mesh position={[0, 0.66, 0.56]} onClick={open} {...handlers}>
          <planeGeometry args={[1.3, 0.8]} />
          {face}
        </mesh>
      </group>
    );
  }
  if (style === "holo") {
    return (
      <group position={position} rotation={[0, yaw, 0]}>
        <Cyl args={[0.45, 0.55, 0.5, 8]} position={[0, 0.25, 0]} material={m.white} />
        <Cyl args={[0.05, 0.05, 0.7, 5]} position={[0, 0.75, 0]} material={m.metal} />
        <mesh position={[0, 1.35, 0]} onClick={open} {...handlers}>
          <planeGeometry args={[1.25, 0.78]} />
          {face}
        </mesh>
        <group ref={holo} position={[0, 2.25, 0]}>
          <mesh>
            <icosahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial color={project.accent} emissive={project.accent} emissiveIntensity={1.4} toneMapped={false} wireframe />
          </mesh>
        </group>
      </group>
    );
  }
  if (style === "frame") {
    return (
      <group position={position} rotation={[0, yaw, 0]}>
        {[-0.6, 0.6].map((x) => (
          <Box key={x} args={[0.08, 1.9, 0.08]} position={[x, 0.95, -0.15]} rotation={[-0.15, 0, 0]} material={m.woodDark} />
        ))}
        <Box args={[1.36, 0.98, 0.07]} position={[0, 1.35, -0.05]} rotation={[-0.15, 0, 0]} material={m.cream} />
        <mesh position={[0, 1.35, 0]} rotation={[-0.15, 0, 0]} onClick={open} {...handlers}>
          <planeGeometry args={[1.22, 0.84]} />
          {face}
        </mesh>
      </group>
    );
  }
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <Box args={[0.7, 0.85, 0.5]} position={[0, 0.42, 0]} material={m.slate} />
      <group position={[0, 1.35, 0]} rotation={[-0.22, 0, 0]}>
        <Box args={[1.3, 0.86, 0.08]} position={[0, 0, -0.03]} material={m.dark} />
        <mesh position={[0, 0, 0.012]} onClick={open} {...handlers}>
          <planeGeometry args={[1.18, 0.74]} />
          {face}
        </mesh>
      </group>
    </group>
  );
}

function Displays({ section, style }: { section: SectionId; style: DisplayStyle }) {
  const layout = DISPLAY_LAYOUT[section] ?? { radius: 4.2, depth: 3.1 };
  const list = displayedProjects(section);
  const spots = displayArc(list.length, layout.radius, layout.depth);
  return (
    <>
      {list.map((p, i) => (
        <ProjectDisplay key={p.id} project={p} index={i} section={section} style={style} position={[spots[i][0], 0.12, spots[i][1]]} />
      ))}
    </>
  );
}

/* ───────────── Home (spawn point) ───────────── */

export function Cabin({ accent }: { accent: string }) {
  const m = landmarkMaterials();
  const flag = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (flag.current) flag.current.rotation.y = Math.sin(clock.elapsedTime * 2.2) * 0.25;
  });
  return (
    <group>
      <Cyl args={[4.6, 4.9, 0.3, 10]} position={[0, 0.0, 0]} material={m.stone} cast={false} />
      <Box args={[3.6, 2.1, 2.8]} position={[0, 1.2, -0.6]} material={m.wood} />
      {[0.5, 0.95, 1.4, 1.85].map((y) => (
        <Box key={y} args={[3.66, 0.08, 2.86]} position={[0, y, -0.6]} material={m.woodDark} cast={false} />
      ))}
      <mesh position={[0, 2.85, -0.6]} rotation={[0, 0, Math.PI / 2]} material={m.roofRed} castShadow>
        <cylinderGeometry args={[1.95, 1.95, 4.2, 3, 1]} />
      </mesh>
      <Box args={[0.55, 1.4, 0.55]} position={[1.05, 3.3, -1.2]} material={m.stoneDark} />
      <Smoke position={[1.05, 4.05, -1.2]} />
      <Box args={[0.88, 1.46, 0.05]} position={[0, 0.88, 0.81]} material={m.trim} cast={false} />
      <Box args={[0.75, 1.35, 0.07]} position={[0, 0.85, 0.83]} material={m.woodDark} />
      <mesh position={[0.27, 0.85, 0.88]} material={m.chrome}>
        <sphereGeometry args={[0.035, 12, 8]} />
      </mesh>
      <Window position={[-1.1, 1.3, 0.81]} width={0.8} height={0.64} />
      <Window position={[1.1, 1.3, 0.81]} width={0.8} height={0.64} />
      <Box args={[4, 0.14, 1.3]} position={[0, 0.22, 1.45]} material={m.woodDark} />
      {[-1.8, 1.8].map((x) => (
        <Cyl key={x} args={[0.07, 0.07, 1.8, 6]} position={[x, 1.1, 2.0]} material={m.wood} />
      ))}
      <Box args={[4.1, 0.1, 1.5]} position={[0, 2.05, 1.5]} rotation={[0.18, 0, 0]} material={m.roofRed} />
      {/* porch railing */}
      <Box args={[1.25, 0.05, 0.05]} position={[-1.15, 0.78, 2.05]} material={m.wood} />
      <Box args={[1.25, 0.05, 0.05]} position={[1.15, 0.78, 2.05]} material={m.wood} />
      {[-1.65, -1.35, -1.05, -0.75, 0.75, 1.05, 1.35, 1.65].map((x) => (
        <Box key={x} args={[0.04, 0.48, 0.04]} position={[x, 0.53, 2.05]} material={m.wood} cast={false} />
      ))}
      <Sign text="HOME" bg="#7c5238" color="#f7efe0" position={[0, 1.72, 2.1]} width={1.3} height={0.32} />
      <group position={[3.5, 0.15, 1.6]} rotation={[0, -0.6, 0]}>
        <Box args={[1.4, 0.08, 0.45]} position={[0, 0.45, 0]} material={m.wood} />
        <Box args={[1.4, 0.4, 0.06]} position={[0, 0.7, -0.22]} material={m.wood} />
        {[-0.6, 0.6].map((x) => (
          <Box key={x} args={[0.08, 0.45, 0.4]} position={[x, 0.22, 0]} material={m.woodDark} />
        ))}
      </group>
      <group position={[-3.3, 0.15, 2.2]}>
        {[0, 2.1, 4.2].map((a) => (
          <Cyl
            key={a}
            args={[0.03, 0.03, 1.3, 4]}
            position={[Math.sin(a) * 0.25, 0.6, Math.cos(a) * 0.25]}
            rotation={[Math.cos(a) * 0.2, 0, -Math.sin(a) * 0.2]}
            material={m.dark}
          />
        ))}
        <Cyl args={[0.11, 0.08, 0.9, 10]} position={[0, 1.35, 0.1]} rotation={[1.2, 0, 0]} material={m.metal} />
      </group>
      <Cyl args={[0.04, 0.05, 4.2, 6]} position={[-2.3, 2.2, -2.4]} material={m.metal} />
      <group ref={flag} position={[-2.3, 3.9, -2.4]}>
        <mesh position={[0.45, 0, 0]}>
          <planeGeometry args={[0.9, 0.55]} />
          <meshStandardMaterial color={accent} side={DoubleSide} />
        </mesh>
      </group>
      <MiniTree position={[-3.6, 0.1, -2.2]} scale={1.3} />
      <MiniTree position={[3.4, 0.1, -2.4]} scale={1.1} />
    </group>
  );
}

/* ───────────── Engineering Garage ───────────── */

export function Workshop() {
  const m = landmarkMaterials();
  return (
    <group>
      <Cyl args={[6.2, 6.5, 0.25, 12]} position={[0, 0, 0]} material={m.stone} cast={false} />
      <Box args={[6.4, 1.2, 4.6]} position={[0, 0.6, -2.4]} material={m.cream} />
      <mesh position={[0, 1.2, -2.4]} rotation={[0, 0, Math.PI / 2]} material={m.metal} castShadow>
        <cylinderGeometry args={[2.3, 2.3, 6.5, 16, 1, false, 0, Math.PI]} />
      </mesh>
      {[-2.4, -0.8, 0.8, 2.4].map((x) => (
        <mesh key={x} position={[x, 1.2, -2.4]} rotation={[0, Math.PI / 2, 0]} material={m.slate}>
          <torusGeometry args={[2.32, 0.05, 4, 16, Math.PI]} />
        </mesh>
      ))}
      <mesh position={[0, 1.2, -0.15]} material={m.cream}>
        <circleGeometry args={[2.3, 16, 0, Math.PI]} />
      </mesh>
      <Box args={[3.2, 2.3, 0.1]} position={[0, 1.2, -0.12]} material={m.windowWarm} cast={false} />
      {[-1.65, 1.65].map((x) => (
        <Box key={x} args={[0.14, 2.4, 0.16]} position={[x, 1.2, -0.08]} material={m.slate} />
      ))}
      {[0.5, 1.05, 1.6].map((y) => (
        <Box key={y} args={[3.2, 0.03, 0.04]} position={[0, y, -0.05]} material={m.slate} cast={false} />
      ))}
      <Box args={[3.5, 0.15, 0.2]} position={[0, 2.4, -0.05]} material={m.slate} />
      <Sign text="ENGINEERING GARAGE" bg="#f2b84b" color="#2d313b" position={[0, 3.15, 0.05]} width={3.6} height={0.5} />
      {[
        [-3.6, -0.6],
        [-3.9, 0.2],
      ].map(([x, z]) => (
        <Cyl key={x} args={[0.32, 0.32, 0.85, 10]} position={[x, 0.55, z]} material={m.red} />
      ))}
      <Box args={[0.8, 0.6, 0.8]} position={[3.7, 0.42, -0.4]} material={m.wood} />
      <Box args={[0.55, 0.45, 0.55]} position={[3.6, 0.95, -0.4]} material={m.woodDark} />
    </group>
  );
}

/* ───────────── Cloud District ───────────── */

export function CloudDistrict({ accent }: { accent: string }) {
  const m = landmarkMaterials();
  const cloud = useRef<Group>(null);
  const leds = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (cloud.current) {
      cloud.current.position.y = 7.2 + Math.sin(t * 0.8) * 0.25;
      cloud.current.rotation.y = t * 0.1;
    }
    leds.current?.children.forEach((c, i) => {
      c.visible = Math.sin(t * (2 + (i % 3)) + i * 1.7) > -0.3;
    });
  });
  return (
    <group>
      <Cyl args={[7.0, 7.3, 0.25, 12]} position={[0, 0, 0]} material={m.stone} cast={false} />
      {/* data centre */}
      <Box args={[5.0, 2.6, 2.6]} position={[-1.8, 1.3, -2.6]} material={m.slate} />
      <Box args={[5.2, 0.16, 2.8]} position={[-1.8, 2.66, -2.6]} material={m.dark} />
      <group ref={leds}>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} position={[-4.0 + (i % 6) * 0.85, 0.7 + Math.floor(i / 6) * 0.55, -1.28]}>
            <boxGeometry args={[0.5, 0.08, 0.04]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {[-3.4, -1.8, -0.2].map((x) => (
        <Cyl key={x} args={[0.38, 0.38, 0.4, 10]} position={[x, 2.95, -2.6]} material={m.metal} />
      ))}
      {/* stacked containers */}
      <Box args={[2.4, 1.1, 1.1]} position={[2.6, 0.62, -2.0]} material={m.red} />
      <Box args={[2.4, 1.1, 1.1]} position={[2.6, 0.62, -3.2]} material={m.glass} />
      <Box args={[2.4, 1.1, 1.1]} position={[2.6, 1.74, -2.6]} material={m.roofRed} />
      {/* antenna mast */}
      <Cyl args={[0.07, 0.12, 5.6, 6]} position={[-4.6, 2.9, -0.2]} material={m.metal} />
      {[1.6, 3.0, 4.4].map((y) => (
        <Box key={y} args={[0.9, 0.05, 0.05]} position={[-4.6, y, -0.2]} material={m.metal} cast={false} />
      ))}
      <mesh position={[-4.6, 5.8, -0.2]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color="#ff4a3a" emissive="#ff3b2a" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      {/* floating cloud tethered to the data centre */}
      <group ref={cloud} position={[-1.8, 7.2, -2.6]}>
        {[
          [0, 0, 0, 1.2],
          [1.1, -0.15, 0.2, 0.85],
          [-1.0, -0.2, -0.1, 0.9],
          [0.3, 0.45, -0.3, 0.75],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} material={m.white} castShadow>
            <icosahedronGeometry args={[r, 1]} />
          </mesh>
        ))}
      </group>
      <Cyl args={[0.02, 0.02, 4.2, 4]} position={[-1.8, 4.9, -2.6]} material={m.metal} cast={false} />
      <Sign text="CLOUD DISTRICT" bg="#2d3d5c" color="#bfe3ff" position={[-1.8, 2.15, -1.27]} width={2.8} height={0.44} />
    </group>
  );
}

/* ───────────── Research Island ───────────── */

export function Observatory({ accent }: { accent: string }) {
  const m = landmarkMaterials();
  const dome = useRef<Group>(null);
  const dish = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (dome.current) dome.current.rotation.y = Math.sin(clock.elapsedTime * 0.15) * 0.8;
    if (dish.current) dish.current.rotation.y = clock.elapsedTime * 0.5;
  });
  return (
    <group>
      <Cyl args={[5.6, 5.9, 0.25, 12]} position={[0, 0, 0]} material={m.stone} cast={false} />
      <Cyl args={[2.7, 2.9, 2.3, 16]} position={[0, 1.25, -0.8]} material={m.white} />
      <Cyl args={[2.95, 2.95, 0.18, 16]} position={[0, 2.45, -0.8]} material={m.slate} />
      <group ref={dome} position={[0, 2.5, -0.8]}>
        <mesh material={m.metal} castShadow>
          <sphereGeometry args={[2.75, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        {[0.45, 0.9].map((a) => (
          <mesh key={a} position={[0, Math.sin(a) * 2.75, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.slate}>
            <torusGeometry args={[Math.cos(a) * 2.76, 0.03, 6, 64]} />
          </mesh>
        ))}
        <Box args={[0.9, 0.25, 2.9]} position={[0, 2.35, 0.65]} rotation={[0.55, 0, 0]} material={m.dark} cast={false} />
        <Cyl args={[0.32, 0.26, 2.6, 12]} position={[0, 2.0, 1.25]} rotation={[0.9, 0, 0]} material={m.cream} />
      </group>
      <Window position={[0, 1.0, 1.9]} width={1.0} height={1.5} cool />
      <group position={[3.9, 0.1, -2.2]}>
        <Cyl args={[0.08, 0.12, 3.6, 6]} position={[0, 1.8, 0]} material={m.metal} />
        <group ref={dish} position={[0, 3.6, 0]}>
          <mesh rotation={[-0.9, 0, 0]} material={m.white} castShadow>
            <sphereGeometry args={[0.8, 14, 6, 0, Math.PI * 2, 0, 0.9]} />
          </mesh>
          <mesh position={[0, 0.25, 0.25]}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2} toneMapped={false} />
          </mesh>
        </group>
      </group>
      {/* little jetty into the lagoon */}
      <Box args={[1.2, 0.12, 3.4]} position={[-4.8, 0.05, -4.4]} rotation={[0, 0.7, 0]} material={m.wood} />
      <Sign text="RESEARCH ISLAND" bg="#24525e" color="#d8f6ff" position={[0, 2.25, 1.97]} width={2.4} height={0.4} />
    </group>
  );
}

/* ───────────── Creative District ───────────── */

export function CreativeStudio() {
  const m = landmarkMaterials();
  const sculpture = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (sculpture.current) sculpture.current.rotation.y += dt * 0.35;
  });
  const stripes = ["#e86a9a", "#f2b84b", "#5fb3a1", "#7a8ef0", "#e8603f"];
  return (
    <group>
      <Cyl args={[7.0, 7.3, 0.25, 12]} position={[0, 0, 0]} material={m.stone} cast={false} />
      {/* studio with a saw-tooth roof */}
      <Box args={[6.2, 2.4, 3.2]} position={[0, 1.2, -2.6]} material={m.white} />
      {[-2.1, 0, 2.1].map((x) => (
        <mesh key={x} position={[x, 2.75, -2.6]} rotation={[Math.PI / 2, Math.PI / 2, 0]} castShadow>
          <cylinderGeometry args={[0.85, 0.85, 3.2, 3, 1]} />
          <meshStandardMaterial color="#e86a9a" flatShading roughness={0.7} />
        </mesh>
      ))}
      {/* mural stripes on the facade */}
      {stripes.map((c, i) => (
        <mesh key={c} position={[-2.4 + i * 1.2, 1.2, -0.99]}>
          <planeGeometry args={[1.2, 2.4]} />
          <meshStandardMaterial color={c} roughness={0.8} />
        </mesh>
      ))}
      <Window position={[0, 0.95, -0.97]} width={1.2} height={1.8} />
      <Sign text="CREATIVE DISTRICT" bg="#2d313b" color="#ffd6e6" position={[0, 3.55, -0.98]} width={3.2} height={0.5} />
      {/* sculpture */}
      <Cyl args={[0.6, 0.7, 0.6, 8]} position={[4.6, 0.35, -1.6]} material={m.white} />
      <mesh ref={sculpture} position={[4.6, 1.7, -1.6]} castShadow>
        <torusKnotGeometry args={[0.55, 0.16, 64, 8]} />
        <meshStandardMaterial color="#f2b84b" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ───────────── Lighthouse ───────────── */

/** CV access point: opens the CV if one is configured, otherwise the contact panel. */
function CvKiosk() {
  const m = landmarkMaterials();
  const { hover, handlers } = useHoverCursor();
  const open = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const g = useGame.getState();
    if (g.phase !== "driving" && g.phase !== "panel") return;
    const cv = cvLink();
    if (cv) window.open(cv, "_blank", "noopener,noreferrer");
    else travelTo("contact");
  };
  return (
    <group position={[-2.6, 0.1, 2.4]} rotation={[0, 0.5, 0]}>
      <Box args={[0.9, 1.3, 0.6]} position={[0, 0.65, 0]} material={m.red} />
      <mesh position={[0, 0.85, 0.31]} onClick={open} {...handlers}>
        <planeGeometry args={[0.7, 0.5]} />
        <meshStandardMaterial color="#fff6e6" emissive="#ffe2a0" emissiveIntensity={hover ? 1.4 : 0.6} toneMapped={false} />
      </mesh>
      <Sign text="CV" bg="#d8473a" color="#ffffff" position={[0, 1.4, 0.31]} width={0.6} height={0.3} />
    </group>
  );
}

export function Lighthouse({ reducedMotion }: { reducedMotion: boolean }) {
  const m = landmarkMaterials();
  const beam = useRef<Group>(null);
  useFrame((_, dt) => {
    if (beam.current) beam.current.rotation.y += dt * (reducedMotion ? 0.2 : 0.7);
  });
  const segments = 5;
  const height = 7.5;
  return (
    <group>
      <Cyl args={[3.2, 3.8, 0.5, 9]} position={[0, 0.05, -0.5]} material={m.stoneDark} cast={false} />
      {Array.from({ length: segments }, (_, i) => {
        const h = height / segments;
        const r0 = 1.45 - (i / segments) * 0.5;
        const r1 = 1.45 - ((i + 1) / segments) * 0.5;
        return <Cyl key={i} args={[r1, r0, h, 14]} position={[0, 0.3 + h * i + h / 2, -0.5]} material={i % 2 ? m.white : m.red} />;
      })}
      <Cyl args={[1.35, 1.25, 0.16, 14]} position={[0, height + 0.38, -0.5]} material={m.dark} />
      <mesh position={[0, height + 0.85, -0.5]} rotation={[Math.PI / 2, 0, 0]} material={m.dark}>
        <torusGeometry args={[1.28, 0.025, 8, 48]} />
      </mesh>
      {Array.from({ length: 24 }, (_, k) => {
        const a = (k / 24) * Math.PI * 2;
        return <Box key={k} args={[0.03, 0.4, 0.03]} position={[Math.cos(a) * 1.28, height + 0.65, -0.5 + Math.sin(a) * 1.28]} material={m.dark} cast={false} />;
      })}
      <Cyl args={[0.75, 0.75, 1.1, 12]} position={[0, height + 1.0, -0.5]} material={m.lamp} cast={false} />
      <mesh position={[0, height + 1.95, -0.5]} material={m.red} castShadow>
        <coneGeometry args={[0.95, 0.85, 12]} />
      </mesh>
      <mesh position={[0, height + 2.45, -0.5]} material={m.dark}>
        <sphereGeometry args={[0.12, 8, 6]} />
      </mesh>
      <group ref={beam} position={[0, height + 1.0, -0.5]}>
        {[0, Math.PI].map((r) => (
          <mesh key={r} rotation={[0, r, Math.PI / 2]} position={[Math.cos(r) * 7, 0, 0]}>
            <coneGeometry args={[1.4, 14, 16, 1, true]} />
            <meshBasicMaterial color="#fff1c2" transparent opacity={0.13} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} />
          </mesh>
        ))}
      </group>
      <group position={[2.9, 0.1, 1.6]} rotation={[0, -0.4, 0]}>
        <Box args={[1.9, 1.4, 1.6]} position={[0, 0.7, 0]} material={m.white} />
        <mesh position={[0, 1.75, 0]} rotation={[0, 0, Math.PI / 2]} material={m.slate} castShadow>
          <cylinderGeometry args={[1.0, 1.0, 2.1, 3, 1]} />
        </mesh>
        <Window position={[0.45, 0.85, 0.8]} width={0.52} height={0.48} />
        <Box args={[0.5, 0.9, 0.05]} position={[-0.4, 0.45, 0.81]} material={m.woodDark} cast={false} />
      </group>
      {[
        [-2.5, -2.4, 1.1],
        [2.3, -2.9, 0.9],
        [-1.2, -3.6, 0.8],
      ].map(([x, z, s]) => (
        <mesh key={x} position={[x, 0.2, z]} scale={[s, s * 0.7, s]} material={m.stoneDark} castShadow>
          <dodecahedronGeometry args={[0.9, 0]} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Interactive parts of each landmark (project displays, CV kiosk). Kept separate
 * from the building models so a custom .glb can replace a building without
 * losing the clickable content, which is generated from the portfolio config.
 */
export function LandmarkInteractives({ id }: { id: SectionId }) {
  switch (id) {
    case "projects":
      return <Displays section="projects" style="screen" />;
    case "devops":
      return <Displays section="devops" style="container" />;
    case "research":
      return <Displays section="research" style="holo" />;
    case "creative":
      return <Displays section="creative" style="frame" />;
    case "contact":
      return <CvKiosk />;
    default:
      return null;
  }
}
