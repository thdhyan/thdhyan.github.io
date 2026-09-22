import { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, ContactShadows } from '@react-three/drei';

useGLTF.preload('/models/hero-robot.glb');
useGLTF.preload('/models/drone.glb');

function HeroModel({ animate }) {
  const spin = useRef();
  const { scene } = useGLTF('/models/hero-robot.glb');

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
        scale={[4.8, 4.8, 4.8]}
        position={[-1, -1, 0]}
      />
    </group>
  );
}

function DroneModel({ animate }) {
  const drone = useRef();
  const { scene } = useGLTF('/models/drone.glb');

  useFrame((state, delta) => {
    if (!drone.current) return;
    if (animate) {
      const t = state.clock.elapsedTime;
      // Slow orbit-yaw + hover bob
      drone.current.rotation.y += delta * 0.25;
      drone.current.position.y = 0.85 + Math.sin(t * 0.9) * 0.16;
    }
  });

  return (
    <group ref={drone} position={[3.0, 0.85, 0.5]} scale={0.5}>
      <primitive object={scene} />
    </group>
  );
}

function GroundPlane() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.15, 0]}>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial
        color="#0f1020"
        metalness={0.04}
        roughness={0.98}
        transparent
        opacity={0.42}
      />
    </mesh>
  );
}

export function Scene({ animate = true }) {
  return (
    <group>
      <ambientLight intensity={1.25} color="#f8faf8" />
      <directionalLight position={[5, 8, 5]}   intensity={1.6} color="#ffffff" castShadow />
      <directionalLight position={[-3, 6, 4]}  intensity={0.95} color="#f3f5f3" />
      <directionalLight position={[0, 3, 10]}  intensity={0.7} color="#eef2ee" />
      <pointLight position={[-3, 2, 3]}  intensity={0.95} color="#dfe4df" distance={16} />
      <pointLight position={[4, -2, 3]}  intensity={0.75} color="#a9d3b0" distance={14} />
      <pointLight position={[0, 5, 5]}   intensity={0.55} color="#f5f7f5" distance={12} />

      <GroundPlane />
      <ContactShadows
        position={[0, -2.14, 0]}
        scale={14}
        blur={2.6}
        opacity={0.5}
        far={4.5}
        resolution={512}
      />

      <group position={[1.3, -0.55, 1.8]} scale={1.08}>
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
