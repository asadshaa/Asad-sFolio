import { Quaternion, Vector3 } from "three";
import type { AboutTab, SectionId } from "@/config/portfolio";

/**
 * Mutable per-frame game state. Read and written inside useFrame / event
 * handlers only — never stored in React state, so the render loop never causes
 * React re-renders.
 */

export const keys = {
  forward: false,
  back: false,
  left: false,
  right: false,
  handbrake: false,
};

export const touchInput = {
  /** -1 (right) … +1 (left), matches keyboard steering sign. */
  steer: 0,
  gas: false,
  brake: false,
};

export const vehicle = {
  position: new Vector3(),
  forward: new Vector3(0, 0, 1),
  up: new Vector3(0, 1, 0),
  /** Smoothed visual orientation (terrain-tilted). */
  quaternion: new Quaternion(),
  speed: 0,
  steer: 0,
  /** Lateral acceleration (for body roll) and longitudinal (for pitch). */
  lateral: 0,
  longitudinal: 0,
  wheelSpin: 0,
  /** Smoothed body roll / pitch (radians) for the chassis animation. */
  bodyRoll: 0,
  bodyPitch: 0,
  braking: false,
  offroad: false,
  roadIndex: 0,
  throttle: 0,
  stuckTime: 0,
  /** Seconds since last collision bump (for sound/camera). */
  bump: 0,
  bumpStrength: 0,
  initialized: false,
};

export const requests: {
  reset: boolean;
  teleport: { id: SectionId; projectId?: string | null; tab?: AboutTab } | null;
  /** Jump the camera straight to its target next frame (after teleports). */
  cameraSnap: boolean;
} = {
  reset: false,
  teleport: null,
  cameraSnap: false,
};
