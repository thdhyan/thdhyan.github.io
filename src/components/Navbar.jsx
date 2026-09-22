import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { label: 'Home',         href: '#home' },
  { label: 'About',        href: '#about' },
  { label: 'Projects',     href: '#projects' },
  { label: 'Skills',       href: '#skills' },
  { label: 'Publications', href: '#publications' },
  { label: 'Contact',      href: '#contact' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar${scrolled ? ' navbar-scrolled' : ''}`} aria-label="Primary navigation">
      <div className="navbar-inner">
        <a href="#home" className="navbar-logo" aria-label="Home">DT</a>
        <div className="navbar-links">
          {NAV_LINKS.map(link => (
            <a key={link.href} href={link.href} className="navbar-link">
              {link.label}
            </a>
          ))}
        </div>
        <a
          href="/cv-dhyan-thakkar-2026-04-29.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="navbar-cv"
        >
          Resume ↗
        </a>
      </div>
    </nav>
  );
}
