"use client";

import { useEffect } from "react";
import { keys, requests } from "@/state/runtime";
import { useGame } from "@/state/gameStore";
import { sound } from "@/lib/audio";

const DRIVE_CODES: Record<string, keyof typeof keys> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "handbrake",
};

function isTextInput(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

/** A control the user deliberately reached with the keyboard (Tab). */
function isKeyboardFocusedControl(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  if (!["BUTTON", "A", "SUMMARY"].includes(el.tagName)) return false;
  try {
    return el.matches(":focus-visible");
  } catch {
    return true;
  }
}

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA"];

function clearKeys() {
  keys.forward = keys.back = keys.left = keys.right = keys.handbrake = false;
}

/**
 * Global keyboard handling. Driving keys are only captured (and only prevent
 * page scrolling) while the game is actually in the driving / intro phase, so
 * keyboard navigation of the panels and menus keeps working normally.
 */
export function useGameControls() {
  useEffect(() => {
    let konami = 0;
    const onDown = (e: KeyboardEvent) => {
      const g = useGame.getState();
      const { phase } = g;

      // Developer terminal toggle works even while typing in it.
      if (e.code === "Backquote" && phase !== "loading") {
        e.preventDefault();
        g.setTerminal(!g.terminalOpen);
        return;
      }
      if (isTextInput(e.target)) return;

      // Easter egg: the Konami code.
      konami = e.code === KONAMI[konami] ? konami + 1 : e.code === KONAMI[0] ? 1 : 0;
      if (konami === KONAMI.length) {
        konami = 0;
        g.findEgg("konami");
        sound.chime("discover");
      }

      if (e.code === "Escape") {
        if (g.terminalOpen) return g.setTerminal(false);
        if (g.mapOpen) return g.setMap(false);
        if (g.helpOpen) return g.setHelp(false);
        if (phase === "panel") return g.closeSection();
        if (phase === "paused") return g.resume();
        if (phase === "driving") return g.pause();
        return;
      }

      const driveKey = DRIVE_CODES[e.code];
      const gameActive = (phase === "driving" || phase === "intro") && !g.mapOpen && !g.terminalOpen;

      if (driveKey && gameActive) {
        // Let Space/arrow keys operate a control the user tabbed to.
        if (isKeyboardFocusedControl(e.target) && (e.code === "Space" || e.code.startsWith("Arrow"))) return;
        e.preventDefault();
        if (phase === "intro" && driveKey !== "handbrake") {
          g.startDriving();
          sound.start();
        }
        keys[driveKey] = true;
        return;
      }

      if (phase !== "driving" || e.repeat) return;
      if (e.code === "KeyE" || e.code === "Enter") {
        if (e.code === "Enter" && isKeyboardFocusedControl(e.target)) return;
        if (g.nearDestination && !g.nearTooFast) {
          e.preventDefault();
          g.openSection(g.nearDestination);
        }
      } else if (e.code === "KeyR") {
        requests.reset = true;
      } else if (e.code === "KeyM") {
        g.setMap(!g.mapOpen);
      } else if (e.code === "KeyT") {
        g.cycleTimeOfDay();
      } else if (e.code === "KeyH") {
        sound.honk();
        g.findEgg("honk");
      }
    };

    const onUp = (e: KeyboardEvent) => {
      const driveKey = DRIVE_CODES[e.code];
      if (driveKey) keys[driveKey] = false;
    };

    const onBlur = () => clearKeys();
    const onVisibility = () => {
      if (document.hidden) {
        clearKeys();
        if (useGame.getState().phase === "driving") useGame.getState().pause();
      }
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      clearKeys();
    };
  }, []);

  // Clear any held keys whenever we leave the driving phase.
  useEffect(
    () =>
      useGame.subscribe((s, prev) => {
        if (s.phase !== prev.phase && s.phase !== "driving") clearKeys();
        if ((s.mapOpen && !prev.mapOpen) || (s.terminalOpen && !prev.terminalOpen)) clearKeys();
      }),
    [],
  );
}
