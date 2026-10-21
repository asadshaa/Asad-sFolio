"use client";

import { useState } from "react";
import type { DeviceCapabilities } from "@/types/game";

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    const ok = !!gl;
    // Release the probe context right away.
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

export function detectCapabilities(): DeviceCapabilities {
  if (typeof window === "undefined") {
    return { checked: false, webgl: false, touch: false, reducedMotion: false, lowPower: false };
  }
  const touch = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 1;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 600;
  const lowPower = touch || smallScreen || cores <= 4 || memory <= 4;
  return { checked: true, webgl: detectWebGL(), touch, reducedMotion, lowPower };
}

/** Client-only (the game shell is loaded with ssr:false), so detection runs in the initializer. */
export function useDeviceCapabilities(): DeviceCapabilities {
  const [caps] = useState(detectCapabilities);
  return caps;
}
