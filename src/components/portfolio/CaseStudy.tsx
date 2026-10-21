import Link from "next/link";
import { Code, ExternalLink, Globe } from "lucide-react";
import { categoryMeta, sectionMeta, type Project } from "@/config/portfolio";
import { missingFields, showTodos } from "@/lib/content";
import { Chip, Eyebrow, SectionHeading } from "./ContentText";
import { StatusBadge } from "./StatusBadge";
import { DeviceMedia } from "./DeviceMedia";
import { AureusArchitecture } from "./demos/AureusArchitecture";
import { PosFlowDemo } from "./demos/PosFlowDemo";
import { SkillGapDemo } from "./demos/SkillGapDemo";
import { FabricPipeline } from "./demos/FabricPipeline";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <Eyebrow>{title}</Eyebrow>
      {children}
    </section>
  );
}

function Bullets({ items, accent }: { items: string[]; accent: string }) {
  return (
    <ul className="space-y-1.5">
      {items.map((t) => (
        <li key={t} className="flex gap-2 leading-relaxed">
          <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent }} />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Demo({ project }: { project: Project }) {
  switch (project.demo) {
    case "aureus-architecture":
      return <AureusArchitecture />;
    case "pos-flow":
      return <PosFlowDemo />;
    case "skill-gap":
      return <SkillGapDemo />;
    case "fabric-pipeline":
      return <FabricPipeline hasMedia={project.media.length > 0} />;
    default:
      return null;
  }
}

/**
 * Reusable project case study. Every section renders only when it has real
 * content; a dev-only checklist lists what still needs to be filled in.
 */
export function CaseStudy({ project: p, variant = "page" }: { project: Project; variant?: "page" | "panel" }) {
  const overview = p.description ?? p.caseStudy.overview ?? p.summary;
  const extraOverview = p.description && p.caseStudy.overview ? p.caseStudy.overview : null;
  const challenges = [...p.challenges, ...p.caseStudy.debugging];
  const results = [...p.outcomes, ...p.caseStudy.lessons];
  const missing = showTodos ? missingFields(p) : [];
  const h = variant === "page" ? 2 : 3;

  return (
    <article className="space-y-6" aria-labelledby={`cs-${p.id}`}>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
          {categoryMeta[p.category].title} · {sectionMeta[p.destination].place}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span aria-hidden className="h-3.5 w-3.5 rounded-full" style={{ background: p.accent }} />
          <SectionHeading level={h} className={variant === "page" ? "text-4xl sm:text-5xl" : "text-2xl"}>
            <span id={`cs-${p.id}`}>{p.name}</span>
          </SectionHeading>
        </div>
        <StatusBadge project={p} withNote />
      </header>

      <Block title="Overview">
        <p className="leading-relaxed">{overview}</p>
        {extraOverview && <p className="leading-relaxed text-ink-soft">{extraOverview}</p>}
      </Block>

      {(p.problem || p.caseStudy.context) && (
        <Block title="Problem & context">
          {p.problem && <p className="leading-relaxed">{p.problem}</p>}
          {p.caseStudy.context && <p className="leading-relaxed text-ink-soft">{p.caseStudy.context}</p>}
        </Block>
      )}

      {p.solution && (
        <Block title="Solution">
          <p className="leading-relaxed">{p.solution}</p>
        </Block>
      )}

      {p.role && (
        <Block title="My role & contribution">
          <p className="leading-relaxed">{p.role}</p>
        </Block>
      )}

      {p.focusAreas.length > 0 && (
        <Block title={p.status === "concept" || p.status === "proposed" ? "Scope" : "Focus areas"}>
          <ul className="flex flex-wrap gap-2">
            {p.focusAreas.map((a) => (
              <Chip key={a}>{a}</Chip>
            ))}
          </ul>
        </Block>
      )}

      {p.plannedFeatures.length > 0 && (
        <Block title="Planned features">
          <p className="text-sm text-ink-soft">Not all of these are built yet.</p>
          <Bullets items={p.plannedFeatures} accent={p.accent} />
        </Block>
      )}

      {(p.technologies.length > 0 || p.caseStudy.architecture || p.modules.length > 0) && (
        <Block title={p.technologyLabel ? `Architecture & ${p.technologyLabel.toLowerCase()}` : "Architecture & technology"}>
          {p.technologies.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label={p.technologyLabel ?? "Technologies"}>
              {p.technologies.map((t) => (
                <li key={t} className="rounded-full bg-ink px-3 py-1 text-sm font-medium text-paper">
                  {t}
                </li>
              ))}
            </ul>
          )}
          {p.caseStudy.architecture && <p className="leading-relaxed">{p.caseStudy.architecture}</p>}
          {p.modules.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {p.modules.map((m) => (
                <li key={m.name} className="rounded-xl border border-ink/10 bg-white/60 p-3">
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-sm text-ink-soft">{m.areas.join(" · ")}</p>
                </li>
              ))}
            </ul>
          )}
        </Block>
      )}

      {p.demo && (
        <Block title="Interactive walkthrough">
          <Demo project={p} />
        </Block>
      )}

      {p.caseStudy.decisions.length > 0 && (
        <Block title="Implementation decisions">
          <Bullets items={p.caseStudy.decisions} accent={p.accent} />
        </Block>
      )}

      {challenges.length > 0 && (
        <Block title="Challenges & debugging">
          <Bullets items={challenges} accent={p.accent} />
        </Block>
      )}

      {results.length > 0 && (
        <Block title="Results & lessons">
          <Bullets items={results} accent={p.accent} />
        </Block>
      )}

      {p.media.length > 0 && (
        <Block title="Screenshots & media">
          <div className={p.media.every((m) => m.device === "phone") ? "flex flex-wrap justify-center gap-5" : "grid gap-4 sm:grid-cols-2"}>
            {p.media.map((m) => (
              <DeviceMedia key={m.src} m={m} />
            ))}
          </div>
        </Block>
      )}

      {(p.repoUrl || p.demoUrl) && (
        <div className="flex flex-wrap gap-2">
          {p.repoUrl && (
            <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink/85">
              <Code className="h-4 w-4" aria-hidden /> Repository <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
          {p.demoUrl && (
            <a href={p.demoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral/90">
              <Globe className="h-4 w-4" aria-hidden /> Live demo <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
      )}

      {variant === "panel" && (
        <Link href={`/projects/${p.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-coral underline-offset-4 hover:underline">
          Open full case study page →
        </Link>
      )}

      {missing.length > 0 && (
        <p className="todo text-xs" title="Only visible in development">
          Dev checklist — still needed: {missing.join(", ")}. Edit src/config/portfolio.ts.
        </p>
      )}
    </article>
  );
}
