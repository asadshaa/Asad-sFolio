"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  DoubleSide,
  FrontSide,
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
import { modelUrl } from "@/config/models";
import { PropAsset, type PropAssetData } from "./ModelSlot";

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

function buildChunks(data: InstanceData, geometry: BufferGeometry, material: Material | Material[], castShadow: boolean): Chunk[] {
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

/** One scenery type, chunked and distance-culled every frame. */
function ChunkLayer({ data, asset, castShadow }: { data: InstanceData; asset: PropAssetData; castShadow: boolean }) {
  const chunks = useMemo(() => buildChunks(data, asset.geometry, asset.material, castShadow), [data, asset, castShadow]);
  useEffect(() => () => chunks.forEach((c) => c.mesh.dispose()), [chunks]);
  useFrame(() => {
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

const veg = (sway: number, doubleSided = false) =>
  applyReveal(new MeshStandardMaterial({ vertexColors: true, roughness: 0.88, side: doubleSided ? DoubleSide : FrontSide }), { sway });
const lampMaterial = () => applyReveal(new MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.55 }));

/**
 * World streaming: scenery is bucketed into spatial chunks over the sphere.
 * Chunks beyond the reveal distance are hidden entirely; nearby instances grow
 * in via the reveal shader. Each prop type can be replaced by a custom .glb
 * (see config/models.ts).
 */
export function WorldStreaming({ shadows }: { shadows: boolean }) {
  const w = getWorld();
  const bulbMat = useMemo(
    () => applyReveal(new MeshStandardMaterial({ color: "#fff3d6", emissive: "#ffd89a", emissiveIntensity: 2.2, toneMapped: false })),
    [],
  );
  useEffect(() => () => bulbMat.dispose(), [bulbMat]);
  const customLamp = modelUrl("street-lamp") !== null;

  useFrame(({ clock }) => {
    revealUniforms.uRevealCenter.value.copy(vehicle.position);
    revealUniforms.uTime.value = clock.elapsedTime;
    bulbMat.emissiveIntensity = 1.4 + lighting.night * 3.4;
  }, -1);

  return (
    <group>
      <PropAsset name="tree-pine" sway={0.018} build={() => ({ geometry: pineGeometry(), material: veg(0.018) })}>
        {(a) => <ChunkLayer data={w.pines} asset={a} castShadow={shadows} />}
      </PropAsset>
      <PropAsset name="tree-broadleaf" sway={0.022} build={() => ({ geometry: broadleafGeometry(), material: veg(0.022) })}>
        {(a) => <ChunkLayer data={w.broadleaf} asset={a} castShadow={shadows} />}
      </PropAsset>
      <PropAsset name="rock" build={() => ({ geometry: rockGeometry(), material: veg(0) })}>
        {(a) => <ChunkLayer data={w.rocks} asset={a} castShadow={false} />}
      </PropAsset>
      <PropAsset name="grass-tuft" sway={0.18} build={() => ({ geometry: tuftGeometry(), material: veg(0.18, true) })}>
        {(a) => <ChunkLayer data={w.tufts} asset={a} castShadow={false} />}
      </PropAsset>
      <PropAsset name="flower" sway={0.12} build={() => ({ geometry: flowerGeometry(), material: veg(0.12) })}>
        {(a) => <ChunkLayer data={w.flowers} asset={a} castShadow={false} />}
      </PropAsset>
      <PropAsset name="street-lamp" build={() => ({ geometry: lampGeometry(), material: lampMaterial() })}>
        {(a) => <ChunkLayer data={w.lamps} asset={a} castShadow={shadows} />}
      </PropAsset>
      {!customLamp && <BulbLayer data={w.lamps} material={bulbMat} />}
      <PropAsset name="road-post" build={() => ({ geometry: postGeometry(), material: lampMaterial() })}>
        {(a) => <ChunkLayer data={w.posts} asset={a} castShadow={false} />}
      </PropAsset>
    </group>
  );
}

/** Glowing lamp bulbs (built-in lamps only); brighten at night. */
function BulbLayer({ data, material }: { data: InstanceData; material: Material }) {
  const asset = useMemo(() => ({ geometry: lampBulbGeometry(), material, custom: false }), [material]);
  useEffect(() => () => asset.geometry.dispose(), [asset]);
  return <ChunkLayer data={data} asset={asset} castShadow={false} />;
}
