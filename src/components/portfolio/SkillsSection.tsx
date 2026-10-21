import { skillLevels, skills, type SkillLevel } from "@/config/portfolio";

const LEVEL_ORDER: SkillLevel[] = ["comfortable", "working", "learning"];
const DOTS: Record<SkillLevel, number> = { comfortable: 3, working: 2, learning: 1 };

/** Skills grouped by honest experience level — no percentage bars. */
export function SkillsSection({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="space-y-5">
      {LEVEL_ORDER.map((level) => {
        const groups = skills.filter((s) => s.level === level);
        if (!groups.length) return null;
        return (
          <section key={level} aria-label={skillLevels[level].label} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span aria-hidden className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`h-2 w-2 rounded-full ${i < DOTS[level] ? "bg-coral" : "bg-ink/15"}`} />
                ))}
              </span>
              <H className="font-display text-base font-bold">{skillLevels[level].label}</H>
              <span className="text-xs text-ink-soft">— {skillLevels[level].description}</span>
            </div>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {groups.map((g) => (
                <li key={g.id} className="rounded-2xl border border-ink/8 bg-white/65 p-4">
                  <p className="font-semibold">{g.title}</p>
                  {g.note && <p className="text-xs text-ink-soft">{g.note}</p>}
                  <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`${g.title} skills`}>
                    {g.items.map((i) => (
                      <li key={i} className="rounded-full border border-ink/10 bg-paper px-2.5 py-0.5 text-sm text-ink-soft">
                        {i}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
