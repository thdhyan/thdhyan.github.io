import { EnvelopeSimple, LinkedinLogo, GithubLogo, ArrowRight } from '@phosphor-icons/react';

const LINKS = [
  {
    icon: EnvelopeSimple,
    label: 'thakk100@umn.edu',
    href: 'mailto:thakk100@umn.edu',
    cls: 'social-email',
  },
  {
    icon: LinkedinLogo,
    label: 'linkedin.com/in/thdhyan',
    href: 'https://linkedin.com/in/thdhyan',
    cls: 'social-linkedin',
  },
  {
    icon: GithubLogo,
    label: 'github.com/thdhyan',
    href: 'https://github.com/thdhyan',
    cls: 'social-github',
  },
];

export function Contact() {
  return (
    <section
      className="section"
      id="contact"
      style={{ flexDirection: 'column', alignItems: 'center', minHeight: '70dvh' }}
    >
      <div style={{ maxWidth: '680px', width: '100%', textAlign: 'center' }}>
        <span className="eyebrow">Contact</span>

        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          marginBottom: '1rem',
          color: 'var(--rose-mid)',
        }}>
          Let's build something that moves.
        </h2>

        <p style={{ marginBottom: '3rem', fontSize: '1rem', maxWidth: '36rem', marginInline: 'auto' }}>
          Open for robotics engineering roles and research collaborations.
          F-1 OPT eligible — can start immediately.
        </p>

        <a href="mailto:thakk100@umn.edu" className="btn-primary" style={{ marginBottom: '2.5rem', display: 'inline-flex' }}>
          Send a Message
          <div className="btn-icon-wrapper">
            <ArrowRight weight="bold" size={16} />
          </div>
        </a>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginTop: '1rem',
          alignItems: 'center',
        }}>
          {LINKS.map(({ icon: Icon, label, href, cls }) => (
            <a
              key={href}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className={`social-icon ${cls}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 1.25rem',
                borderRadius: '999px',
                border: '1px solid var(--rose-border)',
                background: 'var(--bg-card)',
                color: 'var(--text-2)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.3s',
                width: '100%',
                maxWidth: '320px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--rose-border-hi)';
                e.currentTarget.style.color = 'var(--text-1)';
                e.currentTarget.style.background = 'var(--rose-glow)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--rose-border)';
                e.currentTarget.style.color = 'var(--text-2)';
                e.currentTarget.style.background = 'var(--bg-card)';
              }}
            >
              <Icon size={18} weight="fill" />
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '6rem',
        textAlign: 'center',
        color: 'var(--text-3)',
        fontSize: '0.75rem',
        letterSpacing: '0.05em',
      }}>
        <p>Dhyan Thakkar · Minneapolis, MN · F-1 OPT</p>
      </div>
    </section>
  );
}
