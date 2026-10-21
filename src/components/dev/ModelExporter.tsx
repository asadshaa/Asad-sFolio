"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { MeshStandardMaterial, type BufferGeometry, type Group } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { DESTINATIONS } from "@/config/world";
import { buildWorld } from "@/lib/world/world";
import {
  broadleafGeometry,
  cloudGeometry,
  flowerGeometry,
  lampBulbGeometry,
  lampGeometry,
  pineGeometry,
  postGeometry,
  rockGeometry,
  tokenGeometry,
  tuftGeometry,
} from "@/lib/three/props";
import { CarModel } from "@/components/game/CarModel";
import { Cabin, CloudDistrict, CreativeStudio, Lighthouse, Observatory, Workshop } from "@/components/game/Landmarks";
import { Planet } from "@/components/game/Planet";
import { Road } from "@/components/game/Road";

const accent = (id: string) => DESTINATIONS.find((d) => d.id === id)?.accent ?? "#ffffff";

type Status = { name: string; state: "pending" | "ok" | "error"; info?: string };

function PropMesh({ geometry, color, name }: { geometry: () => BufferGeometry; color?: string; name: string }) {
  const { geo, mat } = useMemo(
    () => ({
      geo: geometry(),
      mat: color
        ? new MeshStandardMaterial({ color, name, roughness: 0.6 })
        : new MeshStandardMaterial({ vertexColors: true, roughness: 0.88, name }),
    }),
    [geometry, color, name],
  );
  return <mesh geometry={geo} material={mat} name={name} />;
}

/** Everything that gets exported, keyed by model name (matches config/models.ts). */
const MODELS: { name: string; note: string; node: ReactNode }[] = [
  { name: "car", note: "Wheels: Wheel_FL/FR/RL/RR · materials Paint, TailLight", node: <CarModel /> },
  { name: "landmark-home", note: "Home (spawn point)", node: <Cabin accent={accent("about")} /> },
  { name: "landmark-garage", note: "Engineering Garage", node: <Workshop /> },
  { name: "landmark-cloud", note: "Cloud District", node: <CloudDistrict accent={accent("devops")} /> },
  { name: "landmark-research", note: "Research Island", node: <Observatory accent={accent("research")} /> },
  { name: "landmark-creative", note: "Creative District", node: <CreativeStudio /> },
  { name: "landmark-lighthouse", note: "Lighthouse", node: <Lighthouse reducedMotion /> },
  { name: "tree-pine", note: "Instanced scenery", node: <PropMesh name="Pine" geometry={pineGeometry} /> },
  { name: "tree-broadleaf", note: "Instanced scenery", node: <PropMesh name="Broadleaf" geometry={broadleafGeometry} /> },
  { name: "rock", note: "Instanced scenery", node: <PropMesh name="Rock" geometry={rockGeometry} /> },
  { name: "grass-tuft", note: "Instanced scenery", node: <PropMesh name="GrassTuft" geometry={tuftGeometry} /> },
  { name: "flower", note: "Instanced scenery (tinted per instance)", node: <PropMesh name="Flower" geometry={flowerGeometry} /> },
  {
    name: "street-lamp",
    note: "Pole + bulb (+z faces the road)",
    node: (
      <>
        <PropMesh name="LampPole" geometry={lampGeometry} />
        <PropMesh name="LampBulb" geometry={lampBulbGeometry} color="#fff3d6" />
      </>
    ),
  },
  { name: "road-post", note: "Instanced scenery", node: <PropMesh name="RoadPost" geometry={postGeometry} /> },
  { name: "cloud", note: "Instanced sky", node: <PropMesh name="Cloud" geometry={cloudGeometry} /> },
  { name: "token", note: "Collectible", node: <TokenMesh /> },
  {
    name: "world-reference",
    note: "Planet, road & water — reference for scale only (not swappable)",
    node: (
      <>
        <Planet />
        <Road />
      </>
    ),
  },
];

function TokenMesh() {
  const tokenGeo = useMemo(() => tokenGeometry(), []);
  return (
    <mesh name="Token" geometry={tokenGeo}>
      <meshStandardMaterial name="Token" color="#e3b04b" emissive="#f2a93a" emissiveIntensity={0.2} metalness={0.9} roughness={0.25} />
    </mesh>
  );
}

/** Fires once all models inside the Canvas have mounted. */
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onReady, 100);
    return () => window.clearTimeout(t);
  }, [onReady]);
  return null;
}

function Scene({ groups, onReady }: { groups: React.RefObject<Record<string, Group | null>>; onReady: () => void }) {
  return (
    <>
      <ambientLight intensity={1} />
      {MODELS.map((m) => (
        <group
          key={m.name}
          name={m.name}
          ref={(g) => {
            groups.current[m.name] = g;
          }}
        >
          {m.node}
        </group>
      ))}
      <Ready onReady={onReady} />
    </>
  );
}

/**
 * Dev tool page: renders every procedural model once and exports each one to
 * assets/models/<name>.glb so it can be edited in Blender.
 */
export default function ModelExporter() {
  useState(() => buildWorld("high"));
  const groups = useRef<Record<string, Group | null>>({});
  const [status, setStatus] = useState<Status[]>(MODELS.map((m) => ({ name: m.name, state: "pending" })));
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    const exporter = new GLTFExporter();
    for (const m of MODELS) {
      const g = groups.current[m.name];
      try {
        if (!g) throw new Error("not mounted yet");
        const data = (await exporter.parseAsync(g, { binary: true })) as ArrayBuffer;
        const res = await fetch(`/api/dev/models?name=${m.name}`, { method: "POST", body: data });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? res.statusText);
        setStatus((s) => s.map((x) => (x.name === m.name ? { ...x, state: "ok", info: `${(json.bytes / 1024).toFixed(0)} KB` } : x)));
      } catch (err) {
        setStatus((s) => s.map((x) => (x.name === m.name ? { ...x, state: "error", info: String(err) } : x)));
      }
    }
    setRunning(false);
  }, []);

  // Run once, as soon as every model has mounted inside the Canvas.
  const started = useRef(false);
  const onReady = useCallback(() => {
    if (started.current) return;
    started.current = true;
    void run();
  }, [run]);

  const done = status.filter((s) => s.state === "ok").length;
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="font-display text-3xl font-bold">3D model exporter (dev only)</h1>
      <p className="mt-2 text-ink-soft">
        Exports every built-in model to <code>assets/models/&lt;name&gt;.glb</code>. Edit them in Blender, save to{" "}
        <code>public/models/</code> and point <code>src/config/models.ts</code> at them.
      </p>
      <p className="mt-4 font-semibold" role="status" data-export-done={done === MODELS.length ? "true" : "false"}>
        {done}/{MODELS.length} exported{running ? " — working…" : ""}
      </p>
      <button type="button" onClick={() => void run()} disabled={running} className="mt-3 rounded-full bg-ink px-4 py-2 font-semibold text-paper disabled:opacity-40">
        Export again
      </button>
      <ul className="mt-6 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white/70">
        {status.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
            <span>
              <code className="font-semibold">{s.name}.glb</code>
              <span className="ml-2 text-ink-soft">{MODELS.find((m) => m.name === s.name)?.note}</span>
            </span>
            <span className={s.state === "ok" ? "text-moss" : s.state === "error" ? "text-coral" : "text-ink-soft"}>
              {s.state === "ok" ? `✓ ${s.info}` : s.state === "error" ? `✗ ${s.info}` : "…"}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-6 h-64 overflow-hidden rounded-2xl border border-ink/10">
        <Canvas camera={{ position: [10, 8, 14], fov: 50 }}>
          <Scene groups={groups} onReady={onReady} />
        </Canvas>
      </div>
    </main>
  );
}
