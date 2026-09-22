import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => log('pageerror', e.message.slice(0, 300)));
await page.goto('http://localhost:5173/editor', { waitUntil: 'load', timeout: 20000 });
await page.waitForTimeout(4000);

const token = Math.random().toString(36).slice(2, 8);
await page.evaluate((t) => {
  const d = document.createElement('div');
  d.id = 'mk';
  d.textContent = 'MARK ' + t;
  d.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:red;color:white;font-size:40px;padding:16px;';
  document.body.appendChild(d);
}, token);

const buf = await page.screenshot({ animations: 'disabled', timeout: 15000 });
writeFileSync(`logs/proof-${token}.png`, buf);
log('saved logs/proof-' + token + '.png, bytes =', buf.length, 'token =', token);

// decode the exact bytes in-browser and sample key pixels
const dataUrl = 'data:image/png;base64,' + buf.toString('base64');
const samples = await page.evaluate(async (src) => {
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const px = (x, y) => [...ctx.getImageData(x, y, 1, 1).data].slice(0, 3);
  return {
    size: [img.width, img.height],
    marker_60_40: px(60, 40),      // red if marker captured (editor page has it)
    headline_150_250: px(150, 250), // hero H1 area: bright if hero text, dark if editor canvas
    navbar_313_44: px(313, 44),     // hero navbar logo circle area
    panelTopRight_1280_42: px(1280, 42), // editor panel header text area
  };
}, dataUrl);
log('PIXELS:', JSON.stringify(samples));
await browser.close().catch(() => {});
