"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Cloud, GraduationCap, Hammer, Wrench } from "lucide-react";
import { journey } from "@/config/portfolio";
import { useGame } from "@/state/gameStore";

const ICONS = [GraduationCap, Hammer, Wrench, Cloud];

/** Interactive four-stop career journey (state shared with the milestone posts in the 3D world). */
export function JourneyStepper() {
  const stop = useGame((s) => s.journeyStop);
  const setStop = useGame((s) => s.setJourneyStop);
  const reduce = useReducedMotion();
  const current = journey[stop] ?? journey[0];
  const Icon = ICONS[stop] ?? GraduationCap;

  return (
    <div className="rounded-3xl border border-ink/8 bg-white/65 p-5">
      {/* progress rail */}
      <div className="relative" role="tablist" aria-label="Career journey">
        <div aria-hidden className="absolute left-4 right-4 top-4 h-0.5 bg-ink/10" />
        <div aria-hidden className="absolute left-4 top-4 h-0.5 bg-coral transition-all duration-500" style={{ width: `calc(${(stop / (journey.length - 1)) * 100}% - ${(stop / (journey.length - 1)) * 2}rem)` }} />
        <div className="relative flex justify-between">
          {journey.map((j, i) => {
            const StepIcon = ICONS[i] ?? GraduationCap;
            const on = i === stop;
            return (
              <button
                key={j.id}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls="journey-panel"
                onClick={() => setStop(i)}
                className="flex w-16 flex-col items-center gap-1.5 text-center"
              >
                <span className={`grid h-8 w-8 place-items-center rounded-full border-2 transition ${i <= stop ? "border-coral bg-coral text-white" : "border-ink/15 bg-paper text-ink-soft"} ${on ? "scale-110 shadow-md" : ""}`}>
                  <StepIcon className="h-4 w-4" aria-hidden />
                </span>
                <span className={`text-[0.65rem] font-semibold leading-tight ${on ? "text-ink" : "text-ink-soft"}`}>{j.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div id="journey-panel" role="tabpanel" className="mt-5 min-h-[9.5rem]" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">
              Stop {stop + 1} of {journey.length} · {current.title}
            </p>
            <h3 className="mt-1 flex items-center gap-2 font-display text-2xl font-bold">
              <Icon className="h-5 w-5 text-coral" aria-hidden /> {current.subtitle}
            </h3>
            <p className="mt-2 leading-relaxed">{current.text}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {current.tags.map((t) => (
                <li key={t} className="rounded-full bg-ink/5 px-2.5 py-0.5 text-xs font-medium text-ink-soft">
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex justify-between">
        <button type="button" onClick={() => setStop(Math.max(0, stop - 1))} disabled={stop === 0} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-ink/5 disabled:opacity-30">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Previous
        </button>
        <button
          type="button"
          onClick={() => setStop(Math.min(journey.length - 1, stop + 1))}
          disabled={stop === journey.length - 1}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink/85 disabled:opacity-30"
        >
          Next stop <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/** Static version for the classic page (all stops visible, indexable). */
export function JourneyList() {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {journey.map((j, i) => {
        const Icon = ICONS[i] ?? GraduationCap;
        return (
          <li key={j.id} className="rounded-3xl border border-ink/8 bg-white/70 p-5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-coral text-white">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <p className="mt-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-coral">Stop {i + 1} · {j.title}</p>
            <h3 className="font-display text-lg font-bold leading-snug">{j.subtitle}</h3>
            <p className="mt-2 text-sm leading-relaxed">{j.text}</p>
          </li>
        );
      })}
    </ol>
  );
}
