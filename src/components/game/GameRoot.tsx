"use client";

import dynamic from "next/dynamic";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

/**
 * Client entry for the game. Everything that touches WebGL/window is loaded
 * lazily and never rendered on the server.
 */
const GameExperience = dynamic(() => import("./GameExperience"), {
  ssr: false,
  loading: () => <LoadingScreen progress={0.15} />,
});

export function GameRoot() {
  return <GameExperience />;
}
