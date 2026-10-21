import { Award, ExternalLink } from "lucide-react";
import { credentials } from "@/config/portfolio";

/** Training & certificates. Dates, status and links render only when provided. */
export function CredentialsSection() {
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {credentials.map((c) => (
        <li key={c.id} className="flex gap-3 rounded-2xl border border-ink/8 bg-white/65 p-4">
          <Award className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold leading-snug">{c.title}</p>
            <p className="text-sm text-ink-soft">{[c.issuer, c.date].filter(Boolean).join(" · ")}</p>
            {c.status && (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-moss">{c.status === "completed" ? "Completed" : "In progress"}</p>
            )}
            {c.note && <p className="mt-1 text-xs text-ink-soft">{c.note}</p>}
            {c.url && (
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-coral hover:underline">
                Verify <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
