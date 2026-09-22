# STATE & DECISIONS — Portfolio Website

> Reference file for me (the agent) and the user. Update it whenever a decision or state change happens.
> Last updated: 2026-09-22

## Project
- Vite + React + react-three-fiber portfolio for Dhyan Thakkar, live at https://thdhyan.github.io
- Deploy: `npm run deploy` (build → `docs/`) → `git add docs` → commit → push `main`. GitHub Pages serves `main:/docs`. No CI build.
- Tests: `npx playwright test tests/portfolio.spec.ts --project=chromium` must stay green.
- Lint: `npm run lint` must be 0 errors.
- Screenshots: use `tools/shot.mjs` — `emulateMedia({reducedMotion:'reduce'})` (frameloop -> demand) + waitForFunction (loader gone, main opacity 1, fleet resolved) + `screenshot({animations:'disabled'})`. Verify by pixel sampling (image reads hit a stale-cache tool bug).

## Decisions (confirmed by user)
1. **Full mockup identity** — adopt the AI mockup's visual identity:
   - Palette: near-black bg `#101010`/`#1C1C1C`, purple accent `#6B59D0`, olive `#6D694D`, cream text `#F8EFEF`.
   - Fonts: **Sora** (bold headings) + **Inter** (body). Replace Space Grotesk / Space Mono.
   - ⚠️ CSS vars are named `--rose-*` but held green before; now they hold PURPLE. Never "restore" hue by name.
2. **Projects = live interactive GLB thumbnails** — each project card shows a real robot GLB in a small Canvas, reacting to mouse (hover/pointer), NOT static renders. Grid layout kept (no carousel needed unless user asks later).
3. **Contact handles stay current**: `thakk100@umn.edu`, `linkedin.com/in/thdhyan`, `github.com/thdhyan`. Mockup's dhyanthakkar97 handles were wrong.
4. **Hero→cards scroll choreography: LATER** (2nd pass, after static design matches mockup).
5. **Hero lineup**: user's own model (hero-robot.glb) as centerpiece + Unitree G1, Booster K1, Nova Carter, Spot w/ Arm, Unitree Go1, Unitree Go2 standing on a real ground plane (fleet arc behind/beside, smaller scale). Drone stays.
6. **URDF in-scene (superseded 2026-09-22)**: posing live BECAME a requirement. Fleet now loads raw URDFs at runtime via `urdf-loader` (`src/urdf.js`): real colors/textures, poseable joints + rotation in `/editor`, floor re-align after every pose change. GLB conversion (`tools/urdf2glb.py`) kept only for hero/drone + future card thumbnails.
7. Layout history: user chose "Fleet arc behind me" (not side-by-side equal scale).

## Hero copy (mockup, keep tests green) — ✅ all implemented 2026-09-22
- Eyebrow test asserts exact: `Robotics Engineer · MS Robotics @ UMN` — keep this string in DOM.
- H1 accessible name must remain `Dhyan Thakkar` (Playwright name match is case-insensitive, so `Dhyan THAKKAR` passes).
- Mockup style: "THAKKAR" line in purple accent (`--rose-accent`); CTA "View Projects →"; "Scroll to explore".

## Asset pipeline
- `tools/urdf2glb.py` — converts URDF → decimated, texture-stripped, Y-up, floor-aligned GLB → `build/fleet/<name>.glb`. Then Draco:
  `npx -y @gltf-transform/cli optimize build/fleet/<name>.glb public/models/<name>.glb --compress draco`
- Python: `pip3 install --user --break-system-packages trimesh fast_simplification` (PEP 668 env). yourdfpy works. Blender at `/snap/bin/blender` (fallback).
- Raw sources in `models-raw/` (gitignored, except committed GLBs in `public/models/`):

| Robot | Source (verified paths below by `find`) | Status |
|---|---|---|
| G1 humanoid | `models-raw/g1_legged/g1_29dof_rev_1_0.urdf` (⚠️ `models-raw/g1/` is a wheeled AGV, NOT the humanoid) | source ready |
| Booster K1 | `models-raw/booster_k1/K1_22dof.urdf` + `meshes/` (from github ssh373/asset) | fetched |
| Go1 | `models-raw/go1/go1.urdf` + `meshes/*.dae` (from unitreerobotics/unitree_ros); trunk.dae 61 MB/734k -> `tools/daelite.py` GLB 2.7 MB/88k | runtime URDF ✓ |
| Go2 | `models-raw/go2/` (urdf + `dae/`) | source ready |
| Spot + Arm | `models-raw/spot_arm/urdf/spot_merged.urdf` + `meshes/` (raw DAEs served as-is) | runtime URDF ✓ |
| Nova Carter | `models-raw/nova_carter/nova_carter.urdf`; chassis_link.obj 152 MB -> `tools/objlite.py` 37 MB/502k | runtime URDF ✓ |
| SO100 arm | `models-raw/so100/urdf/so101_new_calib.urdf` | source ready (thumbnails) |
| Drone, hero | `public/models/drone.glb`, `public/models/hero-robot.glb` (Draco, 3.8/3.3 MB) | ✅ done |

- 600 MB of unused raw models moved to `models-raw/`; only hero GLBs were committed originally.
- `models-raw-lite/` (gitignored) = slim lookaside generated from `models-raw/` by `tools/texlite.py` / `objlite.py` / `daelite.py`; the vite middleware serves it for png/jpg/obj/mtl under `/models-raw/`, and `/models-raw-lite/**` resolves directly for DAE->GLB lookups. Re-run the tools if `models-raw/` changes.

## Current code state
- **Identity swap DONE (2026-09-22)**: Sora (headings/wordmark) + Inter (body/meta); purple palette hue 286 with `--rose-accent: #6B59D0` for solid fills; `--rose-*` vars hold purple (never restore green by name). Copy edits landed: hero `THAKKAR` accent line, CTA "View Projects", "Scroll to explore", About heading "Robotics Engineer. Problem Solver. Builder of Intelligent Machines.", Navbar "Let's Connect". Verified by `tools/identity.mjs` (13 DOM asserts + pixel sampling).
- **Fleet = raw URDFs at runtime** (`src/urdf.js` + vite middleware `serveModelsRaw`): real colors/textures, joints poseable, floor re-align after every pose change (idempotent `realign()`), dev hook `window.__fleet`. Hero + drone stay GLB. Single hero canvas only — no per-card canvases.
- **WebGL white-out FIXED**: `models-raw-lite/` lookaside (gitignored) generated by `tools/texlite.py` (textures 760 MB -> 20 MB decoded, tire detail maps -> 4x4), `tools/objlite.py` (nova chassis 152 MB/2.27M faces -> 37 MB/502k, materials kept), `tools/daelite.py` (go1/go2 DAE -> GLB; trunk 61 MB/734k -> 2.7 MB/88k). Middleware prefers lite for png/jpg/obj/mtl; DAE paths try `/models-raw-lite/*.glb` first, fall back to raw.
- `src/layout.js` = single source of truth; `/editor` edits it (draft key `hero-layout-draft-v2`; Export JSON -> bake into layout.js). Baked poses: go1/go2 crouch (thigh 0.45, calf -0.9, FK feet-under-hips ~90% stand), spot arm (arm_joint1/2/3/5/6 + gripper), K1 head/arms, g1/so100/nova positions+rots. All 7 robots grounded min.y=0 (`tools/posecheck.mjs`); editor sliders/rotation/reset verified (`tools/editorcheck.mjs`).
- Sections: Navbar, Hero, About, Projects (7-card text grid), Skills, Publications, Contact. Publications exists (not in mockup — keep, it's real content).
- **STILL TODO**: project card thumbnails (decision 2 says live GLB mini-canvases; earlier note said static renders — confirm with user when building); hero->cards scroll choreography (decision 4, 2nd pass).
- `docs/` deployed 2026-09-22 (main @ 4eda08f); rebuild via `npm run deploy`.

## Environment notes
- Dev server: `npm run dev` → http://localhost:5173 (start in background if needed; old shell handles die between turns).
- Memory files also live in `memory/project_state.md` (palette/deploy details).
- Old plain-HTML site removed from tree but in git history.
- Fleet conversion may take minutes (Nova Carter 153 MB OBJ) — run in background.
