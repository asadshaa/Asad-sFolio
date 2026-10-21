"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { QUALITY, type QualityTier } from "@/config/world";
import type { DeviceCapabilities } from "@/types/game";
import { useGame } from "@/state/gameStore";
import { Planet } from "./Planet";
import { Road } from "./Road";
import { Vehicle } from "./Vehicle";
import { FollowCamera } from "./FollowCamera";
import { Environment } from "./Environment";
import { WorldStreaming } from "./WorldStreaming";
import { Destinations } from "./Destination";
import { CollisionManager } from "./CollisionManager";
import { Tokens } from "./Tokens";

/** Dev-only: expose the R3F store for manual frame stepping / profiling. */
function DevHandle() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __game?: Record<string, unknown> };
    w.__game = { ...(w.__game ?? {}), r3f: get };
  }, [get]);
  return null;
}

function FirstFrame({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    frames.current++;
    // Wait a few frames so shaders are compiled before the curtain lifts.
    if (frames.current > 3) {
      done.current = true;
      onReady();
    }
  });
  return null;
}

interface Props {
  quality: QualityTier;
  caps: DeviceCapabilities;
  onReady: () => void;
  onContextLost: () => void;
}

export default function GameCanvas({ quality, caps, onReady, onContextLost }: Props) {
  const q = QUALITY[quality];
  const [dpr, setDpr] = useState(q.dpr[1]);
  const shadows = true;
  const setLowFpsHint = useGame((s) => s.setLowFpsHint);

  return (
    <Canvas
      className="!fixed inset-0 touch-none"
      shadows={shadows ? "percentage" : false}
      dpr={dpr}
      camera={{ fov: 55, near: 0.1, far: 1200, position: [0, 90, 10] }}
      gl={{ antialias: true, powerPreference: "high-performance", stencil: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.02;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onContextLost();
        });
      }}
      aria-hidden
      tabIndex={-1}
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(q.dpr[0], d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(q.dpr[1], d + 0.25))}
        flipflops={3}
        onFallback={() => {
          setDpr(1);
          setLowFpsHint(true);
        }}
      />
      <Environment shadows={shadows} shadowMap={q.shadowMap} reducedMotion={caps.reducedMotion} lowPower={caps.lowPower} />
      <Planet />
      <Road />
      <WorldStreaming shadows={shadows} />
      <Destinations />
      <Tokens reducedMotion={caps.reducedMotion} />
      <Vehicle />
      <CollisionManager />
      <FollowCamera reducedMotion={caps.reducedMotion} />
      <FirstFrame onReady={onReady} />
      <DevHandle />
    </Canvas>
  );
}
