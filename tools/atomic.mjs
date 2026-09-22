import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('logs', { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => log('pageerror', e.message.slice(0, 300)));
page.on('framenavigated', (f) => { if (f === page.mainFrame()) log('NAVIGATED', f.url()); });
await page.goto('http://localhost:5173/editor', { waitUntil: 'load', timeout: 20000 });
await page.waitForTimeout(4000);

const token = Math.random().toString(36).slice(2, 8);
await page.evaluate((t) => {
  const d = document.createElement('div');
  d.textContent = 'MARK ' + t;
  d.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:red;color:white;font-size:40px;padding:16px;';
  document.body.appendChild(d);
}, token);

const buf = await page.screenshot({ animations: 'disabled', timeout: 15000 });
const name = `logs/atomic-${token}.png`;
writeFileSync(name, buf);

const after = await page.evaluate(() => ({
  href: location.href,
  navbar: !!document.querySelector('.navbar'),
  main: !!document.querySelector('main'),
  panel: document.body.innerText.includes('Hero layout editor'),
  marker: document.body.innerText.includes('MARK'),
  rootHTML: document.getElementById('root').innerHTML.slice(0, 400).replace(/\s+/g, ' '),
}));
log('saved', name);
log('AFTER:', JSON.stringify(after, null, 2));
await browser.close().catch(() => {});
