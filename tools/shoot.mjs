/* Dev utility: capture the hero canvas and report brightness stats + ASCII preview.
   Usage: node tools/shoot.mjs [url] [outfile] [--hidefleet]
*/
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const url = process.argv[2] || 'http://localhost:5173';
const out = process.argv[3] || '/tmp/shoot.png';

const browser = await chromium.launch(
  process.env.CHANNEL
    ? { channel: process.env.CHANNEL, args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] }
    : {},
);
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => logs.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`));

await page.goto(url, { waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(14000);
if (process.env.HIDE_DOM) {
  await page.addStyleTag({ content: '.hero-copy,.navbar,.social-bar,.loader{visibility:hidden !important}' });
  await page.waitForTimeout(1200);
}
const shot = await page.screenshot({ timeout: 90000, animations: 'allow', caret: 'initial' });
fs.writeFileSync(out, shot);
console.log('saved', out, shot.length, 'bytes');
console.log(logs.filter((l) => !l.includes('[vite]') && !l.includes('GL Driver') && !l.includes('THREE.Collada') && !l.includes('THREE.Clock') && !l.includes('GPU stall') && !l.includes('React DevTools')).join('\n'));
await browser.close();
