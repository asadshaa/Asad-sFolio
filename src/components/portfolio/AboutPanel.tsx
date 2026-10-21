"use client";

import { about, services, type AboutTab } from "@/config/portfolio";
import { useGame } from "@/state/gameStore";
import { JourneyStepper } from "./Journey";
import { ExperienceSection } from "./ExperienceSection";
import { SkillsSection } from "./SkillsSection";
import { CredentialsSection } from "./CredentialsSection";
import { ApproachSection } from "./ApproachSection";

const TABS: { id: AboutTab; label: string }[] = [
  { id: "journey", label: "Journey" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "approach", label: "Approach" },
];

/** Home panel: short bio + journey, experience timeline, skills & credentials, approach & services. */
export function AboutPanel() {
  const tab = useGame((s) => s.aboutTab);
  const setTab = useGame((s) => s.setAboutTab);

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="About sections" className="flex gap-1 rounded-full bg-ink/5 p-1">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            id={`about-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls="about-tabpanel"
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              e.preventDefault();
              const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
              setTab(next.id);
              document.getElementById(`about-tab-${next.id}`)?.focus();
            }}
            className={`flex-1 rounded-full px-2 py-2 text-sm font-semibold transition ${tab === t.id ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id="about-tabpanel" role="tabpanel" aria-labelledby={`about-tab-${tab}`} className="space-y-5">
        {tab === "journey" && (
          <>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral">{about.label}</p>
              <p className="font-display text-2xl font-bold leading-tight">{about.heading}</p>
              <p className="leading-relaxed text-ink-soft">{about.shortBio}</p>
              <p className="rounded-2xl bg-sand/70 p-3 text-sm font-medium leading-relaxed">{about.approach}</p>
            </div>
            <JourneyStepper />
          </>
        )}
        {tab === "experience" && <ExperienceSection />}
        {tab === "skills" && (
          <>
            <SkillsSection />
            <div className="space-y-2.5">
              <h3 className="font-display text-base font-bold">Certifications & training</h3>
              <CredentialsSection />
            </div>
          </>
        )}
        {tab === "approach" && (
          <>
            <ApproachSection compact />
            <div className="space-y-2.5">
              <h3 className="font-display text-lg font-bold">{services.title}</h3>
              <ul className="space-y-2">
                {services.items.map((s) => (
                  <li key={s.title} className="rounded-2xl border border-ink/8 bg-white/70 p-3.5">
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-sm text-ink-soft">{s.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
