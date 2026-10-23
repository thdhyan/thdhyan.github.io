import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ArrowRight } from '@phosphor-icons/react';
import { Scene } from './Scene';
import { LAYOUT } from '../layout';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* The lineup was framed for a ~16:10 desktop. On narrow canvases (phones,
   vertical monitors) aim at the lineup's centre and pull back until its
   ~4.5-unit width fits. */
const FIT_ASPECT = 1.2;
const LINEUP_WIDTH_FIT = 1.1;
const MAX_PULLBACK = 2.2;
const LINEUP_CENTER = [0.85, 0.8, 0];

function FitCamera() {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / s.size.height);
  useEffect(() => {
    const [x, y, z] = LAYOUT.camera.pos;
    if (aspect >= FIT_ASPECT) {
      // pulled back + aimed at the lineup's mid-height so the hero's head
      // clears the navbar, and nudged right so the dog clears the headline
      camera.position.set(x, y + 0.4, z * 1.12);
      camera.lookAt(-0.15, 0.85, 0);
    } else {
      const k = Math.min(MAX_PULLBACK, Math.max(1, LINEUP_WIDTH_FIT / aspect));
      const [cx, cy, cz] = LINEUP_CENTER;
      camera.position.set(cx + (x - cx) * k, cy + (y - cy) * k, cz + (z - cz) * k);
      camera.lookAt(cx, cy, cz);
    }
    camera.updateProjectionMatrix();
  }, [camera, aspect]);
  return null;
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const webglOk = typeof document !== 'undefined' && hasWebGL();

export function Hero() {
  return (
    <section className="section hero" id="home" style={{ minHeight: '100dvh' }}>
      <div className="hero-copy" style={{ zIndex: 10, maxWidth: '42rem' }}>

        <span className="eyebrow">Robotics Engineer · MS Robotics @ UMN</span>

        <h1 style={{
          fontSize: 'clamp(3rem, 6vw, 6rem)',
          marginBottom: '1.5rem',
          color: 'var(--text-1)',
        }}>
          Dhyan<br />
          <span style={{ color: 'var(--rose-accent)' }}>THAKKAR</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          maxWidth: '30rem',
          marginBottom: '3rem',
          color: 'var(--text-2)',
          lineHeight: 1.7,
        }}>
          Building machines that move, think, and adapt.
          Specializing in humanoid, quadruped, and autonomous mobile robotics.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <a href="#projects" className="btn-primary">
            View Projects
            <div className="btn-icon-wrapper">
              <ArrowRight weight="bold" size={16} />
            </div>
          </a>
          <a
            href="/cv-dhyan-thakkar-2026-09-22.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Download CV
          </a>
        </div>

        {/* Scroll hint */}
        <div className="hero-scroll-hint" style={{
          marginTop: '5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: 'var(--text-3)',
          fontSize: '0.75rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          <div style={{
            width: '1px',
            height: '48px',
            background: 'linear-gradient(to bottom, transparent, var(--rose-mid))',
          }} />
          Scroll to explore
        </div>
      </div>

      <div className="hero-stage-shell" aria-hidden="true">
        <div className="hero-stage-sticky">
          <div className="hero-stage-frame">
            {!webglOk ? (
              <div className="hero-stage-fallback" title="3D scene needs WebGL (enable hardware acceleration)">
                <div className="hero-stage-fallback-glow hero-stage-fallback-glow-left" />
                <div className="hero-stage-fallback-glow hero-stage-fallback-glow-right" />
                <div className="hero-stage-fallback-floor" />
                <div className="hero-stage-fallback-robot hero-stage-fallback-go2" />
                <div className="hero-stage-fallback-robot hero-stage-fallback-g1" />
                <div className="hero-stage-fallback-robot hero-stage-fallback-spot" />
                <div className="hero-stage-fallback-robot hero-stage-fallback-arm" />
              </div>
            ) : (
            <Canvas
              camera={{ position: LAYOUT.camera.pos, fov: LAYOUT.camera.fov }}
              dpr={[1, 1.5]}
              gl={{
                alpha: true,
                antialias: true,
                powerPreference: 'high-performance',
                preserveDrawingBuffer: false,
                failIfMajorPerformanceCaveat: false,
              }}
              frameloop={prefersReducedMotion ? 'demand' : 'always'}
            >
              <FitCamera />
              <Scene animate={!prefersReducedMotion} />
            </Canvas>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
