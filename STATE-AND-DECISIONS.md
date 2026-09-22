# STATE & DECISIONS — Portfolio Website

> Reference file for me (the agent) and the user. Update it whenever a decision or state change happens.
> Last updated: 2026-09-22

## Project
- Vite + React + react-three-fiber portfolio for Dhyan Thakkar, live at https://thdhyan.github.io
- Deploy: `npm run deploy` (build → `docs/`) → `git add docs` → commit → push `main`. GitHub Pages serves `main:/docs`. No CI build.
- Tests: `npx playwright test tests/portfolio.spec.ts --project=chromium` must stay green.
- Lint: `npm run lint` must be 0 errors.
- Screenshots: Playwright `page.screenshot()` TIMES OUT (frameloop="always"); use CDP `Page.captureScreenshot` via `p.context().newCDPSession(p)`.

## Decisions (confirmed by user)
1. **Full mockup identity** — adopt the AI mockup's visual identity:
   - Palette: near-black bg `#101010`/`#1C1C1C`, purple accent `#6B59D0`, olive `#6D694D`, cream text `#F8EFEF`.
   - Fonts: **Sora** (bold headings) + **Inter** (body). Replace Space Grotesk / Space Mono.
   - ⚠️ CSS vars are named `--rose-*` but held green before; now they hold PURPLE. Never "restore" hue by name.
2. **Projects = live interactive GLB thumbnails** — each project card shows a real robot GLB in a small Canvas, reacting to mouse (hover/pointer), NOT static renders. Grid layout kept (no carousel needed unless user asks later).
3. **Contact handles stay current**: `thakk100@umn.edu`, `linkedin.com/in/thdhyan`, `github.com/thdhyan`. Mockup's dhyanthakkar97 handles were wrong.
4. **Hero→cards scroll choreography: LATER** (2nd pass, after static design matches mockup).
5. **Hero lineup**: user's own model (hero-robot.glb) as centerpiece + Unitree G1, Booster K1, Nova Carter, Spot w/ Arm, Unitree Go1, Unitree Go2 standing on a real ground plane (fleet arc behind/beside, smaller scale). Drone stays.
6. **URDF in-scene**: user wants URDFs loaded so robots can be posed; current implementation path is URDF→GLB conversion (tools/urdf2glb.py) baked at nice poses — revisit runtime urdf-loader only if posing live becomes a requirement.
7. Layout history: user chose "Fleet arc behind me" (not side-by-side equal scale).

## Hero copy (mockup, keep tests green)
- Eyebrow test asserts exact: `Robotics Engineer · MS Robotics @ UMN` — keep this string in DOM.
- H1 accessible name must remain `Dhyan Thakkar`.
- Mockup style: "THAKKAR" line in purple accent; CTA "View Projects →"; "Scroll to explore".

## Asset pipeline
- `tools/urdf2glb.py` — converts URDF → decimated, texture-stripped, Y-up, floor-aligned GLB → `build/fleet/<name>.glb`. Then Draco:
  `npx -y @gltf-transform/cli optimize build/fleet/<name>.glb public/models/<name>.glb --compress draco`
- Python: `pip3 install --user --break-system-packages trimesh fast_simplification` (PEP 668 env). yourdfpy works. Blender at `/snap/bin/blender` (fallback).
- Raw sources in `models-raw/` (gitignored, except committed GLBs in `public/models/`):

| Robot | Source (verified paths below by `find`) | Status |
|---|---|---|
| G1 humanoid | `models-raw/g1_legged/g1_29dof_rev_1_0.urdf` (⚠️ `models-raw/g1/` is a wheeled AGV, NOT the humanoid) | source ready |
| Booster K1 | `models-raw/booster_k1/K1_22dof.urdf` + `meshes/` (from github ssh373/asset) | fetched |
| Go1 | `models-raw/go1/go1.urdf` + `meshes/*.dae` (from unitreerobotics/unitree_ros); trunk.dae 64 MB → decimate | fetched |
| Go2 | `models-raw/go2/` (urdf + `dae/`) | source ready |
| Spot + Arm | `models-raw/spot_arm/urdf/spot_arm.urdf` + `meshes/` | source ready |
| Nova Carter | `models-raw/nova_carter/nova_carter_web.urdf`; chassis_link.obj 153 MB → budget 45k faces | source ready |
| SO100 arm | `models-raw/so100/urdf/so101_new_calib.urdf` | source ready (thumbnails) |
| Drone, hero | `public/models/drone.glb`, `public/models/hero-robot.glb` (Draco, 3.8/3.3 MB) | ✅ done |

- 600 MB of unused raw models moved to `models-raw/`; only hero GLBs were committed originally.

## Current code state
- `src/components/Scene.jsx`: hero-robot + drone only, old green-tinted lighting, ground plane at y=-2.15. **Needs rewrite** for fleet arc + purple lighting + real ground.
- `src/index.css`: still old green palette + Space Grotesk. **Needs identity swap** (vars keep `--rose-*` names or rename carefully — all components use them).
- `src/components/Loader.jsx`: purple-ish already (oklch hue 295-308) but fonts hardcoded 'Space Mono'.
- Sections: Navbar, Hero, About, Projects (7-card text grid), Skills, Publications, Contact. Publications exists (not in mockup — keep, it's real content).
- About heading should become mockup's "Robotics Engineer. Problem Solver. Builder of Intelligent Machines."
- Navbar right button: mockup says "Let's Connect" (currently "Resume ↗").
- `docs/` is stale until next `npm run deploy`.

## Environment notes
- Dev server: `npm run dev` → http://localhost:5173 (start in background if needed; old shell handles die between turns).
- Memory files also live in `memory/project_state.md` (palette/deploy details).
- Old plain-HTML site removed from tree but in git history.
- Fleet conversion may take minutes (Nova Carter 153 MB OBJ) — run in background.
