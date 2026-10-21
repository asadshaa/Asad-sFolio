"use client";

import { useState } from "react";
import { categoryMeta, projects, type ProjectCategory } from "@/config/portfolio";
import { ProjectCard } from "./ProjectCard";

type Filter = "all" | ProjectCategory;
const FILTERS: Filter[] = ["all", "professional", "ai-apps", "devops-lab"];

/**
 * All projects with a working category filter. Freelance concepts live in
 * their own section, so they are not mixed in here.
 */
export function AllProjects() {
  const [filter, setFilter] = useState<Filter>("all");
  const list = projects.filter((p) => p.category !== "freelance" && (filter === "all" || p.category === filter));
  return (
    <div className="space-y-5">
      <div role="group" aria-label="Filter projects by category" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === f ? "bg-ink text-paper" : "bg-white/70 text-ink-soft hover:bg-white"}`}
          >
            {f === "all" ? "All" : categoryMeta[f].title}
          </button>
        ))}
      </div>
      {filter !== "all" && <p className="text-sm text-ink-soft">{categoryMeta[filter].blurb}</p>}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {list.map((p) => (
          <li key={p.id}>
            <ProjectCard project={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
