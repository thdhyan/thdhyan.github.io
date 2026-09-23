/* Identity swap verification: fonts loaded (Sora/Inter), purple accent applied,
   copy edits present. Screenshots logs/identity-hero.png + identity-about.png.
   Run: node tools/identity.mjs */
import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('logs', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
/* reduced motion -> frameloop 'demand' — close camera starves software GL (prodcheck recipe) */
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.emulateMedia({ reducedMotion: 'reduce' });
page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 200)));
await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 30000 });
await page.waitForFunction(() => {
  const m = document.querySelector('main');
  const l = document.querySelector('[aria-label="Loading"]');
  return m && !l && getComputedStyle(m).opacity === '1';
}, { timeout: 30000 });

const r = await page.evaluate(async () => {
  await document.fonts.ready;
  const h1 = document.querySelector('h1');
  const accent = h1?.querySelector('span');
  const navBtn = [...document.querySelectorAll('.navbar-cv')].map((e) => e.textContent.trim());
  const eyebrow = document.querySelector('.eyebrow')?.textContent;
  const cta = document.querySelector('.btn-primary')?.textContent.replace(/\s+/g, ' ').trim();
  const scroll = [...document.querySelectorAll('div')].map((d) => d.textContent).find((t) => t === 'Scroll to explore');
  const aboutH2 = [...document.querySelectorAll('h2')].map((e) => e.textContent.trim());
  return {
    fontsLoaded: {
      sora: document.fonts.check('600 1em Sora'),
      inter: document.fonts.check('400 1em Inter'),
    },
    bodyFont: getComputedStyle(document.body).fontFamily,
    h1Font: h1 ? getComputedStyle(h1).fontFamily : null,
    accentColor: accent ? getComputedStyle(accent).color : null, // want rgb(107, 89, 208)
    accentText: accent?.textContent,
    h1Name: h1?.innerText.replace(/\s+/g, ' ').trim(),
    eyebrow, cta, navBtn, scrollHint: scroll ?? null,
    aboutHeadings: aboutH2,
    btnPrimaryBg: getComputedStyle(document.querySelector('.btn-primary')).backgroundColor,
  };
});

const fails = [];
const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) fails.push(m); };
ok(r.fontsLoaded.sora, 'Sora font loaded');
ok(r.fontsLoaded.inter, 'Inter font loaded');
ok(/Inter/.test(r.bodyFont), `body font = ${r.bodyFont.split(',')[0]}`);
ok(/Sora/.test(r.h1Font || ''), `h1 font = ${(r.h1Font || '').split(',')[0]}`);
ok(r.accentColor === 'rgb(107, 89, 208)', `THAKKAR accent = ${r.accentColor}`);
ok(r.accentText === 'THAKKAR', `accent line = ${r.accentText}`);
ok(/dhyan thakkar/i.test(r.h1Name), `h1 name = ${r.h1Name}`);
ok(r.eyebrow === 'Robotics Engineer · MS Robotics @ UMN', `eyebrow = ${r.eyebrow}`);
ok(r.cta === 'View Projects', `cta = ${r.cta}`);
ok(r.navBtn.includes("Let's Connect"), `navbar = ${JSON.stringify(r.navBtn)}`);
ok(r.scrollHint !== null, 'scroll hint = Scroll to explore');
ok(r.aboutHeadings.some((h) => h.startsWith('Robotics Engineer. Problem Solver.')),
  `about heading = ${r.aboutHeadings.find((h) => h.startsWith('Robotics'))}`);
ok(r.btnPrimaryBg === 'rgb(107, 89, 208)', `btn-primary bg = ${r.btnPrimaryBg}`);

const shot = async (name, y = 0) => {
  if (y) await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(600);
  const buf = await page.screenshot({ animations: 'disabled', timeout: 15000 });
  writeFileSync(`logs/${name}.png`, buf);
  console.log('shot logs/' + name + '.png');
};
await shot('identity-hero', 0);
await shot('identity-about', 900);

console.log(fails.length === 0 ? 'IDENTITY CHECKS PASSED' : `${fails.length} FAILED`);
await browser.close().catch(() => {});
process.exit(fails.length === 0 ? 0 : 1);
