import { ArrowUpRight } from '@phosphor-icons/react';

const PROJECTS = [
  {
    id: 'humanoid',
    date: 'Oct 2025',
    title: 'Human-to-Robot Motion Retargeting',
    desc: 'Low-latency pipeline using Gravity-Constrained Mesh Reconstruction for 3D human sequences from monocular RGB. GMR + TWIST motion mapping at stable 30 FPS on 6 GB VRAM. Benchmarked against AMASS dataset.',
    tags: ['Isaac Sim', 'Mujoco', 'ROS', 'PyTorch'],
  },
  {
    id: 'quadruped',
    date: 'Dec 2025',
    title: 'Quadrupedal System Identification',
    desc: 'Adaptive framework for online estimation of object properties (Mass, CoM, MoI) during pushing/pulling tasks. 89% success rate on goal-oriented manipulation with mean angular error < 10°.',
    tags: ['ANYmal', 'Unitree Go1', 'Python', 'Full-body Control'],
  },
  {
    id: 'arm',
    date: 'Jan 2026',
    title: 'Anthropomorphic Trajectory Optimization',
    desc: 'Robot arm trajectory parameterization aligned with natural human kinematic constraints. Velocity metrics for reaching tasks improve predictability and safety in shared human-robot environments.',
    tags: ['Python', 'Kinematic Constraints', 'HRI'],
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
  },
  {
    id: 'llmnav',
    date: 'Apr 2024',
    title: 'LLM Navigation with LiDAR on Unitree Go2',
    desc: 'Conversational agent on Unitree Go2 with 15+ retrievable goal landmark tokens. Navigated 1,700+ sq. ft. dynamic indoor environments. Sub-782ms latency on custom audio pipeline for edge-deployed fine-tuned LLM.',
    tags: ['Python', 'OpenCV', 'ChatGPT', 'Unitree SDK2'],
  },
  {
    id: 'amr',
    date: 'Jan–Jun 2024',
    title: 'GSLAM-Based AMR Logistics',
    desc: 'Designed Autonomous Mobile Robot systems for transporting 200 lb+ payloads in complex warehouse environments. LLM-based navigation via 4D LiDAR and camera sensing; VIO on multicopters with 5% less vertical deviation.',
    tags: ['ROS2 Nav2', 'G-SLAM', 'C++', '4D LiDAR'],
  },
];

export function Projects() {
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
            <div
              id={`project-card-${project.id}`}
              key={project.id}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <h3 style={{
                  fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
                  color: 'var(--text-1)',
                  lineHeight: 1.25,
                  flex: 1,
                }}>
                  {project.title}
                </h3>
                <span style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-3)',
                  fontFamily: "'Space Mono', monospace",
                  whiteSpace: 'nowrap',
                  paddingTop: '0.125rem',
                }}>
                  {project.date}
                </span>
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.875rem', lineHeight: 1.65, flex: 1, color: 'var(--text-2)' }}>
                {project.desc}
              </p>

              {/* Tags + link */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                {project.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>

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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
