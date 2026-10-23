/* Runtime robot loading for the fleet.

   DEV (local): loads the ORIGINAL URDFs from models-raw/ (served by the vite
   middleware in vite.config.js) — real material colors/textures, poseable
   joints, used by the /editor page. Z-up → Y-up + floor-aligned on load.

   PROD (static GitHub Pages): models-raw/ is gitignored and never deployed,
   so the fleet loads public/models/<id>.urdf (plain relative mesh names) with
   its meshes pulled from the matching decimated Draco pack public/models/<id>.glb
   (built by tools/urdf2pack.py). Same urdf-loader path as dev, so joints stay
   fully poseable and animatable (src/trajectories.js).

   urdf-loader fires its onLoad before meshes finish, so we wait on the
   THREE.LoadingManager's onLoad (mesh loaders itemStart/itemEnd through it). */
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import URDFLoader from 'urdf-loader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export const FLEET_URDFS = {
  g1: { url: '/models-raw/g1_legged/g1_29dof_rev_1_0.urdf' },
  k1: { url: '/models-raw/booster_k1/K1_22dof.urdf' },
  spot: { url: '/models-raw/spot_arm/urdf/spot_merged.urdf' },
  go1: { url: '/models-raw/go1/go1.urdf', packages: { go1_description: '/models-raw/go1' } },
  go2: { url: '/models-raw/go2/go2.urdf', packages: { go2_description: '/models-raw/go2' } },
  so100: { url: '/models-raw/so100/urdf/so101_new_calib.urdf' },
  microduck: { url: '/models-raw/microduck/urdf/microduck.urdf' },
  openduck: {
    url: '/models-raw/openduck/urdf/open_duck_mini_v2.urdf',
    packages: { open_duck_mini_v2_urdf: '/models-raw/openduck' },
  },
  'nova-carter': { url: '/models-raw/nova_carter/nova_carter.urdf' },
};

const PROD = !import.meta.env.DEV;
/* Robots with a packed URDF+GLB in public/models load that way in dev too, so
   dev matches production (colors/overrides baked by tools/urdf2pack.py). */
const PACKED = new Set(['g1', 'k1', 'go2', 'spot', 'microduck', 'openduck', 'nova-carter', 'so100']);
console.info('[fleet] init PROD=', PROD);

/* OBJ (nova-carter) needs MTL for colors; STL/DAE use urdf-loader's built-ins.
   DAE first tries a decimated GLB from models-raw-lite/ (tools/daelite.py) —
   the raw go1 trunk.dae is 61 MB / 734k tris and OOMs the renderer. */
function makeMeshCb() {
  return function meshCb(path, manager, material, done) {
    const applyAndFinish = (obj) => {
      if (material) {
        // URDF <material> color applies only where the mesh has none of its own
        obj.traverse((m) => {
          if (m.isMesh && (!m.material || m.material.name === '')) m.material = material;
        });
      }
      done(obj);
    };
    if (/\.dae$/i.test(path)) {
      const lite = path.replace('/models-raw/', '/models-raw-lite/').replace(/\.dae$/i, '.glb');
      // manual itemStart/End keeps LoadingManager.onLoad waiting for the
      // fetch+parse below (a 404 must not let the manager hit 0 early)
      manager.itemStart();
      let ended = false;
      const end = () => { if (!ended) { ended = true; manager.itemEnd(); } };
      fetch(lite)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('no lite glb'))))
        .then((buf) => new Promise((resolve, reject) => new GLTFLoader(manager).parse(buf, '', resolve, reject)))
        .then((gltf) => { applyAndFinish(gltf.scene); end(); })
        .catch(() => {
          // no lite copy — raw DAE (ColladaLoader tracks itself on the manager)
          URDFLoader.prototype.defaultMeshLoader.call(this, path, manager, material, (obj, err) => {
            done(obj, err);
            end();
          });
        });
      return;
    }
    if (!/\.obj$/i.test(path)) {
      // STL (DAE is handled above)
      URDFLoader.prototype.defaultMeshLoader.call(this, path, manager, material, done);
      return;
    }
    const loadObj = (materials) => {
      const loader = new OBJLoader(manager);
      if (materials) {
        materials.preload();
        loader.setMaterials(materials);
      }
      loader.load(path, applyAndFinish, undefined, (err) => done(null, err));
    };
    const mtlLoader = new MTLLoader(manager);
    mtlLoader.load(
      path.replace(/\.obj$/i, '.mtl'),
      loadObj,
      undefined,
      () => loadObj(null), // no MTL — fall back to plain OBJ (+ URDF color if any)
    );
  };
}

/* PROD mesh callback: every mesh comes from the robot's pack GLB (one node per
   mesh file, keyed by basename, already in the mesh's own frame). */
function makePackedMeshCb(packPromise) {
  return function packedMeshCb(path, manager, material, done) {
    const key = THREE.PropertyBinding.sanitizeNodeName(path.split('/').pop());
    manager.itemStart();
    packPromise
      .then((nodes) => {
        const src = nodes.get(key);
        done(src ? src.clone() : new THREE.Object3D());
      })
      .catch((e) => done(null, e))
      .finally(() => manager.itemEnd());
  };
}

/* Bounding box in the PARENT's local frame (parent world transform removed),
   so posing works while the robot is mounted inside a scaled/rotated group. */
function parentLocalBox(robot) {
  robot.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4();
  if (robot.parent) inv.copy(robot.parent.matrixWorld).invert();
  const box = new THREE.Box3();
  const m = new THREE.Matrix4();
  robot.traverse((c) => {
    if (!c.isMesh || !c.geometry) return;
    if (!c.geometry.boundingBox) c.geometry.computeBoundingBox();
    m.multiplyMatrices(inv, c.matrixWorld);
    box.union(c.geometry.boundingBox.clone().applyMatrix4(m));
  });
  return box;
}

/* Floor-align (min-y = 0) + center x/z. Idempotent — re-run after every pose
   change so bent knees / moved arms never leave feet floating or sunk. */
function realign(robot) {
  const box = parentLocalBox(robot);
  if (!Number.isFinite(box.min.x)) return;
  robot.position.x -= (box.min.x + box.max.x) / 2;
  robot.position.y -= box.min.y;
  robot.position.z -= (box.min.z + box.max.z) / 2;
  robot.updateMatrixWorld(true);
  // dev: expose the verified ground box for test assertions (min.y must be 0)
  const after = parentLocalBox(robot);
  robot.userData.floorBox = {
    min: [after.min.x, after.min.y, after.min.z],
    max: [after.max.x, after.max.y, after.max.z],
  };
}

function finishRobot(robot) {
  // revolute joints with degenerate limits (0,0) would pin pose sliders to 0
  Object.values(robot.joints || {}).forEach((j) => {
    if (j.jointType === 'revolute' && j.limit.lower === j.limit.upper) j.ignoreLimits = true;
  });
  // URDF is Z-up → Y-up (three.js), then floor-align + center
  robot.rotation.x = -Math.PI / 2;
  realign(robot);
  return robot;
}

const cache = new Map();
window.__fleet = cache; // fleet promise cache — resolved == fully loaded + decoded (tests)
if (import.meta.env.DEV) window.__THREE = THREE; // dev: inspect scene graph

/* PROD pack loader — Draco GLBs (same decoder setup as drei useGLTF). */
let glbLoader = null;
function glbLoaderOnce() {
  if (!glbLoader) {
    const draco = new DRACOLoader().setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    glbLoader = new GLTFLoader().setDRACOLoader(draco);
  }
  return glbLoader;
}

function loadPack(id) {
  console.info('[fleet] pack fetch', id);
  return new Promise((resolve, reject) => {
    glbLoaderOnce().load(
      `/models/${id}.glb`,
      (gltf) => {
        const nodes = new Map();
        gltf.scene.traverse((o) => { if (o.name) nodes.set(o.name, o); });
        /* multi-material meshes export as foo, foo_1, foo_2 — regroup under foo */
        const parts = new Map();
        for (const [name, node] of nodes) {
          const m = /^(.+)_(\d+)$/.exec(name);
          if (m && nodes.has(m[1])) parts.set(m[1], [...(parts.get(m[1]) ?? []), node]);
        }
        for (const [base, extra] of parts) {
          const g = new THREE.Group();
          g.add(nodes.get(base).clone(), ...extra.map((n) => n.clone()));
          nodes.set(base, g);
        }
        console.info('[fleet] pack decoded', id);
        resolve(nodes);
      },
      undefined,
      reject,
    );
  });
}

function loadUrdfRobot(id, cfg) {
  return new Promise((resolve, reject) => {
    const manager = new THREE.LoadingManager();
    manager.onLoad = () => resolve(finishRobot(robot));
    const loader = new URDFLoader(manager);
    const packed = PROD || PACKED.has(id);
    if (cfg.packages && !packed) loader.packages = cfg.packages;
    loader.loadMeshCb = packed ? makePackedMeshCb(loadPack(id)) : makeMeshCb();
    let robot = null;
    loader.load(
      packed ? `/models/${id}.urdf` : cfg.url,
      (model) => { robot = model; },
      undefined,
      (err) => reject(err),
    );
  });
}

export function loadFleetRobot(id) {
  if (cache.has(id)) return cache.get(id);
  const cfg = FLEET_URDFS[id];
  if (!cfg) return Promise.reject(new Error(`unknown fleet robot: ${id}`));

  const promise = loadUrdfRobot(id, cfg);
  cache.set(id, promise);
  return promise;
}

/* React hook: resolves the floor-aligned robot, applies joint poses (URDF path). */
export function useFleetRobot(id, joints) {
  const [robot, setRobot] = useState(null);
  useEffect(() => {
    if (!FLEET_URDFS[id]) return undefined;
    let live = true;
    loadFleetRobot(id)
      .then((r) => { console.info('[fleet] mounted', id); if (live) setRobot(r); })
      .catch((e) => console.error(`[fleet] ${id}:`, e));
    return () => { live = false; };
  }, [id]);
  useEffect(() => {
    if (!robot || typeof robot.setJointValues !== 'function') return;
    // reset all poseable joints to 0, then overlay the requested pose,
    // then re-floor-align so posed feet stay on the ground
    const zero = {};
    Object.entries(robot.joints || {}).forEach(([n, j]) => {
      if (j.jointType === 'revolute' || j.jointType === 'prismatic' || j.jointType === 'continuous') zero[n] = 0;
    });
    robot.setJointValues({ ...zero, ...(joints || {}) });
    realign(robot);
  }, [robot, joints]);
  return FLEET_URDFS[id] ? robot : null;
}
