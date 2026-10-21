"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  ClampToEdgeWrapping,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
} from "three";
import { WORLD } from "@/config/world";
import { getWorld } from "@/lib/world/world";

function createRoadTexture() {
  const w = 256;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#5c606d";
  ctx.fillRect(0, 0, w, h);
  // Aggregate speckle.
  for (let i = 0; i < 5000; i++) {
    const v = 60 + Math.random() * 40;
    ctx.fillStyle = `rgba(${v},${v + 3},${v + 10},0.5)`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }
  // Subtle wheel-track wear.
  const wear = ctx.createLinearGradient(0, 0, w, 0);
  wear.addColorStop(0.22, "rgba(255,255,255,0)");
  wear.addColorStop(0.3, "rgba(255,255,255,0.04)");
  wear.addColorStop(0.38, "rgba(255,255,255,0)");
  wear.addColorStop(0.62, "rgba(255,255,255,0)");
  wear.addColorStop(0.7, "rgba(255,255,255,0.04)");
  wear.addColorStop(0.78, "rgba(255,255,255,0)");
  ctx.fillStyle = wear;
  ctx.fillRect(0, 0, w, h);
  // Edge lines.
  ctx.fillStyle = "#efe9dc";
  ctx.fillRect(w * 0.04, 0, w * 0.035, h);
  ctx.fillRect(w * 0.925, 0, w * 0.035, h);
  // Centre dashes.
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(w * 0.485, 0, w * 0.03, h * 0.45);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = RepeatWrapping;
  return tex;
}

function createRoadGeometry() {
  const { road } = getWorld();
  const R = WORLD.radius;
  const hw = WORLD.road.halfWidth;
  const n = road.count + 1; // duplicate first ring to close the loop with continuous UVs
  const ring = 4;
  const positions = new Float32Array(n * ring * 3);
  const uvs = new Float32Array(n * ring * 2);
  const d = new Vector3();
  const s = new Vector3();
  const p = new Vector3();
  const offsets = [-(hw + 0.45), -hw, hw, hw + 0.45];
  const lifts = [-0.32, 0.045, 0.045, -0.32];
  const us = [-0.02, 0, 1, 1.02];
  for (let k = 0; k < n; k++) {
    const i = k % road.count;
    d.fromArray(road.dirs, i * 3);
    s.fromArray(road.sides, i * 3);
    const v = road.arc[k] / WORLD.road.tileLength;
    for (let j = 0; j < ring; j++) {
      p.copy(d)
        .multiplyScalar(R)
        .addScaledVector(s, offsets[j])
        .normalize()
        .multiplyScalar(R + road.elev[i] + lifts[j]);
      positions.set([p.x, p.y, p.z], (k * ring + j) * 3);
      uvs.set([us[j], v], (k * ring + j) * 2);
    }
  }
  const index: number[] = [];
  for (let k = 0; k < n - 1; k++) {
    for (let j = 0; j < ring - 1; j++) {
      const a = k * ring + j;
      const b = a + 1;
      const c = a + ring;
      const e = c + 1;
      // (a, b, c) winds counter-clockwise seen from outside the planet.
      index.push(a, b, c, b, e, c);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(positions, 3));
  g.setAttribute("uv", new BufferAttribute(uvs, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

export function Road() {
  const gl = useThree((s) => s.gl);
  const geometry = useMemo(() => createRoadGeometry(), []);
  const texture = useMemo(() => {
    const t = createRoadTexture();
    t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return t;
  }, [gl]);

  useEffect(
    () => () => {
      geometry.dispose();
      texture.dispose();
    },
    [geometry, texture],
  );

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial map={texture} roughness={0.88} metalness={0} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  );
}
