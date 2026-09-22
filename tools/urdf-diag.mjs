import { chromium } from '@playwright/test';
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('crash', () => log('!!! PAGE CRASHED (renderer OOM or segfault)'));
page.on('pageerror', (e) => log('pageerror: ' + e.message.slice(0, 300)));
page.on('console', (m) => { if (m.type() === 'error') log('console: ' + m.text().slice(0, 300)); });
page.on('requestfailed', (r) => log('reqfail: ' + r.url().slice(-100)));
page.on('response', (r) => {
  const url = r.url();
  if (url.includes('/models-raw/')) log(`res ${r.status()} ${url.split('/models-raw/')[1]}`);
});
try {
  await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 20000 });
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(1500);
    try {
      const op = await page.evaluate(() => {
        const m = document.querySelector('main');
        const mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1;
        return `${m ? getComputedStyle(m).opacity : 'nomain'} heap=${mem}MB`;
      });
      log(`t=${((i + 1) * 1.5).toFixed(1)}s mainOp=${op}`);
    } catch { log(`t=${((i + 1) * 1.5).toFixed(1)}s evaluate FAILED (page gone)`); break; }
  }
} catch (e) { log('goto failed:', e.message.split('\n')[0]); }
await browser.close().catch(() => {});
