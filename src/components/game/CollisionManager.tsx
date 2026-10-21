"use client";

import { useFrame } from "@react-three/fiber";
import { getWorld } from "@/lib/world/world";
import { vehicle } from "@/state/runtime";
import { useGame } from "@/state/gameStore";
import { sound } from "@/lib/audio";

/**
 * Destination trigger zones. Runs every frame but only touches the React
 * store when something actually changes (entering/leaving a zone, a new
 * discovery), so the HUD re-renders a handful of times per session.
 *
 * Zones never auto-open a panel: the player gets a prompt and presses E
 * (or taps), and the prompt is withheld while driving past at speed.
 */
export function CollisionManager() {
  useFrame(() => {
    const g = useGame.getState();
    if (g.phase !== "driving") {
      if (g.nearDestination) g.setNear(null, false);
      return;
    }
    const { landmarks } = getWorld();
    let nearId: (typeof landmarks)[number]["id"] | null = null;
    let tooFast = false;
    for (const l of landmarks) {
      const dz = vehicle.position.distanceTo(l.zoneCenter);
      if (dz < l.config.zoneRadius && nearId === null) {
        nearId = l.id;
        tooFast = Math.abs(vehicle.speed) > l.config.maxInteractSpeed;
      }
      if (!g.discovered.includes(l.id) && vehicle.position.distanceTo(l.position) < l.config.discoverRadius) {
        g.discover(l.id);
        sound.chime("discover");
      }
    }
    g.setNear(nearId, tooFast);
  }, -1);
  return null;
}
