"use client";

import { useEffect, useMemo } from "react";
import { BufferAttribute, BufferGeometry, Color, LinearSRGBColorSpace } from "three";
import { WORLD } from "@/config/world";
import { getWorld } from "@/lib/world/world";

/** The planet surface (one indexed mesh, flat-shaded low-poly) plus the water sphere. */
export function Planet() {
  const world = getWorld();

  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(world.terrain.positions, 3));
    g.setAttribute("color", new BufferAttribute(world.terrain.colors, 3));
    g.setIndex(new BufferAttribute(world.terrain.index, 1));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }, [world]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const waterColor = useMemo(() => new Color(WORLD.palette.water), []);
  const waterEmissive = useMemo(() => new Color().setHex(0x1d4e66, LinearSRGBColorSpace), []);

  return (
    <group>
      <mesh geometry={geometry} receiveShadow castShadow={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.96} metalness={0} />
      </mesh>
      <mesh renderOrder={1}>
        <sphereGeometry args={[WORLD.radius + WORLD.waterLevel, 160, 120]} />
        <meshStandardMaterial
          color={waterColor}
          emissive={waterEmissive}
          emissiveIntensity={0.25}
          roughness={0.18}
          metalness={0.15}
          transparent
          opacity={0.88}
        />
      </mesh>
    </group>
  );
}
