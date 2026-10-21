import type { ElementType, ReactNode } from "react";
import { isTodo, todoText, visible } from "@/lib/content";

/** Renders a config string, styling TODO placeholders (dev only) and hiding empty values. */
export function ContentText({
  value,
  as: Tag = "p",
  className = "",
  fallback,
}: {
  value: string;
  as?: ElementType;
  className?: string;
  /** Shown instead when the value is hidden (e.g. a TODO name in production). */
  fallback?: string;
}) {
  if (!visible(value)) return fallback ? <Tag className={className}>{fallback}</Tag> : null;
  if (isTodo(value)) {
    return (
      <Tag className={`${className} todo`} title="Placeholder — edit src/config/portfolio.ts">
        {todoText(value)}
      </Tag>
    );
  }
  return <Tag className={className}>{value}</Tag>;
}

export function SectionHeading({
  level = 2,
  children,
  className = "",
}: {
  level?: 2 | 3;
  children: ReactNode;
  className?: string;
}) {
  const Tag = level === 2 ? "h2" : "h3";
  return <Tag className={`font-display font-bold tracking-tight text-ink ${className}`}>{children}</Tag>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-coral">{children}</p>;
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-full border border-ink/10 bg-white/70 px-3 py-1 text-sm font-medium text-ink-soft">{children}</li>
  );
}
