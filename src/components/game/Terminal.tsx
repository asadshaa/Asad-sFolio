"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  about,
  contact,
  credentials,
  cvLink,
  journey,
  profile,
  projects,
  sectionMeta,
  sectionOrder,
  skillLevels,
  skills,
  statusMeta,
  timeline,
  type ProjectCategory,
  type SectionId,
} from "@/config/portfolio";
import { TIME_ORDER, type TimeOfDay } from "@/config/world";
import { travelTo } from "@/lib/travel";
import { sound } from "@/lib/audio";
import { getWorld } from "@/lib/world/world";
import { useGame } from "@/state/gameStore";

type Line = { id: number; node: ReactNode; kind?: "in" | "out" | "err" | "ok" };

const COMMANDS: [string, string][] = [
  ["help", "list commands"],
  ["about", "who I am"],
  ["projects", "software & AI projects  (projects --labs | --concepts)"],
  ["open <id>", "open a project case study, e.g. open aureus-erp"],
  ["skills", "skills by experience level"],
  ["experience", "experience, education & training"],
  ["contact", "contact links"],
  ["cv", "open the CV"],
  ["goto <place>", "travel: home, garage, cloud, research, creative, lighthouse"],
  ["map", "open the world map"],
  ["time [day|sunset|night]", "change the time of day"],
  ["sound [on|off]", "toggle sound"],
  ["progress", "discoveries, tokens and easter eggs"],
  ["reset", "reset saved progress"],
  ["classic", "open the classic portfolio"],
  ["clear / exit", "clear the screen / close the terminal"],
];

const PLACES: Record<string, SectionId> = {
  home: "about",
  about: "about",
  garage: "projects",
  projects: "projects",
  cloud: "devops",
  devops: "devops",
  research: "research",
  island: "research",
  ai: "research",
  creative: "creative",
  concepts: "creative",
  freelance: "creative",
  lighthouse: "contact",
  contact: "contact",
};

const Link = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button type="button" onClick={onClick} className="text-gold underline underline-offset-2 hover:text-white">
    {children}
  </button>
);

function listProjects(cat: ProjectCategory[], run: (cmd: string) => void) {
  return (
    <div>
      {projects
        .filter((p) => cat.includes(p.category))
        .map((p) => (
          <div key={p.id}>
            <Link onClick={() => run(`open ${p.id}`)}>{p.id.padEnd(22, " ")}</Link>{" "}
            <span className="text-paper/80">{p.name}</span>
            {p.status && <span className="text-paper/50"> [{statusMeta[p.status].label}]</span>}
          </div>
        ))}
      <div className="mt-1 text-paper/50">Click an id or type: open &lt;id&gt;</div>
    </div>
  );
}

/** Hidden developer terminal (press ` or use the menu). */
export function Terminal() {
  const router = useRouter();
  const open = useGame((s) => s.terminalOpen);
  const setTerminal = useGame((s) => s.setTerminal);
  const [lines, setLines] = useState<Line[]>([]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => input.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [lines]);

  const print = (node: ReactNode, kind: Line["kind"] = "out") => setLines((l) => [...l, { id: nextId.current++, node, kind }].slice(-120));

  const run = (raw: string) => {
    const cmdline = raw.trim();
    if (!cmdline) return;
    print(`$ ${cmdline}`, "in");
    setHistory((h) => [cmdline, ...h.filter((x) => x !== cmdline)].slice(0, 30));
    setHIdx(-1);
    const [cmd, ...args] = cmdline.split(/\s+/);
    const arg = args.join(" ").toLowerCase();
    const g = useGame.getState();

    switch (cmd.toLowerCase()) {
      case "help":
        print(
          <div>
            {COMMANDS.map(([c, d]) => (
              <div key={c}>
                <span className="text-gold">{c.padEnd(24, " ")}</span>
                <span className="text-paper/70">{d}</span>
              </div>
            ))}
          </div>,
        );
        break;
      case "about":
      case "whoami":
        print(
          <div>
            <div className="text-white">{profile.name}</div>
            <div className="text-paper/80">{about.tagline}</div>
            <div className="mt-1 text-paper/70">{profile.positioning}</div>
            <div className="mt-1">
              {journey.map((j, i) => (
                <div key={j.id} className="text-paper/70">
                  {i + 1}. {j.title} — {j.subtitle}
                </div>
              ))}
            </div>
            <div className="mt-1">
              <Link onClick={() => travelTo("about", { tab: "journey" })}>→ go to Home</Link>
            </div>
          </div>,
        );
        break;
      case "projects":
        if (arg.includes("lab")) print(listProjects(["devops-lab"], run));
        else if (arg.includes("concept") || arg.includes("freelance")) print(listProjects(["freelance"], run));
        else print(listProjects(["professional", "ai-apps"], run));
        break;
      case "labs":
        print(listProjects(["devops-lab"], run));
        break;
      case "concepts":
        print(listProjects(["freelance"], run));
        break;
      case "open": {
        const p = projects.find((x) => x.id === arg || x.name.toLowerCase() === arg);
        if (!p) {
          print(`No project "${arg}". Try: projects`, "err");
          break;
        }
        print(`Opening ${p.name} at the ${sectionMeta[p.destination].place}…`, "ok");
        travelTo(p.destination, { projectId: p.id });
        setTerminal(false);
        break;
      }
      case "skills":
        print(
          <div>
            {(["experienced", "working", "learning"] as const).map((lvl) => (
              <div key={lvl} className="mb-1">
                <div className="text-gold">{skillLevels[lvl].label}</div>
                {skills
                  .filter((s) => s.level === lvl)
                  .map((s) => (
                    <div key={s.id} className="text-paper/75">
                      {"  "}
                      {s.title}: {s.items.join(", ")}
                    </div>
                  ))}
              </div>
            ))}
            <Link onClick={() => travelTo("about", { tab: "skills" })}>→ open skills & training</Link>
          </div>,
        );
        break;
      case "experience":
        print(
          <div>
            {timeline.map((t) => (
              <div key={t.id} className="text-paper/80">
                {t.period.padEnd(12, " ")} {t.title} — {t.organization}
              </div>
            ))}
            <div className="mt-1 text-gold">Training</div>
            {credentials.map((c) => (
              <div key={c.id} className="text-paper/70">
                {"  "}
                {c.title}
                {c.issuer ? ` (${c.issuer})` : ""}
              </div>
            ))}
            <Link onClick={() => travelTo("about", { tab: "experience" })}>→ open the timeline</Link>
          </div>,
        );
        break;
      case "contact": {
        const links = contact.links.filter((l) => l.href);
        print(
          <div>
            <div className="text-paper/80">{contact.blurb}</div>
            {links.length === 0 && <div className="text-paper/60">Contact links haven&apos;t been published yet.</div>}
            {links.map((l) => (
              <div key={l.kind}>
                <span className="text-gold">{l.label.padEnd(14, " ")}</span>
                <a className="underline" href={l.kind === "email" && !l.href.startsWith("mailto:") ? `mailto:${l.href}` : l.href} target="_blank" rel="noopener noreferrer">
                  {l.href.replace(/^mailto:/, "")}
                </a>
              </div>
            ))}
            <Link onClick={() => travelTo("contact")}>→ go to the Lighthouse</Link>
          </div>,
        );
        break;
      }
      case "cv": {
        const cv = cvLink();
        if (cv) {
          window.open(cv, "_blank", "noopener,noreferrer");
          print("Opening CV in a new tab…", "ok");
        } else {
          print("The CV hasn't been published here yet — heading to the Lighthouse contact point.", "err");
          travelTo("contact");
          setTerminal(false);
        }
        break;
      }
      case "goto":
      case "cd": {
        const target = PLACES[arg];
        if (!target) {
          print(`Unknown place "${arg}". Places: ${Object.keys(PLACES).filter((k, i, a) => a.indexOf(k) === i).slice(0, 14).join(", ")}`, "err");
          break;
        }
        print(`Travelling to ${sectionMeta[target].place}…`, "ok");
        travelTo(target);
        setTerminal(false);
        break;
      }
      case "ls":
        print(sectionOrder.map((s) => `${sectionMeta[s].place.toLowerCase().replace(/ /g, "-")}/`).join("  "));
        break;
      case "map":
        setTerminal(false);
        g.setMap(true);
        break;
      case "time": {
        const t = arg as TimeOfDay;
        if (arg && !TIME_ORDER.includes(t)) {
          print("Usage: time day | sunset | night", "err");
          break;
        }
        if (arg) g.setTimeOfDay(t);
        else g.cycleTimeOfDay();
        print(`Time of day: ${useGame.getState().timeOfDay}`, "ok");
        break;
      }
      case "sound":
        if (arg === "on" || arg === "off") g.setSound(arg === "on");
        else g.toggleSound();
        sound.start();
        print(`Sound ${useGame.getState().soundOn ? "on" : "off"}`, "ok");
        break;
      case "progress": {
        const total = getWorld().tokens.length;
        print(
          <div className="text-paper/80">
            <div>Places discovered: {g.discovered.length}/{sectionOrder.length}</div>
            <div>Engineering tokens: {g.tokens.length}/{total}</div>
            <div>Easter eggs: {g.eggs.length ? g.eggs.join(", ") : "none yet"}</div>
          </div>,
        );
        break;
      }
      case "reset":
        if (arg === "--yes" || arg === "-y") {
          g.resetProgress();
          print("Progress reset. The world is undiscovered again.", "ok");
        } else print("This clears discoveries, tokens and easter eggs. Type: reset --yes", "err");
        break;
      case "classic":
        print("Opening the classic portfolio…", "ok");
        router.push("/portfolio");
        break;
      case "sudo":
        g.findEgg("sudo");
        print("Permission granted — to keep exploring. (Easter egg found.)", "ok");
        break;
      case "honk":
        sound.start();
        sound.honk();
        g.findEgg("honk");
        print("Beep beep.", "ok");
        break;
      case "clear":
        setLines([]);
        break;
      case "exit":
      case "quit":
        setTerminal(false);
        break;
      default:
        print(`command not found: ${cmd}. Type "help".`, "err");
    }
  };

  const complete = () => {
    const names = ["help", "about", "projects", "open ", "skills", "experience", "contact", "cv", "goto ", "map", "time ", "sound ", "progress", "reset", "classic", "clear", "exit"];
    const match = names.filter((n) => n.startsWith(value.toLowerCase()));
    if (value.startsWith("open ")) {
      const q = value.slice(5).toLowerCase();
      const ids = projects.map((p) => p.id).filter((id) => id.startsWith(q));
      if (ids.length === 1) setValue(`open ${ids[0]}`);
      else if (ids.length > 1) print(ids.join("  "));
    } else if (match.length === 1) setValue(match[0]);
    else if (match.length > 1) print(match.join("  "));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          key="terminal"
          role="dialog"
          aria-modal="false"
          aria-label="Developer terminal"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-x-2 bottom-2 z-[54] flex max-h-[60dvh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#141827]/95 font-mono text-[0.8rem] text-paper shadow-2xl backdrop-blur md:inset-x-auto md:bottom-6 md:left-6 md:w-[640px]"
          onClick={() => input.current?.focus()}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-paper/60">
            <span>asad@tiny-planet: ~</span>
            <button type="button" onClick={() => setTerminal(false)} aria-label="Close terminal" className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/10">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div ref={scroller} className="scroll-soft min-h-40 flex-1 space-y-1 overflow-y-auto whitespace-pre-wrap px-4 py-3" aria-live="polite">
            {lines.length === 0 && (
              <div className="text-paper/60">
                Welcome to the developer terminal. Type <span className="text-gold">help</span> to list commands. Press <span className="text-gold">`</span> or Esc to close.
              </div>
            )}
            {lines.map((l) => (
              <div key={l.id} className={l.kind === "in" ? "text-white" : l.kind === "err" ? "text-coral-soft" : l.kind === "ok" ? "text-[#9be0a8]" : "text-paper/85"}>
                {l.node}
              </div>
            ))}
          </div>
          <form
            className="flex items-center gap-2 border-t border-white/10 px-4 py-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              run(value);
              setValue("");
            }}
          >
            <span aria-hidden className="text-gold">
              $
            </span>
            <label htmlFor="terminal-input" className="sr-only">
              Terminal command
            </label>
            <input
              id="terminal-input"
              ref={input}
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/`/g, ""))}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent text-paper outline-none placeholder:text-paper/30"
              placeholder="help"
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const i = Math.min(history.length - 1, hIdx + 1);
                  if (history[i]) {
                    setHIdx(i);
                    setValue(history[i]);
                  }
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  const i = hIdx - 1;
                  setHIdx(Math.max(-1, i));
                  setValue(i >= 0 ? history[i] : "");
                } else if (e.key === "Tab") {
                  e.preventDefault();
                  complete();
                } else if (e.key === "Escape") {
                  setTerminal(false);
                }
              }}
            />
          </form>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
