// Diagnose when/why the page dies. Usage: node tools/diag.mjs
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);
page.on('console', (m) => log('console', m.type(), m.text().slice(0, 200)));
page.on('pageerror', (e) => log('pageerror', e.message.slice(0, 300)));
page.on('crash', () => log('*** CRASH ***'));
page.on('close', () => log('*** PAGE CLOSED ***'));
page.on('requestfailed', (r) => log('reqfail', r.url().slice(-60), r.failure()?.errorText));
page.on('response', (r) => { if (r.url().includes('/models/')) log('model', r.status(), r.url().slice(-30)); });

try {
  await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 20000 });
  log('loaded, url =', page.url());
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(1000);
    log('tick', i + 1, 'closed =', page.isClosed());
    if (page.isClosed()) break;
  }
} catch (e) {
  log('FAILED:', e.message.split('\n')[0]);
}
await browser.close().catch(() => {});
