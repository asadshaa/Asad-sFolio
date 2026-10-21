"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleHelp, Egg, Hexagon, Map as MapIcon, Menu, Navigation, Sparkles, Volume2, VolumeX } from "lucide-react";
import { gameCopy, profile, sectionMeta, sectionOrder, type SectionId } from "@/config/portfolio";
import { DESTINATIONS, VEHICLE } from "@/config/world";
import { displayName } from "@/lib/content";
import { getWorld } from "@/lib/world/world";
import { vehicle } from "@/state/runtime";
import { useGame, type EasterEgg } from "@/state/gameStore";
import { MiniMap } from "./WorldMap";
import { Vector3 } from "three";
import { textOn } from "@/lib/color";

const accentOf = (id: SectionId) => DESTINATIONS.find((d) => d.id === id)?.accent ?? "#d9472f";

function IconButton({ label, onClick, children, pressed }: { label: string; onClick: () => void; children: React.ReactNode; pressed?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className="glass grid h-11 w-11 place-items-center rounded-full text-ink transition hover:scale-105 active:scale-95"
    >
      {children}
    </button>
  );
}

/** Live compass + speedometer, updated straight to the DOM (no React re-renders per frame). */
function useLiveReadouts(enabled: boolean) {
  const arrow = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const dist = useRef<HTMLSpanElement>(null);
  const speed = useRef<HTMLSpanElement>(null);
  const compass = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const to = new Vector3();
    const left = new Vector3();
    let lastTarget = "";
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (speed.current) speed.current.textContent = String(Math.round(Math.abs(vehicle.speed) * VEHICLE.speedoFactor));
      const { discovered } = useGame.getState();
      const { landmarks } = getWorld();
      let best: (typeof landmarks)[number] | null = null;
      let bestD = Infinity;
      for (const l of landmarks) {
        if (discovered.includes(l.id)) continue;
        const d = l.position.distanceTo(vehicle.position);
        if (d < bestD) {
          bestD = d;
          best = l;
        }
      }
      if (compass.current) compass.current.style.display = best ? "flex" : "none";
      if (!best) return;
      to.subVectors(best.position, vehicle.position);
      to.addScaledVector(vehicle.up, -to.dot(vehicle.up));
      left.crossVectors(vehicle.up, vehicle.forward);
      const angle = Math.atan2(to.dot(left), to.dot(vehicle.forward));
      if (arrow.current) arrow.current.style.transform = `rotate(${(-angle * 180) / Math.PI}deg)`;
      if (dist.current) dist.current.textContent = `${Math.round(bestD)} m`;
      if (label.current && lastTarget !== best.id) {
        lastTarget = best.id;
        label.current.textContent = sectionMeta[best.id].place;
        if (arrow.current) arrow.current.style.color = accentOf(best.id);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  return { arrow, label, dist, speed, compass };
}

const EGG_TEXT: Record<EasterEgg, string> = {
  honk: "Beep beep — you found the horn (H).",
  konami: "Konami code! Gold paint unlocked.",
  sudo: "sudo access granted… to more exploring.",
  "hidden-token": "You found a hidden token off the beaten path.",
  "night-drive": "Night drive — the lamps are on.",
};

/** One toast slot showing the most recent discovery / token / easter egg. */
function Toasts() {
  const lastDiscovery = useGame((s) => s.lastDiscovery);
  const lastToken = useGame((s) => s.lastToken);
  const lastEgg = useGame((s) => s.lastEgg);
  const tokenCount = useGame((s) => s.tokens.length);
  const [hidden, setHidden] = useState<number | null>(null);
  const items = [
    lastDiscovery && { at: lastDiscovery.at, color: accentOf(lastDiscovery.id), icon: Sparkles, text: <><span className="font-semibold">{gameCopy.discovered}:</span> {sectionMeta[lastDiscovery.id].place}</> },
    lastToken && { at: lastToken.at, color: "#e0a42c", icon: Hexagon, text: <><span className="font-semibold">Engineering token</span> · {tokenCount}/{getWorld().tokens.length}</> },
    lastEgg && { at: lastEgg.at, color: "#7a5af0", icon: Egg, text: <><span className="font-semibold">Easter egg:</span> {EGG_TEXT[lastEgg.id]}</> },
  ].filter(Boolean) as { at: number; color: string; icon: typeof Sparkles; text: React.ReactNode }[];
  const last = items.sort((a, b) => b.at - a.at)[0];
  const lastAt = last?.at ?? null;
  useEffect(() => {
    if (lastAt === null) return;
    const t = window.setTimeout(() => setHidden(lastAt), 3200);
    return () => window.clearTimeout(t);
  }, [lastAt]);
  const show = last && hidden !== last.at;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-30 flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {show && (
          <motion.div
            key={last.at}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass flex items-center gap-3 rounded-full py-2 pl-2 pr-5"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: last.color, color: textOn(last.color) }}>
              <last.icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-sm">{last.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** One-time "follow the road" hint shown for a few seconds after driving starts. */
function DrivingHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let shown = false;
    let timer = 0;
    const unsub = useGame.subscribe((st, prev) => {
      if (!shown && st.phase === "driving" && prev.phase === "intro") {
        shown = true;
        setShow(true);
        timer = window.setTimeout(() => setShow(false), 5000);
      }
    });
    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-20 flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {show && (
          <motion.p
            key="hint"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="glass rounded-full px-5 py-2 text-sm font-semibold"
          >
            {gameCopy.drivingHint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function GameHUD({ touch }: { touch: boolean }) {
  const phase = useGame((s) => s.phase);
  const soundOn = useGame((s) => s.soundOn);
  const toggleSound = useGame((s) => s.toggleSound);
  const pause = useGame((s) => s.pause);
  const setHelp = useGame((s) => s.setHelp);
  const near = useGame((s) => s.nearDestination);
  const tooFast = useGame((s) => s.nearTooFast);
  const openSection = useGame((s) => s.openSection);
  const discovered = useGame((s) => s.discovered);
  const tokens = useGame((s) => s.tokens.length);
  const setMap = useGame((s) => s.setMap);
  const stuck = useGame((s) => s.stuckHint);
  const lowFps = useGame((s) => s.lowFpsHint);
  const setLowFps = useGame((s) => s.setLowFpsHint);
  useEffect(() => {
    if (!lowFps) return;
    const t = window.setTimeout(() => setLowFps(false), 9000);
    return () => window.clearTimeout(t);
  }, [lowFps, setLowFps]);
  const driving = phase === "driving";
  const { arrow, label, dist, speed, compass } = useLiveReadouts(driving);
  const name = displayName(profile.name);

  if (phase === "loading") return null;

  return (
    <>
      {/* top bar */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-5">
        <div className="glass pointer-events-auto flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-display text-xs font-bold text-paper">{profile.initials}</span>
          <span className="leading-tight">
            <span className="hidden font-display text-sm font-bold sm:block">{name}</span>
            <span className="hidden text-[0.7rem] text-ink-soft sm:block">{profile.headline}</span>
          </span>
        </div>
        <div className="pointer-events-auto flex gap-1.5 sm:gap-2">
          <IconButton label="World map and fast travel (M)" onClick={() => setMap(true)}>
            <MapIcon className="h-5 w-5" aria-hidden />
          </IconButton>
          <IconButton label={soundOn ? "Mute sound" : "Unmute sound"} onClick={toggleSound} pressed={!soundOn}>
            {soundOn ? <Volume2 className="h-5 w-5" aria-hidden /> : <VolumeX className="h-5 w-5" aria-hidden />}
          </IconButton>
          <IconButton label="Controls and help" onClick={() => setHelp(true)}>
            <CircleHelp className="h-5 w-5" aria-hidden />
          </IconButton>
          <button
            type="button"
            onClick={pause}
            aria-label="Open menu and sections"
            className="glass flex h-11 items-center gap-2 rounded-full px-3.5 text-ink transition hover:scale-[1.03] active:scale-95"
          >
            <Menu className="h-5 w-5" aria-hidden />
            <span className="hidden text-sm font-semibold sm:inline">Sections</span>
          </button>
        </div>
      </header>

      <Toasts />
      <DrivingHint />

      {/* bottom-left: discoveries + compass */}
      {(driving || phase === "paused") && (
        <div
          className={`pointer-events-none fixed z-30 flex flex-col gap-2 ${
            touch ? "left-1/2 top-[4.5rem] -translate-x-1/2 items-center" : "bottom-5 left-5 items-start"
          }`}
        >
          <div className="glass flex items-center gap-1.5 rounded-full px-3 py-2" aria-label={`${discovered.length} of ${sectionOrder.length} places discovered`}>
            {sectionOrder.map((id) => (
              <span
                key={id}
                title={sectionMeta[id].place}
                className="h-2.5 w-2.5 rounded-full transition-all"
                style={{ background: discovered.includes(id) ? accentOf(id) : "rgb(29 34 48 / 0.15)" }}
              />
            ))}
            <span className="ml-1.5 text-xs font-semibold text-ink-soft">
              {discovered.length}/{sectionOrder.length}
            </span>
            <span aria-hidden className="mx-1 h-3 w-px bg-ink/15" />
            <Hexagon className="h-3.5 w-3.5 text-[#e0a42c]" aria-hidden />
            <span className="text-xs font-semibold text-ink-soft" aria-label={`${tokens} tokens collected`}>
              {tokens}
            </span>
          </div>
          <div ref={compass} className="glass flex items-center gap-2 rounded-full py-1.5 pl-2 pr-4 transition-opacity" aria-hidden>
            <span ref={arrow} className="grid h-7 w-7 place-items-center rounded-full bg-white/80 will-change-transform">
              <Navigation className="h-4 w-4 fill-current" />
            </span>
            <span className="text-xs leading-tight">
              <span className="block font-semibold" ref={label} />
              <span className="block text-ink-soft" ref={dist} />
            </span>
          </div>
          {!touch && <MiniMap />}
        </div>
      )}

      {/* bottom-right: speedometer (desktop) */}
      {driving && !touch && (
        <div className="glass-dark pointer-events-none fixed bottom-5 right-5 z-30 flex items-baseline gap-1.5 rounded-2xl px-4 py-2.5" aria-hidden>
          <span ref={speed} className="font-display text-3xl font-bold tabular-nums">
            0
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider opacity-70">km/h</span>
        </div>
      )}

      {/* interaction prompt */}
      <div className={`pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4 ${touch ? "bottom-40" : "bottom-8"}`}>
        <AnimatePresence>
          {driving && near && (
            <motion.div
              key={near + String(tooFast)}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6 }}
            >
              {tooFast ? (
                <div className="glass-dark rounded-full px-5 py-2.5 text-sm font-semibold" role="status">
                  Slow down to explore {sectionMeta[near].place}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openSection(near)}
                  className="glass pointer-events-auto flex items-center gap-3 rounded-full py-2 pl-2 pr-5 text-left shadow-xl"
                >
                  <span className="grid h-10 min-w-10 place-items-center rounded-full px-2 font-display font-bold" style={{ background: accentOf(near), color: textOn(accentOf(near)) }}>
                    {touch ? <Sparkles className="h-4 w-4" aria-hidden /> : "E"}
                  </span>
                  <span>
                    <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                      {touch ? gameCopy.promptTouch : gameCopy.prompt}
                    </span>
                    <span className="block font-display text-lg font-bold leading-tight">
                      {sectionMeta[near].place} · {sectionMeta[near].title}
                    </span>
                  </span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* hints */}
      <div className="pointer-events-none fixed inset-x-0 bottom-28 z-20 flex flex-col items-center gap-2 px-4" aria-live="polite">
        {driving && stuck && (
          <div className="glass-dark rounded-full px-4 py-2 text-sm font-medium">
            Stuck? {touch ? "Open the menu and choose Reset car." : "Press R to put the car back on the road."}
          </div>
        )}
        {lowFps && (
          <a href="/portfolio" className="glass pointer-events-auto rounded-full px-4 py-2 text-sm font-medium">
            Running slowly? Switch to the classic portfolio →
          </a>
        )}
      </div>
    </>
  );
}
