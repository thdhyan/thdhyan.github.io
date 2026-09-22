import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';

const PROJECTS = [
  {
    id: 'booster-k1',
    date: 'Aug–Sep 2026',
    title: 'Multi-Robot Humanoid Fleet & Locomotion — Booster K1',
    desc: 'ROS 2 Jazzy workspace for the 22-DoF Booster K1 humanoid. Namespaced multi-robot fleet verified across three simulation backends (Gazebo Harmonic, MuJoCo, Isaac Sim) with SDK-style endpoints.',
    tags: ['ROS 2 Jazzy', 'Isaac Sim', 'Isaac Lab', 'Gazebo', 'MuJoCo', 'RSL-RL'],
    render: 'renders/booster-k1.png',
  },
  {
    id: 'groot-vqa',
    date: 'Jul–Aug 2026',
    title: 'GR00T Intent Evaluation via VQA',
    desc: 'VQA experiment runners to evaluate GR00T model intent predictions on video clips, including clip-to-task matching and a scripted approved-model download pipeline.',
    tags: ['PyTorch', 'Isaac-GR00T', 'VQA'],
  },
  {
    id: 'cosmos3',
    date: 'Jul 2026',
    title: 'Cosmos3 Video Data Generation',
    desc: 'Batch video-to-video generation and captioning pipeline (5-second segment captions + event detection via Cosmos3 Reasoner) with segmentation, style/scene variation generation, and Google Drive sync.',
    tags: ['Python', 'Cosmos3', 'ffmpeg', 'rclone'],
  },
  {
    id: 'so101-rl',
    date: '2026',
    title: 'SO-101 Manipulation RL Environments',
    desc: 'Single- and dual-arm SO-101 environments (6/12 joints, 5–6 cameras) spanning seven manipulation tasks (pick-lift, pick-and-place, push-T, ramp/bridge pushes, dual-arm cylinder grasp/reach), with a backend-agnostic RL training layer (skrl / rsl_rl) plus teleop data collection.',
    tags: ['MuJoCo', 'Isaac Sim', 'skrl', 'RSL-RL'],
    render: 'renders/so101-rl.png',
  },
  {
    id: 'thesis-lidar',
    date: '2026',
    title: 'Thesis — MID360 LiDAR Simulation',
    desc: 'Sim work for Livox MID360 LiDAR-based perception: simulated LiDAR capture and 3D detection pipeline setup (LivoxDetection / OpenPCDet) for the thesis platform.',
    tags: ['Isaac Sim', 'Livox MID360', 'OpenPCDet'],
    render: 'renders/thesis-lidar.png',
  },
  {
    id: 'thesis-llm-reid',
    date: '2026',
    title: 'Thesis — LLM as Planner with ReID & Human Tracking',
    desc: 'LLM-based planner plus ReID and tracking for human action and character identification using VoxelNeX and LiDAR-HMR.',
    tags: ['Python', 'VoxelNeX', 'LiDAR-HMR', 'LLMs'],
  },
  {
    id: 'humanoid',
    date: 'Oct 2025',
    title: 'Human-to-Robot Motion Retargeting',
    desc: 'Low-latency pipeline using Gravity-Constrained Mesh Reconstruction for 3D human sequences from monocular RGB. GMR + TWIST motion mapping at stable 30 FPS on 6 GB VRAM. Benchmarked against AMASS dataset.',
    tags: ['Isaac Sim', 'Mujoco', 'ROS', 'PyTorch'],
    render: 'renders/humanoid.png',
  },
  {
    id: 'quadruped',
    date: 'Dec 2025',
    title: 'Quadrupedal System Identification',
    desc: 'Adaptive framework for online estimation of object properties (Mass, CoM, MoI) during pushing/pulling tasks. 89% success rate on goal-oriented manipulation with mean angular error < 10°.',
    tags: ['ANYmal', 'Unitree Go1', 'Python', 'Full-body Control'],
    render: 'renders/quadruped.png',
  },
  {
    id: 'arm',
    date: 'Jan 2026',
    title: 'Anthropomorphic Trajectory Optimization',
    desc: 'Robot arm trajectory parameterization aligned with natural human kinematic constraints. Velocity metrics for reaching tasks improve predictability and safety in shared human-robot environments.',
    tags: ['Python', 'Kinematic Constraints', 'HRI'],
    render: 'renders/arm.png',
  },
  {
    id: 'vlmnav',
    date: 'Apr 2025',
    title: 'Visual Tokens–Based Navigation',
    desc: 'Navigation system using QWEN2.5VL 8B with scene graphs. Fine-tuned Qwen2.5 & InternVL3 for visual scene grounding: 78.64% on ObjectNav, 62.35% on OVMM. 27% boost in landmark pose estimation via camera-intrinsic tokens.',
    tags: ['Python', 'VLMs', 'Hugging Face', 'Habitat'],
  },
  {
    id: 'drone',
    date: 'Nov 2024',
    title: 'Object-Centric RL UAV Control',
    desc: 'Reduced VIO jumps by 80% with RL-based UAV control using RGB-D, EKF pose estimation, and segmentation-based detection. PPO agent trained for hovering and orbiting in Isaac Sim/Lab.',
    tags: ['Isaac Sim', 'PX4', 'OpenCV', 'PPO'],
    render: 'renders/drone.png',
  },
  {
    id: 'llmnav',
    date: 'Apr 2024',
    title: 'LLM Navigation with LiDAR on Unitree Go2',
    desc: 'Conversational agent on Unitree Go2 with 15+ retrievable goal landmark tokens. Navigated 1,700+ sq. ft. dynamic indoor environments. Sub-782ms latency on custom audio pipeline for edge-deployed fine-tuned LLM.',
    tags: ['Python', 'OpenCV', 'ChatGPT', 'Unitree SDK2'],
    render: 'renders/llmnav.png',
  },
  {
    id: 'amr',
    date: 'Jan–Jun 2024',
    title: 'GSLAM-Based AMR Logistics',
    desc: 'Designed Autonomous Mobile Robot systems for transporting 200 lb+ payloads in complex warehouse environments. LLM-based navigation via 4D LiDAR and camera sensing; VIO on multicopters with 5% less vertical deviation.',
    tags: ['ROS2 Nav2', 'G-SLAM', 'C++', '4D LiDAR'],
  },
];

/* Horizontal strip mode: tall desktop viewports with motion allowed.
   Falls back to the grid below these thresholds. */
const STRIP_MQ = '(min-width: 900px) and (min-height: 780px) and (prefers-reduced-motion: no-preference)';
const stripPreferred = () =>
  typeof window !== 'undefined' && window.matchMedia(STRIP_MQ).matches;

const clamp1 = {
  display: '-webkit-box',
  WebkitLineClamp: 1,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

function ProjectCard({ p, compact }) {
  return (
    <div
      id={`project-card-${p.id}`}
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? '0.65rem' : '1rem',
        padding: compact ? '0.875rem' : undefined,
        height: '100%',
        minHeight: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {p.render && (
        <div
          style={compact
            ? { flex: '1 1 auto', minHeight: 90, maxHeight: 170, overflow: 'hidden', borderRadius: 8, border: '1px solid rgba(248,239,239,0.06)', background: '#141414' }
            : { aspectRatio: '1104 / 480', overflow: 'hidden', borderRadius: 8, border: '1px solid rgba(248,239,239,0.06)', background: '#141414' }}
        >
          <img
            src={`${import.meta.env.BASE_URL}${p.render}`}
            alt=""
            loading="lazy"
            decoding="async"
            draggable="false"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <h3 style={{
          fontSize: compact ? '1rem' : 'clamp(1rem, 1.5vw, 1.125rem)',
          color: 'var(--text-1)',
          lineHeight: 1.25,
          flex: 1,
          ...(compact ? clamp1 : {}),
        }}>
          {p.title}
        </h3>
        <span style={{
          fontSize: '0.6875rem',
          color: 'var(--text-3)',
          fontFamily: "'Inter', sans-serif",
          whiteSpace: 'nowrap',
          paddingTop: '0.125rem',
        }}>
          {p.date}
        </span>
      </div>

      {/* Description */}
      <p style={{
        fontSize: '0.875rem',
        lineHeight: 1.65,
        flex: compact ? '0 0 auto' : 1,
        color: 'var(--text-2)',
        ...(compact ? clamp1 : {}),
      }}>
        {p.desc}
      </p>

      {/* Tags (+ link in grid mode) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', marginTop: 'auto' }}>
        {p.tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>

      {!compact && (
        <a
          href="#"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--rose-mid)',
            textDecoration: 'none',
            fontSize: '0.8125rem',
            fontWeight: 500,
            transition: 'color 0.2s',
            width: 'fit-content',
            marginTop: 'auto',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--rose-bright)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--rose-mid)'}
        >
          View Details <ArrowUpRight size={14} weight="bold" />
        </a>
      )}
    </div>
  );
}

export function Projects() {
  const [strip, setStrip] = useState(stripPreferred);
  const wrapRef = useRef(null);
  const viewRef = useRef(null);
  const railRef = useRef(null);
  const barRef = useRef(null);
  const idxRef = useRef(null);
  const cols = Math.ceil(PROJECTS.length / 2);

  useEffect(() => {
    const mq = window.matchMedia(STRIP_MQ);
    const onChange = () => setStrip(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /* Vertical scroll scrubs the strip sideways: sticky pin + rAF lerp. */
  useEffect(() => {
    if (!strip) return;
    const wrap = wrapRef.current;
    const view = viewRef.current;
    const rail = railRef.current;
    if (!wrap || !view || !rail) return;

    let travel = 0;
    let target = 0;
    let cur = 0;
    let raf = 0;
    let running = false;
    let lastTs = 0;
    if (import.meta.env.DEV) {
      window.__proj = {
        frames: 0,
        cleanups: 0,
        state: () => ({ target, cur, travel, running, raf, runningFlag: running }),
      };
    }

    const apply = () => {
      rail.style.transform = `translate3d(${-cur * travel}px, 0, 0)`;
      if (barRef.current) barRef.current.style.transform = `scaleX(${cur})`;
      if (idxRef.current) {
        const col = Math.min(cols, Math.max(1, Math.round(cur * (cols - 1)) + 1));
        idxRef.current.textContent = String(col).padStart(2, '0');
      }
    };

    const measure = () => {
      travel = Math.max(0, rail.getBoundingClientRect().width - view.clientWidth);
      wrap.style.height = `${window.innerHeight + travel}px`;
    };

    const readTarget = () => {
      const total = wrap.offsetHeight - window.innerHeight;
      const top = wrap.getBoundingClientRect().top;
      target = total > 0 ? Math.min(1, Math.max(0, -top / total)) : 0;
    };

    const tick = (ts) => {
      if (import.meta.env.DEV) window.__proj.frames += 1;
      /* time-based smoothing: same feel at 30/60/144 fps (and under headless
         rAF throttling a step takes a big dt instead of stalling) */
      const dt = lastTs ? Math.min(0.5, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;
      const next = cur + (target - cur) * (1 - Math.exp(-dt * 12));
      if (Math.abs(target - next) < 0.0004) {
        cur = target;
        apply();
        running = false;
        lastTs = 0;
        return;
      }
      cur = next;
      apply();
      raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      readTarget();
      if (!running) {
        running = true;
        lastTs = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    const onResize = () => {
      measure();
      readTarget();
      cur = target;
      apply();
    };

    measure();
    readTarget();
    cur = target;
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      if (import.meta.env.DEV && window.__proj) window.__proj.cleanups += 1;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
      running = false;
    };
  }, [strip, cols]);

  if (strip) {
    return (
      <section className="section" id="projects" style={{ padding: 0, display: 'block', minHeight: 'auto' }}>
        <div ref={wrapRef} data-projects="wrap" style={{ height: '320vh' }}>
          <div style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '1rem',
            paddingTop: '5.5rem',
            boxSizing: 'border-box',
          }}>
            {/* Header — aligned to the 80rem container */}
            <div style={{ width: 'min(80rem, 90vw)', marginInline: 'auto', flexShrink: 0 }}>
              <span className="eyebrow">Featured Work</span>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem' }}>
                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', margin: 0 }}>Projects</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', letterSpacing: '0.08em', fontVariantNumeric: 'tabular-nums' }}>
                  <span ref={idxRef} data-projects="idx">01</span> / {String(cols).padStart(2, '0')}
                </span>
              </div>
              <div style={{ marginTop: '0.75rem', height: 2, background: 'rgba(248,239,239,0.12)', borderRadius: 1 }}>
                <div
                  ref={barRef}
                  data-projects="bar"
                  style={{
                    height: '100%',
                    width: '100%',
                    background: 'var(--rose-accent, #6B59D0)',
                    transform: 'scaleX(0)',
                    transformOrigin: 'left center',
                  }}
                />
              </div>
            </div>

            {/* Strip — 2 rows × 3 visible columns, gutters match the header */}
            <div
              ref={viewRef}
              data-projects="view"
              style={{
                overflow: 'hidden',
                width: '100%',
                WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 3%, #000 97%, transparent 100%)',
                maskImage: 'linear-gradient(90deg, transparent 0%, #000 3%, #000 97%, transparent 100%)',
              }}
            >
              <div
                ref={railRef}
                data-projects="rail"
                style={{
                  display: 'grid',
                  gridAutoFlow: 'column',
                  gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
                  gridAutoColumns: 'calc((min(80rem, 90vw) - 2.5rem) / 3)',
                  gap: '1.25rem',
                  width: 'max-content',
                  boxSizing: 'border-box',
                  paddingInline: 'max(5vw, calc((100vw - 80rem) / 2))',
                  height: 'clamp(400px, calc(100vh - 258px), 700px)',
                  willChange: 'transform',
                }}
              >
                {PROJECTS.map((project) => (
                  <ProjectCard key={project.id} p={project} compact />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* Grid fallback — mobile, short viewports, reduced motion */
  return (
    <section
      className="section"
      id="projects"
      style={{ flexDirection: 'column', alignItems: 'flex-start' }}
    >
      <div style={{ maxWidth: '80rem', width: '100%', marginInline: 'auto' }}>
        <span className="eyebrow">Featured Work</span>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '3rem' }}>Projects</h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
          gap: '1.25rem',
        }}>
          {PROJECTS.map((project) => (
            <ProjectCard key={project.id} p={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
