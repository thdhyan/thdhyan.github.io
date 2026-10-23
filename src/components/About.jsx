const STATS = [
  { value: '6+',  label: 'Years Experience' },
  { value: '12+', label: 'Robots Deployed'  },
  { value: '3',   label: 'Continents'       },
  { value: '7+',  label: 'Projects Built'   },
];

/* Gantt-style timeline: one lane each for study, work and projects, on a shared
   month axis so overlaps line up vertically. Months counted from START. */
const START = { y: 2020, m: 9 };
const END = { y: 2026, m: 12 };
const mi = (y, m) => (y - START.y) * 12 + (m - START.m);
const SPAN = mi(END.y, END.m) + 1;

const LANES = [
  { name: 'Academia', items: [
    { label: 'BEng — Electronics & Comms', org: 'Nirma University', from: [2020, 9], to: [2024, 5], period: 'Sep 2020 – May 2024' },
    { label: 'MS in Robotics', org: 'University of Minnesota', from: [2024, 8], to: [2026, 12], period: 'Aug 2024 – Dec 2026' },
  ] },
  { name: 'Work', items: [
    { label: 'Research Assistant', org: 'Nirma University', from: [2021, 9], to: [2022, 12], period: 'Sep 2021 – Dec 2022' },
    { label: 'Intern', full: 'Robotics Intern', org: 'Robotics Gallery, Science City', from: [2024, 1], to: [2024, 6], period: 'Jan 2024 – Jun 2024' },
    { label: 'Graduate Research Assistant', org: 'University of Minnesota', from: [2026, 6], to: [2026, 12], period: 'Jun 2026 – Present', now: true },
  ] },
  { name: 'Projects', items: [
    { label: 'AMR Logistics', from: [2024, 1], to: [2024, 6], period: 'Jan – Jun 2024' },
    { label: 'LLM Nav · Go2', from: [2024, 4], to: [2024, 5], period: 'Apr 2024' },
    { label: 'UAV RL', from: [2024, 11], to: [2024, 12], period: 'Nov 2024' },
    { label: 'VLM Nav', from: [2025, 4], to: [2025, 5], period: 'Apr 2025' },
    { label: 'Retargeting', from: [2025, 10], to: [2025, 11], period: 'Oct 2025' },
    { label: 'Quadruped SysID', from: [2025, 12], to: [2026, 1], period: 'Dec 2025' },
    { label: 'Arm TrajOpt', from: [2026, 1], to: [2026, 2], period: 'Jan 2026' },
    { label: 'Thesis · LiDAR / LLM', from: [2026, 1], to: [2026, 12], period: '2026', side: 'in' },
    { label: 'K1 · GR00T · Cosmos3', from: [2026, 7], to: [2026, 9], period: 'Jul – Sep 2026', side: 'left' },
  ] },
];

/* Greedy row packing so overlapping bars in one lane stack instead of colliding */
function pack(items) {
  const rowEnd = [];
  return items.map((it) => {
    const a = mi(...it.from);
    const b = mi(...it.to) + 1;
    let row = rowEnd.findIndex((e) => e <= a);
    if (row < 0) row = rowEnd.length;
    // reserve room for the label that sits beside short bars (~0.8 month per char)
    rowEnd[row] = Math.max(b, a + Math.ceil(it.label.length * 0.8)) + 2;
    return { ...it, a, b, row };
  });
}

function Timeline() {
  const years = [];
  for (let y = START.y; y <= END.y; y += 1) years.push(y);
  return (
    <div className="tl" role="group" aria-label="Academia, work and project timeline">
      <div className="tl-scroll">
        <div className="tl-inner">
          <div className="tl-axis" aria-hidden="true">
            {years.map((y) => (
              <span key={y} className="tl-year" style={{ left: `${(mi(y, 1) / SPAN) * 100}%` }}>
                {y}
              </span>
            ))}
          </div>
          {LANES.map((lane) => {
            const bars = pack(lane.items);
            const rows = Math.max(...bars.map((b) => b.row)) + 1;
            return (
              <div key={lane.name} className="tl-lane">
                <span className="tl-lane-name">{lane.name}</span>
                <div className="tl-track" style={{ height: `${rows * 2.5}rem` }}>
                  {years.slice(1).map((y) => (
                    <i key={y} className="tl-gridline" style={{ left: `${(mi(y, 1) / SPAN) * 100}%` }} />
                  ))}
                  {bars.map((b) => (
                    <div
                      key={b.label}
                      className={`tl-bar tl-${lane.name.toLowerCase()}${b.now ? ' tl-now' : ''}${b.side ? ` tl-${b.side}` : ''}`}
                      style={{
                        left: `${(b.a / SPAN) * 100}%`,
                        width: `${((b.b - b.a) / SPAN) * 100}%`,
                        top: `${b.row * 2.5}rem`,
                      }}
                      title={`${b.label}${b.org ? ` — ${b.org}` : ''} (${b.period})`}
                      tabIndex={0}
                    >
                      <span>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <ul className="tl-list">
        {LANES.slice(0, 2).flatMap((l) => l.items).sort((x, y) => mi(...y.from) - mi(...x.from)).map((it) => (
          <li key={it.label + it.period}>
            <strong>{it.full ?? it.label}</strong> · {it.org} <span>{it.period}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

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

        <Timeline />
      </div>
    </section>
  );
}
