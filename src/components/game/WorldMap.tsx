"use client";

import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, MapPin, X } from "lucide-react";
import { sectionMeta, sectionOrder } from "@/config/portfolio";
import { DESTINATIONS, TOKENS } from "@/config/world";
import { getWorld } from "@/lib/world/world";
import { travelTo } from "@/lib/travel";
import { vehicle } from "@/state/runtime";
import { useGame } from "@/state/gameStore";

/* Equirectangular projection of the planet: the road loop becomes a winding band. */
const W = 360;
const H = 150;
const LAT = 0.8;

let seam: number | null = null;
/** Longitude offset that puts the map's wrap-around seam in the widest gap between landmarks. */
function seamOffset() {
  if (seam !== null) return seam;
  const lons = getWorld()
    .landmarks.map((l) => Math.atan2(l.position.z, l.position.x))
    .sort((a, b) => a - b);
  let best = 0;
  let gap = -1;
  lons.forEach((a, i) => {
    const b = i === lons.length - 1 ? lons[0] + Math.PI * 2 : lons[i + 1];
    if (b - a > gap) {
      gap = b - a;
      best = (a + b) / 2;
    }
  });
  seam = best;
  return seam;
}

function project(x: number, y: number, z: number): [number, number] {
  const len = Math.hypot(x, y, z) || 1;
  let lon = Math.atan2(z / len, x / len) - seamOffset() - Math.PI;
  lon = ((((lon + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  const lat = Math.asin(Math.max(-1, Math.min(1, y / len)));
  return [((lon + Math.PI) / (Math.PI * 2)) * W, ((LAT - lat) / (2 * LAT)) * H];
}

function useRoadPath() {
  return useMemo(() => {
    const { road } = getWorld();
    let d = "";
    let prev: [number, number] | null = null;
    for (let i = 0; i <= road.count; i += 4) {
      const k = i % road.count;
      const p = project(road.dirs[k * 3], road.dirs[k * 3 + 1], road.dirs[k * 3 + 2]);
      d += !prev || Math.abs(p[0] - prev[0]) > W / 2 ? `M${p[0].toFixed(1)} ${p[1].toFixed(1)}` : `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
      prev = p;
    }
    return d;
  }, []);
}

/** Car marker updated every frame straight to the DOM. */
function useCarMarker(enabled: boolean) {
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const p = vehicle.position;
      const [x, y] = project(p.x, p.y, p.z);
      const a = vehicle.forward;
      const [x2, y2] = project(p.x + a.x * 4, p.y + a.y * 4, p.z + a.z * 4);
      let dx = x2 - x;
      if (Math.abs(dx) > W / 2) dx -= Math.sign(dx) * W;
      const ang = (Math.atan2(y2 - y, dx) * 180) / Math.PI;
      ref.current?.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);
  return ref;
}

function MapSvg({ interactive, className }: { interactive: boolean; className?: string }) {
  const path = useRoadPath();
  const discovered = useGame((s) => s.discovered);
  const car = useCarMarker(true);
  const marks = useMemo(() => {
    const list = getWorld().landmarks.map((l) => ({ id: l.id, pos: project(l.position.x, l.position.y, l.position.z), label: [0, -12] as [number, number] }));
    // Greedy label placement: try above, below, then sideways; avoid overlapping placed labels.
    const placed: [number, number, number, number][] = [];
    const hit = (b: [number, number, number, number]) => placed.some((p) => b[0] < p[2] && b[2] > p[0] && b[1] < p[3] && b[3] > p[1]);
    [...list]
      .sort((a, b) => a.pos[0] - b.pos[0])
      .forEach((m) => {
        const w = sectionMeta[m.id].place.length * 5.6 + 6;
        const options: [number, number][] = [[0, -12], [0, 21], [-w / 2 - 4, 4], [w / 2 + 4, 4], [0, -26], [0, 34]];
        for (const [dx, dy] of options) {
          let cx = m.pos[0] + dx;
          cx = Math.max(w / 2 + 2, Math.min(W - w / 2 - 2, cx));
          const box: [number, number, number, number] = [cx - w / 2, m.pos[1] + dy - 10, cx + w / 2, m.pos[1] + dy + 2];
          if (!hit(box)) {
            placed.push(box);
            m.label = [cx - m.pos[0], dy];
            return;
          }
        }
      });
    return list;
  }, []);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role={interactive ? "group" : "img"} aria-label="World map">
      <rect width={W} height={H} rx="14" fill="#8dbb62" opacity="0.35" />
      <path d={path} fill="none" stroke="#fbf6ee" strokeWidth={interactive ? 7 : 6} strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <path d={path} fill="none" stroke="#5c606d" strokeWidth={interactive ? 4 : 3.5} strokeLinecap="round" strokeLinejoin="round" />
      {marks.map((m) => {
        const seen = discovered.includes(m.id);
        const accent = DESTINATIONS.find((d) => d.id === m.id)!.accent;
        const label = seen ? sectionMeta[m.id].place : "Undiscovered place";
        const body = (
          <>
            <circle r={seen ? 7 : 6} fill={seen ? accent : "#fbf6ee"} stroke={seen ? "#fff" : "#1d2230"} strokeOpacity={seen ? 1 : 0.35} strokeWidth="2" strokeDasharray={seen ? undefined : "2 2"} />
            {!seen && (
              <text y="3.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#1d2230" opacity="0.55">
                ?
              </text>
            )}
            {interactive && seen && (
              <text
                x={m.label[0]}
                y={m.label[1]}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#1d2230"
              >
                {sectionMeta[m.id].place}
              </text>
            )}
          </>
        );
        return interactive ? (
          <g
            key={m.id}
            transform={`translate(${m.pos[0]} ${m.pos[1]})`}
            role="button"
            tabIndex={0}
            aria-label={`Travel to ${label}`}
            className="cursor-pointer"
            onClick={() => travelTo(m.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                travelTo(m.id);
              }
            }}
          >
            {body}
          </g>
        ) : (
          <g key={m.id} transform={`translate(${m.pos[0]} ${m.pos[1]})`}>
            {body}
          </g>
        );
      })}
      <g ref={car}>
        <path d="M7 0 L-4 -4.5 L-2 0 L-4 4.5 Z" fill="#d9472f" stroke="#fff" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

/** Compact minimap for the HUD — click to open the full map. */
export function MiniMap() {
  const setMap = useGame((s) => s.setMap);
  return (
    <button type="button" onClick={() => setMap(true)} className="glass pointer-events-auto block w-52 rounded-2xl p-1.5" aria-label="Open world map and fast travel (M)">
      <MapSvg interactive={false} className="h-auto w-full" />
    </button>
  );
}

/** Full-screen map with fast travel to every destination. */
export function WorldMapOverlay() {
  const open = useGame((s) => s.mapOpen);
  const setMap = useGame((s) => s.setMap);
  const discovered = useGame((s) => s.discovered);
  const tokens = useGame((s) => s.tokens.length);
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) closeBtn.current?.focus();
  }, [open]);
  const total = getWorldSafeTokenCount();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="map"
          className="fixed inset-0 z-[52] grid place-items-center bg-ink/30 p-3 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && setMap(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-title"
            initial={{ scale: 0.97, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: 10 }}
            className="glass max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 id="map-title" className="font-display text-2xl font-bold">
                  World map
                </h2>
                <p className="text-sm text-ink-soft">
                  {discovered.length}/{sectionOrder.length} places discovered · {tokens}/{total} tokens
                </p>
              </div>
              <button ref={closeBtn} type="button" onClick={() => setMap(false)} aria-label="Close map" className="grid h-10 w-10 place-items-center rounded-full bg-ink/5 hover:bg-ink/10">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <MapSvg interactive className="mt-4 h-auto w-full" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">Fast travel</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-3">
              {sectionOrder.map((id) => {
                const seen = discovered.includes(id);
                const accent = DESTINATIONS.find((d) => d.id === id)!.accent;
                return (
                  <li key={id}>
                    <button type="button" onClick={() => travelTo(id)} className="flex w-full items-center gap-3 rounded-2xl bg-white/60 px-3 py-2.5 text-left transition hover:bg-white">
                      <span className="grid h-8 w-8 place-items-center rounded-xl text-white" style={{ background: accent }}>
                        {seen ? <Check className="h-4 w-4" aria-hidden /> : <MapPin className="h-4 w-4" aria-hidden />}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold leading-tight">{sectionMeta[id].place}</span>
                        <span className="block text-xs text-ink-soft">{sectionMeta[id].title}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getWorldSafeTokenCount() {
  try {
    return getWorld().tokens.length;
  } catch {
    return TOKENS.onRoad + TOKENS.hidden;
  }
}
