import type { AboutTab, SectionId } from "@/config/portfolio";
import { requests } from "@/state/runtime";
import { useGame } from "@/state/gameStore";
import { sound } from "@/lib/audio";

let busy = false;

/**
 * Fade out, move the car to a destination, open its panel, fade back in.
 * If the visitor is already parked at that destination, the panel just switches.
 * Called from menus, the map and the terminal — always inside a user gesture.
 */
export function travelTo(id: SectionId, opts: { projectId?: string | null; tab?: AboutTab } = {}) {
  const g = useGame.getState();
  if (busy || g.phase === "loading") return;
  sound.start();
  g.setHelp(false);
  g.setMap(false);
  if ((g.phase === "panel" && g.activeSection === id) || g.nearDestination === id) {
    g.openSection(id, opts);
    return;
  }
  busy = true;
  g.setFading(true);
  window.setTimeout(() => {
    requests.teleport = { id, ...opts };
    window.setTimeout(() => {
      useGame.getState().setFading(false);
      busy = false;
    }, 220);
  }, 380);
}
