"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { contact } from "@/config/portfolio";

/**
 * Enquiry form without a backend: it composes an email in the visitor's own
 * mail app (mailto:). Nothing is sent from this page, and the UI says so —
 * there is no fake "message sent" confirmation.
 */
export function EnquiryForm() {
  const [opened, setOpened] = useState(false);

  return (
    <form
      className="space-y-3 rounded-2xl border border-ink/8 bg-white/70 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const name = String(f.get("name") ?? "").trim();
        const type = String(f.get("type") ?? "").trim();
        const subject = `${type || "Enquiry"} — from ${name || "your portfolio"}`;
        const body = [
          `Name: ${name}`,
          `Email: ${String(f.get("email") ?? "").trim()}`,
          `Type: ${type}`,
          String(f.get("timeline") ?? "").trim() ? `Budget / timeline: ${String(f.get("timeline")).trim()}` : "",
          "",
          String(f.get("message") ?? "").trim(),
        ]
          .filter((l, i) => l !== "" || i === 4)
          .join("\n");
        window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setOpened(true);
      }}
    >
      <p className="font-semibold">Send an enquiry</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-ink-soft">Name</span>
          <input name="name" required autoComplete="name" className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink-soft">Email</span>
          <input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2" />
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium text-ink-soft">Project or opportunity</span>
        <select name="type" className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2">
          {contact.enquiryTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-medium text-ink-soft">Brief description</span>
        <textarea name="message" required rows={4} className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-ink-soft">Budget or timeline (optional)</span>
        <input name="timeline" className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85">
          <Send className="h-4 w-4" aria-hidden /> Open in my email app
        </button>
        <p className="text-xs text-ink-soft">This opens your email app with the message filled in — nothing is sent from this page.</p>
      </div>
      {opened && (
        <p role="status" className="rounded-xl bg-sand/70 px-3 py-2 text-sm">
          Your email app should have opened with the message ready to send. If it didn&apos;t, email me directly at{" "}
          <a className="font-semibold underline" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
          .
        </p>
      )}
    </form>
  );
}
