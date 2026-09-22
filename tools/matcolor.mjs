/* Records the material colors of every loaded fleet robot (dev diagnostic).
   Run: node tools/matcolor.mjs */
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 200)));
await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 30000 });

const ids = ['go1', 'go2', 'spot', 'k1', 'g1', 'so100', 'nova-carter'];
const colors = await page.evaluate(async (ids) => {
  const deadline = performance.now() + 60000;
  const out = {};
  const pending = new Set(ids);
  while (pending.size && performance.now() < deadline) {
    for (const id of [...pending]) {
      const p = window.__fleet?.get(id);
      if (!p) continue;
      let done = false;
      await Promise.race([p.then(() => { done = true; }), new Promise((r) => setTimeout(r, 10))]);
      if (done) pending.delete(id);
    }
    if (pending.size) await new Promise((r) => setTimeout(r, 300));
  }
  for (const id of ids) {
    try {
      const robot = await window.__fleet?.get(id);
      if (!robot) { out[id] = `NOT LOADED (still pending: ${[...pending].join(',')})`; continue; }
      const mats = new Map();
      robot.traverse((n) => {
        if (!n.isMesh) return;
        const list = Array.isArray(n.material) ? n.material : [n.material];
        for (const m of list) {
          const hex = m && m.color ? '#' + m.color.getHexString() : String(m && m.type);
          const key = `${m && m.name ? m.name : '(unnamed)'} ${hex} ${m && m.map ? 'map' : ''}`;
          mats.set(key, (mats.get(key) || 0) + 1);
        }
      });
      out[id] = [...mats.entries()].map(([k, v]) => `${k} x${v}`).join(' | ');
    } catch (e) { out[id] = 'error: ' + e.message; }
  }
  return out;
}, ids);

for (const [id, s] of Object.entries(colors)) console.log(id.padEnd(12), s);
await browser.close().catch(() => {});
