"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { CanvasTexture, MeshStandardMaterial, type Group } from "three";
import { vehicle } from "@/state/runtime";
import { useGame } from "@/state/gameStore";

const WHEEL_POS: [number, number, number][] = [
  [0.57, 0.3, 0.74], // front-left (+x is the car's left)
  [-0.57, 0.3, 0.74], // front-right
  [0.57, 0.3, -0.72],
  [-0.57, 0.3, -0.72],
];

function useMaterials() {
  return useMemo(() => {
    const paint = new MeshStandardMaterial({ color: "#e4553c", roughness: 0.38, metalness: 0.15 });
    const cream = new MeshStandardMaterial({ color: "#f3e8d2", roughness: 0.5 });
    const glass = new MeshStandardMaterial({ color: "#22324a", roughness: 0.12, metalness: 0.6 });
    const chrome = new MeshStandardMaterial({ color: "#d6dade", roughness: 0.25, metalness: 0.85 });
    const dark = new MeshStandardMaterial({ color: "#2b2f38", roughness: 0.7 });
    const tire = new MeshStandardMaterial({ color: "#23262d", roughness: 0.9 });
    const head = new MeshStandardMaterial({ color: "#fff7e0", emissive: "#fff1cc", emissiveIntensity: 1.6 });
    return { paint, cream, glass, chrome, dark, tire, head };
  }, []);
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

/** A procedural miniature retro hatchback. Local frame: +z forward, +y up, +x left. */
/** Animated from the shared `vehicle` runtime state (wheel spin, steering, body roll, brake lights). */
export function CarModel() {
  const m = useMaterials();
  const shadowTex = useShadowTexture();
  const tail = useMemo(
    () => new MeshStandardMaterial({ color: "#c2241b", emissive: "#ff2a1a", emissiveIntensity: 0.6 }),
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
      m.paint.color.set(gold ? "#d6a72c" : "#e4553c");
      m.paint.metalness = gold ? 0.75 : 0.15;
      m.paint.roughness = gold ? 0.22 : 0.38;
    }
  });

  return (
    <group>
      {/* soft contact shadow */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} renderOrder={2}>
        <planeGeometry args={[2.0, 3.0]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} opacity={0.75} />
      </mesh>

      <group ref={body} position={[0, 0.34, 0]}>
        {/* lower body */}
        <RoundedBox args={[1.22, 0.46, 2.32]} radius={0.13} smoothness={3} position={[0, 0.22, 0]} castShadow material={m.paint} />
        {/* wheel-arch flares */}
        {WHEEL_POS.map(([x, , z], i) => (
          <RoundedBox
            key={i}
            args={[0.12, 0.2, 0.7]}
            radius={0.05}
            smoothness={2}
            position={[x > 0 ? 0.6 : -0.6, 0.1, z]}
            material={m.paint}
            castShadow
          />
        ))}
        {/* cabin glass + roof */}
        <RoundedBox args={[1.02, 0.42, 1.22]} radius={0.1} smoothness={3} position={[0, 0.62, -0.2]} material={m.glass} castShadow />
        <RoundedBox args={[1.08, 0.08, 1.28]} radius={0.04} smoothness={2} position={[0, 0.86, -0.22]} material={m.cream} castShadow />
        {/* pillars */}
        {[
          [0.5, 0.38],
          [-0.5, 0.38],
          [0.5, -0.8],
          [-0.5, -0.8],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.62, z]} material={m.cream}>
            <boxGeometry args={[0.06, 0.42, 0.07]} />
          </mesh>
        ))}
        {/* belt-line trim */}
        <mesh position={[0, 0.43, 0]} material={m.cream}>
          <boxGeometry args={[1.235, 0.05, 2.1]} />
        </mesh>
        {/* hood stripes */}
        {[0.13, -0.13].map((x) => (
          <mesh key={x} position={[x, 0.455, 0.7]} material={m.cream}>
            <boxGeometry args={[0.1, 0.01, 0.8]} />
          </mesh>
        ))}
        {/* grille, bumpers, plates */}
        <mesh position={[0, 0.2, 1.16]} material={m.dark}>
          <boxGeometry args={[0.56, 0.14, 0.03]} />
        </mesh>
        <mesh position={[0, 0.03, 1.17]} material={m.chrome}>
          <boxGeometry args={[1.26, 0.1, 0.1]} />
        </mesh>
        <mesh position={[0, 0.03, -1.17]} material={m.chrome}>
          <boxGeometry args={[1.26, 0.1, 0.1]} />
        </mesh>
        <mesh position={[0, 0.2, -1.17]} material={m.cream}>
          <boxGeometry args={[0.36, 0.12, 0.02]} />
        </mesh>
        {/* headlights */}
        {[0.4, -0.4].map((x) => (
          <group key={x} position={[x, 0.28, 1.15]}>
            <mesh rotation-x={Math.PI / 2} material={m.chrome}>
              <cylinderGeometry args={[0.125, 0.125, 0.05, 16]} />
            </mesh>
            <mesh rotation-x={Math.PI / 2} position={[0, 0, 0.02]} material={m.head}>
              <cylinderGeometry args={[0.1, 0.1, 0.03, 16]} />
            </mesh>
          </group>
        ))}
        {/* tail lights */}
        {[0.42, -0.42].map((x) => (
          <mesh key={x} position={[x, 0.3, -1.16]} material={tail}>
            <boxGeometry args={[0.24, 0.1, 0.03]} />
          </mesh>
        ))}
        {/* mirrors */}
        {[0.63, -0.63].map((x) => (
          <mesh key={x} position={[x, 0.5, 0.36]} material={m.paint}>
            <boxGeometry args={[0.1, 0.08, 0.1]} />
          </mesh>
        ))}
        {/* roof rack + suitcase */}
        {[0.35, -0.35].map((x) => (
          <mesh key={x} position={[x, 0.93, -0.22]} material={m.dark}>
            <boxGeometry args={[0.04, 0.04, 1.0]} />
          </mesh>
        ))}
        {/* antenna */}
        <mesh position={[-0.46, 0.85, -1.0]} material={m.dark}>
          <cylinderGeometry args={[0.008, 0.008, 0.7, 4]} />
        </mesh>
        <mesh position={[-0.46, 1.2, -1.0]} material={m.dark}>
          <sphereGeometry args={[0.04, 8, 6]} />
        </mesh>
      </group>

      <group ref={wheels}>
      {WHEEL_POS.map((p, i) => (
        <group key={i} position={p}>
          <group>
            <group>
              <mesh rotation-z={Math.PI / 2} material={m.tire} castShadow>
                <cylinderGeometry args={[0.3, 0.3, 0.26, 18]} />
              </mesh>
              <mesh rotation-z={Math.PI / 2} material={m.cream}>
                <cylinderGeometry args={[0.17, 0.17, 0.27, 12]} />
              </mesh>
              <mesh rotation-z={Math.PI / 2} material={m.chrome}>
                <cylinderGeometry args={[0.06, 0.06, 0.29, 8]} />
              </mesh>
              {/* spoke bar so rotation reads visually */}
              <mesh material={m.dark}>
                <boxGeometry args={[0.28, 0.26, 0.04]} />
              </mesh>
            </group>
          </group>
        </group>
      ))}
      </group>
    </group>
  );
}
