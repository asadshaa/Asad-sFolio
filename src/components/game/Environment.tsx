"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Fog,
  HemisphereLight,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  PointLight,
  ShaderMaterial,
  SpotLight,
  Vector3,
  type Group,
} from "three";
import { TIME_PRESETS, WORLD } from "@/config/world";
import { Mesh, PMREMGenerator, Scene, SphereGeometry } from "three";
import { getWorld } from "@/lib/world/world";
import { lighting, stepLighting } from "@/lib/three/lighting";
import { useGame } from "@/state/gameStore";
import { landmarkMaterials } from "./landmarkMaterials";
import { PropAsset, type PropAssetData } from "./ModelSlot";
import { cloudGeometry } from "@/lib/three/props";
import { createRng } from "@/lib/noise";
import { vehicle } from "@/state/runtime";

const R = WORLD.radius;

const WORLD_SUN = new Vector3(0.55, 0.75, 0.38).normalize();
/** Shared, updated each frame: local sun direction relative to the car. */
export const sunDir = new Vector3(0, 1, 0);
const tangential = new Vector3();

function updateSunDir() {
  const up = vehicle.up;
  tangential.copy(WORLD_SUN).addScaledVector(up, -WORLD_SUN.dot(up));
  if (tangential.lengthSq() < 1e-4) tangential.set(1, 0, 0).addScaledVector(up, -up.x);
  tangential.normalize();
  sunDir.copy(up).multiplyScalar(0.74).addScaledVector(tangential, 0.67).normalize();
}

/* ─────────────────────────── sky ─────────────────────────── */

function Sky() {
  const camera = useThree((s) => s.camera);
  const ref = useRef<Group>(null);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uUp: { value: new Vector3(0, 1, 0) },
          uSun: { value: new Vector3(0, 1, 0) },
          uZenith: { value: lighting.skyZenith },
          uMid: { value: lighting.skyMid },
          uHorizon: { value: lighting.skyHorizon },
          uFog: { value: lighting.fog },
          uSunColor: { value: lighting.disc },
          uNight: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uUp, uSun, uZenith, uMid, uHorizon, uFog, uSunColor;
          uniform float uNight;
          varying vec3 vDir;
          float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
          void main() {
            vec3 d = normalize(vDir);
            float e = dot(d, uUp);
            vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.28, e));
            col = mix(col, uZenith, smoothstep(0.22, 0.9, e));
            col = mix(col, uFog, smoothstep(0.02, -0.25, e));
            float s = max(dot(d, uSun), 0.0);
            col += uSunColor * (pow(s, 900.0) * 1.4 + pow(s, 40.0) * 0.18 + pow(s, 6.0) * 0.08 * (1.0 - uNight));
            if (uNight > 0.01) {
              vec3 cell = floor(d * 260.0);
              float star = step(0.9965, hash(cell)) * smoothstep(0.05, 0.3, e);
              col += vec3(0.9, 0.93, 1.0) * star * uNight * (0.6 + 0.4 * hash(cell + 1.0));
            }
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [],
  );

  useFrame(() => {
    ref.current?.position.copy(camera.position);
    material.uniforms.uUp.value.copy(vehicle.up);
    material.uniforms.uSun.value.copy(sunDir);
    material.uniforms.uNight.value = lighting.night;
  });

  useEffect(() => () => material.dispose(), [material]);

  return (
    <group ref={ref}>
      <mesh material={material} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[600, 32, 20]} />
      </mesh>
    </group>
  );
}

/* ─────────────────────────── lights ─────────────────────────── */

function Lights({ shadows, shadowMap }: { shadows: boolean; shadowMap: number }) {
  const scene = useThree((s) => s.scene);
  const sun = useMemo(() => {
    const l = new DirectionalLight("#ffe6c2", 2.7);
    l.castShadow = shadows;
    l.shadow.mapSize.set(shadowMap, shadowMap);
    const c = l.shadow.camera;
    c.left = -22;
    c.right = 22;
    c.top = 22;
    c.bottom = -22;
    c.near = 1;
    c.far = 120;
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.05;
    return l;
  }, [shadows, shadowMap]);
  const hemi = useMemo(() => new HemisphereLight("#d4e6f7", "#6f8b54", 1.05), []);

  const background = useMemo(() => lighting.fog.clone(), []);
  useEffect(() => {
    scene.add(sun, sun.target, hemi);
    scene.fog = new Fog(lighting.fog.clone(), WORLD.fog.near, WORLD.fog.far);
    scene.background = background;
    return () => {
      scene.remove(sun, sun.target, hemi);
      sun.dispose();
      hemi.dispose();
      scene.fog = null;
    };
  }, [scene, sun, hemi, background]);

  useFrame(() => {
    updateSunDir();
    sun.color.copy(lighting.sunColor);
    sun.intensity = lighting.sunIntensity;
    hemi.color.copy(lighting.hemiSky);
    hemi.groundColor.copy(lighting.hemiGround);
    // The reflection map also contributes ambient light, so the hemisphere light is scaled down.
    hemi.intensity = lighting.hemiIntensity * 0.6;
    (scene.fog as Fog | null)?.color.copy(lighting.fog);
    background.copy(lighting.fog);
    sun.position.copy(vehicle.position).addScaledVector(sunDir, 55);
    sun.target.position.copy(vehicle.position);
    sun.target.updateMatrixWorld();
    hemi.position.copy(vehicle.up);
  }, -1);

  return <ambientLight intensity={0.12} />;
}

/* ─────────────────────────── clouds ─────────────────────────── */

const cloudAsset = () => ({
  geometry: cloudGeometry(),
  material: new MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    emissive: "#ffffff",
    emissiveIntensity: 0.22,
    transparent: true,
    opacity: 0.94,
  }),
});

/** Clouds — built-in or a custom "cloud" .glb (see config/models.ts). */
function Clouds() {
  return (
    <PropAsset name="cloud" reveal={false} build={cloudAsset}>
      {(a) => <CloudLayer asset={a} />}
    </PropAsset>
  );
}

function CloudLayer({ asset }: { asset: PropAssetData }) {
  const ref = useRef<Group>(null);
  const mesh = useMemo(() => {
    const { clouds } = getWorld();
    const m = new InstancedMesh(asset.geometry, asset.material, clouds.count);
    m.instanceMatrix.array.set(clouds.matrices.subarray(0, clouds.count * 16));
    m.instanceColor = new InstancedBufferAttribute(clouds.colors.slice(0, clouds.count * 3), 3);
    m.frustumCulled = false;
    return m;
  }, [asset]);

  useEffect(() => () => mesh.dispose(), [mesh]);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.006;
  });

  return (
    <group ref={ref}>
      <primitive object={mesh} />
    </group>
  );
}

/* ─────────────────────────── birds ─────────────────────────── */

const FLOCKS = 4;
const PER_FLOCK = 5;

function wingGeometry(sign: number) {
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute([0, 0, 0.12, sign * 0.55, 0.02, -0.05, 0, 0, -0.14], 3));
  g.computeVertexNormals();
  return g;
}

function Birds({ reducedMotion }: { reducedMotion: boolean }) {
  const data = useMemo(() => {
    const rng = createRng(99);
    const flocks = Array.from({ length: FLOCKS }, (_, i) => ({
      radius: 22 + rng() * 20,
      alt: 11 + rng() * 7,
      speed: (0.05 + rng() * 0.05) * (i % 2 ? 1 : -1),
      phase: rng() * Math.PI * 2,
    }));
    const offsets = Array.from({ length: PER_FLOCK }, (_, k) => {
      const row = Math.ceil(k / 2);
      const s = k % 2 ? 1 : -1;
      return new Vector3(s * row * 0.9, (rng() - 0.5) * 0.4, -row * 0.8);
    });
    const mat = new MeshStandardMaterial({ color: "#3b3f4c", side: DoubleSide, roughness: 1 });
    const n = FLOCKS * PER_FLOCK;
    const left = new InstancedMesh(wingGeometry(1), mat, n);
    const rightW = new InstancedMesh(wingGeometry(-1), mat, n);
    [left, rightW].forEach((m) => (m.frustumCulled = false));
    return { flocks, offsets, left, right: rightW, mat };
  }, []);

  useEffect(
    () => () => {
      data.left.geometry.dispose();
      data.right.geometry.dispose();
      data.mat.dispose();
      data.left.dispose();
      data.right.dispose();
    },
    [data],
  );

  const scratch = useMemo(
    () => ({
      e1: new Vector3(),
      e2: new Vector3(),
      c: new Vector3(),
      fwd: new Vector3(),
      x: new Vector3(),
      p: new Vector3(),
      m: new Matrix4(),
      w: new Matrix4(),
      q: new Quaternion(),
      o: new Object3D(),
    }),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const { e1, e2, c, fwd, x, p, m, w } = scratch;
    const up = vehicle.up;
    e1.set(0, 1, 0).cross(up);
    if (e1.lengthSq() < 1e-3) e1.set(1, 0, 0).cross(up);
    e1.normalize();
    e2.crossVectors(up, e1).normalize();
    let idx = 0;
    data.flocks.forEach((f) => {
      const a = f.phase + t * f.speed;
      c.copy(vehicle.position)
        .addScaledVector(e1, Math.cos(a) * f.radius)
        .addScaledVector(e2, Math.sin(a) * f.radius);
      c.setLength(R + f.alt);
      const cu = p.copy(c).normalize();
      fwd.copy(e1).multiplyScalar(-Math.sin(a) * Math.sign(f.speed)).addScaledVector(e2, Math.cos(a) * Math.sign(f.speed));
      fwd.addScaledVector(cu, -fwd.dot(cu)).normalize();
      x.crossVectors(cu, fwd).normalize();
      data.offsets.forEach((o, k) => {
        m.makeBasis(x, cu, fwd);
        const flap = reducedMotion ? 0.2 : Math.sin(t * 9 + k * 1.3 + f.phase) * 0.55;
        const bob = reducedMotion ? 0 : Math.sin(t * 1.3 + k) * 0.25;
        m.setPosition(
          c.x + x.x * o.x + cu.x * (o.y + bob) + fwd.x * o.z,
          c.y + x.y * o.x + cu.y * (o.y + bob) + fwd.y * o.z,
          c.z + x.z * o.x + cu.z * (o.y + bob) + fwd.z * o.z,
        );
        w.makeRotationZ(flap);
        data.left.setMatrixAt(idx, w.premultiply(m));
        w.makeRotationZ(-flap);
        data.right.setMatrixAt(idx, w.premultiply(m));
        idx++;
      });
    });
    data.left.instanceMatrix.needsUpdate = true;
    data.right.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <primitive object={data.left} />
      <primitive object={data.right} />
    </>
  );
}

/* ─────────────────────────── motes ─────────────────────────── */

function Motes({ count }: { count: number }) {
  const { geometry, material } = useMemo(() => {
    const rng = createRng(5);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) pos[i] = (rng() - 0.5) * 44;
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    const m = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uCenter: { value: new Vector3() }, uTime: { value: 0 }, uR: { value: R } },
      vertexShader: /* glsl */ `
        uniform vec3 uCenter; uniform float uTime; uniform float uR;
        varying float vA;
        void main() {
          vec3 p = position + vec3(sin(uTime * 0.21 + position.y) * 2.0, cos(uTime * 0.17 + position.x) * 1.5, sin(uTime * 0.13 + position.z) * 2.0);
          p = mod(p - uCenter + 22.0, 44.0) - 22.0 + uCenter;
          float alt = length(p) - uR;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float d = length(p - uCenter);
          vA = smoothstep(0.4, 1.6, alt) * (1.0 - smoothstep(4.5, 9.0, alt)) * (1.0 - smoothstep(14.0, 22.0, d));
          vA *= 0.55 + 0.45 * sin(uTime * 1.7 + position.x * 3.1);
          gl_PointSize = 70.0 / -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          float r = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, r) * vA * 0.75;
          gl_FragColor = vec4(1.0, 0.93, 0.74, a);
        }`,
    });
    return { geometry: g, material: m };
  }, [count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(({ clock }) => {
    material.uniforms.uCenter.value.copy(vehicle.position);
    material.uniforms.uTime.value = clock.elapsedTime;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

/**
 * Time of day: eases the shared lighting toward the selected preset and
 * drives night-time emissives. One accent light follows the nearest landmark
 * and the car's headlights are always present (constant light count = no
 * shader recompiles), just dimmed during the day.
 */
function TimeOfDay({ reducedMotion }: { reducedMotion: boolean }) {
  const scene = useThree((s) => s.scene);
  const { accent, head } = useMemo(() => {
    const accentLight = new PointLight("#ffffff", 0, 20, 1.6);
    const headLight = new SpotLight("#fff1d0", 0, 34, 0.55, 0.6, 1.4);
    return { accent: accentLight, head: headLight };
  }, []);
  useEffect(() => {
    scene.add(accent, head, head.target);
    return () => {
      scene.remove(accent, head, head.target);
      accent.dispose();
      head.dispose();
    };
  }, [scene, accent, head]);
  const color = useMemo(() => new Color(), []);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    stepLighting(TIME_PRESETS[useGame.getState().timeOfDay], dt, reducedMotion);
    const n = lighting.night;
    const m = landmarkMaterials();
    m.windowWarm.emissiveIntensity = 1.2 + n * 2.2;
    m.windowCool.emissiveIntensity = 0.8 + n * 1.8;
    m.lamp.emissiveIntensity = 3 + n * 3;

    // Accent light hovers over the nearest landmark, tinted with its colour.
    let best = null as ReturnType<typeof getWorld>["landmarks"][number] | null;
    let bestD = Infinity;
    for (const l of getWorld().landmarks) {
      const d = l.position.distanceTo(vehicle.position);
      if (d < bestD) {
        bestD = d;
        best = l;
      }
    }
    if (best) {
      accent.position.copy(best.position).addScaledVector(best.up, 5);
      color.set(best.config.accent);
      accent.color.lerp(color, Math.min(1, dt * 3));
      const near = Math.max(0, 1 - bestD / 70);
      accent.intensity = near * (5 + n * 22);
    }

    head.position.copy(vehicle.position).addScaledVector(vehicle.up, 0.75).addScaledVector(vehicle.forward, 1.1);
    head.target.position.copy(vehicle.position).addScaledVector(vehicle.forward, 12).addScaledVector(vehicle.up, -0.6);
    head.target.updateMatrixWorld();
    head.intensity = Math.max(0, n - 0.1) * 60;
  }, -1.5);
  return null;
}

/**
 * Image-based lighting: renders a small sky-gradient scene for the current
 * time of day into a prefiltered environment map (reflections on paint, glass,
 * metal and water) and rotates it every frame so "up" in the reflections always
 * matches the car's local up on the planet.
 */
function ReflectionMap() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const timeOfDay = useGame((s) => s.timeOfDay);

  useEffect(() => {
    const p = TIME_PRESETS[timeOfDay];
    const pmrem = new PMREMGenerator(gl);
    const envScene = new Scene();
    const geo = new SphereGeometry(10, 48, 24);
    const mat = new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      uniforms: {
        uZenith: { value: new Color(p.skyZenith) },
        uMid: { value: new Color(p.skyMid) },
        uHorizon: { value: new Color(p.skyHorizon) },
        uGround: { value: new Color(p.night > 0.5 ? "#141a24" : "#6e6a60") },
        uSun: { value: new Color(p.sunColor).multiplyScalar(p.sunIntensity * 0.9) },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uZenith, uMid, uHorizon, uGround, uSun;
        varying vec3 vDir;
        void main() {
          float e = vDir.y;
          vec3 sky = mix(uHorizon, uMid, smoothstep(0.0, 0.3, e));
          sky = mix(sky, uZenith, smoothstep(0.25, 0.9, e));
          vec3 col = mix(uGround, sky, smoothstep(-0.08, 0.02, e));
          // soft bright patch where the sun usually sits
          float s = max(dot(vDir, normalize(vec3(0.55, 0.6, 0.4))), 0.0);
          col += uSun * pow(s, 24.0) * 0.6;
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    envScene.add(new Mesh(geo, mat));
    const rt = pmrem.fromScene(envScene, 0.015);
    scene.environment = rt.texture;
    scene.environmentIntensity = p.night > 0.5 ? 0.35 : 0.75;
    return () => {
      if (scene.environment === rt.texture) scene.environment = null;
      rt.dispose();
      pmrem.dispose();
      geo.dispose();
      mat.dispose();
    };
  }, [gl, scene, timeOfDay]);

  const q = useMemo(() => new Quaternion(), []);
  const Y = useMemo(() => new Vector3(0, 1, 0), []);
  useFrame(() => {
    q.setFromUnitVectors(Y, vehicle.up);
    scene.environmentRotation.setFromQuaternion(q);
  });
  return null;
}

export function Environment({
  shadows,
  shadowMap,
  reducedMotion,
  lowPower,
}: {
  shadows: boolean;
  shadowMap: number;
  reducedMotion: boolean;
  lowPower: boolean;
}) {
  return (
    <>
      <TimeOfDay reducedMotion={reducedMotion} />
      <ReflectionMap />
      <Sky />
      <Lights shadows={shadows} shadowMap={shadowMap} />
      <Clouds />
      <Birds reducedMotion={reducedMotion} />
      <Motes count={lowPower ? 80 : 200} />
    </>
  );
}
