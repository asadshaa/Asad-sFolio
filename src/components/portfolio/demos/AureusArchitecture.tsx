"use client";

import { useState } from "react";
import { projectById } from "@/config/portfolio";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  /** Module name in the config whose areas describe this node. */
  module?: string;
  text?: string;
}

const NODES: Node[] = [
  { id: "db", label: "MySQL database", x: 200, y: 150, text: "MySQL — the database listed in the project's stack." },
  { id: "acc", label: "Accounting", x: 70, y: 52, module: "Accounting" },
  { id: "hr", label: "HR workflows", x: 330, y: 52, module: "HR workflows & approvals" },
  { id: "appr", label: "Approvals", x: 200, y: 30, module: "HR workflows & approvals" },
  { id: "docs", label: "Documents", x: 330, y: 250, module: "Documents" },
  { id: "imp", label: "Imports / parser", x: 70, y: 250, module: "Imports & parsing" },
];

const EDGES: [string, string][] = [
  ["acc", "db"],
  ["hr", "db"],
  ["docs", "db"],
  ["imp", "db"],
  ["appr", "acc"],
  ["appr", "hr"],
  ["imp", "acc"],
];

/**
 * Conceptual module map for Aureus ERP, built only from the modules listed in
 * the content config. Nodes are buttons (keyboard accessible).
 */
export function AureusArchitecture() {
  const project = projectById("aureus-erp");
  const [active, setActive] = useState<string>("db");
  const node = NODES.find((n) => n.id === active)!;
  const mod = project?.modules.find((m) => m.name === node.module);
  const pos = (id: string) => NODES.find((n) => n.id === id)!;

  return (
    <figure className="rounded-2xl border border-ink/10 bg-white/70 p-4">
      <svg viewBox="0 0 400 290" className="mx-auto h-auto w-full max-w-md" role="img" aria-label="Aureus ERP module map: accounting, approvals, HR workflows, documents and imports connected to a shared MySQL database.">
        {EDGES.map(([a, b]) => {
          const on = active === a || active === b;
          return (
            <line
              key={a + b}
              x1={pos(a).x}
              y1={pos(a).y}
              x2={pos(b).x}
              y2={pos(b).y}
              stroke={on ? "#d9472f" : "#1d2230"}
              strokeOpacity={on ? 0.8 : 0.18}
              strokeWidth={on ? 2.5 : 1.5}
              strokeDasharray={on ? "0" : "4 4"}
            />
          );
        })}
        {NODES.map((n) => {
          const on = n.id === active;
          const w = n.id === "db" ? 128 : 112;
          return (
            <g key={n.id} transform={`translate(${n.x - w / 2} ${n.y - 17})`} onMouseEnter={() => setActive(n.id)} onClick={() => setActive(n.id)} className="cursor-pointer">
              <rect width={w} height={34} rx={n.id === "db" ? 17 : 10} fill={on ? "#1d2230" : n.id === "db" ? "#f2b84b" : "#fbf6ee"} stroke="#1d2230" strokeOpacity={0.25} />
              <text x={w / 2} y={21.5} textAnchor="middle" fontSize="12.5" fontWeight={700} fill={on ? "#fbf6ee" : "#1d2230"}>
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Modules">
        {NODES.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => setActive(n.id)}
            aria-pressed={active === n.id}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${active === n.id ? "bg-ink text-paper" : "bg-ink/5 text-ink-soft hover:bg-ink/10"}`}
          >
            {n.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink" aria-live="polite">
        <strong>{node.label}:</strong> {mod ? mod.areas.join(" · ") : node.text}
      </p>
      <figcaption className="mt-2 text-xs text-ink-soft">Conceptual overview built from the listed modules — not a complete system diagram.</figcaption>
    </figure>
  );
}
