/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PORTFOLIO CONTENT — the single source of truth for everything shown in the
 *  3D world, the in-game panels, the terminal, /portfolio and /projects/[id].
 *
 *  Sources: Asad's CV (assets/AsadShaa_CV.pdf — authority for facts, dates,
 *  titles and employment) and his portfolio content brief (narrative & copy).
 *
 *  Rules:
 *   • Use `null` / "" / [] for anything not yet verified. Missing values are
 *     hidden in production; in development a small checklist lists what's missing.
 *   • `status: null` means "not confirmed yet" — no status badge is shown.
 *   • Never add invented metrics, URLs, clients, screenshots or results.
 *   • Never publish confidential company data (see `confidential` on projects).
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ───────────────────────────── types ───────────────────────────── */

/** World destinations (each has a 3D landmark and a panel). */
export type SectionId = "about" | "projects" | "devops" | "research" | "creative" | "contact";

/** Tabs inside the Home (about) panel. */
export type AboutTab = "journey" | "experience" | "skills" | "approach";

export type ProjectCategory = "professional" | "ai-apps" | "devops-lab" | "freelance";

export type ProjectStatus =
  | "completed"
  | "contribution"
  | "in-progress"
  | "history"
  | "academic"
  | "personal"
  | "lab"
  | "experiment"
  | "concept"
  | "proposed"
  | "exploration"
  | "prototype"
  | "client";

/** Development-checklist item: done (supported by the CV / Asad's own account), to verify, or planned. */
export interface ChecklistItem {
  text: string;
  state: "done" | "verify" | "planned";
}

/** A technology with its purpose and verification state. */
export interface StackItem {
  name: string;
  purpose: string;
  state: "verified" | "verify" | "planned";
}

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
  /** Short label shown above the title, e.g. "Enterprise Software / ERP". */
  kicker: string | null;
  /** Named spot in the 3D world, e.g. "Logistics Highway". */
  location: string | null;
  status: ProjectStatus | null;
  /** Extra qualifier shown next to the status (e.g. "Opportunity discussed — scope to be confirmed"). */
  statusNote: string | null;
  summary: string;
  description: string | null;
  role: string | null;
  technologies: string[];
  /** Label for the technology list when it is not (yet) the actual stack, e.g. "Planned stack". */
  technologyLabel: string | null;
  /** Technologies with purpose and state. `technologies` is derived from this. */
  stack: StackItem[];
  focusAreas: string[];
  /** Planned features for concepts / work in progress — always shown as "planned". */
  plannedFeatures: string[];
  problem: string | null;
  /** What the system should accomplish. */
  goal: string | null;
  /** Development checklist. */
  checklist: ChecklistItem[];
  /** Key technical workflow and architecture. */
  howItWorks: string | null;
  solution: string | null;
  /** Qualitative outcome (no unverified numbers). */
  outcome: string | null;
  /** Heading for the outcome, e.g. "Intended outcome" for concepts. */
  outcomeLabel: string | null;
  challenges: string[];
  /** Verified, measurable outcomes only (with baseline + method). */
  outcomes: string[];
  /** Proof still to collect — shown only in development. */
  evidence: string[];
  media: MediaItem[];
  repoUrl: string | null;
  demoUrl: string | null;
  featured: boolean;
  /** Mobile app — media will be shown in phone frames. */
  mobile: boolean;
  /** Built inside a company codebase — show a note that details are kept general. */
  confidential: boolean;
  destination: SectionId;
  accent: string;
  modules: ProjectModule[];
  caseStudy: CaseStudy;
  demo: DemoId | null;
  /** Call-to-action label on cards / links. */
  cta: string;
}

export type SkillLevel = "experienced" | "working" | "learning";

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
  /** Case-study style breakdown of verified contributions; null fields render as "To verify". */
  contributions?: Contribution[];
}

export interface Contribution {
  title: string;
  problem: string | null;
  role: string | null;
  technologies: string[];
  implementation: string | null;
  validation: string | null;
  outcome: string | null;
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
  /** Short chapter label, e.g. "The Foundation". */
  title: string;
  /** Very short label for the progress rail. */
  short: string;
  /** The stop's headline. */
  subtitle: string;
  text: string;
  tags: string[];
}

export interface Concept {
  projectId: string;
  /** Mockup layout used by the procedural concept preview. */
  mockup: "landing" | "gallery" | "store" | "hero3d" | "video" | "dashboard";
}

export interface TitledText {
  title: string;
  text: string;
}

/* ───────────────────────────── profile ───────────────────────────── */

export const profile = {
  name: "Asad Ullah Shah",
  shortName: "Asad Shah",
  initials: "AS",
  /** Short tagline used in the HUD, loading screen and metadata. */
  headline: "Full-Stack Developer · Software Engineer",
  /** Full professional headline. */
  title: "Full-Stack Developer | Software Engineer | Exploring Cloud & DevOps",
  altHeadline: "Building Practical Software, Solving Engineering Problems.",
  positioning:
    "A software developer focused on building useful digital products, business applications and interactive web experiences — experienced across full-stack development and business software, with growing interests in cloud infrastructure, DevOps automation and AI-powered applications.",
  intro:
    "I'm Asad Ullah Shah, a computer science graduate and software developer who enjoys turning ideas and complex requirements into practical software. My work spans web applications, business workflows, APIs, databases and machine-learning experiments. I'm continuing to expand my engineering skills through hands-on development and infrastructure projects.",
  location: "Haripur, Pakistan" as string | null,
  seoDescription:
    "Asad Ullah Shah — full-stack developer and software engineer. Explore an interactive 3D world to discover business software, DevOps work, machine-learning projects and freelance concepts.",
  /** Public URL once deployed (used for Open Graph). */
  siteUrl: "https://asad-s-folio.vercel.app",
};

/** Opening screen copy. */
export const hero = {
  eyebrow: "Welcome to my developer universe",
  heading: "I build software that solves real problems.",
  supporting:
    "From business applications and full-stack systems to AI experiments and cloud infrastructure, I enjoy exploring how technology can make complicated things simpler.",
  primaryCta: "Start Exploring",
  secondaryCta: "View My Work",
  cvCta: "Download CV",
  hint: "Drive around. Discover what I build.",
  keys: "W A S D or Arrow Keys to Drive",
  interactHint: "Approach a destination and press E to explore.",
  altCta: "Explore Portfolio",
};

export const about = {
  label: "The person behind the code",
  heading: "Curious by nature. Engineer by practice.",
  /** Kept for places that need a one-line tagline. */
  tagline: "I build software that solves real problems.",
  paragraphs: [
    "I'm Asad Ullah Shah, a computer science graduate with a strong interest in software engineering and building practical digital products.",
    "I enjoy working across the whole development process — understanding requirements, designing solutions, implementing features, connecting APIs and databases, and troubleshooting problems when things don't work as expected.",
    "My experience includes full-stack development, business software, ERP workflows, inventory and dispatching systems, and machine-learning experiments. I've also been building my understanding of cloud infrastructure, automation and DevOps through hands-on work.",
    "I believe good software is more than code that runs. It should solve the right problem, handle real-world situations, stay maintainable, and make life easier for the people using it.",
    "I'm always interested in challenging projects, learning from experienced engineers, collaborating with teams, and building products with a meaningful purpose.",
  ],
  shortBio:
    "I'm a software developer who enjoys solving real engineering problems. I work across full-stack applications, business systems, APIs and AI experiments, while growing toward cloud engineering and DevOps.",
  approach: "Understand the problem first. Build the simplest reliable solution. Test the important details. Improve it continuously.",
};

export const journey: JourneyStop[] = [
  {
    id: "foundation",
    short: "Foundation",
    title: "The Foundation",
    subtitle: "Learning to think like an engineer",
    text: "My computer science education at PAF-IAST (2022–2026) gave me a foundation in programming, algorithms, databases and software development. Building projects helped me connect theory with practical problems.",
    tags: ["BS Computer Science", "PAF-IAST"],
  },
  {
    id: "builder",
    short: "Builder",
    title: "The Builder",
    subtitle: "Turning ideas into applications",
    text: "I explored frontend and backend development, APIs, databases and responsive interfaces — and my focus became building complete workflows rather than isolated features.",
    tags: ["JavaScript", "React", "Node.js", "Express", "MongoDB", "MySQL"],
  },
  {
    id: "problem-solver",
    short: "Problem Solver",
    title: "The Problem Solver",
    subtitle: "Working with real business logic",
    text: "ERP workflows, accounting, inventory and dispatching introduced me to the complexity behind business software. Data consistency, validation, integration and careful testing became core to how I work.",
    tags: ["Laravel", "Filament", "Livewire", "C# / .NET", "SQL Server"],
  },
  {
    id: "next-level",
    short: "Beyond Code",
    title: "Beyond Application Code",
    subtitle: "Exploring cloud, automation and AI",
    text: "I'm expanding my toolkit through DevOps work, cloud infrastructure experiments, automation and machine learning — learning not only how to build software, but how to deploy, operate and improve it.",
    tags: ["Docker", "Jenkins", "Ansible", "Linux", "TensorFlow"],
  },
];

export const values: { title: string; items: TitledText[] } = {
  title: "How I approach engineering",
  items: [
    {
      title: "Understand before building",
      text: "I start by understanding the existing system, the user's problem and the expected outcome before deciding how to implement a solution.",
    },
    { title: "Reliability matters", text: "Validation, error handling, data consistency and testing matter just as much as the happy path." },
    {
      title: "Keep it maintainable",
      text: "I prefer clear, reusable solutions that fit the existing architecture instead of introducing unnecessary complexity.",
    },
    {
      title: "Keep learning",
      text: "The best way to improve is to build, test, investigate mistakes and learn from people with more experience.",
    },
    {
      title: "Think about the user",
      text: "Software should be understandable and useful. An impressive feature has little value if it doesn't solve the user's actual problem.",
    },
  ],
};

export const process: { title: string; steps: TitledText[] } = {
  title: "From problem to reliable solution",
  steps: [
    { title: "Understand", text: "Clarify the requirement, identify constraints and inspect the existing system." },
    { title: "Plan", text: "Choose an approach that fits the problem, the existing architecture and the available resources." },
    { title: "Build", text: "Implement the necessary features with attention to readability, validation and maintainability." },
    { title: "Test", text: "Check normal behaviour, important edge cases, integrations and regressions." },
    { title: "Improve", text: "Review the result, address problems and document important decisions." },
  ],
};

export const services: { title: string; intro: string; items: TitledText[] } = {
  title: "What I can help build",
  intro: "Work I can take on today — with infrastructure and production AI scoped honestly to my current experience.",
  items: [
    {
      title: "Full-stack web development",
      text: "Responsive web applications that connect useful interfaces with reliable backend logic, databases and APIs.",
    },
    {
      title: "Business applications & integrations",
      text: "Developing and improving business workflows, data validation, API integrations and features that fit existing systems.",
    },
    {
      title: "Frontend & interactive experiences",
      text: "Polished web interfaces with thoughtful interactions, responsive layouts and engaging user experiences.",
    },
    {
      title: "Debugging & existing-codebase improvements",
      text: "Investigating bugs, understanding existing implementations and making focused changes without unnecessary rewrites.",
    },
    {
      title: "AI & machine-learning prototypes",
      text: "Practical AI features and ML prototypes with clear scope, measurable behaviour and realistic limitations.",
    },
    {
      title: "Cloud & DevOps projects",
      text: "Appropriately scoped containerisation, CI/CD and server-configuration tasks — collaborative for larger production infrastructure.",
    },
  ],
};

/* ───────────────────────────── projects ───────────────────────────── */

/*
 * Case-study conventions (see the "Project case studies & developer checklist" brief):
 *   checklist  — "done" (confirmed by Asad / his CV) or "planned" for concepts. The "verify"
 *                state still exists if something ever needs to be shown as unconfirmed.
 *   stack      — each technology with its purpose and state ("verified" / "verify" / "planned").
 *   evidence   — proof still to collect. Shown only in development, never on the live site.
 *   Unverified metrics (e.g. "30% route improvement", "90% fewer errors") are NOT published.
 */

const emptyCase: CaseStudy = { overview: null, context: null, architecture: null, decisions: [], debugging: [], lessons: [] };

const done = (text: string): ChecklistItem => ({ text, state: "done" });
const planned = (text: string): ChecklistItem => ({ text, state: "planned" });
const tech = (name: string, purpose: string, state: StackItem["state"] = "verified"): StackItem => ({ name, purpose, state });

const base = {
  kicker: null,
  location: null,
  statusNote: null,
  description: null,
  role: null,
  technologies: [],
  technologyLabel: null,
  stack: [],
  focusAreas: [],
  plannedFeatures: [],
  problem: null,
  goal: null,
  checklist: [],
  howItWorks: null,
  solution: null,
  outcome: null,
  outcomeLabel: null,
  challenges: [],
  outcomes: [],
  evidence: [],
  media: [],
  repoUrl: null,
  demoUrl: null,
  featured: false,
  mobile: false,
  confidential: false,
  modules: [],
  caseStudy: emptyCase,
  demo: null,
  cta: "Explore the case study",
} satisfies Partial<Project>;

const rawProjects: Project[] = [
  /* ── 01. Aureus ERP ── */
  {
    ...base,
    id: "aureus-erp",
    name: "Aureus ERP",
    kicker: "Enterprise Software / ERP",
    location: "Enterprise Engineering Garage",
    category: "professional",
    status: "contribution",
    summary: "Improving an ERP system's accounting, HR workflows, approvals and business-document management.",
    description:
      "Aureus ERP is an enterprise software project made of interconnected business processes — Accounting and HR modules, approval workflows, financial data integrity, import and parsing logic, and document integration.",
    problem:
      "Business operations become fragmented when accounting, HR, approvals, financial records and supporting documents don't work together consistently. Finance and operations teams need dependable workflows, accurate records, traceable approvals and clear validation rules — and any new feature in an existing ERP must fit the architecture the business already relies on.",
    goal: "Improve existing ERP workflows while preserving established accounting and HR behaviour, financial integrity, permissions and approval processes.",
    role: "Engineered automated bank-statement import parsers, ledger reconciliation workflows and dynamic financial-statement tagging within the Aureus ERP architecture, and built an automated document-synchronisation pipeline using the Google Drive API to centralise accounting records and audit trails.",
    checklist: [
      done("Inspect the existing codebase and understand its architecture before making changes."),
      done("Identify the existing Accounting, HR and approval workflows."),
      done("Trace data between forms, models, services, database records and reports."),
      done("Work with existing Laravel application patterns."),
      done("Use Filament resources and forms for administrative workflows."),
      done("Use Livewire for interactive application behaviour."),
      done("Validate accounting transactions and debit/credit balancing."),
      done("Implement dynamic financial-statement tagging."),
      done("Work on general-ledger mapping."),
      done("Build bank-statement import parsers and ledger reconciliation workflows."),
      done("Preserve authorisation and role-based permissions."),
      done("Synchronise accounting documents (invoices & bills) with Google Drive."),
      done("Validate changes against existing business rules."),
      done("Run regression checks and verify important workflows."),
      done("Document implementation decisions and known limitations."),
    ],
    stack: [
      tech("PHP", "Backend application logic"),
      tech("Laravel", "Application structure, routing, services and business logic"),
      tech("Filament", "Administrative interfaces and business forms"),
      tech("Livewire", "Interactive, server-driven UI"),
      tech("MySQL", "Relational data storage"),
      tech("Google Drive API", "Document synchronisation and centralised records"),
    ],
    howItWorks:
      "Administrative workflows are built with Filament resources and forms, with Livewire handling interactive behaviour. Laravel services and models apply the business rules and validation before records are written to MySQL. Bank statements are parsed and reconciled against the ledger, financial statements are tagged dynamically, and invoices and bills are synchronised with Google Drive to keep accounting records and audit trails in one place.",
    solution:
      "Instead of building a separate accounting system alongside the ERP, the approach extends the established architecture and preserves its business rules — reducing duplication and keeping new functionality maintainable. Financial validation catches inconsistent transactions before they become trusted records, and approval steps keep actions traceable.",
    outcome:
      "Improved and extended existing business workflows, with an emphasis on consistency, maintainability, validation and compatibility with the existing ERP.",
    challenges: [
      "Working inside an existing enterprise application requires more than writing new code: each change must fit the architecture, respect accounting rules and avoid breaking related workflows.",
    ],
    evidence: [
      "Screenshots of implemented workflows using sanitised sample data",
      "A diagram of the relevant data flow",
      "Tests demonstrating accounting validation",
      "A confirmed list of features personally implemented",
      "Verified before-and-after measurements, if available",
    ],
    featured: true,
    confidential: true,
    destination: "projects",
    accent: "#f2b84b",
    modules: [
      { name: "Accounting", areas: ["Bank-statement import parsers", "Ledger reconciliation", "Financial-statement tagging", "Debit/credit validation"] },
      { name: "HR workflows & approvals", areas: ["Approval workflows", "Attendance-related improvements"] },
      { name: "Imports & parsing", areas: ["Import & parser improvements"] },
      { name: "Documents", areas: ["Invoice & bill sync via the Google Drive API", "Centralised records & audit trail"] },
    ],
    caseStudy: {
      ...emptyCase,
      lessons: [
        "Enterprise software depends on consistency between business rules, application logic, permissions and data. Understanding those relationships is essential before making changes.",
      ],
    },
    demo: "aureus-architecture",
  },

  /* ── 02. Truck Dispatching ── */
  {
    ...base,
    id: "truck-dispatching",
    name: "Truck Dispatching System",
    kicker: "Logistics / Business Application",
    location: "Logistics Highway",
    category: "professional",
    status: "history",
    statusNote: "Part of the Point of Sale & Fleet Dispatching Infrastructure project.",
    summary: "A fleet dispatching and route-management module for coordinating truck dispatch operations.",
    problem:
      "Dispatch operations become difficult when transport assignments, routes and operational information are handled inefficiently. Poor planning leads to unnecessary travel, wasted time and difficulty coordinating work.",
    goal: "Create a dispatching system that helps users organise dispatch operations and plan routes more effectively.",
    role: "Built a fleet dispatching and route-management module to automate vehicle scheduling, reduce manual coordination and improve delivery tracking.",
    checklist: [
      done("Identify the dispatcher's primary workflow."),
      done("Model the dispatch, truck, driver or delivery records."),
      done("Create interfaces for viewing and managing dispatch information."),
      done("Automate vehicle scheduling and dispatch assignment."),
      done("Implement route management."),
      done("Validate required dispatch information before saving."),
      done("Handle invalid, incomplete or conflicting records."),
      done("Improve delivery tracking and operational visibility."),
      done("Test realistic dispatch scenarios."),
      done("Build on C#, .NET and SQL Server."),
    ],
    stack: [
      tech("C#", "Application logic"),
      tech(".NET", "Application framework"),
      tech("SQL Server", "Relational database"),
    ],
    howItWorks:
      "A C#/.NET dispatching module backed by SQL Server automates vehicle scheduling and route management, and tracks deliveries so dispatchers can coordinate work from one place rather than by hand.",
    solution:
      "A structured dispatch workflow gives users an organised way to manage operational information, with automated scheduling and route management supporting better planning decisions.",
    outcome: "A more structured dispatching workflow with automated scheduling, route management and better delivery tracking.",
    challenges: [
      "Translating real operational requirements into a workflow that is easy to use, validates the necessary data and supports better dispatch decisions.",
    ],
    evidence: [
      "Dispatch dashboard screenshot",
      "Example route or dispatch workflow",
      "Before-and-after route comparison — the earlier \"30% improvement\" figure stays unpublished until baseline and method are confirmed",
      "Verified performance measurements",
    ],
    featured: true,
    destination: "projects",
    accent: "#e8603f",
    cta: "Explore the project",
  },

  /* ── 03. Point of Sale ── */
  {
    ...base,
    id: "point-of-sale",
    name: "Point of Sale & Inventory Management",
    kicker: "Retail / Business Software",
    location: "Retail Systems Workshop",
    category: "professional",
    status: "history",
    statusNote: "Part of the Point of Sale & Fleet Dispatching Infrastructure project.",
    summary: "Transactional billing with cart and stock validation and real-time inventory synchronisation.",
    problem:
      "A POS system must do more than record a sale. It has to keep transaction data consistent, validate cart contents and keep stock accurate — weak validation or delayed synchronisation leads to incorrect orders and inventory discrepancies.",
    goal: "Build a point-of-sale workflow that handles transactions reliably and keeps sales and inventory information synchronised.",
    role: "Architected transactional billing and real-time inventory synchronisation workflows using C#, .NET and SQL Server with ACID-compliant queries.",
    checklist: [
      done("Implement the product selection and cart workflow."),
      done("Validate quantities and product availability."),
      done("Prevent invalid cart or stock operations."),
      done("Save transaction data consistently (ACID-compliant queries)."),
      done("Implement real-time inventory synchronisation with SQL Server."),
      done("Handle failed operations and database errors."),
      done("Prevent duplicate operations where required."),
      done("Provide clear error messages to users."),
      done("Test sales, stock updates and failure scenarios."),
    ],
    stack: [
      tech("C#", "Application logic"),
      tech(".NET", "Application framework"),
      tech("SQL Server", "Transactions and inventory data"),
    ],
    howItWorks:
      "Cart operations are validated before checkout, stock availability is checked during the transaction, and the sale and inventory updates are written to SQL Server in ACID-compliant transactions so sales and stock stay consistent.",
    solution:
      "Cart validation prevents invalid transactions before they are processed, stock checks reduce the chance of selling unavailable inventory, and transactional database writes keep records consistent. Explicit error handling makes failures diagnosable instead of leaving silent inconsistencies.",
    outcome: "A more reliable sales workflow with attention to data synchronisation, inventory validation and transaction correctness.",
    challenges: [
      "Keeping sales and inventory data consistent — the interface looks simple, but its correctness depends on reliable validation and database operations.",
    ],
    evidence: [
      "Cart and checkout screenshots",
      "Inventory update demonstration",
      "Example validation / error-handling flow",
      "Database or synchronisation architecture diagram",
      "Verified error-rate comparison — the earlier \"90% fewer errors\" figure stays unpublished until measured",
    ],
    featured: true,
    destination: "projects",
    accent: "#5fb3a1",
    demo: "pos-flow",
    cta: "View the case study",
  },

  /* ── 04. Fabric Classification ── */
  {
    ...base,
    id: "fabric-classification",
    name: "Fabric Classification Using Deep Learning",
    kicker: "Machine Learning / Computer Vision",
    location: "Research Island",
    category: "ai-apps",
    status: "academic",
    statusNote: "Final-year project — BS Computer Science.",
    summary: "A mobile app with a CNN that classifies textile patterns and fabric types from camera images.",
    problem:
      "Identifying fabric types manually takes experience and time. Computer vision can test whether image patterns carry enough information to classify fabric into predefined categories.",
    goal: "Train and evaluate a convolutional neural network to classify fabric images into the categories in the dataset — and use it from a mobile app.",
    role: "Trained a custom convolutional neural network in TensorFlow to classify textile patterns and detect fabric types from camera images, and implemented dataset preprocessing and image-augmentation pipelines to reduce overfitting for on-device inference.",
    checklist: [
      done("Identify the fabric classes and dataset."),
      done("Inspect dataset quality and class distribution."),
      done("Preprocess images for the model."),
      done("Apply data augmentation."),
      done("Split data into training, validation and test sets."),
      done("Build a custom CNN architecture."),
      done("Train the model in TensorFlow."),
      done("Monitor training and validation performance."),
      done("Evaluate the model on held-out data."),
      done("Inspect incorrect predictions."),
      done("Reduce overfitting with augmentation."),
      done("Check for data leakage."),
      done("Record reproducible evaluation results."),
      done("Build a Flutter mobile app that classifies camera images."),
    ],
    stack: [
      tech("Python", "Model development"),
      tech("TensorFlow", "Machine-learning framework"),
      tech("CNN", "Image-classification approach"),
      tech("Image preprocessing & augmentation", "Standardise inputs and add variation"),
      tech("Flutter", "Mobile interface for camera-image predictions"),
    ],
    howItWorks:
      "Labelled fabric images are preprocessed and augmented, then used to train a custom CNN in TensorFlow. The CNN learns visual features from the images and predicts a fabric category; the Flutter app captures a camera image and runs it through the model on the device.",
    solution:
      "Preprocessing standardises inputs and augmentation helps the model learn from variation in the training images. How useful the model is depends on the dataset, the class definitions, its test performance and how it handles images unlike the training set.",
    outcome: "An image-classification project demonstrating a practical application of deep learning and computer vision on a mobile device.",
    challenges: [
      "A model can perform well on training data and still fail on unseen images — proper data splitting and evaluation are essential to know whether it learned useful visual patterns.",
    ],
    evidence: [
      "Sample input images with true labels",
      "Example model predictions",
      "Training and validation plots",
      "Confusion matrix and per-class metrics",
      "Dataset size and class count",
      "Verified held-out test accuracy",
    ],
    featured: true,
    mobile: true,
    destination: "research",
    accent: "#c77dd6",
    demo: "fabric-pipeline",
    cta: "Explore the ML project",
  },

  /* ── Weather app (CV) ── */
  {
    ...base,
    id: "weather-app",
    name: "Weather Forecast Mobile App",
    kicker: "Mobile Development",
    category: "ai-apps",
    status: "history",
    summary: "A cross-platform Flutter app fetching forecasts asynchronously from third-party REST APIs.",
    problem: "People want quick, reliable access to forecasts on any phone, even when the network is slow or a request fails.",
    goal: "Build a cross-platform forecast app that loads data asynchronously and handles network problems gracefully.",
    role: "Developed a cross-platform mobile application in Flutter and Dart, integrating third-party REST APIs with asynchronous JSON parsing and network error handling.",
    checklist: [
      done("Build a cross-platform app in Flutter and Dart."),
      done("Integrate third-party weather REST APIs."),
      done("Parse JSON responses asynchronously."),
      done("Handle network errors."),
    ],
    stack: [
      tech("Flutter", "Cross-platform UI"),
      tech("Dart", "Application logic"),
      tech("REST APIs", "Forecast data"),
    ],
    howItWorks: "The app requests forecast data from third-party REST APIs, parses the JSON asynchronously so the UI stays responsive, and shows a clear error state when a request fails.",
    solution: "Asynchronous networking keeps the interface responsive, and explicit error handling avoids blank or frozen screens when the network misbehaves.",
    outcome: "A working cross-platform forecast app with asynchronous data loading and network error handling.",
    challenges: ["Keeping the UI responsive and predictable while network requests are slow or fail."],
    evidence: ["App screenshots", "Screen recording of loading and error states", "Repository link"],
    mobile: true,
    destination: "projects",
    accent: "#4f9fd8",
    cta: "Explore the app",
  },

  /* ── 05. Math Learning App ── */
  {
    ...base,
    id: "math-learning-app",
    name: "Math Learning App",
    kicker: "Education Technology",
    location: "Learning Garden",
    category: "ai-apps",
    status: "history",
    summary: "An interactive app for practising mathematics with quizzes, scoring and progress tracking.",
    problem:
      "Learners need a way to practise mathematics, get feedback and understand their progress. A static set of questions doesn't provide the interaction or feedback that keeps practice engaging.",
    goal: "Create a learning application with interactive quizzes, scoring and progress tracking.",
    checklist: [
      done("Define the intended learner and learning goals."),
      done("Organise questions by topic or difficulty."),
      done("Display questions and answer options clearly."),
      done("Validate submitted answers."),
      done("Provide feedback on answers."),
      done("Calculate quiz scores."),
      done("Track progress."),
      done("Handle incorrect, skipped or unanswered questions."),
      done("Test scoring and navigation."),
      done("Make the interface usable on supported screen sizes."),
      done("Persist progress between sessions."),
    ],
    stack: [
    ],
    solution:
      "Interactive questions turn practice into an active process; scoring shows learners how they performed, and progress tracking can help them decide what to practise next.",
    outcome: "An educational application focused on interactive practice, feedback and learner progress.",
    challenges: ["Scoring logic must be correct and consistent, and the interface should make clear what went well, what needs work and what happens next."],
    evidence: ["Quiz screen", "Correct and incorrect answer examples", "Scoring demonstration", "Progress screen, if implemented", "Confirmed technology stack"],
    destination: "projects",
    accent: "#7a8ef0",
    cta: "Explore the app",
  },

  /* ── 06. Skill-Bridge ── */
  {
    ...base,
    id: "skill-bridge",
    name: "Skill-Bridge",
    kicker: "AI-Assisted Career Development",
    location: "Career Navigator",
    category: "ai-apps",
    status: "concept",
    statusNote: "Planned implementation — nothing below is claimed as built yet.",
    summary: "Comparing a résumé with a target job to explain skill gaps and suggest practical projects and learning steps.",
    problem:
      "Job seekers struggle to compare their skills with a job description, see what's missing and decide what to learn next. A simple keyword match doesn't explain why a candidate is or isn't a good fit.",
    goal: "Design a tool that compares a résumé with a target job, identifies relevant skill gaps and suggests practical projects and learning steps.",
    checklist: [
      planned("Résumé input or upload workflow."),
      planned("Accept a target job description."),
      planned("Extract skills and supporting evidence."),
      planned("Normalise related skill names and terminology."),
      planned("Compare the candidate profile with the job requirements."),
      planned("Use semantic similarity where appropriate."),
      planned("Separate required from preferred skills."),
      planned("Show matched and missing skills with explanations."),
      planned("Recommend practical projects for missing skills."),
      planned("Provide a structured learning roadmap."),
      planned("Help improve résumé bullets using real experience."),
      planned("Let users review and correct extracted information."),
      planned("Protect uploaded résumé data and avoid unnecessary retention."),
      planned("Test results against sample résumés and job descriptions."),
    ],
    stack: [
      tech("React / Vite", "Frontend", "planned"),
      tech("Tailwind CSS", "Styling", "planned"),
      tech("Node.js & Express", "Backend", "planned"),
      tech("MongoDB & Mongoose", "Data persistence", "planned"),
      tech("Ollama + local language model", "Local AI inference", "planned"),
      tech("Embeddings", "Semantic similarity", "planned"),
      tech("Deterministic weighted scoring", "Transparent matching logic", "planned"),
      tech("Automated tests", "Verify parsing, scoring and recommendations", "planned"),
    ],
    howItWorks:
      "Planned flow: extract skills and evidence from the résumé and job description → normalise terminology → score matches with transparent, deterministic weights, using embeddings for semantic similarity → explain matched and missing skills → turn gaps into projects and a learning roadmap the user can review and correct.",
    solution:
      "Instead of returning only a match score, the tool aims to explain the relationship between a candidate's experience and a job's requirements, then turn missing skills into practical learning tasks.",
    outcome: "A clearer, more actionable job-readiness assessment that connects skills, evidence, projects and learning steps.",
    outcomeLabel: "Intended outcome",
    challenges: [
      "AI-generated assessments can be inconsistent or misleading — combining transparent matching rules with semantic analysis and user review makes results easier to inspect and correct.",
    ],
    evidence: ["Working résumé / job-description comparison", "Example skills analysis", "Recommendation & roadmap screen", "Results on a test dataset", "Privacy and data-handling explanation"],
    destination: "research",
    accent: "#4fb3c8",
    demo: "skill-gap",
    cta: "Explore the concept",
  },

  /* ── 07. AI storytelling ── */
  {
    ...base,
    id: "ai-storytelling",
    name: "AI-Assisted Children's Storytelling",
    kicker: "AI-Assisted Creative Technology",
    location: "Storytelling Studio",
    category: "ai-apps",
    status: "experiment",
    statusNote: "Creative experiments and a prototype workflow — not an automated application.",
    summary: "A repeatable workflow for child-friendly stories with consistent characters, scenes, visual prompts and narration.",
    problem:
      "Creating consistent children's stories with AI-generated visuals is hard: characters change appearance between scenes, prompts produce inconsistent results and visuals may not match the narration.",
    goal: "Explore a repeatable workflow for child-friendly stories with consistent characters, scene descriptions, visual prompts and narration.",
    checklist: [
      done("Write an age-appropriate story outline."),
      done("Define character appearance and personality."),
      done("Create a reusable character description."),
      done("Break the story into scenes."),
      done("Write separate visual and audio instructions."),
      done("Keep important character traits consistent across scenes."),
      done("Check scene continuity."),
      done("Review language for child-friendly content."),
      done("Check narration timing against scene duration."),
      done("Assemble and review the resulting sequence."),
    ],
    stack: [
      tech("Gemini", "Story and prompt development"),
      tech("Google Flow / Veo", "AI video generation (used and explored)"),
    ],
    howItWorks:
      "A story is broken into scenes, each with a reusable character description and a structured visual prompt. Scenes are generated, reviewed for consistency and assembled into a short sequence.",
    solution:
      "Reusable character descriptions and structured scene prompts make visual outputs more consistent, and separating visual instructions from narration makes the process easier to review and revise.",
    outcome: "A structured experimentation workflow for producing AI-assisted children's story content.",
    challenges: [
      "Keeping characters and narrative consistent across separately generated scenes requires deliberate planning, repeatable prompts and careful review.",
    ],
    evidence: ["Story outline and scene breakdown", "Character reference sheet", "A few generated scenes", "Final assembled video, if available", "Notes on consistency problems and fixes"],
    destination: "research",
    accent: "#f29bb4",
    cta: "View the experiments",
  },

  /* ── CI/CD & Linux infrastructure (CV project) ── */
  {
    ...base,
    id: "cicd-linux-infra",
    name: "Automated CI/CD Pipeline & Linux Server Infrastructure",
    kicker: "DevOps / Infrastructure",
    category: "devops-lab",
    status: "history",
    summary: "Ansible-provisioned Linux servers with Jenkins, SonarQube code inspection and SSL-secured Apache.",
    problem:
      "Manually configuring servers is slow and error-prone, and environments drift apart — so code that works in one place fails in another.",
    goal: "Automate server provisioning and configuration and add continuous code inspection to the delivery pipeline.",
    role: "Automated multi-server provisioning and configuration management with Ansible playbooks for reproducible staging and production environments, deployed SonarQube on Ubuntu Server for continuous code inspection, and configured Apache virtual hosts secured with SSL/TLS certificates.",
    checklist: [
      done("Automate multi-server provisioning with Ansible playbooks."),
      done("Manage configuration for reproducible staging and production environments."),
      done("Deploy SonarQube on Ubuntu Server for continuous code inspection."),
      done("Configure Apache virtual hosts with SSL/TLS certificates."),
      done("Configure Jenkins pipeline stages and triggers."),
    ],
    stack: [
      tech("Ansible", "Provisioning and configuration management"),
      tech("Jenkins", "CI/CD automation"),
      tech("SonarQube", "Continuous code inspection"),
      tech("Linux (Ubuntu)", "Server operating system"),
      tech("Apache", "Web server / virtual hosts"),
      tech("SSL/TLS", "Encrypted connections"),
    ],
    howItWorks:
      "Ansible playbooks provision and configure the servers repeatably; Jenkins automates the pipeline; SonarQube on Ubuntu inspects code continuously; Apache virtual hosts serve the applications over SSL/TLS.",
    solution: "Codifying server setup in playbooks makes environments reproducible, and continuous inspection catches code-quality problems before deployment.",
    outcome: "Reproducible, automated server setup with continuous code inspection and TLS-secured web hosting.",
    challenges: ["Infrastructure problems usually come from configuration, permissions, networking or environment differences — systematic troubleshooting finds the actual cause."],
    evidence: ["Sanitised Ansible playbook", "Pipeline screenshot or configuration", "Architecture diagram", "SonarQube dashboard screenshot"],
    featured: true,
    destination: "devops",
    accent: "#3a6fd8",
    cta: "Explore the project",
  },

  /* ── 08. DevOps & Cloud Engineering Labs ── */
  {
    ...base,
    id: "devops-labs",
    name: "DevOps & Cloud Engineering Labs",
    kicker: "Infrastructure / DevOps",
    location: "Cloud District",
    category: "devops-lab",
    status: "lab",
    statusNote: "Hands-on learning labs — not evidence of managing production infrastructure.",
    summary: "Linux, Git, containers, CI/CD, configuration management, AWS networking and monitoring — practised hands-on.",
    problem:
      "Software that runs on a developer's machine needs a reliable path to repeatable environments, automated delivery, service configuration, monitoring and deployment.",
    goal: "Build practical experience with infrastructure, Linux administration, containers, CI/CD, configuration management and monitoring.",
    checklist: [
      done("Configure Linux environments."),
      done("Practise Git workflows and repository management."),
      done("Build a CI/CD pipeline with Jenkins and Maven."),
      done("Package applications with Docker."),
      done("Work with AWS compute (EC2) and VPC networking."),
      done("Practise IAM permissions and least-privilege access."),
      done("Explore load balancing."),
      done("Configure health checks."),
      done("Use Ansible for repeatable configuration."),
      done("Configure multi-VM services and troubleshoot dependencies (Vagrant)."),
      done("Practise monitoring with Prometheus."),
      done("Record commands, architecture, logs and troubleshooting steps."),
      done("Document cleanup procedures to avoid unnecessary cloud charges."),
      done("Keep lab results separate from production experience."),
    ],
    stack: [
      tech("Git / GitHub", "Source control"),
      tech("Linux / Bash", "Command-line administration"),
      tech("Docker", "Containerisation"),
      tech("Jenkins & Maven", "CI/CD tooling"),
      tech("Ansible", "Configuration management"),
      tech("AWS (EC2, IAM, VPC, load balancing)", "Cloud learning"),
      tech("Vagrant & VirtualBox", "Local multi-VM labs"),
      tech("Prometheus", "Monitoring and metrics"),
      tech("GitHub Actions", "CI workflows"),
    ],
    howItWorks:
      "Each lab practises one part of the delivery path: Linux and Git fundamentals, containers with Docker, pipelines with Jenkins and Maven, repeatable configuration with Ansible, AWS compute and networking, a Vagrant multi-VM stack (web, app, database, Memcached, RabbitMQ) and monitoring with Prometheus.",
    solution:
      "Containers and repeatable configuration reduce environment differences, CI/CD standardises testing and delivery, cloud networking and IAM organise infrastructure and access, and monitoring makes service problems easier to detect.",
    outcome: "Practical understanding of infrastructure and deployment workflows, with hands-on troubleshooting experience.",
    challenges: ["Infrastructure issues often come from configuration, permissions, networking, dependencies or environment differences — systematic troubleshooting beats repeated guessing."],
    evidence: ["Architecture diagram", "Dockerfile / Compose configuration", "CI/CD pipeline screenshot", "Ansible playbook", "Sanitised AWS architecture screenshot", "Monitoring dashboard, if implemented", "Troubleshooting notes"],
    modules: [
      { name: "Docker & containers", areas: ["Service configuration", "Environment variables", "Networking"] },
      { name: "AWS infrastructure", areas: ["EC2", "VPC", "IAM", "Load balancing"] },
      { name: "CI/CD with Git & Jenkins", areas: ["Pipeline stages", "Automated builds", "Maven"] },
      { name: "Ansible automation", areas: ["Playbooks", "Inventory", "Repeatable configuration"] },
      { name: "Monitoring with Prometheus", areas: ["Metrics", "Service health"] },
      { name: "Vagrant multi-machine", areas: ["Web", "App", "Database", "Memcached", "RabbitMQ"] },
    ],
    destination: "devops",
    accent: "#2f8fd8",
    cta: "Explore the labs",
  },

  /* ── 09. Freelance concepts & proposed solutions ── */
  {
    ...base,
    id: "track-day-rentals",
    name: "Motorcycle Track-Day Rental Website",
    category: "freelance",
    status: "proposed",
    summary: "Compare motorcycles, pricing and inclusions, then enquire in one tap — in Thai, Chinese and English.",
    problem: "Customers need to compare available motorcycles, understand pricing and included services, and contact the rental business without friction.",
    plannedFeatures: [
      "Responsive landing page",
      "Individual motorcycle details and pricing",
      "Full-screen hero video",
      "Thai, Chinese and English content",
      "WhatsApp or Facebook Messenger enquiry flow",
      "Mobile-first booking experience",
    ],
    stack: [tech("Framer", "Part of the proposed scope", "planned")],
    outcome: "Make motorcycle options easier to compare and enquiries easier to start.",
    outcomeLabel: "Intended outcome",
    destination: "creative",
    accent: "#e8553f",
    cta: "View the proposal",
  },
  {
    ...base,
    id: "healthcare-saas",
    name: "Healthcare B2B SaaS Website",
    category: "freelance",
    status: "proposed",
    summary: "Explaining a healthcare product clearly, building trust and guiding buyers to request a demo.",
    problem: "Business buyers need to understand the product, its benefits and workflows, and how to request a demonstration.",
    plannedFeatures: ["Clear product positioning", "Feature and workflow sections", "Appropriate trust and proof elements", "Responsive design", "Demo or enquiry CTA"],
    outcome: "Help potential buyers understand the offering and take the next step.",
    outcomeLabel: "Intended outcome",
    destination: "creative",
    accent: "#3aa0a0",
    cta: "View the proposal",
  },
  {
    ...base,
    id: "interactive-3d-hero",
    name: "Interactive 3D Website Hero",
    category: "freelance",
    status: "proposed",
    summary: "A distinctive interactive 3D hero that stays fast, accessible and usable on mobile.",
    problem: "A conventional hero section may not communicate a visually distinctive brand experience.",
    plannedFeatures: ["Interactive 3D scene", "Responsive camera and layout behaviour", "Optimised loading and rendering", "Accessible fallback content", "A clear CTA that stays usable on mobile"],
    stack: [tech("Three.js / React Three Fiber", "If selected and implemented", "planned")],
    outcome: "A distinctive experience without sacrificing performance or usability.",
    outcomeLabel: "Intended outcome",
    destination: "creative",
    accent: "#7a5af0",
    cta: "View the proposal",
  },
  {
    ...base,
    id: "toy-ecommerce",
    name: "Toy E-commerce Experience",
    category: "freelance",
    status: "proposed",
    summary: "Easier product discovery and clearer product details for a toy store.",
    problem: "Customers need to explore products easily and understand product details before purchasing.",
    plannedFeatures: ["Product browsing", "Product detail views", "Responsive layouts", "Clear cart and purchase flow, if in scope", "Helpful navigation and feedback"],
    outcome: "Make product discovery and purchasing easier.",
    outcomeLabel: "Intended outcome",
    destination: "creative",
    accent: "#f2b84b",
    cta: "View the proposal",
  },
  {
    ...base,
    id: "apres-cookies",
    name: "Après Cookies — Shopify Store",
    category: "freelance",
    status: "proposed",
    summary: "A brand-aligned Shopify storefront that makes browsing and buying cookies easy.",
    problem: "A cookie brand needs a recognisable online storefront where customers can browse products and reach the purchase flow.",
    plannedFeatures: ["Brand-aligned visual design", "Product presentation", "Mobile-friendly product pages", "Shopify storefront integration", "Clear purchase CTAs"],
    stack: [tech("Shopify", "Part of the proposed scope", "planned")],
    outcome: "A cohesive storefront that supports product discovery and buying.",
    outcomeLabel: "Intended outcome",
    destination: "creative",
    accent: "#c98b5a",
    cta: "View the proposal",
  },
  {
    ...base,
    id: "av-studio",
    name: "Audiovisual Studio Website",
    category: "freelance",
    status: "proposed",
    summary: "A media-led site that showcases a studio's work and makes enquiries easy.",
    problem: "A creative studio needs to showcase its work and make it easy for potential clients to understand its capabilities and get in touch.",
    plannedFeatures: ["Media-led homepage", "Project gallery or case studies", "Responsive audiovisual presentation", "Contact or enquiry workflow", "Performance-conscious media loading"],
    outcome: "Present creative work clearly and encourage relevant enquiries.",
    outcomeLabel: "Intended outcome",
    destination: "creative",
    accent: "#2d313b",
    cta: "View the proposal",
  },
  {
    ...base,
    id: "nation-ai-commerce",
    name: "Nation AI-Commerce",
    category: "freelance",
    status: "concept",
    summary: "Branding and a landing page communicating a digital-commerce product's identity, purpose and value.",
    plannedFeatures: ["Brand identity", "Visual system", "Landing page", "Product positioning"],
    destination: "creative",
    accent: "#3f6b52",
    cta: "View the concept",
  },
  {
    ...base,
    id: "zoo-hill-data-ai",
    name: "Zoo Hill Data AI Lab",
    category: "freelance",
    status: "proposed",
    statusNote: "Opportunity discussed — scope to be confirmed.",
    summary: "An AI- and data-oriented website opportunity.",
    plannedFeatures: ["AI & data storytelling", "Web experience"],
    destination: "creative",
    accent: "#5b8def",
    cta: "View the proposal",
  },
];

/** Derive the simple technology list (cards, terminal) from each project's stack. */
export const projects: Project[] = rawProjects.map((p) => {
  if (p.stack.length === 0) return p;
  const verified = p.stack.filter((s) => s.state === "verified").map((s) => s.name);
  const plannedOnly = verified.length === 0 && p.stack.some((s) => s.state === "planned");
  return {
    ...p,
    technologies: plannedOnly ? p.stack.filter((s) => s.state === "planned").map((s) => s.name) : verified,
    technologyLabel: plannedOnly ? (p.category === "freelance" ? "Proposed stack" : "Planned stack") : p.technologyLabel,
  };
});

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

export const skillsIntro =
  "My toolkit reflects building applications, working with business data, and exploring infrastructure and AI — grouped by how much I've actually used each tool.";

export const skillLevels: Record<SkillLevel, { label: string; description: string }> = {
  experienced: { label: "Experienced", description: "Used in professional roles" },
  working: { label: "Working knowledge", description: "Used in projects" },
  learning: { label: "Learning", description: "Practised through hands-on labs" },
};

export const skills: SkillGroup[] = [
  {
    id: "backend",
    title: "Backend & business systems",
    level: "experienced",
    items: ["PHP", "Laravel", "Filament", "Livewire", "Node.js", "Express.js", "REST APIs"],
    note: null,
  },
  {
    id: "frontend",
    title: "Frontend",
    level: "experienced",
    items: ["JavaScript (ES6+)", "HTML5", "CSS3", "Responsive UI"],
    note: null,
  },
  { id: "data", title: "Databases", level: "experienced", items: ["MySQL", "MongoDB"], note: null },
  {
    id: "practice",
    title: "Engineering practice",
    level: "experienced",
    items: ["Git branching workflows", "Debugging", "API integration", "Business workflow analysis"],
    note: null,
  },
  {
    id: "frameworks",
    title: "Frameworks & languages",
    level: "working",
    items: ["React.js", "Next.js", "TypeScript", "C#", ".NET"],
    note: null,
  },
  { id: "mobile", title: "Mobile", level: "working", items: ["Flutter", "Dart"], note: null },
  { id: "data-more", title: "More databases", level: "working", items: ["SQL Server", "PostgreSQL"], note: null },
  { id: "ml", title: "AI & machine learning", level: "working", items: ["Python", "TensorFlow (CNN)"], note: null },
  {
    id: "devops",
    title: "DevOps & infrastructure",
    level: "working",
    items: ["Docker", "Jenkins", "GitHub Actions", "Ansible", "SonarQube", "Maven", "Linux (Ubuntu)", "Bash", "Apache", "SSL/TLS"],
    note: null,
  },
  {
    id: "cloud",
    title: "Cloud & monitoring",
    level: "learning",
    items: ["AWS (EC2, VPC, IAM, load balancing)", "Prometheus", "Vagrant"],
    note: null,
  },
];

/* ───────────────────────────── experience ───────────────────────────── */

export const experienceTitle = "Where I've been building";

export const timeline: TimelineEntry[] = [
  {
    id: "truck-it-in",
    kind: "work",
    title: "Software Engineer",
    organization: "Truck It In (Private) Limited",
    period: "2026",
    location: null,
    summary: null,
    responsibilities: [
      "Developed and maintained production enterprise modules using PHP, Laravel, Filament and Livewire to streamline internal logistics, accounting and HR operations.",
      "Collaborated with finance and operations stakeholders to translate business rules into automated system workflows, eliminating manual spreadsheet tracking and duplicate data entry.",
      "Audited and refactored legacy ERP components to resolve integration bottlenecks and enforce strict database relational integrity across departmental modules.",
    ],
    highlights: [],
    contributions: [
      {
        title: "Enterprise modules for logistics, accounting and HR",
        problem: "Internal logistics, accounting and HR operations needed streamlining.",
        role: "Developed and maintained production enterprise modules.",
        technologies: ["PHP", "Laravel", "Filament", "Livewire"],
        implementation: null,
        validation: null,
        outcome: "Streamlined internal logistics, accounting and HR operations.",
      },
      {
        title: "Business rules turned into automated workflows",
        problem: "Manual spreadsheet tracking and duplicate data entry.",
        role: "Collaborated with finance and operations stakeholders to translate business rules into automated system workflows.",
        technologies: ["PHP", "Laravel", "Filament", "Livewire"],
        implementation: null,
        validation: null,
        outcome: "Eliminated manual spreadsheet tracking and duplicate data entry.",
      },
      {
        title: "Legacy ERP refactoring",
        problem: "Integration bottlenecks between departmental modules.",
        role: "Audited and refactored legacy ERP components.",
        technologies: ["PHP", "Laravel"],
        implementation: null,
        validation: null,
        outcome: "Resolved integration bottlenecks and enforced strict relational integrity across departmental modules.",
      },
    ],
  },
  {
    id: "ats-ai-lab",
    kind: "work",
    title: "Applied Software Development Trainee",
    organization: "ATS AI Lab",
    period: "Summer 2025",
    location: null,
    summary: null,
    responsibilities: [
      "Managed multi-environment release workflows using structured Git branching strategies, reducing merge conflicts across team deployments.",
      "Integrated automated static code analysis into pre-deployment pipelines and diagnosed runtime logs to debug REST API and database bottlenecks.",
    ],
    highlights: [],
  },
  {
    id: "digital-empowerment",
    kind: "work",
    title: "Backend Developer",
    organization: "Digital Empowerment Pakistan",
    period: "Jul 2024 – Aug 2024",
    location: null,
    summary: null,
    responsibilities: [
      "Engineered RESTful APIs using Node.js and Express.js, implementing custom middleware for request sanitisation and centralised error handling.",
      "Designed and indexed MongoDB and MySQL schemas to optimise query execution and support concurrent read/write operations.",
    ],
    highlights: [],
  },
  {
    id: "hazara-university",
    kind: "work",
    title: "Frontend Developer",
    organization: "Hazara University Mansehra",
    period: "Aug 2023 – Oct 2023",
    location: null,
    summary: null,
    responsibilities: [
      "Built responsive, cross-browser web interfaces using HTML5, CSS3 and JavaScript (ES6+), developing reusable UI components for university portals.",
      "Reduced client-side page load times by minifying static assets and optimising DOM rendering paths.",
    ],
    highlights: [],
  },
  {
    id: "paf-iast",
    kind: "education",
    title: "BS Computer Science",
    organization: "Pak-Austria Fachhochschule (PAF-IAST)",
    period: "2022 – 2026",
    location: "Haripur, Pakistan",
    summary: null,
    responsibilities: [],
    highlights: ["Final-year project: Fabric Classification mobile application (TensorFlow, Flutter)."],
  },
];

export const credentials: Credential[] = [
  {
    id: "fcc-backend",
    title: "Back End Development and APIs",
    issuer: "freeCodeCamp",
    date: null,
    status: "completed",
    url: "https://www.freecodecamp.org/certification/fcc3276732c-c0fa-4293-9e22-89f358db8170/back-end-development-and-apis",
    note: null,
  },
  {
    id: "fcc-rwd",
    title: "Responsive Web Design",
    issuer: "freeCodeCamp",
    date: null,
    status: "completed",
    url: "https://www.freecodecamp.org/certification/fcc3276732c-c0fa-4293-9e22-89f358db8170/responsive-web-design",
    note: null,
  },
  { id: "devops-cicd", title: "DevOps & CI/CD Systems Training", issuer: "", date: null, status: null, url: null, note: null },
  // Mentioned earlier but not on the CV — uncomment once verified:
  // { id: "google-dm", title: "Digital Marketing & E-commerce", issuer: "Google", date: null, status: null, url: null, note: null },
  // { id: "coursera", title: "Coursera Specialization", issuer: "Coursera", date: null, status: null, url: null, note: "Exact title to be confirmed." },
  // { id: "decoding-devops", title: "Decoding DevOps — From Basics to Advanced Projects with AI", issuer: "", date: null, status: null, url: null, note: null },
  // { id: "udemy-devops", title: "DevOps Tools Training", issuer: "Udemy", date: null, status: null, url: null, note: null },
];

/* ───────────────────────────── contact ───────────────────────────── */

/** The CV PDF served from /public. */
export const CV_PATH = "/AsadShaa_CV.pdf";

export const contact = {
  label: "Have a problem worth solving?",
  heading: "Let's build something useful.",
  blurb:
    "Have a project idea, a technical challenge or an opportunity to collaborate? I'd love to hear what you're working on and explore how I can help.",
  primaryCta: "Get in Touch",
  cvCta: "Download My CV",
  email: "asadullahsyed2049@gmail.com",
  links: [
    { kind: "email", label: "Email", href: "mailto:asadullahsyed2049@gmail.com" },
    { kind: "github", label: "GitHub", href: "https://github.com/asadshaa" },
    { kind: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/asad-ullah-56b106249" },
    { kind: "cv", label: "Download CV", href: CV_PATH },
  ] as ContactLink[],
  /** Enquiry types for the contact form (the form opens the visitor's email app — nothing is sent silently). */
  enquiryTypes: ["Full-time role", "Internship", "Freelance project", "Collaboration", "Something else"],
};

export const cvLink = (): string | null => contact.links.find((l) => l.kind === "cv" && l.href)?.href ?? null;

export const footer = {
  text: "Designed and built by Asad Ullah Shah.",
  secondary: "Built with curiosity, code, and a continuous desire to learn.",
};

/** Copy used inside the 3D game. */
export const gameCopy = {
  loading: "Building the world…",
  start: "Your next discovery is just around the corner.",
  drivingHint: "Follow the road. Explore the world.",
  prompt: "Press E to explore",
  promptTouch: "Tap to explore",
  discovered: "New destination discovered",
  returnPrompt: "Back to the road",
  completionTitle: "You've explored my developer universe",
  completion: "Thanks for stopping by. If something here caught your interest, let's talk.",
};

/* ───────────────────────────── sections ───────────────────────────── */

export const sectionMeta: Record<SectionId, { title: string; place: string; blurb: string; intro: string }> = {
  about: {
    title: "About",
    place: "Home",
    blurb: "The person behind the code.",
    intro: "",
  },
  projects: {
    title: "Software Projects",
    place: "Engineering Garage",
    blurb: "A closer look at what I've built.",
    intro: "A closer look at what I've built — business systems and applications. Pick one to open its case study; the camera pulls up to its screen.",
  },
  devops: {
    title: "DevOps & Infrastructure",
    place: "Cloud District",
    blurb: "Learning how to build, deploy and operate reliable systems.",
    intro:
      "Engineering beyond the application. I'm expanding my understanding of how software is packaged, deployed, monitored and operated — one infrastructure project plus hands-on labs that document what I've practised.",
  },
  research: {
    title: "AI & Research",
    place: "Research Island",
    blurb: "Exploring ideas through code, data and experimentation.",
    intro: "Exploring ideas through code, data and experimentation — each project labelled with how far along it is.",
  },
  creative: {
    title: "Concepts & Freelance",
    place: "Creative District",
    blurb: "Experiments in design, interaction and digital products.",
    intro:
      "Selected concepts and freelance work. I enjoy exploring how thoughtful design and practical engineering can turn a business idea into a useful digital experience. Every entry is labelled honestly — proposals are never presented as completed client work.",
  },
  contact: {
    title: "Contact & CV",
    place: "Lighthouse",
    blurb: "Have something in mind? Let's talk.",
    intro: "",
  },
};

export const sectionOrder: SectionId[] = ["about", "projects", "devops", "research", "creative", "contact"];

export const categoryMeta: Record<ProjectCategory, { title: string; blurb: string }> = {
  professional: { title: "Professional & business software", blurb: "Systems built for real business workflows." },
  "ai-apps": { title: "AI, mobile & application projects", blurb: "Machine learning, mobile apps and AI experiments." },
  "devops-lab": { title: "DevOps & infrastructure", blurb: "An infrastructure project plus hands-on learning labs — labs are not production systems." },
  freelance: { title: "Selected concepts & freelance work", blurb: "Concepts and proposals, labelled by status." },
};

export const statusMeta: Record<ProjectStatus, { label: string; tone: "solid" | "soft" | "outline" }> = {
  completed: { label: "Completed", tone: "solid" },
  contribution: { label: "Professional contribution", tone: "solid" },
  "in-progress": { label: "In progress", tone: "soft" },
  history: { label: "Project history", tone: "soft" },
  academic: { label: "Academic project", tone: "soft" },
  personal: { label: "Personal project", tone: "soft" },
  lab: { label: "Learning lab", tone: "outline" },
  experiment: { label: "Creative experiment", tone: "outline" },
  concept: { label: "Concept", tone: "outline" },
  proposed: { label: "Proposed solution", tone: "outline" },
  exploration: { label: "Design exploration", tone: "outline" },
  prototype: { label: "Prototype", tone: "outline" },
  client: { label: "Completed client work", tone: "solid" },
};

export const projectsIn = (section: SectionId) => projects.filter((p) => p.destination === section);
export const projectById = (id: string | null | undefined) => projects.find((p) => p.id === id) ?? null;
