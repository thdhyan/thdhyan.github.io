import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, ContactShadows, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useFleetRobot } from '../urdf';
import { TRAJ, sampleTrajectory } from '../trajectories';

useGLTF.preload('/models/hero-robot.glb');
useGLTF.preload('/models/drone.glb');

/* The hero/drone textures are dark photos (mean luminance ~24/255). Even with
   IBL they render near-black, so lift albedo a little and let the studio
   environment contribute more reflection. */
function boostMaterials(root, { env = 1.8, tint = 1.55 } = {}) {
  root?.traverse?.((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    mats.forEach((m) => {
      if ('envMapIntensity' in m) m.envMapIntensity = env;
      if (m.color) m.color.multiplyScalar(tint);
      m.needsUpdate = true;
    });
  });
}

/* Image-based lighting, generated locally (three's RoomEnvironment + PMREM).
   No CDN, no HDR download — the PBR robot textures get real fill/reflection
   light instead of rendering near-black on the dark page background. */
function StudioEnvironment({ intensity = 0.85 }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const rt = pmrem.fromScene(room, 0.04);
    // eslint-disable-next-line react-hooks/immutability -- three.js scene mutation, not React state
    scene.environment = rt.texture;
    scene.environmentIntensity = intensity;
    return () => {
      // eslint-disable-next-line react-hooks/immutability -- three.js scene mutation, not React state
      scene.environment = null;
      rt.dispose();
      pmrem.dispose();
      room.traverse((o) => {
        o.geometry?.dispose?.();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((m) => m.dispose?.());
      });
    };
  }, [gl, scene, intensity]);
  return null;
}

function HeroModel({ animate }) {
  const spin = useRef();
  const { scene } = useGLTF('/models/hero-robot.glb');
  const { scale, lift } = LAYOUT.hero;
  const y = lift ? scale * 0.5 : 0; // origin-centered model: lift so feet land on floor

  useEffect(() => { boostMaterials(scene, { env: 1.6, tint: 4.0 }); }, [scene]);

  useFrame((state) => {
    if (!animate || !spin.current) return;
    const t = state.clock.elapsedTime;
    // Gentle idle sway + subtle turn toward the pointer
    spin.current.rotation.y = Math.sin(t * 0.35) * 0.1 + state.pointer.x * 0.18;
    spin.current.rotation.x = -state.pointer.y * 0.05;
  });

  return (
    <group ref={spin}>
      <primitive
        object={scene}
        scale={[scale, scale, scale]}
        position={[0, y, 0]}
      />
    </group>
  );
}

/* Arrangement comes from src/layout.js — edit there or via the /editor page. */
import { LAYOUT } from '../layout';

/* Shared clock for the joint trajectories. Dev tests can freeze it with
   window.__trajT = <seconds>. */
const trajTime = (state) =>
  (import.meta.env.DEV && typeof window.__trajT === 'number') ? window.__trajT : state.clock.elapsedTime;

function FleetRobot({ id, pos, scale, rot, rotY, joints, animate }) {
  const robot = useFleetRobot(id, joints);

  // robots cast real shadows onto the floor
  useEffect(() => {
    robot?.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }, [robot]);

  useFrame((state) => {
    const traj = TRAJ[id];
    if (!animate || !traj || !robot || typeof robot.setJointValues !== 'function') return;
    robot.setJointValues(sampleTrajectory(traj, trajTime(state), joints));
  });

  if (!robot) return null;
  return (
    <group position={pos} rotation={rot ?? [0, rotY, 0]} scale={scale}>
      <primitive object={robot} />
      <PadRing radius={0.55} />
    </group>
  );
}

/* Faint glowing footprint ring under each robot — anchors it to the floor */
function PadRing({ radius }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} renderOrder={1}>
      <ringGeometry args={[radius * 0.94, radius, 64]} />
      <meshBasicMaterial color="#8F7CFF" transparent opacity={0.28} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function DroneModel({ animate }) {
  const drone = useRef();
  const { scene } = useGLTF('/models/drone.glb');
  const { pos, scale, hover } = LAYOUT.drone;

  useEffect(() => { boostMaterials(scene, { env: 1.3, tint: 1.05 }); }, [scene]);

  useFrame((state, delta) => {
    if (!drone.current) return;
    if (animate) {
      const t = state.clock.elapsedTime;
      // Slow orbit-yaw + hover bob
      drone.current.rotation.y += delta * 0.25;
      drone.current.position.y = pos[1] + Math.sin(t * 0.9) * hover;
    }
  });

  return (
    <group ref={drone} position={pos} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

const GROUND_CENTER = [0.9, 0, 1.4];

/* Soft floor pool: radial fade-out (no hard plane edge), a fine grid, and
   rings that pulse outward from the lineup like a sonar sweep. */
function GroundPlane({ animate }) {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((state) => {
    uniforms.uTime.value = animate ? state.clock.elapsedTime : 0;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={GROUND_CENTER} renderOrder={-1}>
      <circleGeometry args={[18, 96]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vPos;
          void main() {
            vPos = position.xy;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          varying vec2 vPos;
          void main() {
            float r = length(vPos);
            float fade = 1.0 - smoothstep(3.0, 17.0, r);
            // base floor: dark pool with a purple-tinged centre
            vec3 col = mix(vec3(0.045, 0.045, 0.06), vec3(0.10, 0.085, 0.17), exp(-r * 0.22));
            float a = 0.88 * fade;
            // fine grid
            vec2 g = abs(fract(vPos * 0.5 + 0.5) - 0.5);
            float line = 1.0 - smoothstep(0.0, 0.018, min(g.x, g.y));
            col += vec3(0.30, 0.26, 0.55) * line * 0.22 * fade;
            // static concentric rings every 2 units
            float ring = 1.0 - smoothstep(0.0, 0.03, abs(fract(r * 0.5) - 0.5) * 2.0 - 0.0);
            col += vec3(0.42, 0.35, 0.80) * ring * 0.05 * fade;
            // outward pulse
            float w = fract(uTime * 0.10);
            float pr = w * 15.0;
            float pulse = exp(-pow((r - pr) * 1.6, 2.0)) * (1.0 - w);
            col += vec3(0.55, 0.47, 1.0) * pulse * 0.32;
            gl_FragColor = vec4(col, a);
          }
        `}
      />
    </mesh>
  );
}

/* Floor that only shows shadows (real shadow map, on top of ContactShadows) */
function ShadowCatcher() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[GROUND_CENTER[0], 0.002, GROUND_CENTER[2]]} receiveShadow>
      <planeGeometry args={[24, 24]} />
      <shadowMaterial transparent opacity={0.5} />
    </mesh>
  );
}

/* Radial glow sprite behind the lineup — the "flare" */
function useGlowTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(160,140,255,0.85)');
    grad.addColorStop(0.35, 'rgba(107,89,208,0.30)');
    grad.addColorStop(1, 'rgba(107,89,208,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

function GlowFlare({ animate }) {
  const tex = useGlowTexture();
  const mat = useRef();
  useFrame((state) => {
    if (!animate || !mat.current) return;
    mat.current.opacity = 0.42 + Math.sin(state.clock.elapsedTime * 0.6) * 0.1;
  });
  return (
    <sprite position={[1.0, 1.5, -3.5]} scale={[13, 7, 1]} renderOrder={-2}>
      <spriteMaterial ref={mat} map={tex} transparent opacity={0.42} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
}

/* A slow purple light that circles the lineup, raking across the robots */
function OrbitLight({ animate }) {
  const light = useRef();
  useFrame((state) => {
    if (!animate || !light.current) return;
    const t = state.clock.elapsedTime * 0.35;
    light.current.position.set(0.9 + Math.cos(t) * 5, 1.4 + Math.sin(t * 1.7) * 0.5, 1.4 + Math.sin(t) * 3.5);
  });
  return <pointLight ref={light} position={[5, 1.4, 1.4]} intensity={2.2} color="#9C8CFF" distance={11} decay={1.6} />;
}

export function Scene({ animate = true }) {
  return (
    <group>
      <StudioEnvironment intensity={0.85} />

      {/* Key light — warm, from camera-right, casts the shadows */}
      <directionalLight position={[6, 9, 6]} intensity={1.7} color="#FFF3EA" castShadow />
      {/* Fill — cool, camera-left, opens the shadow side */}
      <directionalLight position={[-6, 4, 6]} intensity={0.7} color="#BFC8FF" />
      {/* Rim from behind — outlines dark robots against the dark page */}
      <directionalLight position={[-2, 6, -8]} intensity={2.1} color="#C9B8FF" />
      <directionalLight position={[7, 3, -5]} intensity={1.2} color="#FF9FC4" />
      {/* Sky/ground bounce */}
      <hemisphereLight args={['#D9DEFF', '#1B1628', 0.35]} />
      <ambientLight intensity={0.22} color="#F6F0FF" />
      {/* Practical on the hero so its face/body reads */}
      <pointLight position={[2.2, 2.4, 4.6]} intensity={4.2} color="#FFE9F2" distance={14} decay={2} />
      <pointLight position={[-3.4, 1.8, 3.2]} intensity={2.8} color="#8B5CF6" distance={12} decay={2} />

      <GroundPlane animate={animate} />
      <ShadowCatcher />
      <ContactShadows
        position={[0, 0.008, 0]}
        scale={16}
        blur={2.6}
        opacity={0.4}
        far={5}
        resolution={512}
      />
      <GlowFlare animate={animate} />
      <OrbitLight animate={animate} />
      {animate && (
        <Sparkles count={70} scale={[11, 4.5, 7]} position={[0.9, 1.8, 1.2]} size={2.2} speed={0.35} opacity={0.7} color="#C9C2FF" />
      )}

      {/* Fleet — arrangement from src/layout.js */}
      <Suspense fallback={null}>
        {LAYOUT.fleet.map((robot) => (
          <FleetRobot key={robot.id} {...robot} animate={animate} />
        ))}
      </Suspense>

      {/* Hero centerpiece — stands on the ground plane, head clears the navbar */}
      <group position={LAYOUT.hero.pos} rotation={[0, LAYOUT.hero.rotY, 0]}>
        <Suspense fallback={null}>
          <HeroModel animate={animate} />
        </Suspense>
      </group>

      <Suspense fallback={null}>
        <DroneModel animate={animate} />
      </Suspense>
    </group>
  );
}
