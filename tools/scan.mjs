import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.emulateMedia({ reducedMotion: 'reduce' });
page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 300)));
await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 20000 });
await page.waitForFunction(() => {
  const m = document.querySelector('main');
  return m && !document.querySelector('[aria-label="Loading"]') && getComputedStyle(m).opacity === '1';
}, { timeout: 20000 });
await page.waitForTimeout(800);
const buf = await page.screenshot({ animations: 'disabled', timeout: 15000 });

const out = await page.evaluate(async (src) => {
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);
  const at = (x, y) => { const i = (y * width + x) * 4; return [data[i], data[i+1], data[i+2]]; };
  // locate near-white pixels (person's white shirt / robot white bodies)
  let whiteCount = 0; const whiteCols = {};
  // locate bright pixels excluding text zone (x>560) and navbar (y 0..80) and panel-free right side
  for (let y = 90; y < height; y += 4) {
    for (let x = 560; x < width; x += 4) {
      const [r, g, b] = at(x, y);
      if (r > 200 && g > 200 && b > 200) {
        whiteCount++;
        const col = Math.floor(x / 80) * 80;
        whiteCols[col] = (whiteCols[col] || 0) + 1;
      }
    }
  }
  // column histogram of near-white (80px buckets) tells where robots/person are
  return { whiteCount, whiteCols, size: [width, height] };
}, 'data:image/png;base64,' + buf.toString('base64'));
console.log('near-white pixel buckets (col range -> count):');
for (const [k, v] of Object.entries(out.whiteCols)) console.log(`  x ${k}-${+k + 80}: ${v}`);
console.log('total:', out.whiteCount);
await browser.close().catch(() => {});
