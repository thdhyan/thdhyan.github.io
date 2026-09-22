import { Canvas } from '@react-three/fiber';
import { ArrowRight } from '@phosphor-icons/react';
import { Scene } from './Scene';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
          Dhyan<br />Thakkar
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
          <a href="#contact" className="btn-primary">
            Contact Me
            <div className="btn-icon-wrapper">
              <ArrowRight weight="bold" size={16} />
            </div>
          </a>
          <a
            href="/cv-dhyan-thakkar-2026-04-29.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Download CV
          </a>
        </div>

        {/* Scroll hint */}
        <div style={{
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
          Scroll
        </div>
      </div>

      <div className="hero-stage-shell" aria-hidden="true">
        <div className="hero-stage-sticky">
          <div className="hero-stage-frame">
            <Canvas
              camera={{ position: [0, 1.0, 11.5], fov: 28 }}
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
              <Scene animate={!prefersReducedMotion} />
            </Canvas>
          </div>
        </div>
      </div>
    </section>
  );
}
