import { Briefcase, GraduationCap } from "lucide-react";
import { timeline } from "@/config/portfolio";
import { showTodos } from "@/lib/content";
import { Eyebrow } from "./ContentText";

/** Professional experience + education timeline. Unverified details are simply omitted. */
export function ExperienceSection({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <ol className="relative space-y-6 border-l-2 border-ink/10 pl-7">
      {timeline.map((e) => {
        const Icon = e.kind === "work" ? Briefcase : GraduationCap;
        const sparse = !e.summary && e.responsibilities.length === 0;
        return (
          <li key={e.id} className="relative">
            <span aria-hidden className="absolute -left-[2.45rem] top-0 grid h-8 w-8 place-items-center rounded-full border-[3px] border-paper bg-coral text-white">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-wider text-coral">
              {e.kind === "work" ? "Experience" : "Education"} · {e.period}
            </p>
            <H className="mt-1 font-display text-xl font-bold">{e.title}</H>
            <p className="text-sm font-medium text-ink-soft">
              {e.organization}
              {e.location ? ` · ${e.location}` : ""}
            </p>
            {e.summary && <p className="mt-2 leading-relaxed">{e.summary}</p>}
            {e.responsibilities.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <Eyebrow>Responsibilities</Eyebrow>
                <ul className="space-y-1">
                  {e.responsibilities.map((r) => (
                    <li key={r} className="flex gap-2 text-ink-soft">
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {e.highlights.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <Eyebrow>Highlights</Eyebrow>
                <ul className="space-y-1">
                  {e.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
            {showTodos && sparse && e.kind === "work" && (
              <p className="todo mt-2 text-xs">Dev note: add verified responsibilities / deliverables for this role in src/config/portfolio.ts.</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
