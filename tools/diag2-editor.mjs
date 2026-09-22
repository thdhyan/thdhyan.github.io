import { chromium } from '@playwright/test';
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => log('pageerror', e.message.slice(0, 300)));
await page.goto('http://localhost:5173/editor', { waitUntil: 'load', timeout: 20000 });
await page.waitForTimeout(4000);
const info = await page.evaluate(() => {
  const root = document.getElementById('root');
  const panel = [...document.querySelectorAll('div')].find(d => d.textContent?.startsWith('Hero layout editor'));
  const nav = document.querySelector('.navbar');
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return { rect: [b.x, b.y, b.width, b.height].map(Math.round), pos: s.position, z: s.zIndex, bg: s.backgroundColor.slice(0, 30), vis: s.visibility, disp: s.display, op: s.opacity }; };
  return {
    path: location.pathname,
    rootChildren: root ? root.children.length : -1,
    rootChildTags: root ? [...root.children].map(c => c.tagName + '.' + (c.className || '')) : [],
    scripts: [...document.scripts].map(s => s.src.split('/').pop()),
    navbar: r(nav),
    editorDiv: r(panel?.parentElement),
    editorPanel: r(panel),
    main: r(document.querySelector('main')),
    topAt700_450: (() => { const el = document.elementFromPoint(700, 450); return el ? el.tagName + '.' + (el.className || '') : null; })(),
    topAt1280_300: (() => { const el = document.elementFromPoint(1280, 300); return el ? el.tagName + '.' + (el.className?.toString?.() || '') : null; })(),
    bodyHead: document.body.innerText.slice(0, 120).replace(/\n/g, ' | '),
  };
});
log(JSON.stringify(info, null, 2));
await browser.close().catch(() => {});
