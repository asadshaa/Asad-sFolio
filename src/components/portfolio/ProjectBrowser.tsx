"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { categoryMeta, concepts, projectById, projectsIn, type ProjectCategory, type SectionId } from "@/config/portfolio";
import { useGame } from "@/state/gameStore";
import { CaseStudy } from "./CaseStudy";
import { StatusBadge } from "./StatusBadge";
import { ConceptMockup } from "./ConceptMockup";
import { textOn } from "@/lib/color";

/**
 * In-game project browser for a destination. Selecting a project shows its
 * case study and also moves the 3D camera to that project's display.
 */
export function ProjectBrowser({ section, intro }: { section: SectionId; intro?: string }) {
  const selectedId = useGame((s) => s.selectedProjectId);
  const select = useGame((s) => s.selectProject);
  const list = projectsIn(section);
  const selected = projectById(selectedId);
  const groups = Array.from(new Set(list.map((p) => p.category))) as ProjectCategory[];
  const gallery = section === "creative";

  return (
    <AnimatePresence mode="wait" initial={false}>
      {selected && selected.destination === section ? (
        <motion.div key={selected.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="space-y-5">
          <button type="button" onClick={() => select(null)} className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold text-ink-soft hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All {gallery ? "concepts" : "projects"}
          </button>
          <CaseStudy project={selected} variant="panel" />
          <nav aria-label="Other projects here" className="flex flex-wrap gap-2 border-t border-ink/10 pt-4">
            {list
              .filter((p) => p.id !== selected.id)
              .map((p) => (
                <button key={p.id} type="button" onClick={() => select(p.id)} className="rounded-full border border-ink/10 bg-white/60 px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-white">
                  {p.name}
                </button>
              ))}
          </nav>
        </motion.div>
      ) : (
        <motion.div key="list" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }} className="space-y-5">
          {intro && <p className="leading-relaxed text-ink-soft">{intro}</p>}
          {groups.map((cat) => (
            <section key={cat} className="space-y-2.5" aria-label={categoryMeta[cat].title}>
              {groups.length > 1 && <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">{categoryMeta[cat].title}</h3>}
              <ul className={gallery ? "grid grid-cols-2 gap-2.5" : "space-y-2.5"}>
                {list
                  .filter((p) => p.category === cat)
                  .map((p, i) => {
                    const concept = concepts.find((c) => c.projectId === p.id);
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => select(p.id)}
                          className={`group w-full rounded-2xl border border-ink/8 bg-white/65 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md ${
                            gallery ? "flex h-full flex-col gap-2 p-2.5" : "flex items-center gap-4 p-4"
                          }`}
                        >
                          {gallery && concept ? (
                            <ConceptMockup kind={concept.mockup} accent={p.accent} label={p.name} />
                          ) : (
                            <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-sm font-bold" style={{ background: p.accent, color: textOn(p.accent) }}>
                              {String(i + 1).padStart(2, "0")}
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className={`block font-display font-semibold text-ink ${gallery ? "text-sm leading-snug" : "text-lg"}`}>{p.name}</span>
                            {!gallery && <span className="mt-0.5 block text-sm text-ink-soft">{p.summary}</span>}
                            <span className="mt-1.5 block">
                              <StatusBadge project={p} />
                            </span>
                          </span>
                          {!gallery && <ChevronRight className="h-5 w-5 shrink-0 text-ink-soft transition group-hover:translate-x-0.5" aria-hidden />}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
