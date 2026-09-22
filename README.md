# Dhyan Thakkar — Portfolio

Personal portfolio site for **Dhyan Thakkar**, Robotics Engineer (MS Robotics, University of Minnesota).

Live: [https://thdhyan.github.io](https://thdhyan.github.io)

## Stack

- **Vite 8** + **React 19**
- **Three.js** via react-three-fiber v9 + drei v10 — animated hero scene (humanoid + drone GLB models)
- **GSAP 3.15**, Phosphor Icons
- **Playwright** for end-to-end section tests
- OKLCH palette (charcoal + green accent), Space Grotesk / Space Mono

## Commands

```bash
npm install
npm run dev      # dev server → http://localhost:5173
npm run build    # production build → dist/
npm run lint     # eslint
npm test         # via npx playwright test (chromium)
```

## 3D models

- Source GLBs live in `models-raw/` (gitignored, ~600 MB of raw robot models).
- Only the compressed hero models ship, in `public/models/` (Draco-compressed via `@gltf-transform/cli`):
  - `hero-robot.glb` — 36.9 MB → 3.3 MB
  - `drone.glb` — 38.6 MB → 3.8 MB
- To re-optimize: `npx @gltf-transform/cli optimize in.glb out.glb --compress draco`

## Deployment (GitHub Pages)

Source lives on **`main`**; the built site is committed to **`main:/docs`** and
served directly by GitHub Pages (no CI build).

```bash
npm run deploy   # build → dist/, then sync dist/ → docs/
git add docs && git commit -m "chore: publish site" && git push
```

## Structure

```
src/
  components/   Navbar, SocialBar, Loader, Hero, About, Projects,
                Skills, Publications, Contact, Scene (R3F)
  index.css     design tokens + global styles
public/
  models/       compressed GLBs served to the site
  assets/       projects.csv
tests/          Playwright specs
```
