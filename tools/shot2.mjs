// Capture + measure main opacity simultaneously. Usage: node tools/shot2.mjs
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('logs', { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.emulateMedia({ reducedMotion: 'reduce' });
page.on('pageerror', (e) => log('pageerror', e.message.slice(0, 200)));

await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 20000 });

const cdp = await page.context().newCDPSession(page);

async function snap(name) {
  const state = await page.evaluate(() => ({
    main: getComputedStyle(document.querySelector('main')).opacity,
    loader: !!document.querySelector('[aria-label="Loading"]'),
    loaderOp: document.querySelector('[aria-label="Loading"]')
      ? getComputedStyle(document.querySelector('[aria-label="Loading"]')).opacity : null,
  }));
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: false });
  writeFileSync(`logs/${name}.png`, Buffer.from(data, 'base64'));
  log(name, JSON.stringify(state));
}

await page.waitForTimeout(4000);
await snap('t4s');
await page.waitForTimeout(5000);
await snap('t9s');
await browser.close().catch(() => {});
