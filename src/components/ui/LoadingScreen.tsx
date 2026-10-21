"use client";

import Link from "next/link";
import { gameCopy, profile } from "@/config/portfolio";
import { displayName } from "@/lib/content";

/**
 * Curtain shown while the 3D chunk downloads and the world is generated.
 * Also used as the dynamic-import fallback, so it appears on first paint.
 */
export function LoadingScreen({ progress, leaving = false }: { progress: number; leaving?: boolean }) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const name = displayName(profile.name);
  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-gradient-to-b from-[#a6c8e4] via-[#f3dcc6] to-[#efd6bf] px-6 transition-opacity duration-700 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-live="polite"
      aria-label={`Loading the world, ${pct} percent`}
    >
      <div className="flex flex-col items-center text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink font-display text-lg font-bold text-paper shadow-lg">
          {profile.initials}
        </span>
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">{name}</h1>
        <p className="mt-3 font-display text-lg text-ink-soft sm:text-xl">{profile.headline}</p>
      </div>

      <div className="mt-12 w-[min(320px,80vw)]">
        <div className="relative h-1.5 rounded-full bg-ink/10">
          <div className="absolute inset-y-0 left-0 rounded-full bg-coral transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
          {/* tiny car riding the progress bar */}
          <svg
            viewBox="0 0 32 18"
            className="absolute -top-[19px] h-[18px] w-8 -translate-x-1/2 transition-[left] duration-500 ease-out"
            style={{ left: `${pct}%` }}
            aria-hidden
          >
            <rect x="2" y="6" width="28" height="7" rx="3" fill="#e4553c" />
            <rect x="8" y="1.5" width="14" height="6" rx="2.5" fill="#22324a" />
            <rect x="8" y="1" width="14" height="1.6" rx="0.8" fill="#f3e8d2" />
            <circle cx="9" cy="14" r="3" fill="#23262d" />
            <circle cx="23" cy="14" r="3" fill="#23262d" />
            <circle cx="9" cy="14" r="1.2" fill="#f3e8d2" />
            <circle cx="23" cy="14" r="1.2" fill="#f3e8d2" />
          </svg>
        </div>
        <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          {pct < 100 ? gameCopy.loading : "Ready"} · {pct}%
        </p>
      </div>

      <Link
        href="/portfolio"
        className="absolute bottom-8 rounded-full px-4 py-2 text-sm font-semibold text-ink-soft underline-offset-4 hover:text-ink hover:underline"
      >
        Skip exploration — view classic portfolio
      </Link>
    </div>
  );
}
