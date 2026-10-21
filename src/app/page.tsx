import Link from "next/link";
import { about, categoryMeta, profile, projects, sectionMeta, sectionOrder } from "@/config/portfolio";
import { GameRoot } from "@/components/game/GameRoot";

export default function Home() {
  return (
    <>
      <GameRoot />

      {/* Indexable, screen-reader friendly summary — the full accessible version lives at /portfolio. */}
      <section className="sr-only" aria-label="Portfolio summary">
        <h1>
          {profile.name} — {profile.headline}
        </h1>
        <p>{about.tagline}</p>
        <p>{profile.positioning}</p>
        <p>
          This site is an explorable 3D driving game. Prefer a conventional layout?{" "}
          <Link href="/portfolio">Open the accessible portfolio</Link>.
        </p>
        <h2>Places to explore</h2>
        <ul>
          {sectionOrder.map((id) => (
            <li key={id}>
              {sectionMeta[id].place}: {sectionMeta[id].title} — {sectionMeta[id].blurb}
            </li>
          ))}
        </ul>
        {(["professional", "ai-apps", "devops-lab", "freelance"] as const).map((cat) => (
          <div key={cat}>
            <h2>{categoryMeta[cat].title}</h2>
            <ul>
              {projects
                .filter((p) => p.category === cat)
                .map((p) => (
                  <li key={p.id}>
                    <Link href={`/projects/${p.id}`}>{p.name}</Link> — {p.summary}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>

      <noscript>
        <p style={{ position: "fixed", inset: "auto 0 0 0", padding: 16, textAlign: "center", background: "#fbf6ee" }}>
          The 3D experience needs JavaScript. <a href="/portfolio">View the classic portfolio</a>.
        </p>
      </noscript>
    </>
  );
}
