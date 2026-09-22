// What element paints on top at given points? + screenshot. Usage: node tools/shot3.mjs
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('logs', { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.emulateMedia({ reducedMotion: 'reduce' });
page.on('pageerror', (e) => log('pageerror', e.message.slice(0, 200)));

await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 20000 });
await page.waitForTimeout(9000);

const info = await page.evaluate(() => {
  const pts = [[170, 250], [950, 400]]; // over "Dhyan" text, over hero robot area
  const stacks = pts.map(([x, y]) => ({
    at: [x, y],
    stack: document.elementsFromPoint(x, y).slice(0, 6).map((el) => {
      const s = getComputedStyle(el);
      return `${el.tagName}.${(el.className || '').toString().slice(0, 30)} op=${s.opacity} z=${s.zIndex} bg=${s.backgroundColor.slice(0, 28)} vis=${s.visibility}`;
    }),
  }));
  // ancestors of main with opacity/filter
  const chain = [];
  let el = document.querySelector('main');
  while (el) {
    const s = getComputedStyle(el);
    chain.push(`${el.tagName}.${(el.className || '').toString().slice(0, 20)} op=${s.opacity} filter=${s.filter} mix=${s.mixBlendMode}`);
    el = el.parentElement;
  }
  return { stacks, chain, mainInline: document.querySelector('main').getAttribute('style') };
});
log(JSON.stringify(info, null, 2));

const cdp = await page.context().newCDPSession(page);
const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('logs/stack.png', Buffer.from(data, 'base64'));
log('saved logs/stack.png');
await browser.close().catch(() => {});
