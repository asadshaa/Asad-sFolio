"use client";

import { about, profile, type AboutTab } from "@/config/portfolio";
import { useGame } from "@/state/gameStore";
import { JourneyStepper } from "./Journey";
import { ExperienceSection } from "./ExperienceSection";
import { SkillsSection } from "./SkillsSection";
import { CredentialsSection } from "./CredentialsSection";

const TABS: { id: AboutTab; label: string }[] = [
  { id: "journey", label: "Journey" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills & training" },
];

/** Home panel: intro + journey, experience timeline, skills & credentials. */
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
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${tab === t.id ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id="about-tabpanel" role="tabpanel" aria-labelledby={`about-tab-${tab}`} className="space-y-5">
        {tab === "journey" && (
          <>
            <div className="space-y-3">
              <p className="font-display text-2xl font-bold leading-tight">{about.tagline}</p>
              {about.paragraphs.map((p) => (
                <p key={p} className="leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
              <p className="rounded-2xl bg-sand/70 p-3 text-sm leading-relaxed">{profile.positioning}</p>
            </div>
            <JourneyStepper />
          </>
        )}
        {tab === "experience" && <ExperienceSection />}
        {tab === "skills" && (
          <>
            <SkillsSection />
            <div className="space-y-2.5">
              <h3 className="font-display text-base font-bold">Training & certificates</h3>
              <CredentialsSection />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
