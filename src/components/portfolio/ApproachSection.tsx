import { Compass, Hammer, ListChecks, RefreshCw, Search } from "lucide-react";
import { process, services, values } from "@/config/portfolio";

const STEP_ICONS = [Search, Compass, Hammer, ListChecks, RefreshCw];

/** Engineering values + the five-step process. Server-compatible. */
export function ApproachSection({ headingLevel = 3, compact = false }: { headingLevel?: 2 | 3; compact?: boolean }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="space-y-8">
      <section className="space-y-3" aria-label={values.title}>
        <H className="font-display text-lg font-bold">{values.title}</H>
        <ul className={`grid gap-2.5 ${compact ? "" : "sm:grid-cols-2"}`}>
          {values.items.map((v, i) => (
            <li key={v.title} className="rounded-2xl border border-ink/8 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">0{i + 1}</p>
              <p className="mt-1 font-semibold">{v.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{v.text}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-3" aria-label={process.title}>
        <H className="font-display text-lg font-bold">{process.title}</H>
        <ol className={`grid gap-2.5 ${compact ? "" : "sm:grid-cols-5"}`}>
          {process.steps.map((s, i) => {
            const Icon = STEP_ICONS[i] ?? Search;
            return (
              <li key={s.title} className="rounded-2xl border border-ink/8 bg-white/70 p-4">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-paper">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <p className="mt-2 font-semibold">
                  {i + 1}. {s.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.text}</p>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

/** "What I can help build". Server-compatible. */
export function ServicesSection() {
  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-ink-soft">{services.intro}</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.items.map((s) => (
          <li key={s.title} className="rounded-2xl border border-ink/8 bg-white/70 p-5">
            <p className="font-display text-lg font-bold">{s.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
