import { chromium } from '@playwright/test';
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => log('pageerror', e.message.slice(0, 300)));
page.on('console', (m) => { if (m.type() === 'error') log('console.error', m.text().slice(0, 300)); });
await page.goto('http://localhost:5173/editor', { waitUntil: 'load', timeout: 20000 });
await page.waitForTimeout(4000);
const info = await page.evaluate(() => ({
  path: location.pathname,
  hasEditorPanel: !!document.body.innerText.match(/Hero layout editor/),
  hasNavbar: !!document.querySelector('.navbar'),
  bodyHead: document.body.innerText.slice(0, 200),
  canvases: document.querySelectorAll('canvas').length,
}));
log(JSON.stringify(info, null, 2));
await browser.close().catch(() => {});
