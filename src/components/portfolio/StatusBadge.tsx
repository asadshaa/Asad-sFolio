import { statusMeta, type Project } from "@/config/portfolio";

/** Status pill. Renders nothing when the status is not confirmed (null). */
export function StatusBadge({ project, withNote = false }: { project: Project; withNote?: boolean }) {
  if (!project.status) return null;
  const meta = statusMeta[project.status];
  const tone =
    meta.tone === "solid"
      ? "bg-moss text-white border-moss"
      : meta.tone === "soft"
        ? "bg-gold/20 text-ink border-gold/40"
        : "bg-transparent text-ink-soft border-ink/25 border-dashed";
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide ${tone}`}>
        {meta.label}
      </span>
      {withNote && project.statusNote && <span className="text-xs text-ink-soft">{project.statusNote}</span>}
    </span>
  );
}
