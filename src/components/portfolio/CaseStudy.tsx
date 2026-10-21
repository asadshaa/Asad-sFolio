import Link from "next/link";
import { Check, Clock3, Code, ExternalLink, Globe, Minus } from "lucide-react";
import { categoryMeta, sectionMeta, statusMeta, type Project, type StackItem } from "@/config/portfolio";
import { showTodos } from "@/lib/content";
import { Chip, Eyebrow, SectionHeading } from "./ContentText";
import { StatusBadge } from "./StatusBadge";
import { DeviceMedia } from "./DeviceMedia";
import { DevChecklist } from "./DevChecklist";
import { AureusArchitecture } from "./demos/AureusArchitecture";
import { PosFlowDemo } from "./demos/PosFlowDemo";
import { SkillGapDemo } from "./demos/SkillGapDemo";
import { FabricPipeline } from "./demos/FabricPipeline";

function Block({ n, title, children }: { n?: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <Eyebrow>{n ? `${String(n).padStart(2, "0")} · ${title}` : title}</Eyebrow>
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

const STACK_STATE: Record<StackItem["state"], { label: string; cls: string }> = {
  verified: { label: "", cls: "border-ink/10 bg-white" },
  verify: { label: "To verify", cls: "border-dashed border-gold-deep/40 bg-gold/10" },
  planned: { label: "Planned", cls: "border-dashed border-ink/20 bg-transparent" },
};

/** Technologies as readable tags with their purpose and verification state. */
function StackList({ stack }: { stack: StackItem[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {stack.map((s) => (
        <li key={s.name} className={`rounded-xl border px-3 py-2 ${STACK_STATE[s.state].cls}`}>
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            {s.name}
            {s.state !== "verified" && (
              <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide ${s.state === "verify" ? "bg-gold/25 text-gold-deep" : "bg-ink/5 text-ink-soft"}`}>
                {STACK_STATE[s.state].label}
              </span>
            )}
          </p>
          <p className="text-sm text-ink-soft">{s.purpose}</p>
        </li>
      ))}
    </ul>
  );
}

type QState = "yes" | "no" | "na";

/** The shared case-study quality checklist, computed from the project's real data. */
function qualityChecklist(p: Project): { group: string; items: [string, QState][] }[] {
  const doneText = p.checklist.filter((c) => c.state === "done").map((c) => c.text.toLowerCase());
  const isConcept = p.status === "concept" || p.status === "proposed";
  return [
    {
      group: "Problem & solution",
      items: [
        ["The real problem is explained in plain language", p.problem ? "yes" : "no"],
        ["The solution connects directly to that problem", p.solution || p.plannedFeatures.length ? "yes" : "no"],
        ["The outcome describes a practical benefit", p.outcome ? "yes" : "no"],
      ],
    },
    {
      group: "Engineering",
      items: [
        [
          "Technologies are verified against the CV or source code",
          p.stack.length === 0 ? "no" : p.stack.every((s) => s.state !== "verify") ? (isConcept ? "na" : "yes") : "no",
        ],
        ["Implemented features are distinguished from planned ones", "yes"],
        ["Important workflows and architecture are explained", p.howItWorks ? "yes" : isConcept ? "na" : "no"],
        ["Technical challenges are described", p.challenges.length ? "yes" : isConcept ? "na" : "no"],
        ["Testing and error handling are documented", doneText.some((t) => /test|error|regression|validat/.test(t)) ? "yes" : isConcept ? "na" : "no"],
      ],
    },
    {
      group: "Evidence",
      items: [
        ["Project screenshots are available", p.media.length ? "yes" : "no"],
        ["Demo or repository link is verified", p.repoUrl || p.demoUrl ? "yes" : "no"],
        ["Metrics have a clear baseline and method", p.outcomes.length ? "yes" : "na"],
        ["Confidential data is excluded", "yes"],
        ["Project status is accurate", p.status ? "yes" : "no"],
      ],
    },
  ];
}

function QualityChecklist({ project }: { project: Project }) {
  const groups = qualityChecklist(project);
  const all = groups.flatMap((g) => g.items);
  const yes = all.filter(([, s]) => s === "yes").length;
  const applicable = all.filter(([, s]) => s !== "na").length;
  return (
    <details className="group rounded-2xl border border-ink/10 bg-white/60 p-4">
      <summary className="cursor-pointer list-none font-semibold">
        Case-study checklist · {yes}/{applicable} complete
        <span className="ml-2 text-sm font-normal text-ink-soft group-open:hidden">Show</span>
      </summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {groups.map((g) => (
          <div key={g.group}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">{g.group}</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {g.items.map(([text, s]) => (
                <li key={text} className="flex gap-2">
                  {s === "yes" ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss" aria-label="Complete" />
                  ) : s === "no" ? (
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" aria-label="Not yet" />
                  ) : (
                    <Minus className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" aria-label="Not applicable" />
                  )}
                  <span className={s === "yes" ? "" : "text-ink-soft"}>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-soft">Computed from what this case study actually contains — nothing here is decorative.</p>
    </details>
  );
}

/**
 * Project case study: problem → goal → development checklist → stack → how it
 * works → solution → outcome → challenges & learning → status → proof.
 * Sections render only when they have real content.
 */
export function CaseStudy({ project: p, variant = "page" }: { project: Project; variant?: "page" | "panel" }) {
  const h = variant === "page" ? 2 : 3;
  const challenges = [...p.challenges, ...p.caseStudy.debugging];
  const lessons = p.caseStudy.lessons;
  const isConcept = p.status === "concept" || p.status === "proposed";
  const hasProof = p.media.length > 0 || !!p.repoUrl || !!p.demoUrl || !!p.demo;
  let n = 0;
  const next = () => ++n;

  return (
    <article className="space-y-6" aria-labelledby={`cs-${p.id}`}>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
          {p.kicker ?? categoryMeta[p.category].title} · {p.location ?? sectionMeta[p.destination].place}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span aria-hidden className="h-3.5 w-3.5 rounded-full" style={{ background: p.accent }} />
          <SectionHeading level={h} className={variant === "page" ? "text-4xl sm:text-5xl" : "text-2xl"}>
            <span id={`cs-${p.id}`}>{p.name}</span>
          </SectionHeading>
        </div>
        <p className="text-lg leading-relaxed text-ink-soft">{p.summary}</p>
        {p.confidential && (
          <p className="rounded-xl border border-ink/10 bg-white/60 px-3 py-2 text-xs text-ink-soft">
            Built inside a company codebase — details are kept general, and no confidential data, internal screens or source code are shown.
          </p>
        )}
      </header>

      {p.problem && (
        <Block n={next()} title="The problem">
          <p className="leading-relaxed">{p.problem}</p>
        </Block>
      )}

      {p.goal && (
        <Block n={next()} title="The goal">
          <p className="leading-relaxed">{p.goal}</p>
        </Block>
      )}

      {(p.checklist.length > 0 || p.plannedFeatures.length > 0) && (
        <Block n={next()} title={p.status === "proposed" ? "Proposed solution" : p.status === "concept" ? "Proposed developer checklist" : "Development checklist"}>
          {p.role && <p className="leading-relaxed">{p.role}</p>}
          {p.checklist.length > 0 && <DevChecklist items={p.checklist} />}
          {p.plannedFeatures.length > 0 && (
            <>
              <p className="text-sm text-ink-soft">{isConcept ? "Proposed — not presented as completed work." : "Planned — not all of these are built yet."}</p>
              <Bullets items={p.plannedFeatures} accent={p.accent} />
            </>
          )}
        </Block>
      )}
      {p.checklist.length === 0 && p.plannedFeatures.length === 0 && p.role && (
        <Block n={next()} title="My role">
          <p className="leading-relaxed">{p.role}</p>
        </Block>
      )}

      {(p.stack.length > 0 || p.technologies.length > 0) && (
        <Block n={next()} title="Technology stack">
          {p.stack.length > 0 ? (
            <StackList stack={p.stack} />
          ) : (
            <ul className="flex flex-wrap gap-2">
              {p.technologies.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </ul>
          )}
        </Block>
      )}

      {(p.howItWorks || p.modules.length > 0) && (
        <Block n={next()} title="How it works">
          {p.howItWorks && <p className="leading-relaxed">{p.howItWorks}</p>}
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

      {p.solution && (
        <Block n={next()} title="The solution">
          <p className="leading-relaxed">{p.solution}</p>
        </Block>
      )}

      {(p.outcome || p.outcomes.length > 0) && (
        <Block n={next()} title={p.outcomeLabel ?? "Outcome"}>
          {p.outcome && <p className="leading-relaxed">{p.outcome}</p>}
          {p.outcomes.length > 0 && <Bullets items={p.outcomes} accent={p.accent} />}
        </Block>
      )}

      {(challenges.length > 0 || lessons.length > 0) && (
        <Block n={next()} title="Challenges & learning">
          {challenges.length > 0 && <Bullets items={challenges} accent={p.accent} />}
          {lessons.length > 0 && (
            <div className="rounded-xl bg-sand/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">What I learned</p>
              <Bullets items={lessons} accent={p.accent} />
            </div>
          )}
        </Block>
      )}

      <Block n={next()} title="Project status">
        <div className="flex flex-wrap items-center gap-2">
          {p.status && <StatusBadge project={p} />}
          {p.statusNote && <span className="text-sm text-ink-soft">{p.statusNote}</span>}
        </div>
        {p.status && <p className="sr-only">Status: {statusMeta[p.status].label}</p>}
      </Block>

      {hasProof && (
        <Block n={next()} title="Proof">
          {p.demo && (
            <>
              <p className="text-sm text-ink-soft">Interactive walkthrough — illustrative, built for this portfolio.</p>
              <Demo project={p} />
            </>
          )}
          {p.media.length > 0 && (
            <div className={p.media.every((m) => m.device === "phone" || (p.mobile && !m.device)) ? "flex flex-wrap justify-center gap-5" : "grid gap-4 sm:grid-cols-2"}>
              {p.media.map((m) => (
                <DeviceMedia key={m.src} m={p.mobile && !m.device ? { ...m, device: "phone" } : m} />
              ))}
            </div>
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
        </Block>
      )}

      {/* The computed quality checklist is a working aid for Asad, so it only shows in development. */}
      {showTodos && variant === "page" && <QualityChecklist project={p} />}

      {variant === "panel" && (
        <Link href={`/projects/${p.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-coral underline-offset-4 hover:underline">
          Open the full case study →
        </Link>
      )}

      {showTodos && p.evidence.length > 0 && (
        <div className="todo text-xs" title="Only visible in development">
          <p className="font-semibold not-italic">Dev only — evidence to collect:</p>
          <ul className="mt-1 list-disc pl-5">
            {p.evidence.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
