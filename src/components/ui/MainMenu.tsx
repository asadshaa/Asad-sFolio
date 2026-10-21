"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Briefcase, Check, Keyboard, LayoutGrid, Map as MapIcon, MapPin, Play, RotateCcw, Sparkles, SquareTerminal, Sun, Trash2 } from "lucide-react";
import { sectionMeta, sectionOrder } from "@/config/portfolio";
import { DESTINATIONS } from "@/config/world";
import { useGame } from "@/state/gameStore";
import { requests } from "@/state/runtime";
import { travelTo } from "@/lib/travel";

/** Two-step "reset saved progress" control (state resets when the menu closes). */
function ResetProgress() {
  const resetProgress = useGame((s) => s.resetProgress);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-white/40 px-3 py-2 text-xs text-ink-soft">
      <span>Progress is saved on this device.</span>
      {confirm ? (
        <span className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              resetProgress();
              setConfirm(false);
            }}
            className="rounded-full bg-coral px-2.5 py-1 font-semibold text-white"
          >
            Confirm reset
          </button>
          <button type="button" onClick={() => setConfirm(false)} className="rounded-full px-2 py-1 font-semibold hover:bg-ink/5">
            Cancel
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setConfirm(true)} className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold hover:bg-ink/5">
          <Trash2 className="h-3.5 w-3.5" aria-hidden /> Reset progress
        </button>
      )}
    </div>
  );
}

/** Pause menu: resume, travel to any destination, classic view, controls. */
export function MainMenu() {
  const phase = useGame((s) => s.phase);
  const resume = useGame((s) => s.resume);
  const resumePhase = useGame((s) => s.resumePhase);
  const discovered = useGame((s) => s.discovered);
  const setHelp = useGame((s) => s.setHelp);
  const setMap = useGame((s) => s.setMap);
  const setTerminal = useGame((s) => s.setTerminal);
  const timeOfDay = useGame((s) => s.timeOfDay);
  const cycleTime = useGame((s) => s.cycleTimeOfDay);
  const resumeBtn = useRef<HTMLButtonElement>(null);
  const open = phase === "paused";

  useEffect(() => {
    if (open) resumeBtn.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="menu"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-3 backdrop-blur-[3px] sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && resume()}
        >
          <motion.nav
            aria-labelledby="menu-title"
            role="dialog"
            aria-modal="true"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="glass max-h-[94dvh] w-full max-w-sm overflow-y-auto rounded-[1.75rem] p-5"
          >
            <div className="flex items-center justify-between px-1">
              <h2 id="menu-title" className="font-display text-2xl font-bold">
                Paused
              </h2>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
                {discovered.length}/{sectionOrder.length} discovered
              </span>
            </div>

            <button
              ref={resumeBtn}
              type="button"
              onClick={resume}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-coral px-4 py-3.5 font-semibold text-white transition hover:bg-coral/90"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden /> {resumePhase === "panel" ? "Resume" : "Resume driving"}
            </button>

            <p className="mt-5 px-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">Travel to</p>
            <ul className="mt-2 space-y-1.5">
              {sectionOrder.map((id) => {
                const accent = DESTINATIONS.find((d) => d.id === id)?.accent;
                const seen = discovered.includes(id);
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => travelTo(id)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-white/55 px-3 py-2.5 text-left transition hover:bg-white"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-xl text-white" style={{ background: accent }}>
                        {seen ? <Check className="h-4 w-4" aria-hidden /> : <MapPin className="h-4 w-4" aria-hidden />}
                      </span>
                      <span className="flex-1">
                        <span className="block font-semibold leading-tight">{sectionMeta[id].title}</span>
                        <span className="block text-xs text-ink-soft">{sectionMeta[id].place}</span>
                      </span>
                      {seen && <span className="sr-only">(discovered)</span>}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-2 flex gap-2 text-sm font-semibold">
              <button type="button" onClick={() => travelTo("about", { tab: "experience" })} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white/55 px-2 py-2.5 hover:bg-white">
                <Briefcase className="h-4 w-4" aria-hidden /> Experience
              </button>
              <button type="button" onClick={() => travelTo("about", { tab: "skills" })} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white/55 px-2 py-2.5 hover:bg-white">
                <Sparkles className="h-4 w-4" aria-hidden /> Skills
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-sm font-semibold">
              <button
                type="button"
                onClick={() => {
                  resume();
                  setMap(true);
                }}
                className="flex flex-col items-center gap-1 rounded-2xl bg-white/55 px-2 py-3 hover:bg-white"
              >
                <MapIcon className="h-4 w-4" aria-hidden /> Map
              </button>
              <button
                type="button"
                onClick={() => {
                  resume();
                  setTerminal(true);
                }}
                className="flex flex-col items-center gap-1 rounded-2xl bg-white/55 px-2 py-3 hover:bg-white"
              >
                <SquareTerminal className="h-4 w-4" aria-hidden /> Terminal
              </button>
              <button type="button" onClick={cycleTime} className="flex flex-col items-center gap-1 rounded-2xl bg-white/55 px-2 py-3 capitalize hover:bg-white">
                <Sun className="h-4 w-4" aria-hidden /> {timeOfDay}
              </button>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 text-sm font-semibold">
              <Link href="/portfolio" className="flex flex-col items-center gap-1 rounded-2xl bg-white/55 px-2 py-3 text-center hover:bg-white">
                <LayoutGrid className="h-4 w-4" aria-hidden /> Classic view
              </Link>
              <button type="button" onClick={() => setHelp(true)} className="flex flex-col items-center gap-1 rounded-2xl bg-white/55 px-2 py-3 hover:bg-white">
                <Keyboard className="h-4 w-4" aria-hidden /> Controls
              </button>
              <button
                type="button"
                onClick={() => {
                  requests.reset = true;
                  resume();
                }}
                className="flex flex-col items-center gap-1 rounded-2xl bg-white/55 px-2 py-3 hover:bg-white"
              >
                <RotateCcw className="h-4 w-4" aria-hidden /> Reset car
              </button>
            </div>

            <ResetProgress />
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
