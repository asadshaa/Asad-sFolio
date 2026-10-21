"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Brain, Cloud, Code2, Compass, FileText, LayoutGrid, Mail, Palette, Play, User } from "lucide-react";
import { cvLink, profile, sectionMeta, sectionOrder, type SectionId } from "@/config/portfolio";
import { DESTINATIONS } from "@/config/world";
import { travelTo } from "@/lib/travel";
import { displayName } from "@/lib/content";
import { useGame } from "@/state/gameStore";
import { sound } from "@/lib/audio";

const SECTION_ICONS: Record<SectionId, typeof User> = {
  about: User,
  projects: Code2,
  devops: Cloud,
  research: Brain,
  creative: Palette,
  contact: Mail,
};
const accentOf = (id: SectionId) => DESTINATIONS.find((d) => d.id === id)?.accent ?? "#d9472f";

/**
 * Shortcuts for visitors who'd rather not drive (e.g. recruiters): each one
 * flies the camera to that place and opens its panel directly.
 */
function QuickAccess({ variant }: { variant: "card" | "chips" }) {
  const cv = cvLink();
  if (variant === "chips") {
    return (
      <nav aria-label="Jump to a section" className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {sectionOrder.map((id) => {
          const Icon = SECTION_ICONS[id];
          return (
            <button key={id} type="button" onClick={() => travelTo(id)} className="glass inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold text-ink">
              <Icon className="h-4 w-4" style={{ color: accentOf(id) }} aria-hidden /> {sectionMeta[id].title}
            </button>
          );
        })}
      </nav>
    );
  }
  return (
    <nav aria-label="Jump to a section" className="glass pointer-events-auto w-80 rounded-[1.6rem] p-3">
      <p className="px-2 pb-2 pt-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-ink-soft">Quick access — no driving needed</p>
      <ul className="space-y-1">
        {sectionOrder.map((id) => {
          const Icon = SECTION_ICONS[id];
          return (
            <li key={id}>
              <button type="button" onClick={() => travelTo(id)} className="group flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition hover:bg-white/80">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white shadow-sm" style={{ color: accentOf(id) }}>
                  <Icon className="h-[1.05rem] w-[1.05rem]" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-tight text-ink">{sectionMeta[id].title}</span>
                  <span className="block text-xs text-ink-soft">{sectionMeta[id].place}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-ink-soft opacity-0 transition group-hover:opacity-100" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      {cv && (
        <a href={cv} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-ink px-3 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85">
          <FileText className="h-4 w-4" aria-hidden /> Download CV
        </a>
      )}
    </nav>
  );
}

export function IntroOverlay({ touch }: { touch: boolean }) {
  const phase = useGame((s) => s.phase);
  const start = useGame((s) => s.startDriving);
  const name = displayName(profile.name);

  return (
    <AnimatePresence>
      {phase === "intro" && (
        <motion.section
          key="intro"
          aria-labelledby="intro-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] } }}
          exit={{ opacity: 0, y: 16, transition: { duration: 0.35 } }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:justify-start sm:px-10 sm:pb-12"
        >
          <div className="pointer-events-auto max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/70">Full-stack software developer</p>
            <h1 id="intro-title" className="mt-2 font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-ink drop-shadow-[0_2px_12px_rgba(255,255,255,0.6)] sm:text-6xl">
              {name}
            </h1>
            <p className="mt-3 font-display text-xl text-ink/80">{profile.headline}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => {
                  sound.start();
                  start();
                }}
                className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3.5 font-semibold text-white shadow-lg shadow-coral/30 transition hover:-translate-y-0.5 hover:bg-coral/90"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden /> Start Driving
              </button>
              <Link
                href="/portfolio"
                className="glass inline-flex items-center gap-2 rounded-full px-5 py-3.5 font-semibold text-ink transition hover:-translate-y-0.5"
              >
                <LayoutGrid className="h-4 w-4" aria-hidden /> View Portfolio
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-ink/75">
              {!touch && (
                <span className="flex items-center gap-1.5">
                  <span className="kbd">W</span>
                  <span className="kbd">A</span>
                  <span className="kbd">S</span>
                  <span className="kbd">D</span>
                  <span className="ml-1">/ Arrow Keys to Drive</span>
                </span>
              )}
              {touch && <span>Use the on-screen pedals and wheel to drive</span>}
              <span className="flex items-center gap-1.5">
                <Compass className="h-4 w-4" aria-hidden /> Explore to Discover
              </span>
            </div>
            <div className="lg:hidden">
              <QuickAccess variant="chips" />
            </div>
          </div>
        </motion.section>
      )}
      {phase === "intro" && (
        <motion.div
          key="quick"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0, transition: { delay: 0.8, duration: 0.6 } }}
          exit={{ opacity: 0, x: 12, transition: { duration: 0.25 } }}
          className="fixed bottom-12 right-10 z-30 hidden lg:block"
        >
          <QuickAccess variant="card" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
