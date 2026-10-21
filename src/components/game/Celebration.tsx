"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Car, Flag, Mail } from "lucide-react";
import { sectionOrder } from "@/config/portfolio";
import { getWorld } from "@/lib/world/world";
import { travelTo } from "@/lib/travel";
import { sound } from "@/lib/audio";
import { useGame } from "@/state/gameStore";

/** Shown once, when every major location has been discovered. */
export function Celebration() {
  const on = useGame((s) => s.celebrating);
  const setOn = useGame((s) => s.setCelebrating);
  const tokens = useGame((s) => s.tokens.length);
  const eggs = useGame((s) => s.eggs.length);
  const primary = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!on) return;
    sound.fanfare();
    const t = window.setTimeout(() => primary.current?.focus(), 300);
    return () => window.clearTimeout(t);
  }, [on]);

  let totalTokens = 0;
  try {
    totalTokens = getWorld().tokens.length;
  } catch {
    /* world not ready */
  }

  return (
    <AnimatePresence>
      {on && (
        <motion.div key="celebrate" className="fixed inset-0 z-[57] grid place-items-center bg-ink/25 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="celebrate-title"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass relative w-full max-w-md rounded-[2rem] p-7 text-center"
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ink text-paper">
              <Flag className="h-5 w-5" aria-hidden />
            </span>
            <h2 id="celebrate-title" className="mt-4 font-display text-2xl font-bold">
              All {sectionOrder.length} places visited
            </h2>
            <p className="mt-2 text-ink-soft">Thanks for exploring. If something here caught your interest, I&apos;d be glad to talk.</p>
            <p className="mt-3 text-sm font-semibold text-ink">
              {tokens}/{totalTokens} tokens · {eggs} easter egg{eggs === 1 ? "" : "s"}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                ref={primary}
                type="button"
                onClick={() => {
                  setOn(false);
                  travelTo("contact");
                }}
                className="inline-flex items-center gap-2 rounded-full bg-coral px-5 py-3 font-semibold text-white hover:bg-coral/90"
              >
                <Mail className="h-4 w-4" aria-hidden /> Contact & CV
              </button>
              <button type="button" onClick={() => setOn(false)} className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-5 py-3 font-semibold hover:bg-ink/10">
                <Car className="h-4 w-4" aria-hidden /> Keep driving
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
