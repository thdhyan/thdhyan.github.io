// Why is <main> dim? Dump opacity/loader/overlay state. Usage: node tools/diag2.mjs
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.emulateMedia({ reducedMotion: 'reduce' });
page.on('pageerror', (e) => console.log('pageerror', e.message.slice(0, 200)));

await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 20000 });
await page.waitForTimeout(6000);

const info = await page.evaluate(() => {
  const main = document.querySelector('main');
  const loader = document.querySelector('[aria-label="Loading"]');
  const h1 = document.querySelector('h1');
  const fixed = [...document.querySelectorAll('*')].filter((el) => {
    const s = getComputedStyle(el);
    return s.position === 'fixed' && s.opacity !== '0' && s.display !== 'none';
  }).map((el) => ({
    tag: el.tagName, cls: el.className?.toString().slice(0, 40),
    z: getComputedStyle(el).zIndex, op: getComputedStyle(el).opacity,
    bg: getComputedStyle(el).backgroundColor.slice(0, 30),
  }));
  return {
    mainOpacity: main ? getComputedStyle(main).opacity : 'no main',
    loaderPresent: !!loader,
    h1Color: h1 ? getComputedStyle(h1).color : 'no h1',
    h1Opacity: h1 ? getComputedStyle(h1).opacity : 'no h1',
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    fixedElements: fixed,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close().catch(() => {});
