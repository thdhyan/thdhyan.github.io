import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
const reqFail = [];
const urdfReqs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message.slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
page.on('requestfailed', (r) => reqFail.push(r.url().slice(-90) + ' :: ' + r.failure()?.errorText));
page.on('response', (r) => { if (/models-raw|\.urdf|\.stl|\.dae|\.obj|\.mtl/i.test(r.url())) urdfReqs.push(r.status() + ' ' + r.url().split('models-raw')[1]?.slice(0, 70)); });
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 20000 });
try {
  await page.waitForFunction(() => {
    const m = document.querySelector('main');
    return m && !document.querySelector('[aria-label="Loading"]') && getComputedStyle(m).opacity === '1';
  }, { timeout: 25000 });
} catch { log('WARN: main never reached opacity 1'); }
await page.waitForTimeout(9000); // URDFs are heavy — give meshes time
const buf = await page.screenshot({ animations: 'disabled', timeout: 15000 });
writeFileSync(`logs/urdf-hero-${Date.now()}.png`, buf);
const counts = { total: urdfReqs.length, ok: urdfReqs.filter(s => s.startsWith('2')).length, bad: urdfReqs.filter(s => !s.startsWith('2')) };
log('models-raw responses:', JSON.stringify(counts));
log('non-200s:', JSON.stringify(urdfReqs.filter(s => !s.startsWith('2')).slice(0, 10)));
log('request failures:', JSON.stringify(reqFail.slice(0, 10)));
log('errors:', JSON.stringify(errs.slice(0, 10)));
await browser.close().catch(() => {});
