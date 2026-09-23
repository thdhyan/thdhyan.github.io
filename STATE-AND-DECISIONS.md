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
2. **Projects thumbnails (superseded 2026-09-22)**: originally "live interactive GLB mini-canvases"; user then asked for **static renders of the posed 3D robots** on the cards — done via `tools/rendercards.mjs` → `public/renders/*.png`. User also requested (and got) a **horizontally scrolling 2×3 carousel** (vertical scroll scrubs the strip sideways). Grid kept as mobile/reduced-motion fallback.
3. **Contact handles stay current**: `thakk100@umn.edu`, `linkedin.com/in/thdhyan`, `github.com/thdhyan`. Mockup's dhyanthakkar97 handles were wrong.
4. **Hero→cards scroll choreography: LATER** (2nd pass, after static design matches mockup).
5. **Hero lineup**: user's own model (hero-robot.glb) as centerpiece + Unitree G1, Booster K1, Nova Carter, Spot w/ Arm, Unitree Go1, Unitree Go2 standing on a real ground plane (fleet arc behind/beside, smaller scale). Drone stays.
6. **URDF in-scene (superseded 2026-09-22)**: posing live BECAME a requirement. Fleet now loads raw URDFs at runtime via `urdf-loader` (`src/urdf.js`): real colors/textures, poseable joints + rotation in `/editor`, floor re-align after every pose change. GLB conversion (`tools/urdf2glb.py`) kept only for hero/drone + card-thumbnail source GLBs (unused fleet GLBs stay untracked in `public/models/`).
7. Layout history: user chose "Fleet arc behind me" (not side-by-side equal scale). Layout v2 baked 2026-09-22 from user's editor export `layout(8).json` (hero scale 1.8, moved fleet, g1 full pose, k1 pose, spot `front_left_hip_x`) — spot bent-knee crouch MERGED back in (the stale export predated it).
8. **Hero camera lives in `LAYOUT.camera`** (`pos [0,1,11.5]`, `fov 28`) — Hero.jsx consumes it; `/editor` has "Hero camera" sliders (pos X/Y/Z + fov) that preview live (`window.__heroCam`/`window.__heroControls`) and export into the JSON. User's export camera matched the site default (nothing to change).

## Hero copy (mockup, keep tests green) — ✅ all implemented 2026-09-22
- Eyebrow test asserts exact: `Robotics Engineer · MS Robotics @ UMN` — keep this string in DOM.
- H1 accessible name must remain `Dhyan Thakkar` (Playwright name match is case-insensitive, so `Dhyan THAKKAR` passes).
- Mockup style: "THAKKAR" line in purple accent (`--rose-accent`); CTA "View Projects →"; "Scroll to explore".

## Asset pipeline
- `tools/urdf2glb.py` — converts URDF → decimated, texture-stripped, Y-up, floor-aligned GLB → `build/fleet/<name>.glb`. Then Draco:
  `npx -y @gltf-transform/cli optimize build/fleet/<name>.glb public/models/<name>.glb --compress draco`
- **Pose bake (2026-09-23)**: `node tools/exportposes.mjs` exports `LAYOUT.fleet` joints → `tools/fleet-poses.json`; `urdf2glb.py` applies them via yourdfpy `update_cfg` (filtered to `joint_map` — unknown keys KeyError) before flatten, so production GLB poses match dev. **Workflow: joint change in `src/layout.js` → re-run exportposes + urdf2glb + draco-optimize for all 7** (heights re-verified vs posecheck: max dev 0.013, min.y=0).
- Python: `pip3 install --user --break-system-packages trimesh fast_simplification` (PEP 668 env). yourdfpy works. Blender at `/snap/bin/blender` (fallback).
- Raw sources in `models-raw/` (gitignored, except committed GLBs in `public/models/`):

| Robot | Source (verified paths below by `find`) | Status |
|---|---|---|
| G1 humanoid | `models-raw/g1_legged/g1_29dof_rev_1_0.urdf` (⚠️ `models-raw/g1/` is a wheeled AGV, NOT the humanoid) | source ready |
| Booster K1 | `models-raw/booster_k1/K1_22dof.urdf` + `meshes/` (from github ssh373/asset) | fetched |
| Go1 | `models-raw/go1/go1.urdf` + `meshes/*.dae` (from unitreerobotics/unitree_ros); trunk.dae 61 MB/734k -> `tools/daelite.py` GLB 4.8 MB/184k | runtime URDF ✓ |
| Go2 | `models-raw/go2/` (urdf + `dae/`) | source ready |
| Spot + Arm | `models-raw/spot_arm/urdf/spot_merged.urdf` + `meshes/` (raw DAEs served as-is) | runtime URDF ✓ |
| Nova Carter | `models-raw/nova_carter/nova_carter.urdf`; chassis_link.obj 152 MB -> `tools/objlite.py` 37 MB/502k | runtime URDF ✓ |
| SO100 arm | `models-raw/so100/urdf/so101_new_calib.urdf` | runtime URDF ✓ (card render) |
| Drone, hero | `public/models/drone.glb`, `public/models/hero-robot.glb` (Draco, 3.8/3.3 MB) | ✅ done |

- 600 MB of unused raw models moved to `models-raw/`; only hero GLBs were committed originally.
- `models-raw-lite/` (gitignored) = slim lookaside generated from `models-raw/` by `tools/texlite.py` / `objlite.py` / `daelite.py`; the vite middleware serves it for png/jpg/obj/mtl under `/models-raw/`, and `/models-raw-lite/**` resolves directly for DAE->GLB lookups. Re-run the tools if `models-raw/` changes.
- **daelite fidelity fix (2026-09-22)**: `FACE_CAP = 150_000`, `FACE_RATIO = 0.25` — earlier cap (25k) blocky-ified lower limbs (go1 calf/hip -> 6k, go2 base -> 25k). Now ONLY go1 trunk decimates (734k -> 184k); all other parts keep full fidelity (user complained about degraded legs).

## Renders (project cards)
- `node tools/rendercards.mjs` (dev server up) → re-renders `public/renders/*.png`, 1104×480 studio shots: /editor scene, side panel + grid hidden, camera framed on entity bbox (fov 28, 3/4 view), pixel-sanity asserted (std/mean/bright).
- Mapping (thematic): booster-k1←k1, so101-rl←so100, thesis-lidar←nova-carter, humanoid←g1, quadruped←go1, arm←spot, llmnav←go2, drone←drone. Cards without a fitting robot (groot-vqa, cosmos3, thesis-llm-reid, vlmnav, amr) show no banner — user can assign repeats if wanted.
- k1 URDF attaches ~1-2s after fleet promises resolve → rendercards waits for group children per job.

## Projects carousel
- Strip mode when `(min-width:900px) and (min-height:780px) and (prefers-reduced-motion:no-preference)`; otherwise the original grid.
- `position: sticky` pin inside a JS-sized wrap (height = 100vh + rail travel); scroll progress lerps `translate3d` on the rail — **time-based smoothing** `1-exp(-dt*12)` (dt clamp 0.5): same feel at 30/60/144 Hz and robust under headless rAF throttling. Progress bar + `NN / 07` column counter updated imperatively via refs (no re-render).
- 2 rows × 3 visible columns (`grid-auto-flow: column`), gutters `max(5vw, (100vw-80rem)/2)` align with the 80rem header, edge fade via mask-image. Compact cards: banner (flex, 90–170px) + title (1-line clamp) + desc (1-line clamp) + tags, no dead "View Details" link; grid mode keeps full desc + link.
- Test hooks: `data-projects="wrap|view|rail|bar|idx"`; dev hook `window.__proj` (frames/cleanups/state).
- ⚠️ Vite transform cache can serve a stale mixed module after rapid same-file writes — `touch <file>` to bust.

## Current code state
- **Identity swap DONE (2026-09-22)**: Sora (headings/wordmark) + Inter (body/meta); purple palette hue 286 with `--rose-accent: #6B59D0` for solid fills; `--rose-*` vars hold purple (never restore green by name). Copy edits landed: hero `THAKKAR` accent line, CTA "View Projects", "Scroll to explore", About heading "Robotics Engineer. Problem Solver. Builder of Intelligent Machines.", Navbar "Let's Connect". Verified by `tools/identity.mjs` (13 DOM asserts + pixel sampling).
- **Fleet loading = split dev/prod (2026-09-23, fixes missing robots on thdhyan.github.io)**: **dev** keeps raw URDFs at runtime (`src/urdf.js` + vite middleware `serveModelsRaw`) — real colors/textures, poseable joints, editor workflow; **prod** (`PROD = !import.meta.env.DEV`) loads pose-baked Draco GLBs `/models/<id>.glb` via GLTFLoader + DRACOLoader (gstatic `v1/decoders/`, same CDN class drei/hero uses). **Root cause of the live bug**: `/models-raw/**` exists only through the dev-only vite middleware (`models-raw/` gitignored, 782 MB) → GitHub Pages 404s it → only hero/drone (committed GLBs) rendered. GLB scenes get `joints = {}` so component code treats both paths alike; joint-effect guarded `typeof robot.setJointValues === 'function'`; `window.__fleet` exposed in prod too (promise resolve = fully decoded); catch label `[fleet]`. `/editor` on prod: sliders dead (accepted — dev tool). Hero + drone stay GLB either way. Single hero canvas only — card images are static renders (no per-card canvases).
- **WebGL white-out FIXED**: `models-raw-lite/` lookaside (gitignored) generated by `tools/texlite.py` (textures 760 MB -> 20 MB decoded, tire detail maps -> 4x4), `tools/objlite.py` (nova chassis 152 MB/2.27M faces -> 37 MB/502k, materials kept), `tools/daelite.py` (go1/go2 DAE -> GLB, fidelity per note above). Middleware prefers lite for png/jpg/obj/mtl; DAE paths try `/models-raw-lite/*.glb` first, fall back to raw.
- **Back/rim light** added to Scene.jsx + Editor.jsx: `directionalLight [-2,5,-7]`, intensity 1.3, color `#C9C2FF`.
- `src/layout.js` = single source of truth; `/editor` edits it (draft key `hero-layout-draft-v2`; Export JSON -> bake into layout.js). Baked poses: go1/go2 crouch (thigh 0.45, calf -0.9), **spot crouch** (hip_y 0.6, knee -1.11, FK feet-under-hips L1=0.3205/L2=0.3709, ~13% lower, + `front_left_hip_x -0.105`), K1 (Head_pitch 0.091, Shoulder_Roll -1.3, Elbow_Pitch 0.55, AAHead_yaw 0.16), g1 full 14-joint pose, layout(8) positions/rotYs, `camera`. All 7 robots grounded min.y=0 (`tools/posecheck.mjs`); editor sliders/rotation/reset/hero-cam verified (`tools/editorcheck.mjs`, 10 asserts incl. camera export).
- Sections: Navbar, Hero, About, Projects (13-card horizontal strip w/ renders + grid fallback), Skills, Publications, Contact. Publications exists (not in mockup — keep, it's real content).
- **QA tools (all green 2026-09-23)**: `tools/posecheck.mjs`, `tools/editorcheck.mjs`, `tools/identity.mjs`, `tools/cardscheck.mjs`, `tools/rendercards.mjs`, `tools/urdf-diag.mjs`, `tools/prodcheck.mjs` (prod gate: `npm run preview` :4173 → `PROD CHECKS PASSED`; it emulates `reducedMotion` — under headless software GL the frameloop-'always' loop stalls the main thread ~2 min on the first robot-heavy frames, 'demand' recovers ~8s) + `npx playwright test tests/portfolio.spec.ts --project=chromium` + `npm run lint`.
- **STILL TODO**: hero→cards scroll choreography (decision 4, 2nd pass); optional: renders for the 5 cards without a robot.
- `docs/` rebuilt from this work 2026-09-23 via `npm run deploy`.

## Environment notes
- Dev server: `npm run dev` → http://localhost:5173 (start in background if needed; old shell handles die between turns).
- Headless Playwright on this box runs rAF at ~1-2 fps (software GL) — never use fixed sleeps for animation settle; poll conditions (`waitForFunction` with `polling: 100`).
- Memory files also live in `memory/project_state.md` (palette/deploy details).
- Old plain-HTML site removed from tree but in git history.
- Fleet conversion may take minutes (Nova Carter 153 MB OBJ) — run in background.
