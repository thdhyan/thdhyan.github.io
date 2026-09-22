import { useEffect, useState } from 'react';

export function Loader({ onDone }) {
  const [phase, setPhase] = useState('visible'); /* visible | fading | done */

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase('fading'), 2400);
    const doneTimer = setTimeout(() => {
      setPhase('done');
      onDone?.();
    }, 3000);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  if (phase === 'done') return null;

  return (
    <div
      aria-label="Loading"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'oklch(5.5% 0.014 295)',
        gap: '1.5rem',
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 0.6s cubic-bezier(0.32, 0.72, 0, 1)',
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
      }}
    >
      {/* SVG robot + circle */}
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Rotating outer ring */}
        <circle
          cx="70"
          cy="70"
          r="60"
          stroke="oklch(72% 0.22 308 / 0.25)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="70"
          cy="70"
          r="60"
          stroke="oklch(78% 0.27 322)"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="94.2 282.6"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 70 70"
            to="360 70 70"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Second ring, counter-rotating */}
        <circle
          cx="70"
          cy="70"
          r="50"
          stroke="oklch(50% 0.28 303 / 0.35)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="47.1 267.0"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 70 70"
            to="0 70 70"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Humanoid robot body */}
        <g transform="translate(70, 70)">
          {/* Head */}
          <circle cy="-28" r="9" fill="oklch(72% 0.22 308)" />
          {/* Eye dots */}
          <circle cx="-3" cy="-30" r="1.5" fill="oklch(5.5% 0.014 295)" />
          <circle cx="3"  cy="-30" r="1.5" fill="oklch(5.5% 0.014 295)" />

          {/* Neck */}
          <rect x="-2.5" y="-19" width="5" height="5" rx="1" fill="oklch(72% 0.22 308 / 0.7)" />

          {/* Torso */}
          <rect x="-13" y="-14" width="26" height="28" rx="3" fill="oklch(16% 0.022 295)" />
          {/* Chest panel */}
          <rect x="-7" y="-8" width="14" height="10" rx="2" fill="oklch(72% 0.22 308 / 0.3)" />
          <circle cy="-3" r="3" fill="oklch(78% 0.27 322)" opacity="0.8" />

          {/* Left arm (static) */}
          <rect x="-20" y="-14" width="7" height="22" rx="3.5" fill="oklch(72% 0.22 308 / 0.8)" />

          {/* Right arm (waving) */}
          <g transformOrigin="13 -14">
            <rect x="13" y="-14" width="7" height="22" rx="3.5" fill="oklch(78% 0.27 322 / 0.9)">
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 16.5 -14; -55 16.5 -14; 0 16.5 -14"
                dur="1.2s"
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
              />
            </rect>
          </g>

          {/* Legs */}
          <rect x="-13" y="15" width="10" height="20" rx="4" fill="oklch(72% 0.22 308 / 0.75)" />
          <rect x="3"   y="15" width="10" height="20" rx="4" fill="oklch(72% 0.22 308 / 0.75)" />

          {/* Feet */}
          <rect x="-15" y="33" width="13" height="5" rx="2.5" fill="oklch(72% 0.22 308 / 0.6)" />
          <rect x="2"   y="33" width="13" height="5" rx="2.5" fill="oklch(72% 0.22 308 / 0.6)" />
        </g>

        {/* Orbit dot */}
        <circle cx="70" cy="10" r="4" fill="oklch(78% 0.27 322)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 70 70"
            to="360 70 70"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Second orbit dot */}
        <circle cx="70" cy="20" r="2.5" fill="oklch(50% 0.28 303)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="180 70 70"
            to="540 70 70"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      {/* Label */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <span style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: '0.875rem',
          fontWeight: 700,
          color: 'oklch(72% 0.22 308)',
          letterSpacing: '0.14em',
        }}>
          DHYAN THAKKAR
        </span>
        <span style={{
          fontSize: '0.6875rem',
          color: 'oklch(52% 0.06 305)',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
        }}>
          Robotics Engineer
        </span>
      </div>

      {/* Animated dots */}
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: 'oklch(72% 0.22 308)',
              display: 'inline-block',
              animation: `dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes dot-pulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
