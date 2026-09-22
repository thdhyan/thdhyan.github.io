import { chromium } from '@playwright/test';
const log = (...a) => console.log(...a);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 20000 });
await page.waitForFunction(() => {
  const m = document.querySelector('main');
  return m && !document.querySelector('[aria-label="Loading"]') && getComputedStyle(m).opacity === '1';
}, { timeout: 20000 });
await page.waitForTimeout(500);
const buf = await page.screenshot({ animations: 'disabled', timeout: 15000 });

const samples = await page.evaluate(async (src) => {
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const px = (x, y) => [...ctx.getImageData(x, y, 1, 1).data].slice(0, 3);
  // scan a vertical strip through expected person x~884 for non-background rows
  const rows = [];
  for (let y = 100; y < 880; y += 20) rows.push([y, px(884, y)]);
  return {
    personStrip: rows,
    paragraphRegion: [px(300, 430), px(420, 470), px(250, 495)], // text zone: bg dark?
    amrZone: [px(184, 640), px(184, 700)],                        // expected AMR location
    armRight: [px(1330, 400)],                                    // so100 after x 3.9->3.3
  };
}, 'data:image/png;base64,' + buf.toString('base64'));

// person silhouette: rows where pixel differs strongly from bg #101010
const bright = samples.personStrip.filter(([y, [r, g, b]]) => Math.abs(r - 16) + Math.abs(g - 16) + Math.abs(b - 16) > 40);
log('person strip non-bg rows:', JSON.stringify(bright));
log('paragraph zone px:', JSON.stringify(samples.paragraphRegion));
log('AMR zone px:', JSON.stringify(samples.amrZone));
log('so100 zone px:', JSON.stringify(samples.armRight));
await browser.close().catch(() => {});
