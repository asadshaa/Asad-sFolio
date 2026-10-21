import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Car } from "lucide-react";
import { profile, projectById, projects, sectionMeta } from "@/config/portfolio";
import { CaseStudy } from "@/components/portfolio/CaseStudy";
import { ProjectCard } from "@/components/portfolio/ProjectCard";

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = projectById(id);
  if (!p) return { title: "Project not found" };
  return { title: p.name, description: p.summary, openGraph: { title: `${p.name} · ${profile.name}`, description: p.summary } };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const project = projectById(id);
  if (!project) notFound();
  const related = projects.filter((p) => p.category === project.category && p.id !== project.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6dcc3] via-paper to-paper">
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-3">
          <Link href="/portfolio#projects" className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Portfolio
          </Link>
          <Link
            href={`/?goto=${project.destination}&project=${project.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-coral px-3.5 py-2 text-sm font-semibold text-white hover:bg-coral/90"
          >
            <Car className="h-4 w-4" aria-hidden /> View at the {sectionMeta[project.destination].place}
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-4xl px-5 py-12">
        <CaseStudy project={project} variant="page" />
        {related.length > 0 && (
          <section aria-labelledby="related-title" className="mt-16 border-t border-ink/10 pt-10">
            <h2 id="related-title" className="font-display text-2xl font-bold">
              Related
            </h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}>
                  <ProjectCard project={p} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
