// Stable screenshot: forces settled state, disables CSS transitions, waits, captures.
// Usage: node tools/shot.mjs [outName] [scrollY]
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const out = process.argv[2] || 'shot';
const scrollY = Number(process.argv[3] || 0);
mkdirSync('logs', { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.emulateMedia({ reducedMotion: 'reduce' }); // frameloop="demand" -> screenshot-safe
page.on('pageerror', (e) => log('pageerror', e.message.slice(0, 200)));

try {
  await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 20000 });
  // Wait for real app state: loader gone + main fully faded in.
  await page.waitForFunction(() => {
    const m = document.querySelector('main');
    const l = document.querySelector('[aria-label="Loading"]');
    return m && !l && getComputedStyle(m).opacity === '1';
  }, { timeout: 20000 });
  // Fleet URDFs resolve after the loader — wait for all of them too
  await page.waitForFunction(async () => {
    const cache = window.__fleet;
    if (!cache || !cache.size) return true;
    const done = await Promise.all([...cache.values()].map((p) => Promise.race([p.then(() => true), new Promise((r) => setTimeout(() => r(false), 50))])));
    return done.every(Boolean);
  }, { timeout: 30000 }).catch(() => console.log('fleet wait timed out'));
  if (scrollY) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(500);
  const buf = await page.screenshot({ animations: 'disabled', timeout: 15000 });
  writeFileSync(`logs/${out}.png`, buf);
  log('saved logs/' + out + '.png');
} catch (e) {
  log('FAILED:', e.message.split('\n')[0]);
}
await browser.close().catch(() => {});
