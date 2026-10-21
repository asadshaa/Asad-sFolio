"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  InstancedBufferAttribute,
  InstancedMesh,
  MeshStandardMaterial,
  Vector3,
  type BufferGeometry,
  type Material,
} from "three";
import { WORLD } from "@/config/world";
import { getWorld, type InstanceData } from "@/lib/world/world";
import { applyReveal, revealUniforms } from "@/lib/three/reveal";
import { lighting } from "@/lib/three/lighting";
import {
  broadleafGeometry,
  flowerGeometry,
  lampBulbGeometry,
  lampGeometry,
  pineGeometry,
  postGeometry,
  rockGeometry,
  tuftGeometry,
} from "@/lib/three/props";
import { vehicle } from "@/state/runtime";

/**
 * World streaming: scenery is bucketed into spatial chunks over the sphere.
 * Each frame, chunks farther than the reveal distance are hidden entirely
 * (no draw call, no vertex work); nearby chunks are drawn, and the reveal
 * shader grows each instance in as the car approaches.
 */

const CHUNKS = 64;
const chunkCenters: Vector3[] = (() => {
  // Fibonacci sphere — evenly distributed chunk centres.
  const pts: Vector3[] = [];
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < CHUNKS; i++) {
    const y = 1 - (i / (CHUNKS - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    pts.push(new Vector3(Math.cos(g * i) * r, y, Math.sin(g * i) * r));
  }
  return pts;
})();

interface Chunk {
  mesh: InstancedMesh;
  center: Vector3;
  radius: number;
}

function buildChunks(data: InstanceData, geometry: BufferGeometry, material: Material, castShadow: boolean): Chunk[] {
  const buckets: number[][] = chunkCenters.map(() => []);
  const p = new Vector3();
  for (let i = 0; i < data.count; i++) {
    p.set(data.matrices[i * 16 + 12], data.matrices[i * 16 + 13], data.matrices[i * 16 + 14]).normalize();
    let best = 0;
    let bestDot = -2;
    for (let c = 0; c < CHUNKS; c++) {
      const d = p.dot(chunkCenters[c]);
      if (d > bestDot) {
        bestDot = d;
        best = c;
      }
    }
    buckets[best].push(i);
  }
  const chunks: Chunk[] = [];
  buckets.forEach((ids) => {
    if (!ids.length) return;
    const mesh = new InstancedMesh(geometry, material, ids.length);
    const colors = new Float32Array(ids.length * 3);
    const center = new Vector3();
    ids.forEach((id, k) => {
      mesh.instanceMatrix.array.set(data.matrices.subarray(id * 16, id * 16 + 16), k * 16);
      colors.set(data.colors.subarray(id * 3, id * 3 + 3), k * 3);
      center.x += data.matrices[id * 16 + 12];
      center.y += data.matrices[id * 16 + 13];
      center.z += data.matrices[id * 16 + 14];
    });
    center.divideScalar(ids.length);
    let radius = 0;
    ids.forEach((id) => {
      p.set(data.matrices[id * 16 + 12], data.matrices[id * 16 + 13], data.matrices[id * 16 + 14]);
      radius = Math.max(radius, p.distanceTo(center));
    });
    mesh.instanceColor = new InstancedBufferAttribute(colors, 3);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    mesh.visible = false;
    chunks.push({ mesh, center, radius });
  });
  return chunks;
}

interface Layer {
  data: InstanceData;
  geometry: BufferGeometry;
  material: Material;
  castShadow: boolean;
}

export function WorldStreaming({ shadows }: { shadows: boolean }) {
  const { layers, chunks, bulbMat } = useMemo(() => {
    const w = getWorld();
    const veg = (sway: number) =>
      applyReveal(new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 }), { sway });
    const lampMat = applyReveal(new MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.2 }));
    const bulbMat = applyReveal(
      new MeshStandardMaterial({ color: "#fff3d6", emissive: "#ffd89a", emissiveIntensity: 2.2, toneMapped: false }),
    );
    const layers: Layer[] = [
      { data: w.pines, geometry: pineGeometry(), material: veg(0.018), castShadow: shadows },
      { data: w.broadleaf, geometry: broadleafGeometry(), material: veg(0.022), castShadow: shadows },
      { data: w.rocks, geometry: rockGeometry(), material: veg(0), castShadow: false },
      { data: w.tufts, geometry: tuftGeometry(), material: veg(0.18), castShadow: false },
      { data: w.flowers, geometry: flowerGeometry(), material: veg(0.12), castShadow: false },
      { data: w.lamps, geometry: lampGeometry(), material: lampMat, castShadow: shadows },
      { data: w.lamps, geometry: lampBulbGeometry(), material: bulbMat, castShadow: false },
      { data: w.posts, geometry: postGeometry(), material: lampMat, castShadow: false },
    ];
    const chunks = layers.flatMap((l) => buildChunks(l.data, l.geometry, l.material, l.castShadow));
    return { layers, chunks, bulbMat };
  }, [shadows]);

  useEffect(
    () => () => {
      chunks.forEach((c) => c.mesh.dispose());
      layers.forEach((l) => l.geometry.dispose());
      new Set(layers.map((l) => l.material)).forEach((m) => m.dispose());
    },
    [chunks, layers],
  );

  useFrame(({ clock }) => {
    revealUniforms.uRevealCenter.value.copy(vehicle.position);
    revealUniforms.uTime.value = clock.elapsedTime;
    bulbMat.emissiveIntensity = 1.4 + lighting.night * 3.4;
    const limit = WORLD.reveal.far + 2;
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      c.mesh.visible = c.center.distanceTo(vehicle.position) - c.radius < limit;
    }
  }, -1);

  return (
    <group>
      {chunks.map((c, i) => (
        <primitive key={i} object={c.mesh} />
      ))}
    </group>
  );
}
