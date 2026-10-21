"use client";

import { useState } from "react";
import { Check, CircleDashed, Clock3 } from "lucide-react";
import type { ChecklistItem } from "@/config/portfolio";

type Filter = "all" | ChecklistItem["state"];

const LABEL: Record<ChecklistItem["state"], string> = { done: "Done", verify: "To verify", planned: "Planned" };

function StateIcon({ state }: { state: ChecklistItem["state"] }) {
  if (state === "done")
    return (
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-moss text-white">
        <Check className="h-3 w-3" aria-hidden />
      </span>
    );
  if (state === "verify")
    return (
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-gold-deep/60 text-gold-deep">
        <Clock3 className="h-3 w-3" aria-hidden />
      </span>
    );
  return (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-ink-soft">
      <CircleDashed className="h-5 w-5" aria-hidden />
    </span>
  );
}

/**
 * Development checklist with real states — not decorative progress. "Done"
 * items are supported by the CV or Asad's own account; "To verify" items are
 * not yet confirmed and are not claimed as implemented.
 */
export function DevChecklist({ items }: { items: ChecklistItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const counts = { done: 0, verify: 0, planned: 0 };
  items.forEach((i) => counts[i.state]++);
  const filters: Filter[] = ["all", ...(["done", "verify", "planned"] as const).filter((s) => counts[s] > 0)];
  const shown = filter === "all" ? items : items.filter((i) => i.state === filter);

  return (
    <div className="space-y-3">
      {filters.length > 2 && (
        <div role="group" aria-label="Filter checklist" className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filter === f ? "bg-ink text-paper" : "bg-ink/5 text-ink-soft hover:bg-ink/10"}`}
            >
              {f === "all" ? `All · ${items.length}` : `${LABEL[f]} · ${counts[f]}`}
            </button>
          ))}
        </div>
      )}
      <ul className="space-y-1.5">
        {shown.map((i) => (
          <li key={i.text} className="flex items-start gap-2.5">
            <StateIcon state={i.state} />
            <span className={`leading-snug ${i.state === "done" ? "text-ink" : "text-ink-soft"}`}>
              {i.text}
              {i.state !== "done" && (
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${i.state === "verify" ? "bg-gold/25 text-gold-deep" : "bg-ink/5 text-ink-soft"}`}>
                  {LABEL[i.state]}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {counts.verify > 0 && (
        <p className="text-xs text-ink-soft">
          <strong>To verify</strong> — not yet confirmed from the CV or source code, so it isn&apos;t claimed as implemented.
        </p>
      )}
    </div>
  );
}
