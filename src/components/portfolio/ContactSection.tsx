import { Code, FileDown, Globe, Link as LinkIcon, Mail } from "lucide-react";
import { contact, cvLink, type ContactLink } from "@/config/portfolio";
import { EnquiryForm } from "./EnquiryForm";

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

function displayFor(l: ContactLink) {
  if (l.kind === "email") return l.href.replace(/^mailto:/, "");
  if (l.kind === "cv") return "PDF";
  try {
    const u = new URL(l.href);
    return (u.host.replace(/^www\./, "") + u.pathname).replace(/\/$/, "");
  } catch {
    return l.href;
  }
}

/** Contact: heading, real links from the config, CV download and an email-based enquiry form. */
export function ContactSection({ showHeading = true }: { showHeading?: boolean }) {
  const links = contact.links.filter((l) => l.href && l.kind !== "cv");
  const cv = cvLink();
  return (
    <div className="space-y-5">
      {showHeading && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral">{contact.label}</p>
          <p className="font-display text-2xl font-bold leading-tight">{contact.heading}</p>
        </div>
      )}
      <p className="text-[1.05rem] leading-relaxed text-ink-soft">{contact.blurb}</p>

      <div className="flex flex-wrap gap-2">
        <a
          href={`mailto:${contact.email}`}
          className="inline-flex items-center gap-2 rounded-full bg-coral px-5 py-3 font-semibold text-white transition hover:bg-coral/90"
        >
          <Mail className="h-4 w-4" aria-hidden /> {contact.primaryCta}
        </a>
        {cv && (
          <a href={cv} download className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-semibold text-paper transition hover:bg-ink/85">
            <FileDown className="h-4 w-4" aria-hidden /> {contact.cvCta}
          </a>
        )}
      </div>

      <ul className="grid gap-2.5">
        {links.map((l) => {
          const external = l.kind !== "email";
          return (
            <li key={l.kind + l.href}>
              <a
                href={l.href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group flex items-center gap-3 rounded-2xl border border-ink/8 bg-white/70 p-3.5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-paper">
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

      <EnquiryForm />
    </div>
  );
}
