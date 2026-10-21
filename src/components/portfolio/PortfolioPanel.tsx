"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Car, X } from "lucide-react";
import { gameCopy, sectionMeta, sectionOrder, type SectionId } from "@/config/portfolio";
import { DESTINATIONS } from "@/config/world";
import { useGame } from "@/state/gameStore";
import { travelTo } from "@/lib/travel";
import { AboutPanel } from "./AboutPanel";
import { ProjectBrowser } from "./ProjectBrowser";
import { ContactSection } from "./ContactSection";
import { readableAccent } from "@/lib/color";

function Body({ id }: { id: SectionId }) {
  switch (id) {
    case "about":
      return <AboutPanel />;
    case "projects":
      return <ProjectBrowser section="projects" intro={sectionMeta.projects.intro} />;
    case "devops":
      return (
        <ProjectBrowser section="devops" intro={sectionMeta.devops.intro} />
      );
    case "research":
      return <ProjectBrowser section="research" intro={sectionMeta.research.intro} />;
    case "creative":
      return <ProjectBrowser section="creative" intro={sectionMeta.creative.intro} />;
    case "contact":
      return <ContactSection />;
  }
}

/**
 * Portfolio panel shown beside the 3D scene when a destination is opened.
 * Desktop: right-hand sheet. Mobile: bottom sheet. The scene keeps rendering
 * (framed by the destination camera) in the uncovered area.
 */
export function PortfolioPanel() {
  const active = useGame((s) => s.activeSection);
  const phase = useGame((s) => s.phase);
  const close = useGame((s) => s.closeSection);
  const reduce = useReducedMotion();
  const heading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const open = active !== null && (phase === "panel" || phase === "paused");

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => heading.current?.focus({ preventScroll: true }), 60);
    return () => {
      window.clearTimeout(t);
      returnFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open, active]);

  const idx = active ? sectionOrder.indexOf(active) : -1;
  const nextId = idx >= 0 ? sectionOrder[(idx + 1) % sectionOrder.length] : null;
  const accent = DESTINATIONS.find((d) => d.id === active)?.accent ?? "#d9472f";

  return (
    <AnimatePresence>
      {open && active && (
        <motion.aside
          key="panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="panel-title"
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 40, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: 40 }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="glass fixed inset-x-2 bottom-2 z-40 flex max-h-[64dvh] flex-col overflow-hidden rounded-[1.75rem] md:inset-x-auto md:bottom-4 md:right-4 md:top-20 md:max-h-none md:w-[min(560px,46vw)]"
        >
          <header className="relative shrink-0 px-6 pb-4 pt-6">
            <div aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: accent }} />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em]" style={{ color: readableAccent(accent) }}>
                  {sectionMeta[active].place}
                </p>
                <h2 id="panel-title" ref={heading} tabIndex={-1} className="mt-1 font-display text-3xl font-bold tracking-tight outline-none">
                  {sectionMeta[active].title}
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink/5 text-ink transition hover:bg-ink/10"
                aria-label="Close panel and return to driving"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </header>
          <div className="scroll-soft min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <Body id={active} />
          </div>
          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-ink/8 bg-white/40 px-5 py-3">
            <button
              type="button"
              onClick={close}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink/85"
            >
              <Car className="h-4 w-4" aria-hidden /> {gameCopy.returnPrompt}
              <span className="kbd ml-1 hidden !bg-white/20 !text-paper !shadow-none md:inline-flex">Esc</span>
            </button>
            {nextId && (
              <button
                type="button"
                onClick={() => travelTo(nextId)}
                className="inline-flex items-center gap-1.5 truncate rounded-full px-3 py-2 text-sm font-semibold text-ink-soft transition hover:bg-ink/5 hover:text-ink"
              >
                Next: {sectionMeta[nextId].title} <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            )}
          </footer>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
