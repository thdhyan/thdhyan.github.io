import { Clock, CheckCircle } from '@phosphor-icons/react';

const PUBLICATIONS = [
  {
    status: 'in-prep',
    statusLabel: 'In Preparation',
    title: 'Online System Identification for Quadrupedal Manipulation with Unknown Payloads',
    venue: 'IEEE ICRA 2026',
    authors: 'Dhyan Thakkar et al.',
    year: '2026',
    tags: ['Quadrupeds', 'System Identification', 'Manipulation', 'Full-body Control'],
    abstract: 'Adaptive framework for quadrupeds to perform online estimation of object properties — Mass, CoM, and Moments of Inertia — during dynamic pushing and pulling tasks in real-time environments.',
  },
  {
    status: 'in-prep',
    statusLabel: 'In Preparation',
    title: 'Visual Token Navigation: Grounding VLMs for Embodied Navigation with Camera Intrinsics',
    venue: 'RSS 2026',
    authors: 'Dhyan Thakkar et al.',
    year: '2026',
    tags: ['VLMs', 'Embodied AI', 'ObjectNav', 'Scene Grounding'],
    abstract: 'Navigation system using QWEN2.5VL 8B and scene graphs with camera intrinsics as visual tokens. Achieves 78.64% on ObjectNav and 62.35% on OVMM, with 27% improvement in landmark pose estimation.',
  },
  {
    status: 'in-prep',
    statusLabel: 'In Preparation',
    title: 'Real-time Human-to-Robot Motion Retargeting via Gravity-Constrained Mesh Reconstruction',
    venue: 'IEEE RA-L',
    authors: 'Dhyan Thakkar et al.',
    year: '2025',
    tags: ['Motion Retargeting', 'Humanoids', 'Monocular RGB', 'Physics Simulation'],
    abstract: 'Low-latency pipeline using Gravity-Constrained Mesh Reconstruction from monocular RGB for real-time motion retargeting to humanoid platforms, achieving stable 30 FPS on 6 GB VRAM.',
  },
];

const STATUS_STYLES = {
  'in-prep':  { color: 'var(--rose-mid)',  icon: Clock       },
  'review':   { color: '#F59E0B',            icon: Clock       },
  'published':{ color: '#10B981',            icon: CheckCircle },
};

export function Publications() {
  return (
    <section
      className="section"
      id="publications"
      style={{ flexDirection: 'column', alignItems: 'flex-start' }}
    >
      <div style={{ maxWidth: '72rem', width: '100%', marginInline: 'auto' }}>
        <span className="eyebrow">Research</span>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '0.75rem' }}>
          Publications
        </h2>
        <p style={{ marginBottom: '3rem', maxWidth: '36rem', fontSize: '0.9375rem' }}>
          Active research across quadrupedal manipulation, embodied navigation, and humanoid motion.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {PUBLICATIONS.map((pub, idx) => {
            const { color, icon: Icon } = STATUS_STYLES[pub.status] || STATUS_STYLES['in-prep'];
            return (
              <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Status + venue row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icon size={14} style={{ color }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {pub.statusLabel}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-3)',
                    fontFamily: "'Inter', sans-serif",
                    background: 'var(--rose-glow)',
                    border: '1px solid var(--rose-border)',
                    borderRadius: '999px',
                    padding: '0.2rem 0.65rem',
                  }}>
                    {pub.venue} · {pub.year}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 'clamp(1rem, 1.5vw, 1.125rem)', color: 'var(--text-1)', lineHeight: 1.3 }}>
                  {pub.title}
                </h3>

                {/* Authors */}
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', margin: 0 }}>
                  {pub.authors}
                </p>

                {/* Abstract */}
                <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: 'var(--text-2)', margin: 0 }}>
                  {pub.abstract}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {pub.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
