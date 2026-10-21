import type { SectionId } from "./portfolio";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  3D MODEL OVERRIDES
 *
 *  Every model in the world is built in code. To replace one with your own:
 *   1. Start from the exported original in /assets/models/<name>.glb
 *      (regenerate them any time at http://localhost:3000/dev/models).
 *   2. Edit it in Blender (or any glTF tool) and export as .glb.
 *   3. Put the file in /public/models/ and point the name at it below, e.g.
 *        car: "/models/car.glb",
 *
 *  If a file is missing or fails to load, the built-in model is used instead.
 *  See README → "Editing the 3D models" for scale, origin and naming rules.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const MODEL_OVERRIDES: Partial<Record<ModelName, string>> = {
  // car: "/models/car.glb",
  // "landmark-home": "/models/landmark-home.glb",
  // "tree-pine": "/models/tree-pine.glb",
};

export type ModelName =
  | "car"
  | "landmark-home"
  | "landmark-garage"
  | "landmark-cloud"
  | "landmark-research"
  | "landmark-creative"
  | "landmark-lighthouse"
  | "tree-pine"
  | "tree-broadleaf"
  | "rock"
  | "grass-tuft"
  | "flower"
  | "street-lamp"
  | "road-post"
  | "cloud"
  | "token";

export const LANDMARK_MODEL: Record<SectionId, ModelName> = {
  about: "landmark-home",
  projects: "landmark-garage",
  devops: "landmark-cloud",
  research: "landmark-research",
  creative: "landmark-creative",
  contact: "landmark-lighthouse",
};

export const modelUrl = (name: ModelName): string | null => MODEL_OVERRIDES[name] ?? null;
