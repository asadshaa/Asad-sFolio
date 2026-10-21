import type { Concept } from "@/config/portfolio";

/**
 * Procedural wireframe "mockup" for a concept card. These are abstract layout
 * sketches — clearly labelled as concept mockups, never presented as
 * screenshots of shipped work.
 */
export function ConceptMockup({ kind, accent, label }: { kind: Concept["mockup"]; accent: string; label: string }) {
  const soft = `${accent}33`;
  return (
    <div className="relative overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm" role="img" aria-label={`Concept mockup sketch for ${label}`}>
      <div className="flex items-center gap-1 border-b border-ink/8 bg-paper px-2 py-1.5">
        {["#e8603f", "#f2b84b", "#5fb3a1"].map((c) => (
          <span key={c} className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
        ))}
        <span className="ml-2 h-1.5 w-1/3 rounded-full bg-ink/10" />
      </div>
      <div className="aspect-[16/10] p-2.5">
        {kind === "landing" && (
          <div className="flex h-full flex-col gap-1.5">
            <div className="flex flex-1 items-center gap-2 rounded-lg p-2" style={{ background: soft }}>
              <div className="flex-1 space-y-1">
                <div className="h-2 w-4/5 rounded bg-ink/70" />
                <div className="h-2 w-3/5 rounded bg-ink/40" />
                <div className="mt-1.5 h-2.5 w-12 rounded-full" style={{ background: accent }} />
              </div>
              <div className="h-full w-2/5 rounded-md" style={{ background: accent, opacity: 0.55 }} />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-5 rounded-md bg-ink/8" />
              ))}
            </div>
          </div>
        )}
        {kind === "dashboard" && (
          <div className="flex h-full gap-1.5">
            <div className="w-1/5 space-y-1 rounded-md bg-ink/80 p-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-1 rounded bg-white/40" />
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="h-2 w-1/2 rounded bg-ink/60" />
              <div className="flex flex-1 items-end gap-1 rounded-md bg-ink/5 p-1.5">
                {[40, 65, 50, 80, 70, 95].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: accent, opacity: 0.4 + i * 0.1 }} />
                ))}
              </div>
            </div>
          </div>
        )}
        {kind === "hero3d" && (
          <div className="relative grid h-full place-items-center overflow-hidden rounded-lg bg-[#141827]">
            <div className="absolute h-3/4 w-1/2 rounded-full blur-xl" style={{ background: accent, opacity: 0.6 }} />
            <svg viewBox="0 0 100 60" className="relative h-4/5 w-auto" aria-hidden>
              <polygon points="50,6 86,28 72,54 28,54 14,28" fill="none" stroke="#fff" strokeOpacity="0.8" />
              <polygon points="50,6 72,54 14,28 86,28 28,54" fill="none" stroke="#fff" strokeOpacity="0.35" />
            </svg>
            <div className="absolute bottom-2 left-2 h-1.5 w-1/3 rounded bg-white/70" />
          </div>
        )}
        {kind === "store" && (
          <div className="grid h-full grid-cols-4 grid-rows-2 gap-1.5">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex flex-col gap-0.5 rounded-md bg-ink/5 p-1">
                <div className="flex-1 rounded" style={{ background: i % 3 === 0 ? accent : soft }} />
                <div className="h-1 w-3/4 rounded bg-ink/30" />
              </div>
            ))}
          </div>
        )}
        {kind === "video" && (
          <div className="flex h-full flex-col gap-1.5">
            <div className="relative flex-1 rounded-md bg-ink">
              <div className="absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2 border-y-[7px] border-l-[11px] border-y-transparent" style={{ borderLeftColor: accent === "#2d313b" ? "#f2b84b" : accent }} />
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-4 rounded bg-ink/15" />
              ))}
            </div>
          </div>
        )}
        {kind === "gallery" && (
          <div className="grid h-full grid-cols-3 gap-1.5">
            {[60, 100, 75, 90, 55, 80].map((h, i) => (
              <div key={i} className="self-end rounded-md" style={{ height: `${h}%`, background: i % 2 ? soft : accent, opacity: i % 2 ? 1 : 0.7 }} />
            ))}
          </div>
        )}
      </div>
      <span className="absolute right-2 top-1 rounded-full bg-ink/80 px-1.5 py-px text-[0.55rem] font-semibold uppercase tracking-wider text-paper">Mockup</span>
    </div>
  );
}
