import { LinkedinLogo, GithubLogo, EnvelopeSimple } from '@phosphor-icons/react';

export function SocialBar() {
  return (
    <div className="social-bar" role="complementary" aria-label="Social links">
      <a
        href="https://linkedin.com/in/thdhyan"
        target="_blank"
        rel="noopener noreferrer"
        className="social-icon social-linkedin"
        aria-label="LinkedIn"
      >
        <LinkedinLogo size={20} weight="fill" />
      </a>
      <a
        href="https://github.com/thdhyan"
        target="_blank"
        rel="noopener noreferrer"
        className="social-icon social-github"
        aria-label="GitHub"
      >
        <GithubLogo size={20} weight="fill" />
      </a>
      <a
        href="mailto:thakk100@umn.edu"
        className="social-icon social-email"
        aria-label="Email"
      >
        <EnvelopeSimple size={20} weight="fill" />
      </a>
    </div>
  );
}
