import { create } from "zustand";
import { sectionOrder, type AboutTab, type SectionId } from "@/config/portfolio";
import { TIME_ORDER, type TimeOfDay } from "@/config/world";
import type { GamePhase } from "@/types/game";

export type EasterEgg = "honk" | "konami" | "sudo" | "hidden-token" | "night-drive";

interface OpenOptions {
  projectId?: string | null;
  tab?: AboutTab;
}

interface GameState {
  phase: GamePhase;
  /** Phase to return to after closing the menu. */
  resumePhase: GamePhase;
  activeSection: SectionId | null;
  aboutTab: AboutTab;
  journeyStop: number;
  selectedProjectId: string | null;
  nearDestination: SectionId | null;
  nearTooFast: boolean;
  discovered: SectionId[];
  lastDiscovery: { id: SectionId; at: number } | null;
  /** Indices of collected engineering tokens. */
  tokens: number[];
  lastToken: { index: number; at: number } | null;
  eggs: EasterEgg[];
  lastEgg: { id: EasterEgg; at: number } | null;
  celebrated: boolean;
  celebrating: boolean;
  goldPaint: boolean;
  timeOfDay: TimeOfDay;
  soundOn: boolean;
  helpOpen: boolean;
  mapOpen: boolean;
  terminalOpen: boolean;
  fading: boolean;
  stuckHint: boolean;
  lowFpsHint: boolean;

  setPhase: (phase: GamePhase) => void;
  startDriving: () => void;
  openSection: (id: SectionId, opts?: OpenOptions) => void;
  closeSection: () => void;
  setAboutTab: (tab: AboutTab) => void;
  setJourneyStop: (i: number) => void;
  selectProject: (id: string | null) => void;
  setNear: (id: SectionId | null, tooFast: boolean) => void;
  discover: (id: SectionId) => void;
  collectToken: (index: number) => void;
  findEgg: (id: EasterEgg) => void;
  setCelebrating: (on: boolean) => void;
  setTimeOfDay: (t: TimeOfDay) => void;
  cycleTimeOfDay: () => void;
  toggleSound: () => void;
  setSound: (on: boolean) => void;
  setHelp: (open: boolean) => void;
  setMap: (open: boolean) => void;
  setTerminal: (open: boolean) => void;
  pause: () => void;
  resume: () => void;
  setFading: (f: boolean) => void;
  setStuckHint: (s: boolean) => void;
  setLowFpsHint: (s: boolean) => void;
  resetProgress: () => void;
}

const PROGRESS_KEY = "portfolio:progress:v2";

interface SavedProgress {
  discovered: SectionId[];
  tokens: number[];
  eggs: EasterEgg[];
  celebrated: boolean;
  timeOfDay: TimeOfDay;
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return;
    const p = JSON.parse(raw) as Partial<SavedProgress>;
    useGame.setState({
      discovered: (p.discovered ?? []).filter((d) => sectionOrder.includes(d)),
      tokens: Array.isArray(p.tokens) ? p.tokens : [],
      eggs: Array.isArray(p.eggs) ? p.eggs : [],
      celebrated: !!p.celebrated,
      timeOfDay: p.timeOfDay && TIME_ORDER.includes(p.timeOfDay) ? p.timeOfDay : "sunset",
      goldPaint: (p.eggs ?? []).includes("konami"),
    });
  } catch {
    /* storage unavailable or corrupt — start fresh */
  }
}

function saveProgress(s: GameState) {
  try {
    const p: SavedProgress = { discovered: s.discovered, tokens: s.tokens, eggs: s.eggs, celebrated: s.celebrated, timeOfDay: s.timeOfDay };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

/** Persist progress whenever a saved field changes. */
export function persistProgress() {
  return useGame.subscribe((s, prev) => {
    if (
      s.discovered !== prev.discovered ||
      s.tokens !== prev.tokens ||
      s.eggs !== prev.eggs ||
      s.celebrated !== prev.celebrated ||
      s.timeOfDay !== prev.timeOfDay
    )
      saveProgress(s);
  });
}

export const useGame = create<GameState>((set, get) => ({
  phase: "loading",
  resumePhase: "driving",
  activeSection: null,
  aboutTab: "journey",
  journeyStop: 0,
  selectedProjectId: null,
  nearDestination: null,
  nearTooFast: false,
  discovered: [],
  lastDiscovery: null,
  tokens: [],
  lastToken: null,
  eggs: [],
  lastEgg: null,
  celebrated: false,
  celebrating: false,
  goldPaint: false,
  timeOfDay: "sunset",
  soundOn: true,
  helpOpen: false,
  mapOpen: false,
  terminalOpen: false,
  fading: false,
  stuckHint: false,
  lowFpsHint: false,

  setPhase: (phase) => set({ phase }),
  startDriving: () => set({ phase: "driving" }),
  openSection: (id, opts = {}) => {
    const { discovered, aboutTab } = get();
    set({
      phase: "panel",
      activeSection: id,
      mapOpen: false,
      aboutTab: id === "about" ? (opts.tab ?? aboutTab) : aboutTab,
      selectedProjectId: opts.projectId ?? null,
    });
    if (!discovered.includes(id)) get().discover(id);
  },
  closeSection: () => set({ phase: "driving", activeSection: null, selectedProjectId: null }),
  setAboutTab: (aboutTab) => set({ aboutTab }),
  setJourneyStop: (journeyStop) => set({ journeyStop }),
  selectProject: (id) => set({ selectedProjectId: id }),
  setNear: (id, tooFast) => {
    const s = get();
    if (s.nearDestination !== id || s.nearTooFast !== tooFast) set({ nearDestination: id, nearTooFast: tooFast });
  },
  discover: (id) => {
    const { discovered, celebrated } = get();
    if (discovered.includes(id)) return;
    const next = [...discovered, id];
    const complete = !celebrated && sectionOrder.every((s) => next.includes(s));
    set({
      discovered: next,
      lastDiscovery: { id, at: Date.now() },
      ...(complete ? { celebrated: true, celebrating: true } : {}),
    });
  },
  collectToken: (index) => {
    const { tokens } = get();
    if (tokens.includes(index)) return;
    set({ tokens: [...tokens, index], lastToken: { index, at: Date.now() } });
  },
  findEgg: (id) => {
    const { eggs } = get();
    if (eggs.includes(id)) return;
    set({ eggs: [...eggs, id], lastEgg: { id, at: Date.now() }, ...(id === "konami" ? { goldPaint: true } : {}) });
  },
  setCelebrating: (celebrating) => set({ celebrating }),
  setTimeOfDay: (timeOfDay) => {
    set({ timeOfDay });
    if (timeOfDay === "night") get().findEgg("night-drive");
  },
  cycleTimeOfDay: () => {
    const i = TIME_ORDER.indexOf(get().timeOfDay);
    get().setTimeOfDay(TIME_ORDER[(i + 1) % TIME_ORDER.length]);
  },
  toggleSound: () => set({ soundOn: !get().soundOn }),
  setSound: (on) => set({ soundOn: on }),
  setHelp: (open) => set({ helpOpen: open }),
  setMap: (mapOpen) => set({ mapOpen }),
  setTerminal: (terminalOpen) => set({ terminalOpen }),
  pause: () => {
    const { phase } = get();
    if (phase === "paused" || phase === "loading") return;
    set({ phase: "paused", resumePhase: phase });
  },
  resume: () => {
    const { phase, resumePhase } = get();
    if (phase === "paused") set({ phase: resumePhase === "paused" ? "driving" : resumePhase });
  },
  setFading: (fading) => set({ fading }),
  setStuckHint: (stuckHint) => {
    if (get().stuckHint !== stuckHint) set({ stuckHint });
  },
  setLowFpsHint: (lowFpsHint) => set({ lowFpsHint }),
  resetProgress: () => {
    set({
      discovered: [],
      tokens: [],
      eggs: [],
      celebrated: false,
      celebrating: false,
      goldPaint: false,
      lastDiscovery: null,
      lastToken: null,
      lastEgg: null,
    });
    try {
      localStorage.removeItem(PROGRESS_KEY);
    } catch {
      /* ignore */
    }
  },
}));
