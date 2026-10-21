"use client";

import { Component, useCallback, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import type { QualityTier } from "@/config/world";
import { buildWorld, getWorld } from "@/lib/world/world";
import { keys, requests, vehicle } from "@/state/runtime";
import { sound } from "@/lib/audio";
import { useDeviceCapabilities } from "@/hooks/useDeviceCapabilities";
import { useGameControls } from "@/hooks/useGameControls";
import { loadProgress, persistProgress, useGame } from "@/state/gameStore";
import { projectById, sectionOrder, type SectionId } from "@/config/portfolio";
import { travelTo } from "@/lib/travel";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { IntroOverlay } from "@/components/ui/IntroOverlay";
import { MainMenu } from "@/components/ui/MainMenu";
import { SettingsPanel } from "@/components/ui/SettingsPanel";
import { PortfolioPanel } from "@/components/portfolio/PortfolioPanel";
import { PortfolioFallback } from "@/components/portfolio/PortfolioFallback";
import { GameHUD } from "./GameHUD";
import { TouchControls } from "./TouchControls";
import { WorldMapOverlay } from "./WorldMap";
import { Terminal } from "./Terminal";
import { Celebration } from "./Celebration";

const GameCanvas = dynamic(() => import("./GameCanvas"), { ssr: false });

class CanvasBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("3D scene failed:", error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const SOUND_KEY = "portfolio:sound";

type Stage = "boot" | "canvas" | "failed";

export default function GameExperience() {
  const caps = useDeviceCapabilities();
  const quality: QualityTier = caps.lowPower ? "low" : "high";
  const [stage, setStage] = useState<Stage>("boot");
  const [progress, setProgress] = useState(0.35);
  const [curtain, setCurtain] = useState<"up" | "leaving" | "gone">("up");
  const fading = useGame((s) => s.fading);
  useGameControls();

  // Fresh UI state on every mount (e.g. returning from /portfolio).
  useEffect(() => {
    useGame.setState({ phase: "loading", activeSection: null, nearDestination: null, fading: false, helpOpen: false, mapOpen: false, terminalOpen: false, celebrating: false });
    loadProgress();
    const unsubscribe = persistProgress();
    if (process.env.NODE_ENV !== "production") {
      // Dev-only debugging handle.
      (window as unknown as Record<string, unknown>).__game = { vehicle, keys, requests, useGame, getWorld };
    }
    return unsubscribe;
  }, []);

  // Generate the world after the loading screen has painted. (setTimeout, not
  // rAF: rAF is paused in background tabs, which would stall the loader.)
  useEffect(() => {
    if (!caps.webgl) return;
    let t2 = 0;
    const t1 = window.setTimeout(() => {
      setProgress(0.5);
      t2 = window.setTimeout(() => {
        try {
          buildWorld(quality);
          setProgress(0.8);
          setStage("canvas");
        } catch (err) {
          console.error("World generation failed:", err);
          setStage("failed");
        }
      }, 40);
    }, 60);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [caps.webgl, quality]);

  // Sound preference + interaction chimes.
  useEffect(() => {
    try {
      if (localStorage.getItem(SOUND_KEY) === "off") useGame.getState().setSound(false);
    } catch {
      /* storage unavailable */
    }
    sound.setEnabled(useGame.getState().soundOn);
    const unsub = useGame.subscribe((s, prev) => {
      if (s.soundOn !== prev.soundOn) {
        sound.setEnabled(s.soundOn);
        try {
          localStorage.setItem(SOUND_KEY, s.soundOn ? "on" : "off");
        } catch {
          /* ignore */
        }
      }
      if (s.phase !== prev.phase) {
        if (s.phase === "panel") sound.chime("open");
        else if (prev.phase === "panel" && s.phase === "driving") sound.chime("close");
        if (s.phase === "paused") sound.suspend();
        else if (prev.phase === "paused") sound.resume();
      }
    });
    return () => {
      unsub();
      sound.dispose();
    };
  }, []);

  const onReady = useCallback(() => {
    setProgress(1);
    window.setTimeout(() => {
      setCurtain("leaving");
      useGame.getState().setPhase("intro");
      window.setTimeout(() => setCurtain("gone"), 900);
      // Deep links from case-study pages: /?goto=<section>&project=<id>
      const params = new URLSearchParams(window.location.search);
      const goto = params.get("goto") as SectionId | null;
      if (goto && sectionOrder.includes(goto)) {
        const project = projectById(params.get("project"));
        window.setTimeout(() => travelTo(goto, { projectId: project?.destination === goto ? project.id : null }), 700);
        window.history.replaceState(null, "", window.location.pathname);
      }
    }, 450);
  }, []);

  const fail = useCallback(() => setStage("failed"), []);

  if (!caps.webgl || stage === "failed") {
    return (
      <PortfolioFallback
        notice={
          !caps.webgl
            ? "Your browser or device can't run the 3D experience, so here's the classic portfolio instead."
            : "The 3D world couldn't start on this device, so here's the classic portfolio instead."
        }
        showGameLink={false}
      />
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#efd6bf]">
      {stage === "canvas" && (
        <CanvasBoundary onError={fail}>
          <GameCanvas quality={quality} caps={caps} onReady={onReady} onContextLost={fail} />
        </CanvasBoundary>
      )}

      <GameHUD touch={caps.touch} />
      <IntroOverlay touch={caps.touch} />
      {caps.touch && <TouchControls />}
      <PortfolioPanel />
      <MainMenu />
      <SettingsPanel touch={caps.touch} />
      <WorldMapOverlay />
      <Terminal />
      <Celebration />

      <AnimatePresence>
        {fading && (
          <motion.div
            key="fade"
            className="pointer-events-none fixed inset-0 z-[58] bg-paper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.35 } }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          />
        )}
      </AnimatePresence>

      {curtain !== "gone" && <LoadingScreen progress={progress} leaving={curtain === "leaving"} />}
    </div>
  );
}
