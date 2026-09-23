/* Editor interaction check: pose sliders move joints + re-ground, rotation
   inputs change the scene group euler, Reset pose zeroes joints.
   Run: node tools/editorcheck.mjs */
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
/* reduced motion -> frameloop 'demand' — close camera starves software GL (prodcheck recipe) */
await page.emulateMedia({ reducedMotion: 'reduce' });
page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 200)));
await page.goto('http://localhost:5173/editor', { waitUntil: 'load', timeout: 30000 });
await page.waitForFunction(() => window.__fleet && window.__fleet.size >= 4, { timeout: 60000 });

const fails = [];
const ok = (cond, msg) => { console.log(cond ? 'OK  ' : 'FAIL', msg); if (!cond) fails.push(msg); };

// 1. select go2 via its chip
await page.locator('button', { hasText: /^go2$/ }).click();

// 2. joint sliders panel rendered (scoped: joint rows have span[title]; cam sliders don't)
const JOINT_RANGE = 'span[title] ~ input[type="range"]';
const sliderCount = await page.locator(JOINT_RANGE).count();
ok(sliderCount >= 8, `joint sliders rendered (${sliderCount})`);

// 3. pick FR_calf_joint, drive its slider to the midpoint of its limits
const target = await page.evaluate(async () => {
  const robot = await window.__fleet.get('go2');
  const name = 'FR_calf_joint';
  const j = robot.joints[name];
  const lo = j.ignoreLimits ? -Math.PI : j.limit.lower;
  const hi = j.ignoreLimits ? Math.PI : j.limit.upper;
  return { name, before: j.jointValue[0], target: (lo + hi) / 2, min_y: robot.userData.floorBox.min[1] };
});
const idx = await (async () => {
  // sliders follow Object.entries(robot.joints) order (non-fixed) — find index by order of appearance
  const names = await page.evaluate(async () => {
    const robot = await window.__fleet.get('go2');
    return Object.entries(robot.joints)
      .filter(([, j]) => j.jointType !== 'fixed')
      .map(([n]) => n);
  });
  return names.indexOf(target.name);
})();
ok(idx >= 0 && idx < sliderCount, `slider index for ${target.name} = ${idx}`);
await page.locator(JOINT_RANGE).nth(idx).evaluate((el, v) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, String(v));
  el.dispatchEvent(new Event('input', { bubbles: true }));
}, target.target);
await page.waitForTimeout(400);

const afterSlider = await page.evaluate(async (name) => {
  const robot = await window.__fleet.get('go2');
  return { value: robot.joints[name].jointValue[0], min_y: robot.userData.floorBox.min[1] };
}, target.name);
ok(Math.abs(afterSlider.value - target.target) < 0.03,
  `slider moved ${target.name}: ${target.before.toFixed(3)} -> ${afterSlider.value.toFixed(3)} (want ~${target.target.toFixed(3)})`);
ok(Math.abs(afterSlider.min_y) < 1e-3, `re-grounded after slider (min.y=${afterSlider.min_y})`);

// 4. rotation Z input (number inputs: pos x/y/z, rot x/y/z, scale) -> group euler
await page.locator('input[type="number"]').nth(5).evaluate((el, v) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, v);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}, '15');
await page.waitForTimeout(300);
const rotZ = await page.evaluate(() => {
  const g = window.__editor?.current?.go2;
  const input = document.querySelectorAll('input[type="number"]')[5];
  return { scene: g ? g.rotation.z : null, shown: input ? input.value : null };
});
ok(rotZ.shown === '15', `rotation input shows ${rotZ.shown}`);
ok(rotZ.scene !== null && Math.abs(rotZ.scene - (15 * Math.PI) / 180) < 1e-6,
  `scene group rotation.z = ${rotZ.scene?.toFixed(4)} (want ${((15 * Math.PI) / 180).toFixed(4)})`);

// 5. Reset pose -> all joints zeroed + grounded
await page.locator('button', { hasText: /^Reset pose$/ }).click();
await page.waitForTimeout(400);
const afterReset = await page.evaluate(async () => {
  const robot = await window.__fleet.get('go2');
  // zero is out of range for go2's calf limits — urdf-loader
  // clamps to the mechanical limit, which is the correct "reset" behavior
  const clamp = (j) => Math.min(Math.max(0, j.limit.lower), j.limit.upper);
  const bad = Object.entries(robot.joints)
    .filter(([, j]) => j.jointType !== 'fixed')
    .filter(([n, j]) => Math.abs(robot.joints[n].jointValue[0] - clamp(j)) > 1e-6)
    .map(([n, j]) => `${n}=${robot.joints[n].jointValue[0]} want ${clamp(j)}`);
  return { bad, min_y: robot.userData.floorBox.min[1] };
});
ok(afterReset.bad.length === 0,
  `Reset pose set all joints to clamped zero${afterReset.bad.length ? ' — off: ' + afterReset.bad.join(', ') : ''}`);
ok(Math.abs(afterReset.min_y) < 1e-3, `grounded after reset (min.y=${afterReset.min_y})`);

// 6. hero camera sliders -> live editor camera -> draft export payload
const camBefore = await page.evaluate(() => window.__heroCam?.position.x ?? null);
await page.locator('span:text-is("pos X") ~ input[type="range"]').evaluate((el, v) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, String(v));
  el.dispatchEvent(new Event('input', { bubbles: true }));
}, 3.2);
await page.waitForTimeout(300);
const camAfter = await page.evaluate(() => window.__heroCam?.position.x ?? null);
ok(camAfter !== null && Math.abs(camAfter - 3.2) < 1e-6,
  `hero cam slider moved camera.x ${camBefore} -> ${camAfter} (want 3.2)`);

await page.locator('button', { hasText: /^Save draft$/ }).evaluate((el) => el.click());
const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('hero-layout-draft-v2') || 'null'));
ok(draft?.camera?.pos?.[0] === 3.2 && typeof draft?.camera?.fov === 'number',
  `draft carries camera (pos=[${draft?.camera?.pos}], fov=${draft?.camera?.fov})`);

console.log(fails.length === 0 ? 'EDITOR CHECKS PASSED' : `${fails.length} FAILED`);
await browser.close().catch(() => {});
process.exit(fails.length === 0 ? 0 : 1);
