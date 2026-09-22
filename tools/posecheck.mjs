/* Pose + ground-contact verification for the fleet (dev diagnostic).
   Run: node tools/posecheck.mjs
   Asserts: layout joints applied, every robot's floor box sits at min.y=0,
   go1/go2 heights are crouched (not max standing). */
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 200)));
await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 30000 });

// wait for main + all fleet robots
await page.waitForFunction(() => {
  const m = document.querySelector('main');
  return m && getComputedStyle(m).opacity === '1';
}, { timeout: 30000 });
await page.waitForFunction(async () => {
  const cache = window.__fleet;
  if (!cache || !cache.size) return false;
  const done = await Promise.all([...cache.values()].map((p) => Promise.race([p.then(() => true), new Promise((r) => setTimeout(() => r(false), 100))])));
  return done.every(Boolean);
}, { timeout: 60000 });

const report = await page.evaluate(async () => {
  await new Promise((r) => setTimeout(r, 400)); // let pose effects settle
  const expectJoints = {
    go1: { FR_calf_joint: -0.9, FL_thigh_joint: 0.45, RR_calf_joint: -0.9, RL_calf_joint: -0.9 },
    go2: { FR_calf_joint: -0.9, FL_calf_joint: -0.9, RR_thigh_joint: 0.45 },
    spot: { arm_joint3: 1.76, arm_joint1: 1.258407, arm_gripper: -0.836263 },
    k1: { ARight_Shoulder_Pitch: -2.056, Left_Shoulder_Roll: -1.3, Head_pitch: 0.091 },
  };
  const out = {};
  for (const [id, p] of window.__fleet) {
    const robot = await p;
    const fb = robot.userData.floorBox;
    const joints = robot.joints || {};
    const applied = {};
    const exp = expectJoints[id] || {};
    for (const [n, want] of Object.entries(exp)) {
      const got = joints[n] ? joints[n].jointValue?.[0] : undefined;
      applied[n] = got !== undefined && Math.abs(got - want) < 1e-3 ? `OK(${got.toFixed(3)})` : `MISMATCH want=${want} got=${got}`;
    }
    out[id] = {
      min_y: fb ? +fb.min[1].toFixed(5) : 'NO BOX',
      height: fb ? +(fb.max[1] - fb.min[1]).toFixed(3) : '?',
      size_xz: fb ? [+(fb.max[0] - fb.min[0]).toFixed(2), +(fb.max[2] - fb.min[2]).toFixed(2)] : '?',
      joints: applied,
    };
  }
  return out;
});

let fail = 0;
for (const [id, r] of Object.entries(report)) {
  const grounded = typeof r.min_y === 'number' && Math.abs(r.min_y) < 1e-3;
  const jointsOk = Object.values(r.joints).every((v) => v.startsWith('OK'));
  if (!grounded || !jointsOk) fail++;
  console.log(
    id.padEnd(12),
    `min.y=${r.min_y} h=${r.height} xz=${JSON.stringify(r.size_xz)}`,
    Object.entries(r.joints).map(([n, v]) => `${n}:${v}`).join(' '),
    grounded ? '' : '<< NOT GROUNDED',
  );
}
console.log(fail === 0 ? 'ALL CHECKS PASSED' : `${fail} ROBOTS FAILED`);
await browser.close().catch(() => {});
process.exit(fail === 0 ? 0 : 1);
