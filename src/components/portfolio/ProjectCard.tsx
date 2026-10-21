import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { concepts, type Project } from "@/config/portfolio";
import { StatusBadge } from "./StatusBadge";
import { ConceptMockup } from "./ConceptMockup";

/** Card linking to a project's case-study page. Server-compatible. */
export function ProjectCard({ project: p, headingLevel = 3 }: { project: Project; headingLevel?: 3 | 4 }) {
  const H = headingLevel === 3 ? "h3" : "h4";
  const concept = concepts.find((c) => c.projectId === p.id);
  return (
    <Link
      href={`/projects/${p.id}`}
      className="group flex h-full flex-col gap-3 rounded-3xl border border-ink/8 bg-white/70 p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
    >
      {concept && <ConceptMockup kind={concept.mockup} accent={p.accent} label={p.name} />}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.accent }} />
          <H className="font-display text-lg font-bold leading-snug text-ink">{p.name}</H>
        </div>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-ink-soft transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
      </div>
      <p className="text-ink-soft">{p.summary}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        <StatusBadge project={p} />
        {(p.technologyLabel ? [] : p.technologies.slice(0, 4)).map((t) => (
          <span key={t} className="rounded-full bg-ink/5 px-2.5 py-0.5 text-xs font-medium text-ink-soft">
            {t}
          </span>
        ))}
      </div>
      <span className="sr-only">Open case study</span>
    </Link>
  );
}
