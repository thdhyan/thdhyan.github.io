import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('logs', { recursive: true });
const OUT = 'logs/spot-check-090557.png';
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => log('pageerror', e.message.slice(0, 300)));
try {
  await page.goto('http://localhost:5173/editor', { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(3500);
  await page.getByRole('button', { name: 'Hero view' }).click();
  await page.getByRole('button', { name: 'spot', exact: true }).click();
  await page.waitForTimeout(800);
  const state = await page.evaluate(() => ({
    path: location.pathname,
    panel: document.body.innerText.includes('Hero layout editor'),
    heroViewBtn: !!([...document.querySelectorAll('button')].find(b => b.textContent === 'Hero view')),
  }));
  log('state:', JSON.stringify(state));
  const buf = await page.screenshot({ animations: 'disabled', timeout: 15000 });
  writeFileSync(OUT, buf);
  log('saved', OUT, buf.length, 'bytes');
} catch (e) { log('FAILED:', e.message.split('\n')[0]); }
await browser.close().catch(() => {});
