/* Export src/layout.js joint poses → tools/fleet-poses.json for urdf2glb.py,
   so production GLB fallbacks match the posed dev/URDF scene exactly.
   Run: node tools/exportposes.mjs   (then: python3 tools/urdf2glb.py) */
import { writeFileSync } from 'node:fs';
import { LAYOUT } from '../src/layout.js';

const poses = {};
for (const r of LAYOUT.fleet) {
  if (r.joints && Object.keys(r.joints).length) poses[r.id] = r.joints;
}
writeFileSync(new URL('./fleet-poses.json', import.meta.url), `${JSON.stringify(poses, null, 2)}\n`);
console.log(`fleet-poses.json: ${Object.keys(poses).map((k) => `${k}(${Object.keys(poses[k]).length})`).join(' ')}`);
