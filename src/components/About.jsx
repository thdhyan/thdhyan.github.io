const STATS = [
  { value: '6+',  label: 'Years Experience' },
  { value: '12+', label: 'Robots Deployed'  },
  { value: '3',   label: 'Continents'       },
  { value: '7+',  label: 'Projects Built'   },
];

export function About() {
  return (
    <section
      className="section"
      id="about"
      style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
    >
      <div style={{ maxWidth: '52rem', width: '100%' }}>
        <span className="eyebrow">Background</span>

        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '1.5rem' }}>
          Robotics Engineer. Problem Solver. Builder of Intelligent Machines.
        </h2>

        <p style={{ fontSize: 'clamp(1rem, 1.5vw, 1.125rem)', marginBottom: '1rem', maxWidth: '42rem', marginInline: 'auto' }}>
          Robotics Engineer pursuing an MS at the University of Minnesota, bridging mechanical
          design and intelligent software for real-world robotic systems.
        </p>
        <p style={{ fontSize: 'clamp(0.9rem, 1.3vw, 1rem)', marginBottom: '4rem', maxWidth: '40rem', marginInline: 'auto' }}>
          My work spans complex kinematic systems, RL-based control, real-time autonomy,
          and VLM-powered navigation — across ground robots, UAVs, and humanoid platforms.
          F-1 OPT eligible.
        </p>

        {/* Stats grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem',
        }}>
          {STATS.map(({ value, label }) => (
            <div key={label} className="card stat-card">
              <span className="stat-number">{value}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>

        {/* Experience timeline strip */}
        <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          {[
            { role: 'MS in Robotics',         org: 'University of Minnesota',      period: 'Aug 2024 – Dec 2026' },
            { role: 'Robotics Intern',         org: 'Robotics Gallery, Science City', period: 'Jan 2024 – Jun 2024' },
            { role: 'Research Assistant',      org: 'Nirma University',             period: 'Sep 2021 – Dec 2022' },
            { role: 'BEng — Electronics & Comms', org: 'Nirma University',          period: 'Sep 2020 – May 2024' },
          ].map(({ role, org, period }) => (
            <div
              key={role}
              className="card"
              style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}
            >
              <div>
                <p style={{ color: 'var(--text-1)', fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.2rem' }}>{role}</p>
                <p style={{ color: 'var(--rose-mid)', fontSize: '0.8125rem', margin: 0 }}>{org}</p>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                {period}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
