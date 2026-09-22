/* Renders posed individual robots from the /editor scene into public/renders/<id>.png.
   Each render is a 1104x480 (2.3:1) studio shot on the card background:
   side panel + grid helper hidden, camera framed on the entity's bounding box.
   Run: node tools/rendercards.mjs   (dev server on :5173 required) */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const W = 1104;
const H = 480;
/* fleet/editor entity -> project card id (thematic mapping) */
const JOBS = [
  { ent: 'k1', out: 'booster-k1' },
  { ent: 'so100', out: 'so101-rl' },
  { ent: 'nova-carter', out: 'thesis-lidar' },
  { ent: 'g1', out: 'humanoid' },
  { ent: 'go1', out: 'quadruped' },
  { ent: 'spot', out: 'arm' },
  { ent: 'go2', out: 'llmnav' },
  { ent: 'drone', out: 'drone' },
];

await mkdir('public/renders', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 200)));
await page.goto('http://localhost:5173/editor', { waitUntil: 'load', timeout: 30000 });
await page.waitForFunction(() => window.__fleet && window.__fleet.size >= 7, { timeout: 60000 });
await page.waitForTimeout(600); // poses + camera snap settle

/* hide editor chrome: side panel + orbit hint */
await page.evaluate(() => {
  document.querySelector('[data-editor-panel]')?.style.setProperty('display', 'none');
  [...document.querySelectorAll('div, span, p')].forEach((el) => {
    if (el.childElementCount === 0 && el.textContent.includes('Drag empty space')) {
      el.style.display = 'none';
    }
  });
});

const fails = [];
for (const job of JOBS) {
  /* some URDFs (k1) attach after the fleet promises resolve */
  await page.waitForFunction((id) => {
    const g = window.__editor?.current?.[id];
    return g && g.children.length > 0;
  }, job.ent, { timeout: 30000 });

  const framed = await page.evaluate((targetId) => {
    const groups = window.__editor?.current;
    const THREE = window.__THREE;
    const cam = window.__heroCam;
    const controls = window.__heroControls;
    if (!groups || !groups[targetId] || !THREE || !cam || !controls) return `missing hooks for ${targetId}`;

    for (const [id, g] of Object.entries(groups)) g.visible = id === targetId;
    const scene = groups[targetId].parent;
    scene.traverse((o) => { if (o.isGridHelper) o.visible = false; });

    const box = new THREE.Box3().setFromObject(groups[targetId]);
    if (!isFinite(box.min.y) || box.max.y > 1e6) return `bad bbox for ${targetId}`;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    cam.fov = 28;
    cam.aspect = cam.aspect || window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    const vTan = Math.tan((cam.fov * Math.PI) / 360);
    const hTan = vTan * cam.aspect;
    const distV = (size.y * 0.5) / vTan;
    const distH = (Math.max(size.x, size.z) * 0.7) / hTan;
    const dist = Math.max(distV, distH) * 1.3;

    const dir = new THREE.Vector3(0.75, 0.4, 1).normalize();
    controls.target.copy(center);
    cam.position.copy(center.clone().add(dir.multiplyScalar(dist)));
    controls.update();
    return null;
  }, job.ent);
  if (framed) {
    console.log(`FAIL ${job.out}: ${framed}`);
    fails.push(job.out);
    continue;
  }

  await page.waitForTimeout(200);
  await page.screenshot({ path: `public/renders/${job.out}.png`, animations: 'disabled' });

  /* pixel sanity: not flat, not white-out, robot present */
  const stats = await page.evaluate(async (url) => {
    const img = new Image();
    img.src = `${url}?t=${Date.now()}`;
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
      sum += l; sq += l * l; if (l > 200) bright++; n++;
    }
    const mean = sum / n;
    const std = Math.sqrt(sq / n - mean * mean);
    return { mean: +mean.toFixed(1), std: +std.toFixed(1), brightFrac: +(bright / n).toFixed(4) };
  }, `http://localhost:5173/renders/${job.out}.png`);

  const ok = stats.std > 6 && stats.brightFrac < 0.5 && stats.mean > 8;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${job.out}.png`, stats);
  if (!ok) fails.push(job.out);
}

await browser.close().catch(() => {});
console.log(fails.length === 0 ? 'RENDERS OK' : `RENDER FAILURES: ${fails.join(', ')}`);
process.exit(fails.length === 0 ? 0 : 1);
