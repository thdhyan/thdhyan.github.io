import { Cpu, Cube, Robot, Database, GridFour, Goggles } from '@phosphor-icons/react';

const TOOLS = [
  { name: 'ROS 2', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ros/ros-original.svg' },
  { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg' },
  { name: 'C++', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg' },
  { name: 'PyTorch', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pytorch/pytorch-original.svg' },
  { name: 'TensorFlow', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tensorflow/tensorflow-original.svg' },
  { name: 'OpenCV', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/opencv/opencv-original.svg' },
  { name: 'CUDA', ReactIcon: Cpu },
  { name: 'NVIDIA Isaac Sim', ReactIcon: Cube },
  { name: 'Gazebo', ReactIcon: Cube },
  { name: 'Docker', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg' },
  { name: 'Git', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg' },
  { name: 'Linux', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linux/linux-original.svg' },
  { name: 'SLAM', ReactIcon: Robot },
  { name: 'LiDAR', ReactIcon: Database },
  { name: 'Computer Vision', ReactIcon: Goggles },
  { name: 'Deep Learning', ReactIcon: GridFour },
  { name: 'Reinforcement Learning', ReactIcon: Robot },
  { name: 'MATLAB', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/matlab/matlab-original.svg' },
];

export function Skills() {
  return (
    <section className="section" id="skills" style={{ flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '80rem', width: '100%', marginInline: 'auto' }}>
        <span className="eyebrow">Skills & Tools</span>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '3rem' }}>
          Tech that powers<br />intelligent robots.
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '1rem',
        }}>
          {TOOLS.map((tool) => (
            <div key={tool.name} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center', gap: '1rem' }}>
              {tool.icon ? (
                <img src={tool.icon} alt={tool.name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
              ) : (
                tool.ReactIcon && <tool.ReactIcon size={40} color="var(--rose-mid)" />
              )}
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-1)' }}>
                {tool.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
