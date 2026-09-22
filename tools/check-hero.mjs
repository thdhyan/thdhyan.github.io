// Quick visual check: loads the site, reports console errors/crashes, CDP screenshot.
// Usage: node tools/check-hero.mjs [outName] [scrollY]
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const out = process.argv[2] || 'hero';
const scrollY = Number(process.argv[3] || 0);
mkdirSync('logs', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
page.on('crash', () => errors.push('PAGE CRASHED'));
page.on('requestfailed', (r) => {
  const err = r.failure()?.errorText || '';
  if (!err.includes('ERR_ABORTED')) errors.push(`REQFAIL: ${r.url()} ${err}`);
});

try {
  await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(5000);
  if (scrollY) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(1500);
  }
  const cdp = await page.context().newCDPSession(page);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`logs/${out}.png`, Buffer.from(data, 'base64'));
  console.log('screenshot: logs/' + out + '.png');
} catch (e) {
  console.log('FAILED:', e.message.split('\n')[0]);
} finally {
  console.log('errors:', errors.length ? JSON.stringify(errors, null, 2) : 'none');
  await browser.close().catch(() => {});
}
