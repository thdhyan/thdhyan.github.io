/* Production fallback check — the fleet must load from /models/*.glb with
   zero /models-raw requests (that dir is dev-only and 404s on GitHub Pages).
   Start a preview first:  npm run preview   (http://localhost:4173)
   Run: node tools/prodcheck.mjs */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const FLEET = ['g1', 'k1', 'nova-carter', 'spot', 'go1', 'go2', 'so100'];

mkdirSync('logs', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
/* reduced motion -> R3F frameloop 'demand': under headless software GL the
   'always' loop stalls the main thread ~2 min (first robot-heavy frames) and
   the gates starve; demand recovers in ~8s. Same recipe as the dev gates. */
await page.emulateMedia({ reducedMotion: 'reduce' });
const resp = new Map();
const errs = [];
page.on('response', (r) => resp.set(new URL(r.url()).pathname, r.status()));
page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errs.push(`console: ${m.text()}`); });

const fails = [];
const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) fails.push(m); };

await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
await page.waitForFunction(() => {
  const m = document.querySelector('main');
  const l = document.querySelector('[aria-label="Loading"]');
  return m && !l && getComputedStyle(m).opacity === '1';
}, undefined, { polling: 250, timeout: 45000 });

/* all 7 fleet robots fully loaded + draco-decoded (promise resolves post-decode) */
await page.waitForFunction(async () => {
  if (!window.__fleet || window.__fleet.size < 7) return false;
  try {
    await Promise.all([...window.__fleet.values()]);
    return true;
  } catch {
    return false;
  }
}, undefined, { polling: 200, timeout: 40000 }).catch(() => {});
const fleetOk = await page.evaluate(async () => {
  if (!window.__fleet || window.__fleet.size < 7) return false;
  try {
    await Promise.all([...window.__fleet.values()]);
    return true;
  } catch {
    return false;
  }
});
ok(fleetOk, `fleet loaded + decoded (${await page.evaluate(() => window.__fleet?.size ?? 0)}/7 promises resolved)`);

const fleetResp = FLEET.filter((id) => resp.get(`/models/${id}.glb`) === 200);
ok(fleetResp.length === 7, `all 7 fleet GLBs served 200 (${fleetResp.length}/7)`);
ok(resp.get('/models/hero-robot.glb') === 200, 'hero-robot.glb 200');
ok(resp.get('/models/drone.glb') === 200, 'drone.glb 200');
const raw = [...resp.keys()].filter((p) => p.startsWith('/models-raw'));
ok(raw.length === 0, `no /models-raw requests (${raw.length ? raw.join(', ') : 'none'})`);
ok(errs.length === 0, `no page/console errors (${errs.length ? errs.slice(0, 2).join(' | ') : 'none'})`);

/* visual: hero viewport has robots on screen (data-URL pixel sample — image
   files themselves hit the stale-cache read bug) */
await page.waitForTimeout(1200);
const shot = await page.screenshot({ animations: 'disabled' });
await page.screenshot({ path: 'logs/prod-hero.png', animations: 'disabled' });
const stats = await page.evaluate(async (dataUrl) => {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let sum = 0, sq = 0, bright = 0, n = 0;
  for (let i = 0; i < d.length; i += 4 * 97) {
    const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
    sum += l; sq += l * l; if (l > 140) bright++; n++;
  }
  const mean = sum / n;
  return { mean: +mean.toFixed(1), std: +Math.sqrt(sq / n - mean * mean).toFixed(1), brightFrac: +(bright / n).toFixed(4) };
}, `data:image/png;base64,${shot.toString('base64')}`);
ok(stats.std > 6 && stats.brightFrac > 0.005, `hero pixels show scene content ${JSON.stringify(stats)}`);

console.log(fails.length === 0 ? 'PROD CHECKS PASSED' : `${fails.length} FAILED`);
await browser.close().catch(() => {});
process.exit(fails.length === 0 ? 0 : 1);
