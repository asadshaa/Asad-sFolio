import { Code, FileDown, Globe, Link as LinkIcon, Mail } from "lucide-react";
import { contact, type ContactLink } from "@/config/portfolio";
import { showTodos } from "@/lib/content";
import { ContentText } from "./ContentText";

function LinkedInMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="6" y="10" width="2.6" height="8" />
      <circle cx="7.3" cy="6.9" r="1.5" />
      <path d="M11 10h2.5v1.2c.5-.8 1.5-1.4 2.8-1.4 2.1 0 3.2 1.3 3.2 3.8V18h-2.6v-4c0-1.2-.5-1.9-1.5-1.9s-1.8.7-1.8 1.9v4H11z" />
    </svg>
  );
}

const ICONS: Record<ContactLink["kind"], (p: { className?: string }) => React.ReactNode> = {
  email: (p) => <Mail {...p} aria-hidden />,
  github: (p) => <Code {...p} aria-hidden />,
  linkedin: (p) => <LinkedInMark {...p} />,
  cv: (p) => <FileDown {...p} aria-hidden />,
  website: (p) => <Globe {...p} aria-hidden />,
  other: (p) => <LinkIcon {...p} aria-hidden />,
};

function hrefFor(l: ContactLink) {
  if (l.kind === "email" && !l.href.startsWith("mailto:")) return `mailto:${l.href}`;
  return l.href;
}

function displayFor(l: ContactLink) {
  if (l.kind === "email") return l.href.replace(/^mailto:/, "");
  if (l.kind === "cv") return "PDF";
  try {
    const u = new URL(l.href);
    return (u.host + u.pathname).replace(/\/$/, "");
  } catch {
    return l.href;
  }
}

export function ContactSection() {
  const links = contact.links.filter((l) => l.href);
  const missing = contact.links.filter((l) => !l.href);
  return (
    <div className="space-y-5">
      <ContentText value={contact.blurb} className="text-[1.05rem] leading-relaxed" />
      {links.length > 0 && (
        <ul className="grid gap-2.5">
          {links.map((l) => {
            const external = l.kind !== "email" && l.kind !== "cv";
            return (
              <li key={l.kind + l.href}>
                <a
                  href={hrefFor(l)}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  {...(l.kind === "cv" ? { download: true } : {})}
                  className="group flex items-center gap-3 rounded-2xl border border-ink/8 bg-white/70 p-3.5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-coral text-white">
                    {ICONS[l.kind]({ className: "h-[1.1rem] w-[1.1rem]" })}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">{l.label}</span>
                    <span className="block truncate text-sm text-ink-soft">{displayFor(l)}</span>
                  </span>
                  {external && <span className="sr-only">(opens in a new tab)</span>}
                </a>
              </li>
            );
          })}
        </ul>
      )}
      {showTodos && missing.length > 0 && (
        <p className="todo text-sm">
          Add real links for: {missing.map((m) => m.label).join(", ")} in src/config/portfolio.ts — empty links are hidden in production.
        </p>
      )}
    </div>
  );
}
