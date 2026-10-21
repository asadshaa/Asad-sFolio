"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Volume2, VolumeX, X } from "lucide-react";
import { useGame } from "@/state/gameStore";

const KEYS: [string[], string][] = [
  [["W", "↑"], "Accelerate"],
  [["S", "↓"], "Brake / reverse"],
  [["A", "←"], "Steer left"],
  [["D", "→"], "Steer right"],
  [["Space"], "Handbrake"],
  [["E"], "Explore a destination"],
  [["R"], "Reset car to the road"],
  [["M"], "World map & fast travel"],
  [["T"], "Change time of day"],
  [["H"], "Honk"],
  [["`"], "Developer terminal"],
  [["Esc"], "Pause menu / close panel"],
];

/** Controls & settings dialog. */
export function SettingsPanel({ touch }: { touch: boolean }) {
  const open = useGame((s) => s.helpOpen);
  const setHelp = useGame((s) => s.setHelp);
  const soundOn = useGame((s) => s.soundOn);
  const toggleSound = useGame((s) => s.toggleSound);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeBtn.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="help"
          className="fixed inset-0 z-[55] grid place-items-center bg-ink/30 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && setHelp(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            initial={{ scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 10 }}
            className="glass w-full max-w-md rounded-[1.75rem] p-6"
          >
            <div className="flex items-center justify-between">
              <h2 id="help-title" className="font-display text-2xl font-bold">
                Controls
              </h2>
              <button
                ref={closeBtn}
                type="button"
                onClick={() => setHelp(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-ink/5 hover:bg-ink/10"
                aria-label="Close controls"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            {touch ? (
              <ul className="mt-4 space-y-2.5 text-ink-soft">
                <li>
                  <strong className="text-ink">Steering wheel</strong> (bottom left) — drag left or right to steer.
                </li>
                <li>
                  <strong className="text-ink">Pedals</strong> (bottom right) — hold <em>Go</em> to accelerate, <em>Brake</em> to slow down or reverse.
                </li>
                <li>
                  <strong className="text-ink">Explore</strong> — tap the prompt when you reach a glowing ring.
                </li>
                <li>
                  <strong className="text-ink">Menu</strong> — jump straight to any destination.
                </li>
              </ul>
            ) : (
              <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2.5">
                {KEYS.map(([k, label]) => (
                  <div key={label} className="contents">
                    <dt className="flex gap-1">
                      {k.map((x) => (
                        <kbd key={x} className="kbd">
                          {x}
                        </kbd>
                      ))}
                    </dt>
                    <dd className="text-ink-soft">{label}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/60 p-3">
              <span className="font-semibold">Sound</span>
              <button
                type="button"
                onClick={toggleSound}
                aria-pressed={soundOn}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper"
              >
                {soundOn ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}
                {soundOn ? "On" : "Off"}
              </button>
            </div>
            <p className="mt-4 text-sm text-ink-soft">Tip: follow the beams of light — each one marks a place to discover.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
