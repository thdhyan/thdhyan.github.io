/* Local layout editor — open /editor in the dev server.
   Click a robot to select it, drag the gizmo to move/rotate, tune numbers in the
   panel, then "Export JSON" and replace src/layout.js with the result. */
import { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, useGLTF, ContactShadows } from '@react-three/drei';
import { LAYOUT } from '../layout';
import { FLEET_URDFS, useFleetRobot } from '../urdf';

const STORAGE_KEY = 'hero-layout-draft-v2'; // v2: baked layout(1).json — ignore older drafts;

const clone = (o) => JSON.parse(JSON.stringify(o));

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupt draft — fall back to committed layout */ }
  return clone(LAYOUT);
}

/* hero + drone + fleet flattened into one editable entity list */
function toEntities(l) {
  const norm = (o) => ({ ...o, rot: o.rot ?? [0, o.rotY ?? 0, 0], joints: o.joints ?? {} });
  return [
    norm({ id: 'hero', model: l.hero.model, pos: l.hero.pos, rotY: l.hero.rotY, scale: l.hero.scale, lift: !!l.hero.lift }),
    norm({ id: 'drone', model: l.drone.model, pos: l.drone.pos, rotY: l.drone.rotY, scale: l.drone.scale }),
    ...l.fleet.map((f) => norm({ id: f.id, model: f.model, pos: f.pos, rotY: f.rotY, scale: f.scale, joints: f.joints })),
  ];
}

function fromEntities(ents, orig) {
  const byId = Object.fromEntries(ents.map((e) => [e.id, e]));
  return {
    hero: { ...orig.hero, ...pick(byId.hero) },
    drone: { ...orig.drone, ...pick(byId.drone) },
    fleet: orig.fleet.map((f) => ({ ...f, ...pick(byId[f.id]) })),
  };
}
const pick = (e) => ({
  pos: e.pos,
  rotY: e.rot?.[1] ?? e.rotY ?? 0,
  rot: e.rot,
  scale: e.scale,
  ...(Object.keys(e.joints || {}).length ? { joints: e.joints } : {}),
});

/* Snaps the editor camera to the exact hero-scene framing (Hero.jsx camera) */
function CameraView({ view }) {
  const { camera, controls } = useThree();
  useEffect(() => {
    if (!controls) return;
    camera.position.set(...view.pos);
    // eslint-disable-next-line react-hooks/immutability -- R3F camera is a mutable three.js object
    camera.fov = view.fov;
    camera.updateProjectionMatrix();
    controls.target.set(0, 1, 0);
    controls.update();
  }, [view, controls, camera]);
  // dev hook for tools/editorcheck.mjs + tools/rendercards.mjs
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.__heroCam = camera;
      window.__heroControls = controls;
    }
  }, [view, controls, camera]);
  return null;
}

function GltfBody({ model, liftY }) {
  const { scene } = useGLTF(`/models/${model}.glb`);
  return <primitive object={scene} position={[0, liftY, 0]} />;
}

function UrdfBody({ model, joints }) {
  const robot = useFleetRobot(model, joints);
  if (!robot) return null;
  return <primitive object={robot} />;
}

function EntityBody({ ent, liftY }) {
  if (FLEET_URDFS[ent.model]) return <UrdfBody model={ent.model} joints={ent.joints} />;
  return <GltfBody model={ent.model} liftY={liftY} />;
}

function Entity({ ent, onSelect, reg }) {
  const liftY = ent.lift ? 0.5 : 0; // group scale multiplies this offset
  const rot = ent.rot ?? [0, ent.rotY ?? 0, 0];
  return (
    <group
      ref={(o) => { if (o) reg(ent.id, o); }}
      position={ent.pos}
      rotation={rot}
      scale={ent.scale}
      onClick={(ev) => { ev.stopPropagation(); onSelect(ent.id); }}
    >
      <EntityBody ent={ent} liftY={liftY} />
    </group>
  );
}

export default function Editor() {
  const [ents, setEnts] = useState(() => toEntities(loadInitial()));
  const [orig, setOrig] = useState(() => loadInitial());
  const [selId, setSelId] = useState(null);
  const [selObj, setSelObj] = useState(null); // Object3D of the selected entity
  const [mode, setMode] = useState('translate'); // translate | rotate
  const [view, setView] = useState(() => {
    // start framed exactly like the hero (layout/draft camera) when known
    const l = loadInitial();
    return l.camera ? { pos: [...l.camera.pos], fov: l.camera.fov } : { pos: [0, 3, 14], fov: 40 };
  });
  const objs = useRef({});
  const reg = (id, o) => { objs.current[id] = o; };
  useEffect(() => {
    // dev: test hook for tools/editorcheck.mjs
    if (import.meta.env.DEV) window.__editor = objs;
  }, []);

  const select = (id) => {
    setSelId(id);
    setSelObj(objs.current[id] || null);
  };
  const deselect = () => { setSelId(null); setSelObj(null); };

  const selEnt = ents.find((e) => e.id === selId) || null;
  /* joint metadata from the loaded URDF (null for GLB entities / nothing selected) */
  const selRobot = useFleetRobot(selEnt?.model ?? '');
  const selJoints = selRobot
    ? Object.entries(selRobot.joints || {}).filter(([, j]) => j.jointType !== 'fixed')
    : [];

  const update = (id, fn) => setEnts((prev) => prev.map((e) => (e.id === id ? fn(e) : e)));

  /* pull transform from the gizmo-mutated object into state */
  const syncFromGizmo = () => {
    if (!selObj || !selId) return;
    update(selId, (e) => ({
      ...e,
      pos: [selObj.position.x, selObj.position.y, selObj.position.z],
      rot: [selObj.rotation.x, selObj.rotation.y, selObj.rotation.z],
      rotY: selObj.rotation.y,
    }));
  };

  const setField = (key, i, v) => update(selId, (e) => {
    const next = [...e.pos];
    next[i] = v;
    return { ...e, [key]: next };
  });

  const layoutOut = useMemo(
    () => ({ ...fromEntities(ents, orig), camera: { pos: [...view.pos], fov: view.fov } }),
    [ents, orig, view],
  );

  const saveDraft = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutOut));
  const toJSON = () => {
    const o = { ...layoutOut };
    if (o.drone.hover !== undefined) o.drone.hover = orig.drone.hover;
    return JSON.stringify(o, null, 2);
  };
  const doExport = () => {
    const json = toJSON();
    navigator.clipboard?.writeText(json).catch(() => {});
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'layout.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const doReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setOrig(clone(LAYOUT));
    setEnts(toEntities(LAYOUT));
    setView(LAYOUT.camera ? { pos: [...LAYOUT.camera.pos], fov: LAYOUT.camera.fov } : { pos: [0, 3, 14], fov: 40 });
    deselect();
  };

  const deg = (r) => Math.round((r * 180) / Math.PI);
  const rad = (d) => (d * Math.PI) / 180;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#101010' }}>
      <Canvas camera={{ position: [0, 3, 14], fov: 40 }} onClick={deselect}>
        <ambientLight intensity={1.1} color="#F8EFEF" />
        <directionalLight position={[5, 8, 5]} intensity={1.5} color="#F8EFEF" />
        <directionalLight position={[-3, 6, 4]} intensity={0.8} color="#C9C2FF" />
        {/* back/rim light — matches Scene.jsx so editor previews like the hero */}
        <directionalLight position={[-2, 5, -7]} intensity={1.3} color="#C9C2FF" />
        <pointLight position={[-4, 2, 3]} intensity={1.1} color="#6B59D0" distance={18} />
        <gridHelper args={[40, 40, '#2a2a2a', '#1c1c1c']} position={[0, 0.001, 0]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color="#141414" roughness={0.95} />
        </mesh>
        <ContactShadows position={[0, 0.01, 0]} scale={24} blur={2.6} opacity={0.5} far={5} resolution={512} />

        {ents.map((e) => (
          <Entity key={e.id} ent={e} reg={reg} onSelect={select} />
        ))}

        {selObj && (
          <TransformControls
            object={selObj}
            mode={mode}
            showX
            showY
            showZ
            onObjectChange={syncFromGizmo}
          />
        )}
        <CameraView view={view} />
        <OrbitControls makeDefault target={[0, 1, 0]} />
      </Canvas>

      {/* side panel */}
      <div data-editor-panel style={{
        position: 'absolute', top: 16, right: 16, width: 280, maxHeight: '90vh',
        overflowY: 'auto', background: 'rgba(16,16,16,0.92)', border: '1px solid #2c2c2c',
        borderRadius: 12, padding: 16, color: '#F8EFEF', fontFamily: 'Inter, sans-serif', fontSize: 13,
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Hero layout editor</div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {ents.map((e) => (
            <button key={e.id} onClick={() => select(e.id)} style={chip(e.id === selId)}>{e.id}</button>
          ))}
        </div>

        <Label>Camera</Label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <button onClick={() => setView({ pos: [0, 1, 11.5], fov: 28 })} style={chip(view.fov === 28)}>Hero view</button>
          <button onClick={() => setView({ pos: [0, 3, 14], fov: 40 })} style={chip(view.fov === 40)}>Overview</button>
        </div>

        <Label>Hero camera (exported as LAYOUT.camera)</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {[0, 1, 2].map((i) => (
            <CamSlider
              key={i}
              label={`pos ${'XYZ'[i]}`}
              min={[-8, -2, -6][i]}
              max={[8, 8, 18][i]}
              step={0.1}
              value={Number(view.pos[i].toFixed(1))}
              onChange={(v) => setView((prev) => {
                const pos = [...prev.pos];
                pos[i] = v;
                return { ...prev, pos };
              })}
            />
          ))}
          <CamSlider
            label="fov"
            min={10}
            max={60}
            step={1}
            value={view.fov}
            onChange={(v) => setView((prev) => ({ ...prev, fov: v }))}
          />
        </div>

        {selEnt && (
          <>
            <Label>Move / Rotate</Label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <button onClick={() => setMode('translate')} style={chip(mode === 'translate')}>Move</button>
              <button onClick={() => setMode('rotate')} style={chip(mode === 'rotate')}>Rotate</button>
            </div>
            <Label>Position</Label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {['x', 'y', 'z'].map((ax, i) => (
                <Num key={ax} label={ax.toUpperCase()} step={0.1}
                  value={Number(selEnt.pos[i].toFixed(2))}
                  onChange={(v) => setField('pos', i, v)} />
              ))}
            </div>

            <Label>Rotation (°)</Label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {['x', 'y', 'z'].map((ax, i) => (
                <Num key={ax} label={ax.toUpperCase()} step={5}
                  value={deg(selEnt.rot[i])}
                  onChange={(v) => update(selEnt.id, (e) => {
                    const rot = [...e.rot]; rot[i] = rad(v);
                    return { ...e, rot, rotY: rot[1] };
                  })} />
              ))}
            </div>

            <Label>Scale</Label>
            <Num label="×" step={0.1} value={selEnt.scale}
              onChange={(v) => update(selEnt.id, (e) => ({ ...e, scale: Math.max(0.05, v) }))} />

            {selJoints.length > 0 && (
              <>
                <Label>Pose joints ({selJoints.length})</Label>
                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selJoints.map(([name, j]) => {
                    const lo = j.jointType === 'continuous' || j.ignoreLimits ? -Math.PI : j.limit.lower;
                    const hi = j.jointType === 'continuous' || j.ignoreLimits ? Math.PI : j.limit.upper;
                    const val = selEnt.joints?.[name] ?? 0;
                    const unit = j.jointType === 'prismatic' ? 'm' : '°';
                    const shown = unit === '°' ? Math.round(deg(val)) : Number(val.toFixed(3));
                    return (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ flex: '0 0 96px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, color: '#aaa' }} title={name}>{name}</span>
                        <input
                          type="range" min={lo} max={hi} step={j.jointType === 'prismatic' ? 0.005 : 0.02}
                          value={val}
                          onChange={(ev) => {
                            const v = Number(ev.target.value);
                            update(selEnt.id, (e) => ({ ...e, joints: { ...(e.joints || {}), [name]: v } }));
                          }}
                          style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: 11, color: '#888', width: 42, textAlign: 'right' }}>{shown}{unit}</span>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => update(selEnt.id, (e) => ({ ...e, joints: {} }))}
                  style={{ ...btn, marginTop: 8, background: 'transparent', border: '1px solid #444' }}
                >Reset pose</button>
              </>
            )}
          </>
        )}
        {!selEnt && <div style={{ color: '#888', marginBottom: 10 }}>Click a robot in the scene (or a chip above) to select it.</div>}

        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          <button onClick={() => { saveDraft(); }} style={btn}>Save draft</button>
          <button onClick={doExport} style={{ ...btn, background: '#6B59D0' }}>Export JSON</button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button onClick={doReset} style={{ ...btn, background: 'transparent', border: '1px solid #444' }}>Reset</button>
        </div>
        <div style={{ color: '#777', marginTop: 10, lineHeight: 1.5 }}>
          Export copies the JSON to your clipboard and downloads <b>layout.json</b> — send it over and
          I&apos;ll bake it into <b>src/layout.js</b>. Drafts survive refresh (Save draft).
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 14, left: 16, color: '#777', fontSize: 12, fontFamily: 'Inter, sans-serif',
      }}>
        Drag empty space = orbit · Scroll = zoom · Click robot = select
      </div>
    </div>
  );
}

const chip = (on) => ({
  padding: '4px 9px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
  background: on ? '#6B59D0' : '#1e1e1e', color: '#F8EFEF', border: `1px solid ${on ? '#6B59D0' : '#333'}`,
});
const btn = {
  flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: '#262626', color: '#F8EFEF', fontSize: 13, fontWeight: 600,
};
const Label = ({ children }) => (
  <div style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, margin: '8px 0 4px' }}>{children}</div>
);
const CamSlider = ({ label, min, max, step, value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{ color: '#777', fontSize: 11, flex: '0 0 46px' }}>{label}</span>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ flex: 1 }}
    />
    <span style={{ color: '#aaa', fontSize: 11, width: 40, textAlign: 'right' }}>{value}</span>
  </div>
);
const Num = ({ label, value, onChange, step }) => (
  <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
    <span style={{ color: '#777', fontSize: 11, width: 12 }}>{label}</span>
    <input
      type="number" step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: '100%', boxSizing: 'border-box', background: '#1a1a1a', border: '1px solid #333',
        borderRadius: 6, color: '#F8EFEF', padding: '5px 6px', fontSize: 13,
      }}
    />
  </label>
);
