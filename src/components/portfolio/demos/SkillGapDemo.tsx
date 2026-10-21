"use client";

import { useMemo, useState } from "react";

/**
 * Illustrative skill-gap analysis showing the *planned* deterministic matching
 * idea behind Skill-Bridge. All data below is sample data, not output of the
 * real application.
 */

const ALIASES: Record<string, string> = {
  js: "javascript",
  "node.js": "node",
  nodejs: "node",
  "express.js": "express",
  reactjs: "react",
  postgres: "sql",
  postgresql: "sql",
  mysql: "sql",
  k8s: "kubernetes",
};

const normalize = (s: string) => {
  const k = s.trim().toLowerCase();
  return ALIASES[k] ?? k;
};

const SAMPLE_RESUME = ["JavaScript", "React", "Node.js", "Express.js", "MongoDB", "Git", "Docker"];

const SAMPLE_ROLES: { id: string; title: string; required: string[] }[] = [
  { id: "fullstack", title: "Junior Full-Stack Developer (sample)", required: ["JavaScript", "React", "Node", "Express", "SQL", "Testing", "Git"] },
  { id: "devops", title: "Junior DevOps Engineer (sample)", required: ["Linux", "Docker", "CI/CD", "AWS", "Terraform", "Monitoring", "Git"] },
  { id: "ml", title: "ML Engineer Intern (sample)", required: ["Python", "TensorFlow", "Data preprocessing", "SQL", "Git"] },
];

const ROADMAP: Record<string, string> = {
  sql: "Model a small relational schema and rewrite one Mongo feature in SQL.",
  testing: "Add unit and API tests to an existing Express project.",
  linux: "Run a project on a Linux VM and script its setup.",
  "ci/cd": "Build a pipeline that tests and deploys on every push.",
  aws: "Deploy an app on EC2 behind a load balancer.",
  terraform: "Recreate the AWS setup as infrastructure-as-code.",
  monitoring: "Expose metrics and graph them with Prometheus.",
  python: "Rebuild a small data script in Python.",
  tensorflow: "Train a tiny image classifier end to end.",
  "data preprocessing": "Clean and augment an image dataset before training.",
};

export function SkillGapDemo() {
  const [resume, setResume] = useState<string[]>(SAMPLE_RESUME);
  const [roleId, setRoleId] = useState(SAMPLE_ROLES[0].id);
  const [draft, setDraft] = useState("");
  const role = SAMPLE_ROLES.find((r) => r.id === roleId)!;

  const result = useMemo(() => {
    const have = new Set(resume.map(normalize));
    const matched = role.required.filter((r) => have.has(normalize(r)));
    const missing = role.required.filter((r) => !have.has(normalize(r)));
    return { matched, missing, score: Math.round((matched.length / role.required.length) * 100) };
  }, [resume, role]);

  const addSkill = () => {
    const v = draft.trim();
    if (v && !resume.some((r) => normalize(r) === normalize(v))) setResume([...resume, v]);
    setDraft("");
  };

  return (
    <figure className="rounded-2xl border border-ink/10 bg-white/70 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Sample résumé skills</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {resume.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setResume(resume.filter((r) => r !== s))}
                  className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold hover:bg-coral/15"
                  aria-label={`Remove ${s}`}
                >
                  {s} ×
                </button>
              </li>
            ))}
          </ul>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addSkill();
            }}
          >
            <label className="sr-only" htmlFor="skill-add">
              Add a skill
            </label>
            <input
              id="skill-add"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a skill, e.g. SQL"
              className="min-w-0 flex-1 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-sm"
            />
            <button type="submit" className="rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-paper">
              Add
            </button>
          </form>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-ink-soft" htmlFor="role-pick">
            Sample job description
          </label>
          <select id="role-pick" value={roleId} onChange={(e) => setRoleId(e.target.value)} className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm">
            {SAMPLE_ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>
        <div aria-live="polite">
          <div className="flex items-end justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Skill coverage</p>
            <p className="font-display text-3xl font-bold tabular-nums">{result.score}%</p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-ink/10">
            <div className="h-2 rounded-full bg-moss transition-all" style={{ width: `${result.score}%` }} />
          </div>
          <p className="mt-3 text-xs font-semibold text-moss">Matched</p>
          <p className="text-sm">{result.matched.join(", ") || "—"}</p>
          <p className="mt-2 text-xs font-semibold text-coral">Gaps</p>
          <p className="text-sm">{result.missing.join(", ") || "None — great match!"}</p>
          {result.missing.length > 0 && (
            <>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-ink-soft">Suggested roadmap</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
                {result.missing.map((m) => (
                  <li key={m}>{ROADMAP[normalize(m)] ?? `Build a small project that uses ${m}.`}</li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-ink-soft">
        Illustrative data. Shows the planned deterministic matching idea (normalised names + aliases → matched / missing → roadmap). Not output from the Skill-Bridge application.
      </figcaption>
    </figure>
  );
}
