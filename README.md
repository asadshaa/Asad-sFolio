# Asad Ullah Shah — 3D Portfolio

An explorable 3D driving-game portfolio. Visitors drive around a small planet
and discover six places:

| Place | Section |
| --- | --- |
| **Home** (spawn point) | About · career journey · experience · skills & training |
| **Engineering Garage** | Professional & business software, applications |
| **Cloud District** | DevOps & cloud learning labs |
| **Research Island** | AI / ML projects and experiments |
| **Creative District** | Selected concepts & freelance work |
| **Lighthouse** | Contact, CV and links |

Visitors who don't want to drive can use **Quick access** on the opening
screen (or the **Sections** menu) to fly straight to any section, or open the
conventional, accessible site at **`/portfolio`**. Every project has its own
case-study page at **`/projects/<id>`**.

Built with Next.js (App Router) · TypeScript · React Three Fiber · Three.js ·
drei · Tailwind CSS · Motion · Lucide · zustand.

---

## 1. Edit your content

Everything lives in **`src/config/portfolio.ts`**: profile, about text,
journey stops, projects, skills (with honest experience levels), timeline,
credentials, contact links and section labels.

**Projects** support: `category`, `status` (`completed` · `in-progress` ·
`personal` · `concept` · `proposed` · `experiment`, or `null` = not confirmed,
no badge), `statusNote`, `summary`, `description`, `role`, `technologies`
(+ `technologyLabel` such as "Planned stack"), `focusAreas`,
`plannedFeatures`, `problem`, `solution`, `challenges`, `outcomes`,
`media`, `repoUrl`, `demoUrl`, `featured`, `destination`, `modules` and
`caseStudy` sections (overview, context, architecture, decisions, debugging,
lessons) plus an optional interactive `demo`.

- Use `null` / `[]` for anything not verified — it is hidden in production.
  In development, each case study shows a dashed checklist of missing fields.
- **Media / screenshots:** put files in `public/` and add them to `media`:
  ```ts
  media: [
    { src: "/projects/math-app/home.png", alt: "Home screen", device: "phone" },
    { src: "/projects/math-app/quiz.mp4", alt: "Quiz flow", kind: "video", device: "phone", poster: "/projects/math-app/quiz.png" },
    { src: "/projects/pos/checkout.png", alt: "Checkout", device: "browser" },
  ]
  ```
  `device: "phone"` shows mobile apps in a phone frame; `"browser"` shows web
  apps in a browser window. Short muted screen recordings (`kind: "video"`)
  autoplay and loop.
- **CV:** put a PDF in `public/` (e.g. `public/cv.pdf`) and set the CV link
  `href` to `"/cv.pdf"`. The CV kiosk at the Lighthouse, the terminal `cv`
  command and the Quick access card then open it.
- Adding a project to a destination automatically adds an interactive display
  at that landmark.

Interactive demos (all clearly labelled as illustrative, browser-only):
Aureus ERP module map, POS cart/stock/SQL-sync simulation, Skill-Bridge
skill-gap analysis with sample data, Fabric Classification pipeline overview.

## Editing the 3D models

Every model is built in code, but each one is also available as an editable
**`.glb`** file in **`assets/models/`** (opens in Blender: *File → Import →
glTF 2.0*). To regenerate those files after changing code, run the dev server
and open **http://localhost:3000/dev/models** — it re-exports everything
(dev-only; disabled in production).

| File | What it is | Notes |
| --- | --- | --- |
| `car.glb` | The player car | Front faces **+Z**. Wheel nodes `Wheel_FL`, `Wheel_FR`, `Wheel_RL`, `Wheel_RR` (origin at the wheel centre) spin and steer. Materials named `TailLight` glow when braking, `Paint` turns gold for the Konami easter egg. |
| `landmark-home.glb` … `landmark-lighthouse.glb` | The six destination buildings | **+Z faces the road**, X runs along it. Keep the footprint inside the flat pad (radius ≈ 6–8.5). Project displays and the CV kiosk are added separately from the config, so leave space in front. |
| `tree-pine`, `tree-broadleaf`, `rock`, `grass-tuft`, `flower`, `street-lamp`, `road-post`, `cloud`, `token` | Instanced scenery | Drawn hundreds of times — keep them low-poly. Base at the origin, **+Y up**. Each instance gets a random scale/rotation and a slight colour tint. `street-lamp`: the arm points along **+Z** (toward the road). |
| `world-reference.glb` | Planet, road and water | Reference for scale only — the terrain drives the physics, so it can't be swapped. |

Scale: **1 unit ≈ 1 metre** (the car is ~2.3 long, trees ~2–4 tall).

**To use your own version:**

1. Edit a file from `assets/models/` in Blender.
2. Export as **glTF Binary (.glb)** (keep "+Y Up" enabled; apply transforms).
3. Save it in **`public/models/`**, e.g. `public/models/car.glb`.
4. Point the model at it in **`src/config/models.ts`**:
   ```ts
   export const MODEL_OVERRIDES = {
     car: "/models/car.glb",
   };
   ```

If a file is missing or fails to load, the site logs a warning and uses the
built-in model, so a bad export never breaks the page. Collisions are defined
in `src/config/world.ts` (`colliders` per destination): if you make a building
much bigger or smaller, adjust them there.

## 2. Run locally

Requires Node.js ≥ 20.9.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

> **Windows note:** if your project path contains `&` (e.g. `MyPersonalApps&Stuff`),
> npm's `.cmd` shims break. Run Next directly instead:
> `node node_modules/next/dist/bin/next dev`

Quality checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## 3. Deploy to Vercel

The site is fully static (every route prerenders), needs no environment
variables, no database and no paid APIs.

**Option A — Git + dashboard**
1. Push this folder to a GitHub/GitLab/Bitbucket repository.
2. In Vercel: *Add New → Project → Import* the repository.
3. Framework preset **Next.js** is detected automatically. Keep the defaults
   (build command `next build`, output handled by Vercel).
4. Click **Deploy**.

**Option B — Vercel CLI**
```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

After the first deploy, set `profile.siteUrl` in `src/config/portfolio.ts` to
the production URL and redeploy so Open Graph images get absolute URLs.

---

## How it works

### Architecture

```
src/
  app/                      routes: / (game), /portfolio (classic), icon, OG image
  config/
    portfolio.ts            ALL personal content (single source of truth)
    world.ts                planet, road, vehicle, camera, destinations, quality tiers
  lib/
    world/world.ts          procedural planet: road loop, terrain, scatter, colliders
    three/reveal.ts         shader patch: scenery grows in near the car + wind sway
    three/props.ts          procedural low-poly prop geometry (merged, vertex-coloured)
    audio.ts                procedural Web Audio (engine, tyres, wind, birds, chimes)
    noise.ts, content.ts, travel.ts
  state/
    runtime.ts              mutable per-frame state (vehicle, input) — no React renders
    gameStore.ts            zustand UI state (phase, panels, discoveries, sound)
  components/
    game/                   Canvas, Planet, Road, Vehicle, CarModel, FollowCamera,
                            Environment, WorldStreaming, Destination, Landmarks,
                            CollisionManager, GameHUD, TouchControls, GameExperience
    portfolio/              section components shared by the game panel and /portfolio
    ui/                     LoadingScreen, IntroOverlay, MainMenu, SettingsPanel
  hooks/                    useGameControls, useDeviceCapabilities
```

### Driving on a sphere
Rather than a rigid-body vehicle (Rapier has no radial gravity, and physics
cars on a curved surface tend to tip, jitter or tunnel), the car uses a
**kinematic controller**: position on the surface + heading in the tangent
plane. Each frame it integrates speed/steering, re-projects onto the terrain
height function, and re-orthonormalises its heading. Obstacles are soft
circular colliders that push the car out and scrub speed. Water and steep
cliffs act as gentle walls. The result can't fall through the world or get
permanently stuck, and **R** (or *Reset car* in the menu) puts it back on the road.

### Progressive discovery
- The planet's curvature hides everything beyond a ~25 unit horizon.
- Scenery is bucketed into 64 spatial chunks; chunks beyond reveal range are
  not drawn at all, and nearby instances grow in via a vertex shader.
- Atmospheric fog matches the sky gradient; tall light beams hint at
  undiscovered landmarks from afar; a compass points to the nearest one.

### Destinations
Each landmark has a trigger zone on the road (pulsing ring). Inside it, a
**Press E / Tap to explore** prompt appears — but only below a speed threshold,
so driving past fast never triggers anything. Panels never auto-reopen; closing
returns you to the same spot. The pause menu (Esc / ☰) can travel directly to
any destination.

### Performance
Instanced, merged, vertex-coloured props (one draw call per prop type per
visible chunk), shared materials, no per-frame allocations, delta-time
movement, adaptive DPR via `PerformanceMonitor`, a low-quality tier for
phones / low-memory devices, and a single shadow-casting light that follows
the car. Measured ~15 ms/frame (≈60 fps) on Intel Iris Xe at 1.75× DPR before
capping high-tier DPR at 1.5.

### Accessibility & fallbacks
- `/portfolio`: semantic, server-rendered, keyboard-navigable, indexable.
- Visually hidden summary on `/` for screen readers and crawlers.
- No WebGL / context loss / scene error → automatic fallback to the classic view.
- `prefers-reduced-motion` disables camera drift, FOV kick and shake.
- Sound starts only after a click/key press, and the mute preference persists.

## Controls

| Key | Action |
| --- | --- |
| W / ↑ | Accelerate |
| S / ↓ | Brake / reverse |
| A / ← · D / → | Steer |
| Space | Handbrake |
| E | Explore destination |
| R | Reset car to road |
| M | World map & fast travel |
| T | Time of day (sunset / day / night) |
| H | Honk |
| ` | Developer terminal (`help` lists commands) |
| Esc | Close overlay / panel, or open the Sections menu |

Optional extras (never required to see any content): engineering tokens along
the road, hidden easter eggs, and a short completion card after visiting all
six places. Progress is stored in `localStorage` and can be reset from the
Sections menu or with the terminal command `reset --yes`.

Touch devices get a steering pad and separate Go / Brake pedals.
