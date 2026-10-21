/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PORTFOLIO CONTENT — the single source of truth for everything shown in the
 *  3D world, the in-game panels, the terminal, /portfolio and /projects/[id].
 *
 *  Rules:
 *   • Use `null` / "" / [] for anything not yet verified. Missing values are
 *     hidden in production; in development a small checklist lists what's missing.
 *   • `status: null` means "not confirmed yet" — no status badge is shown.
 *   • Never add invented metrics, URLs, clients, screenshots or results.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ───────────────────────────── types ───────────────────────────── */

/** World destinations (each has a 3D landmark and a panel). */
export type SectionId = "about" | "projects" | "devops" | "research" | "creative" | "contact";

/** Tabs inside the Home (about) panel. */
export type AboutTab = "journey" | "experience" | "skills";

export type ProjectCategory = "professional" | "ai-apps" | "devops-lab" | "freelance";

export type ProjectStatus = "completed" | "in-progress" | "personal" | "concept" | "proposed" | "experiment";

export interface MediaItem {
  /** Path under /public (e.g. "/projects/pos/checkout.png") or a video file ("/projects/app/demo.mp4"). */
  src: string;
  alt: string;
  caption?: string;
  /** "video" plays muted & looping (great for short screen recordings). Defaults to "image". */
  kind?: "image" | "video";
  /** Frame the media in a device: "phone" for mobile apps, "browser" for web apps. */
  device?: "phone" | "browser" | "none";
  /** Poster image for videos. */
  poster?: string;
}

export interface ProjectModule {
  name: string;
  areas: string[];
}

export interface CaseStudy {
  overview: string | null;
  context: string | null;
  architecture: string | null;
  decisions: string[];
  debugging: string[];
  lessons: string[];
}

/** Interactive, clearly-labelled illustrative demos available to case studies. */
export type DemoId = "aureus-architecture" | "pos-flow" | "skill-gap" | "fabric-pipeline";

export interface Project {
  id: string;
  name: string;
  category: ProjectCategory;
  status: ProjectStatus | null;
  /** Extra qualifier shown next to the status (e.g. "Opportunity discussed — scope to be confirmed"). */
  statusNote: string | null;
  summary: string;
  description: string | null;
  role: string | null;
  technologies: string[];
  /** Label for the technology list when it is not (yet) the actual stack, e.g. "Planned stack". */
  technologyLabel: string | null;
  focusAreas: string[];
  /** Planned features for concepts / work in progress — always shown as "planned". */
  plannedFeatures: string[];
  problem: string | null;
  solution: string | null;
  challenges: string[];
  /** Verified outcomes only. */
  outcomes: string[];
  media: MediaItem[];
  repoUrl: string | null;
  demoUrl: string | null;
  featured: boolean;
  destination: SectionId;
  accent: string;
  modules: ProjectModule[];
  caseStudy: CaseStudy;
  demo: DemoId | null;
}

export type SkillLevel = "comfortable" | "working" | "learning";

export interface SkillGroup {
  id: string;
  title: string;
  level: SkillLevel;
  items: string[];
  note: string | null;
}

export interface TimelineEntry {
  id: string;
  kind: "work" | "education";
  title: string;
  organization: string;
  period: string;
  location: string | null;
  summary: string | null;
  responsibilities: string[];
  highlights: string[];
}

export type CredentialStatus = "completed" | "in-progress";

export interface Credential {
  id: string;
  title: string;
  issuer: string;
  date: string | null;
  status: CredentialStatus | null;
  url: string | null;
  note: string | null;
}

export interface ContactLink {
  kind: "email" | "github" | "linkedin" | "cv" | "website" | "other";
  label: string;
  href: string;
}

export interface JourneyStop {
  id: string;
  title: string;
  subtitle: string;
  text: string;
  tags: string[];
}

export interface Concept {
  projectId: string;
  /** Mockup layout used by the procedural concept preview. */
  mockup: "landing" | "gallery" | "store" | "hero3d" | "video" | "dashboard";
}

/* ───────────────────────────── profile ───────────────────────────── */

export const profile = {
  name: "Asad Ullah Shah",
  initials: "AS",
  headline: "Developer. Builder. Problem Solver.",
  positioning:
    "Full-stack software developer building practical digital products, business applications and interactive experiences — expanding into cloud engineering, DevOps and AI-powered applications.",
  location: null as string | null,
  seoDescription:
    "Asad Ullah Shah — full-stack software developer. Explore an interactive 3D world to discover software projects, DevOps labs, AI experiments and freelance concepts.",
  /** Public URL once deployed (used for Open Graph). */
  siteUrl: "",
};

export const about = {
  tagline: "I build software that solves real problems.",
  paragraphs: [
    "I'm Asad Ullah Shah, a computer science graduate and software developer interested in building practical, reliable digital products — from full-stack applications and business systems to AI experiments and cloud infrastructure.",
    "I enjoy understanding how systems work, finding what's broken, and turning complicated workflows into something people can actually use.",
    "I'm continuing to grow as an engineer, with a focus on full-stack development, cloud engineering, DevOps, and intelligent applications.",
  ],
};

export const journey: JourneyStop[] = [
  {
    id: "beginning",
    title: "The Beginning",
    subtitle: "PAF-IAST · BS Computer Science · 2022–2026",
    text: "Where it started: a computer science degree at PAF-IAST, learning how software and systems fit together.",
    tags: ["Computer Science", "PAF-IAST"],
  },
  {
    id: "builder",
    title: "The Builder",
    subtitle: "Full-stack applications",
    text: "Building full-stack applications end to end — REST APIs, databases and the interfaces people actually use.",
    tags: ["React", "Next.js", "Node.js", "Express", "MongoDB", "SQL"],
  },
  {
    id: "problem-solver",
    title: "The Problem Solver",
    subtitle: "Business systems",
    text: "Working inside real business workflows: debugging, ERP integration and keeping data consistent and trustworthy.",
    tags: ["Debugging", "ERP integration", "Data integrity", "Laravel"],
  },
  {
    id: "next-level",
    title: "The Next Level",
    subtitle: "Cloud · DevOps · AI",
    text: "Now expanding into cloud infrastructure, automation, DevOps and AI-powered applications through hands-on labs and experiments.",
    tags: ["AWS", "Docker", "CI/CD", "Ansible", "AI"],
  },
];

/* ───────────────────────────── projects ───────────────────────────── */

const emptyCase: CaseStudy = { overview: null, context: null, architecture: null, decisions: [], debugging: [], lessons: [] };

const base = {
  statusNote: null,
  description: null,
  role: null,
  technologies: [],
  technologyLabel: null,
  focusAreas: [],
  plannedFeatures: [],
  problem: null,
  solution: null,
  challenges: [],
  outcomes: [],
  media: [],
  repoUrl: null,
  demoUrl: null,
  featured: false,
  modules: [],
  caseStudy: emptyCase,
  demo: null,
} satisfies Partial<Project>;

export const projects: Project[] = [
  /* ── Professional & business software ── */
  {
    ...base,
    id: "aureus-erp",
    name: "Aureus ERP",
    category: "professional",
    status: null,
    summary: "Laravel ERP covering accounting, HR workflows and approvals.",
    description:
      "An ERP application built with Laravel, Filament and Livewire on MySQL. Work areas include accounting, HR workflows and approvals, financial data integrity, import/parser improvements and document integration.",
    technologies: ["Laravel", "PHP", "Filament", "Livewire", "MySQL"],
    focusAreas: ["Accounting", "HR workflows", "Approvals", "Financial data integrity", "Import / parser improvements", "Document integration"],
    featured: true,
    destination: "projects",
    accent: "#f2b84b",
    modules: [
      { name: "Accounting", areas: ["Financial records", "Data integrity"] },
      { name: "HR workflows & approvals", areas: ["HR processes", "Approval flows"] },
      { name: "Imports & parsing", areas: ["Import / parser improvements"] },
      { name: "Documents", areas: ["Document integration"] },
    ],
    caseStudy: {
      ...emptyCase,
      overview:
        "Accounting and HR workflows are presented here as parts of the same Aureus ERP codebase rather than as separate products.",
    },
    demo: "aureus-architecture",
  },
  {
    ...base,
    id: "truck-dispatching",
    name: "Truck Dispatching System",
    category: "professional",
    status: null,
    summary: "Dispatch workflow software for logistics operations.",
    focusAreas: ["Dispatch workflows", "Logistics", "Route planning", "Operational efficiency"],
    technologies: [],
    featured: true,
    destination: "projects",
    accent: "#e8603f",
  },
  {
    ...base,
    id: "point-of-sale",
    name: "Point of Sale System",
    category: "professional",
    status: null,
    summary: "POS with cart validation, inventory and SQL synchronisation.",
    focusAreas: ["SQL synchronisation", "Cart validation", "Inventory management", "Error handling"],
    technologies: [],
    featured: true,
    destination: "projects",
    accent: "#5fb3a1",
    demo: "pos-flow",
  },

  /* ── AI & application projects ── */
  {
    ...base,
    id: "fabric-classification",
    name: "Fabric Classification",
    category: "ai-apps",
    status: null,
    summary: "Classifying fabric images with a convolutional neural network.",
    technologies: ["Python", "TensorFlow", "Convolutional neural networks"],
    focusAreas: ["Image preprocessing", "Model training", "Classification", "Evaluation"],
    featured: true,
    destination: "research",
    accent: "#c77dd6",
    demo: "fabric-pipeline",
  },
  {
    ...base,
    id: "math-learning-app",
    name: "Math Learning App",
    category: "ai-apps",
    status: null,
    summary: "An educational app for learning maths.",
    focusAreas: ["Educational application development", "Learning interactions"],
    technologies: [],
    destination: "projects",
    accent: "#7a8ef0",
  },
  {
    ...base,
    id: "skill-bridge",
    name: "Skill-Bridge",
    category: "ai-apps",
    status: "concept",
    statusNote: "Work in progress — features below are planned unless marked otherwise.",
    summary: "Matching résumés to job descriptions and turning skill gaps into a learning roadmap.",
    technologies: ["MERN stack", "Ollama (local)", "Qwen", "Embeddings", "Deterministic skill-matching"],
    technologyLabel: "Planned stack",
    plannedFeatures: [
      "Résumé analysis",
      "Job-description analysis",
      "Semantic skill matching",
      "Skill-gap reports",
      "Learning roadmaps",
      "Project-based recommendations",
    ],
    featured: true,
    destination: "research",
    accent: "#4fb3c8",
    demo: "skill-gap",
  },
  {
    ...base,
    id: "ai-storytelling",
    name: "AI Children's Storytelling",
    category: "ai-apps",
    status: "experiment",
    statusNote: "Creative workflow experiments, not a finished application.",
    summary: "Experiments in turning children's stories into consistent illustrated scenes.",
    focusAreas: ["Story-to-scene workflows", "Character consistency", "Visual prompting", "AI-assisted animation"],
    technologies: [],
    destination: "research",
    accent: "#f29bb4",
  },

  /* ── DevOps engineering labs ── */
  {
    ...base,
    id: "lab-docker",
    name: "Docker Multi-Service Labs",
    category: "devops-lab",
    status: "experiment",
    summary: "Containerising applications made of multiple services.",
    technologies: ["Docker"],
    focusAreas: ["Containers", "Multi-service applications"],
    destination: "devops",
    accent: "#2f8fd8",
  },
  {
    ...base,
    id: "lab-aws",
    name: "AWS Infrastructure Labs",
    category: "devops-lab",
    status: "experiment",
    summary: "Hands-on work with core AWS networking and compute.",
    technologies: ["AWS", "EC2", "VPC", "IAM", "Load balancing"],
    focusAreas: ["Compute", "Networking", "Access management", "Load balancing"],
    destination: "devops",
    accent: "#f29a3a",
  },
  {
    ...base,
    id: "lab-cicd",
    name: "Git & Jenkins CI/CD Labs",
    category: "devops-lab",
    status: "experiment",
    summary: "Exploring build pipelines with Git and Jenkins.",
    technologies: ["Git", "Jenkins"],
    focusAreas: ["Version control", "Continuous integration", "Pipelines"],
    destination: "devops",
    accent: "#d24a3a",
  },
  {
    ...base,
    id: "lab-ansible",
    name: "Ansible Automation Labs",
    category: "devops-lab",
    status: "experiment",
    summary: "Automating server configuration with Ansible.",
    technologies: ["Ansible"],
    focusAreas: ["Configuration management", "Automation"],
    destination: "devops",
    accent: "#3a3f4b",
  },
  {
    ...base,
    id: "lab-prometheus",
    name: "Prometheus Monitoring Labs",
    category: "devops-lab",
    status: "experiment",
    summary: "Metrics collection and observability with Prometheus.",
    technologies: ["Prometheus"],
    focusAreas: ["Monitoring", "Observability"],
    destination: "devops",
    accent: "#e6522c",
  },
  {
    ...base,
    id: "lab-vagrant",
    name: "Vagrant Multi-VM Infrastructure",
    category: "devops-lab",
    status: "experiment",
    summary: "A multi-VM stack: application, database, web, Memcached and RabbitMQ.",
    technologies: ["Vagrant", "Memcached", "RabbitMQ"],
    focusAreas: ["Application server", "Database server", "Web server", "Caching", "Message queue"],
    destination: "devops",
    accent: "#1868f2",
  },

  /* ── Selected concepts & freelance work ── */
  {
    ...base,
    id: "track-day-rentals",
    name: "Motorcycle Track-Day Rental Website",
    category: "freelance",
    status: "concept",
    summary: "A multilingual site for renting track-day motorcycles.",
    technologies: ["Framer"],
    technologyLabel: "Proposed tool",
    focusAreas: ["Multilingual experience", "Bike pages", "Pricing", "Messaging-based enquiries"],
    destination: "creative",
    accent: "#e8553f",
  },
  {
    ...base,
    id: "healthcare-saas",
    name: "Healthcare B2B SaaS Website",
    category: "freelance",
    status: "concept",
    summary: "Improving a B2B healthcare product's landing page and storytelling.",
    focusAreas: ["Landing-page improvement", "Product storytelling", "Responsive layouts", "Conversion-focused design"],
    destination: "creative",
    accent: "#3aa0a0",
  },
  {
    ...base,
    id: "interactive-3d-hero",
    name: "Interactive 3D Website Hero",
    category: "freelance",
    status: "concept",
    summary: "A WebGL hero section with Blender assets and camera transitions.",
    technologies: ["Three.js", "WebGL", "Blender"],
    technologyLabel: "Proposed stack",
    focusAreas: ["Camera transitions", "Creative interaction", "3D assets"],
    destination: "creative",
    accent: "#7a5af0",
  },
  {
    ...base,
    id: "toy-ecommerce",
    name: "Toy E-commerce Experience",
    category: "freelance",
    status: "concept",
    summary: "Playful product discovery and cart interactions for a toy store.",
    focusAreas: ["Product discovery", "Playful UI", "Motion", "Responsive layouts", "Cart interactions"],
    destination: "creative",
    accent: "#f2b84b",
  },
  {
    ...base,
    id: "apres-cookies",
    name: "Après Cookies — Shopify",
    category: "freelance",
    status: "proposed",
    statusNote: "Opportunity discussed — no completed deliverables listed.",
    summary: "Shopify storefront maintenance and improvements.",
    technologies: ["Shopify"],
    technologyLabel: "Platform",
    focusAreas: ["Storefront maintenance", "Storefront improvements"],
    destination: "creative",
    accent: "#c98b5a",
  },
  {
    ...base,
    id: "av-studio",
    name: "Audiovisual Studio Website & CMS",
    category: "freelance",
    status: "concept",
    summary: "A video-led studio site with a project gallery and CMS.",
    focusAreas: ["Video-led design", "Project gallery", "Motion", "Content management"],
    destination: "creative",
    accent: "#2d313b",
  },
  {
    ...base,
    id: "nation-ai-commerce",
    name: "Nation AI-Commerce",
    category: "freelance",
    status: "concept",
    summary: "Brand direction and an AI-commerce landing page.",
    focusAreas: ["Brand direction", "Product positioning", "Landing page"],
    destination: "creative",
    accent: "#3f6b52",
  },
  {
    ...base,
    id: "zoo-hill-data-ai",
    name: "Zoo Hill Data AI Lab",
    category: "freelance",
    status: "proposed",
    statusNote: "Opportunity discussed — scope to be confirmed.",
    summary: "An AI- and data-oriented web experience.",
    focusAreas: ["AI & data storytelling", "Web experience"],
    destination: "creative",
    accent: "#5b8def",
  },
];

/** Mockup styles for the concept gallery (procedural previews, not screenshots). */
export const concepts: Concept[] = [
  { projectId: "track-day-rentals", mockup: "landing" },
  { projectId: "healthcare-saas", mockup: "dashboard" },
  { projectId: "interactive-3d-hero", mockup: "hero3d" },
  { projectId: "toy-ecommerce", mockup: "store" },
  { projectId: "apres-cookies", mockup: "store" },
  { projectId: "av-studio", mockup: "video" },
  { projectId: "nation-ai-commerce", mockup: "landing" },
  { projectId: "zoo-hill-data-ai", mockup: "gallery" },
];

/* ───────────────────────────── skills ───────────────────────────── */

export const skillLevels: Record<SkillLevel, { label: string; description: string }> = {
  comfortable: { label: "Comfortable", description: "Used regularly to build applications" },
  working: { label: "Working knowledge", description: "Used in real project work" },
  learning: { label: "Hands-on learning", description: "Practised through labs and experiments" },
};

export const skills: SkillGroup[] = [
  {
    id: "frontend",
    title: "Frontend",
    level: "comfortable",
    items: ["React", "Next.js", "JavaScript", "TypeScript", "Responsive web apps"],
    note: null,
  },
  {
    id: "backend",
    title: "Backend & APIs",
    level: "comfortable",
    items: ["Node.js", "Express.js", "REST APIs"],
    note: null,
  },
  { id: "data", title: "Databases", level: "comfortable", items: ["MongoDB", "SQL"], note: null },
  {
    id: "erp",
    title: "Laravel ecosystem",
    level: "working",
    items: ["Laravel", "PHP", "Filament", "Livewire"],
    note: "Used in ERP development.",
  },
  {
    id: "ml",
    title: "Machine learning",
    level: "learning",
    items: ["Python", "TensorFlow"],
    note: "Machine-learning experiments.",
  },
  {
    id: "devops",
    title: "Cloud & DevOps",
    level: "learning",
    items: ["Docker", "AWS", "CI/CD", "Infrastructure automation", "Monitoring"],
    note: "Hands-on labs and development.",
  },
  {
    id: "practice",
    title: "Engineering practice",
    level: "comfortable",
    items: ["Git", "Debugging", "Integration", "Testing", "AI-assisted development tools"],
    note: null,
  },
];

/* ───────────────────────────── experience ───────────────────────────── */

export const timeline: TimelineEntry[] = [
  {
    id: "truck-it-in",
    kind: "work",
    title: "AI Intern",
    organization: "Truck It In",
    period: "2026",
    location: null,
    summary: null,
    responsibilities: [],
    highlights: [],
  },
  {
    id: "paf-iast",
    kind: "education",
    title: "BS Computer Science",
    organization: "PAF-IAST",
    period: "2022 – 2026",
    location: null,
    summary: null,
    responsibilities: [],
    highlights: [],
  },
];

export const credentials: Credential[] = [
  { id: "fcc-backend", title: "Back End Development and APIs", issuer: "freeCodeCamp", date: null, status: null, url: null, note: null },
  { id: "fcc-rwd", title: "Responsive Web Design", issuer: "freeCodeCamp", date: null, status: null, url: null, note: null },
  { id: "google-dm", title: "Digital Marketing & E-commerce", issuer: "Google", date: null, status: null, url: null, note: null },
  { id: "coursera", title: "Coursera Specialization", issuer: "Coursera", date: null, status: null, url: null, note: "Exact title to be confirmed." },
  { id: "ats", title: "Applied Training in Software Development", issuer: "ATS", date: "Summer 2025", status: null, url: null, note: null },
  { id: "decoding-devops", title: "Decoding DevOps — From Basics to Advanced Projects with AI", issuer: "", date: null, status: null, url: null, note: null },
  { id: "udemy-devops", title: "DevOps Tools Training", issuer: "Udemy", date: null, status: null, url: null, note: null },
];

/* ───────────────────────────── contact ───────────────────────────── */

/**
 * Real links only — empty `href`s are hidden.
 * CV: drop a PDF into /public (e.g. /public/cv.pdf) and set the cv href to "/cv.pdf".
 */
export const contact: { blurb: string; links: ContactLink[] } = {
  blurb: "Have a project, a role or a question? I'd be glad to hear from you.",
  links: [
    { kind: "email", label: "Email", href: "" },
    { kind: "github", label: "GitHub", href: "" },
    { kind: "linkedin", label: "LinkedIn", href: "" },
    { kind: "cv", label: "Download CV", href: "" },
  ],
};

export const cvLink = (): string | null => contact.links.find((l) => l.kind === "cv" && l.href)?.href ?? null;

/* ───────────────────────────── sections ───────────────────────────── */

export const sectionMeta: Record<SectionId, { title: string; place: string; blurb: string }> = {
  about: { title: "About", place: "Home", blurb: "Who I am, where I've been and where I'm heading." },
  projects: { title: "Software Projects", place: "Engineering Garage", blurb: "Business software and applications." },
  devops: { title: "DevOps & Cloud Labs", place: "Cloud District", blurb: "Infrastructure, automation and monitoring labs." },
  research: { title: "AI & Research", place: "Research Island", blurb: "Machine-learning projects and AI experiments." },
  creative: { title: "Concepts & Freelance", place: "Creative District", blurb: "Selected concepts and freelance work." },
  contact: { title: "Contact & CV", place: "Lighthouse", blurb: "Send a signal." },
};

export const sectionOrder: SectionId[] = ["about", "projects", "devops", "research", "creative", "contact"];

export const categoryMeta: Record<ProjectCategory, { title: string; blurb: string }> = {
  professional: { title: "Professional & business software", blurb: "Systems built for real business workflows." },
  "ai-apps": { title: "AI & application projects", blurb: "Applications, ML projects and AI experiments." },
  "devops-lab": { title: "DevOps engineering labs", blurb: "Hands-on learning labs — not production systems." },
  freelance: { title: "Selected concepts & freelance work", blurb: "Concepts and proposals, labelled by status." },
};

export const statusMeta: Record<ProjectStatus, { label: string; tone: "solid" | "soft" | "outline" }> = {
  completed: { label: "Completed", tone: "solid" },
  "in-progress": { label: "In progress", tone: "soft" },
  personal: { label: "Personal project", tone: "soft" },
  concept: { label: "Concept", tone: "outline" },
  proposed: { label: "Proposed solution", tone: "outline" },
  experiment: { label: "Learning experiment", tone: "outline" },
};

export const projectsIn = (section: SectionId) => projects.filter((p) => p.destination === section);
export const projectById = (id: string | null | undefined) => projects.find((p) => p.id === id) ?? null;
