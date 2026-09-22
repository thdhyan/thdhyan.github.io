import { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, ContactShadows } from '@react-three/drei';
import { useFleetRobot } from '../urdf';

useGLTF.preload('/models/hero-robot.glb');
useGLTF.preload('/models/drone.glb');

function HeroModel({ animate }) {
  const spin = useRef();
  const { scene } = useGLTF('/models/hero-robot.glb');
  const { scale, lift } = LAYOUT.hero;
  const y = lift ? scale * 0.5 : 0; // origin-centered model: lift so feet land on floor

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

function FleetRobot({ id, pos, scale, rot, rotY, joints }) {
  const robot = useFleetRobot(id, joints);
  if (!robot) return null;
  return (
    <group position={pos} rotation={rot ?? [0, rotY, 0]} scale={scale}>
      <primitive object={robot} />
    </group>
  );
}

function DroneModel({ animate }) {
  const drone = useRef();
  const { scene } = useGLTF('/models/drone.glb');
  const { pos, scale, hover } = LAYOUT.drone;

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

function GroundPlane() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial
        color="#101010"
        metalness={0.05}
        roughness={0.95}
        transparent
        opacity={0.65}
      />
    </mesh>
  );
}

export function Scene({ animate = true }) {
  return (
    <group>
      <ambientLight intensity={1.1} color="#F8EFEF" />
      <directionalLight position={[5, 8, 5]}   intensity={1.5} color="#F8EFEF" castShadow />
      <directionalLight position={[-3, 6, 4]}  intensity={0.8} color="#C9C2FF" />
      <directionalLight position={[0, 3, 10]}  intensity={0.6} color="#F8EFEF" />
      <pointLight position={[-4, 2, 3]}  intensity={1.1} color="#6B59D0" distance={18} />
      <pointLight position={[4, -1, 3]}  intensity={0.8} color="#6D694D" distance={14} />
      <pointLight position={[0, 5, 5]}   intensity={0.6} color="#6B59D0" distance={14} />

      <GroundPlane />
      <ContactShadows
        position={[0, 0.01, 0]}
        scale={16}
        blur={2.6}
        opacity={0.5}
        far={5}
        resolution={512}
      />

      {/* Fleet — arrangement from src/layout.js */}
      <Suspense fallback={null}>
        {LAYOUT.fleet.map((robot) => (
          <FleetRobot key={robot.id} {...robot} />
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
