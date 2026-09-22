/* Projects strip check: pinned 2x3 horizontal carousel scrubs sideways as the
   page scrolls down, progress bar + counter advance, renders lazy-load.
   Run: node tools/cardscheck.mjs   (dev server on :5173 required) */
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 200)));
await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 30000 });
await page.waitForFunction(() => {
  const m = document.querySelector('main');
  const l = document.querySelector('[aria-label="Loading"]');
  return m && !l && getComputedStyle(m).opacity === '1';
}, { timeout: 30000 });

const fails = [];
const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) fails.push(m); };

/* 1. strip mode active at 1440x900: rail present, pinned wrap has scroll room,
      cards flow in exactly 2 rows, render imgs in DOM */
const setup = await page.evaluate(() => {
  const rail = document.querySelector('[data-projects="rail"]');
  const wrap = document.querySelector('[data-projects="wrap"]');
  const rows = rail
    ? [...rail.children].map((c) => Math.round(c.getBoundingClientRect().top))
        .filter((v, i, a) => a.indexOf(v) === i).length
    : 0;
  return {
    hasRail: !!rail,
    wrapH: wrap?.offsetHeight ?? 0,
    vh: window.innerHeight,
    rows,
    cards: rail ? rail.children.length : 0,
    imgs: document.querySelectorAll('img[src*="/renders/"]').length,
  };
});
ok(setup.hasRail, 'strip mode active (rail present at 1440x900)');
ok(setup.wrapH > 2 * setup.vh, `pinned wrap height ${setup.wrapH} > 2*vh (scroll room)`);
ok(setup.rows === 2, `cards flow in 2 rows (${setup.rows})`);
ok(setup.cards === 13, `13 cards in rail (${setup.cards})`);
ok(setup.imgs === 8, `8 render images in DOM (${setup.imgs})`);

/* 2. geometry for scrub steps */
const geo = await page.evaluate(() => {
  const wrap = document.querySelector('[data-projects="wrap"]');
  return {
    top: wrap.getBoundingClientRect().top + window.scrollY,
    range: wrap.offsetHeight - window.innerHeight,
  };
});
const scrubTo = async (frac) => {
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: 'instant' }),
    geo.top + geo.range * frac,
  );
  /* poll the lerp state (interval polling — rAF cadence is throttled headless) */
  await page.waitForFunction(
    (f) => window.__proj && Math.abs(window.__proj.state().cur - f) < 0.01,
    frac,
    { polling: 100, timeout: 30000 },
  );
};

/* 3. mid-scrub: rail translated left, sticky pinned, bar + counter advanced */
await scrubTo(0.5);
const mid = await page.evaluate(() => {
  const rail = document.querySelector('[data-projects="rail"]');
  const sticky = document.querySelector('[data-projects="wrap"]').firstElementChild;
  const bar = document.querySelector('[data-projects="bar"]');
  return {
    tx: new DOMMatrixReadOnly(getComputedStyle(rail).transform).m41,
    bar: bar.style.transform,
    idx: document.querySelector('[data-projects="idx"]').textContent,
    stickyTop: Math.round(sticky.getBoundingClientRect().top),
  };
});
ok(mid.tx < -100, `scroll down scrubs rail left (tx=${Math.round(mid.tx)}px)`);
const barScale = parseFloat((mid.bar.match(/scaleX\(([\d.]+)\)/) || [])[1]);
ok(barScale >= 0.4 && barScale <= 0.6, `progress bar mid-track (${mid.bar})`);
ok(mid.stickyTop === 0, `sticky section pinned at top (${mid.stickyTop})`);
ok(mid.idx !== '01', `column counter advanced (${mid.idx})`);

/* 4. step through the whole strip so lazy imgs pass the viewport */
for (const f of [0.15, 0.3, 0.7, 0.85, 1]) await scrubTo(f);
const end = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img[src*="/renders/"]')];
  const rail = document.querySelector('[data-projects="rail"]');
  return {
    loaded: imgs.filter((i) => i.naturalWidth > 0).length,
    n: imgs.length,
    tx: new DOMMatrixReadOnly(getComputedStyle(rail).transform).m41,
    idx: document.querySelector('[data-projects="idx"]').textContent,
    maxTx: -(rail.getBoundingClientRect().width - document.querySelector('[data-projects="view"]').clientWidth),
  };
});
ok(end.idx === '07', `counter reaches last column (${end.idx})`);
ok(Math.abs(end.tx - end.maxTx) < 40, `rail fully traversed (tx=${Math.round(end.tx)} / ${Math.round(end.maxTx)})`);
ok(end.loaded === end.n && end.n > 0, `all renders loaded after scrub (${end.loaded}/${end.n})`);

/* 5. horizontal pixel evidence: screenshot the strip at mid-scrub */
await scrubTo(0.5);
await page.screenshot({ path: 'logs/projects-strip.png', animations: 'disabled' });

console.log(fails.length === 0 ? 'CARDS CHECKS PASSED' : `${fails.length} FAILED`);
await browser.close().catch(() => {});
process.exit(fails.length === 0 ? 0 : 1);
