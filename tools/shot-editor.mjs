import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('logs', { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => log('pageerror', e.message.slice(0, 300)));
try {
  await page.goto('http://localhost:5173/editor', { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(4000);
  // live-capture marker: big red banner with random token
  const token = Math.random().toString(36).slice(2, 8);
  await page.evaluate((t) => {
    const d = document.createElement('div');
    d.id = 'capture-marker';
    d.textContent = 'CAPTURE ' + t;
    d.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:red;color:white;font-size:48px;padding:20px;';
    document.body.appendChild(d);
  }, token);
  await page.waitForTimeout(300);
  const state = await page.evaluate(() => ({
    path: location.pathname,
    panel: document.body.innerText.includes('Hero layout editor'),
    marker: document.getElementById('capture-marker')?.textContent,
    canvases: document.querySelectorAll('canvas').length,
  }));
  log('state:', JSON.stringify(state));
  const buf = await page.screenshot({ animations: 'disabled', timeout: 15000 });
  const name = `logs/ed-${token}.png`;
  writeFileSync(name, buf);
  log('saved', name);
} catch (e) {
  log('FAILED:', e.message.split('\n')[0]);
}
await browser.close().catch(() => {});
