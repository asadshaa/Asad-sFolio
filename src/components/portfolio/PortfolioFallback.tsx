import Link from "next/link";
import { ArrowRight, Car } from "lucide-react";
import { about, categoryMeta, profile, projects } from "@/config/portfolio";
import { JourneyList } from "./Journey";
import { ProjectCard } from "./ProjectCard";
import { AllProjects } from "./AllProjects";
import { ExperienceSection } from "./ExperienceSection";
import { SkillsSection } from "./SkillsSection";
import { CredentialsSection } from "./CredentialsSection";
import { ContactSection } from "./ContactSection";

const NAV = [
  { id: "about", label: "About" },
  { id: "featured", label: "Featured" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "concepts", label: "Concepts" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

function Section({ id, eyebrow, title, blurb, children }: { id: string; eyebrow: string; title: string; blurb?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 border-t border-ink/10 py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">{eyebrow}</p>
      <h2 id={`${id}-title`} className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {blurb && <p className="mt-2 max-w-2xl text-ink-soft">{blurb}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

/**
 * The conventional, fully accessible portfolio. Same content as the game
 * (both read from config/portfolio.ts). Server-rendered and indexable.
 */
export function PortfolioFallback({ notice, showGameLink = true }: { notice?: string; showGameLink?: boolean }) {
  const featured = projects.filter((p) => p.featured);
  const concepts = projects.filter((p) => p.category === "freelance");
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6dcc3] via-paper to-paper">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/portfolio" className="flex shrink-0 items-center gap-2.5 font-display font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-sm text-paper">{profile.initials}</span>
            <span className="hidden md:inline">{profile.name}</span>
          </Link>
          <nav aria-label="Sections" className="flex items-center gap-0.5 overflow-x-auto text-sm font-medium">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="whitespace-nowrap rounded-full px-3 py-1.5 text-ink-soft hover:bg-ink/5 hover:text-ink">
                {n.label}
              </a>
            ))}
          </nav>
          {showGameLink && (
            <Link href="/" className="hidden shrink-0 items-center gap-1.5 rounded-full bg-coral px-3.5 py-2 text-sm font-semibold text-white hover:bg-coral/90 sm:inline-flex">
              <Car className="h-4 w-4" aria-hidden /> 3D world
            </Link>
          )}
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-5 pb-24">
        {notice && (
          <p role="status" className="mt-6 rounded-2xl border border-gold/50 bg-gold/15 px-4 py-3 text-sm text-ink">
            {notice}
          </p>
        )}
        <section className="py-16 sm:py-24" aria-labelledby="hero-title">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">{profile.headline}</p>
          <h1 id="hero-title" className="mt-3 font-display text-5xl font-extrabold tracking-tight sm:text-7xl">
            {profile.name}
          </h1>
          <p className="mt-5 max-w-2xl font-display text-2xl leading-snug text-ink sm:text-3xl">{about.tagline}</p>
          <p className="mt-4 max-w-2xl text-lg text-ink-soft">{profile.positioning}</p>
          {showGameLink && (
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-coral px-5 py-3 font-semibold text-white shadow-lg shadow-coral/25 transition hover:bg-coral/90"
            >
              <Car className="h-5 w-5" aria-hidden /> Explore the 3D world <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </section>

        <Section id="about" eyebrow="Home" title="About">
          <div className="max-w-3xl space-y-4">
            {about.paragraphs.map((p) => (
              <p key={p} className="text-lg leading-relaxed">
                {p}
              </p>
            ))}
          </div>
          <h3 className="mt-10 font-display text-xl font-bold">The journey so far</h3>
          <div className="mt-4">
            <JourneyList />
          </div>
        </Section>

        <Section id="featured" eyebrow="Engineering Garage" title="Featured projects" blurb="A few projects worth a closer look. Each opens a full case study.">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <li key={p.id}>
                <ProjectCard project={p} />
              </li>
            ))}
          </ul>
        </Section>

        <Section id="projects" eyebrow="Catalog" title="All projects" blurb="Professional software, AI & application projects and DevOps learning labs — kept clearly separate.">
          <AllProjects />
        </Section>

        <Section id="experience" eyebrow="Timeline" title="Experience & education">
          <div className="max-w-3xl">
            <ExperienceSection headingLevel={3} />
          </div>
        </Section>

        <Section id="concepts" eyebrow="Creative District" title={categoryMeta.freelance.title} blurb="Concepts, proposals and freelance opportunities. Statuses are shown as they are — a proposal is never presented as completed client work. Previews are mockup sketches, not screenshots.">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {concepts.map((p) => (
              <li key={p.id}>
                <ProjectCard project={p} />
              </li>
            ))}
          </ul>
        </Section>

        <Section id="skills" eyebrow="Toolkit" title="Skills & certifications" blurb="Grouped by how much I've actually used them — no inflated percentages.">
          <SkillsSection headingLevel={3} />
          <h3 className="mt-10 font-display text-xl font-bold">Training & certificates</h3>
          <div className="mt-4">
            <CredentialsSection />
          </div>
        </Section>

        <Section id="contact" eyebrow="Lighthouse" title="Contact & CV">
          <div className="max-w-xl">
            <ContactSection />
          </div>
        </Section>

        {showGameLink && (
          <div className="mt-6 flex justify-center">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-semibold text-paper hover:bg-ink/85">
              <Car className="h-5 w-5" aria-hidden /> Back to the 3D world
            </Link>
          </div>
        )}
      </main>
      <footer className="border-t border-ink/10 py-8 text-center text-sm text-ink-soft">
        {profile.name} · Built with Next.js &amp; Three.js
      </footer>
    </div>
  );
}
