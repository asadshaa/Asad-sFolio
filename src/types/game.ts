import type { SectionId } from "@/config/portfolio";

export type GamePhase = "loading" | "intro" | "driving" | "paused" | "panel";

export type CameraMode = "intro" | "follow" | "destination";

export interface DeviceCapabilities {
  checked: boolean;
  webgl: boolean;
  touch: boolean;
  reducedMotion: boolean;
  lowPower: boolean;
}

export type { SectionId };
