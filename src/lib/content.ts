import type { Project } from "@/config/portfolio";

/** Helpers for the "missing content" conventions used in `config/portfolio.ts`. */

export const isTodo = (value: string | undefined | null): boolean =>
  !value || value.trim().length === 0 || value.trim().startsWith("TODO");

export const showTodos = process.env.NODE_ENV !== "production";

/** Keep real values always; keep TODO placeholders only in development. */
export const visible = (value: string | undefined | null): boolean =>
  !!value && value.trim().length > 0 && (showTodos || !isTodo(value));

export const visibleList = (values: string[]): string[] => values.filter(visible);

/** Strip the "TODO:" prefix for display. */
export const todoText = (value: string): string => value.replace(/^TODO:?\s*/, "");

/** The owner's display name, or a neutral fallback while it is still a placeholder. */
export const displayName = (name: string): string => (isTodo(name) ? (showTodos ? "Your Name" : "Portfolio") : name);

/** Dev-only checklist of case-study fields that still need real content. */
export function missingFields(p: Project): string[] {
  const missing: string[] = [];
  if (!p.status) missing.push("status");
  if (!p.role) missing.push("my role");
  if (!p.problem) missing.push("problem");
  if (!p.solution) missing.push("solution");
  if (p.technologies.length === 0) missing.push("verified technologies");
  if (p.challenges.length === 0 && p.caseStudy.debugging.length === 0) missing.push("challenges");
  if (p.outcomes.length === 0 && p.caseStudy.lessons.length === 0) missing.push("results / lessons");
  if (p.media.length === 0) missing.push("screenshots / media");
  if (!p.repoUrl && !p.demoUrl) missing.push("repo / demo URL");
  return missing;
}
