"use client";

import { Component, Suspense, useEffect, useMemo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import { Mesh, type BufferGeometry, type Material, type Object3D } from "three";
import { modelUrl, type ModelName } from "@/config/models";
import { mergeGltfScene } from "@/lib/three/gltfMerge";
import { applyReveal } from "@/lib/three/reveal";

/** Falls back to the built-in model if a custom .glb is missing or broken. */
class ModelBoundary extends Component<{ name: string; fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn(`[models] Could not load the custom model "${this.props.name}", using the built-in one.`, error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function prepareShadows(root: Object3D) {
  root.traverse((o) => {
    const m = o as Mesh;
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
}

function CustomScene({ url, onScene }: { url: string; onScene?: (scene: Object3D) => ReactNode }) {
  const { scene } = useGLTF(url);
  const instance = useMemo(() => {
    const c = scene.clone(true);
    prepareShadows(c);
    return c;
  }, [scene]);
  return (
    <>
      <primitive object={instance} />
      {onScene?.(instance)}
    </>
  );
}

/**
 * Renders a custom .glb for `name` if one is configured in config/models.ts,
 * otherwise the built-in procedural model (`children`).
 * `onScene` lets callers attach behaviour (e.g. wheel animation) to the loaded scene.
 */
export function ModelSlot({ name, children, onScene }: { name: ModelName; children: ReactNode; onScene?: (scene: Object3D) => ReactNode }) {
  const url = modelUrl(name);
  if (!url) return <>{children}</>;
  return (
    <ModelBoundary name={name} fallback={children}>
      <Suspense fallback={null}>
        <CustomScene url={url} onScene={onScene} />
      </Suspense>
    </ModelBoundary>
  );
}

/* ───────────── instanced assets (scenery) ───────────── */

export interface PropAssetData {
  geometry: BufferGeometry;
  material: Material | Material[];
  custom: boolean;
}

function BuiltInAsset({ build, children }: { build: () => Omit<PropAssetData, "custom">; children: (a: PropAssetData) => ReactNode }) {
  // `build` is a stable factory; build once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const asset = useMemo(() => ({ ...build(), custom: false }), []);
  useEffect(
    () => () => {
      asset.geometry.dispose();
      (Array.isArray(asset.material) ? asset.material : [asset.material]).forEach((m) => m.dispose());
    },
    [asset],
  );
  return <>{children(asset)}</>;
}

function CustomAsset({
  url,
  sway,
  reveal,
  children,
}: {
  url: string;
  sway: number;
  reveal: boolean;
  children: (a: PropAssetData) => ReactNode;
}) {
  const { scene } = useGLTF(url);
  const asset = useMemo(() => {
    const merged = mergeGltfScene(scene);
    const mats = merged.materials.map((m) => {
      const c = m.clone();
      return reveal || sway > 0 ? applyReveal(c, { sway, noReveal: !reveal }) : c;
    });
    return { geometry: merged.geometry, material: mats.length === 1 ? mats[0] : mats, custom: true };
  }, [scene, sway, reveal]);
  useEffect(
    () => () => {
      asset.geometry.dispose();
      (Array.isArray(asset.material) ? asset.material : [asset.material]).forEach((m) => m.dispose());
    },
    [asset],
  );
  return <>{children(asset)}</>;
}

/**
 * Geometry + material for an instanced prop. Uses a custom .glb (all meshes
 * merged into one, materials kept) when configured, else the built-in builder.
 */
export function PropAsset({
  name,
  build,
  sway = 0,
  reveal = true,
  children,
}: {
  name: ModelName;
  build: () => Omit<PropAssetData, "custom">;
  sway?: number;
  reveal?: boolean;
  children: (a: PropAssetData) => ReactNode;
}) {
  const url = modelUrl(name);
  const builtIn = <BuiltInAsset build={build}>{children}</BuiltInAsset>;
  if (!url) return builtIn;
  return (
    <ModelBoundary name={name} fallback={builtIn}>
      <Suspense fallback={null}>
        <CustomAsset url={url} sway={sway} reveal={reveal}>
          {children}
        </CustomAsset>
      </Suspense>
    </ModelBoundary>
  );
}
