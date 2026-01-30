import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllDomains } from '../lib/content';
import DisplayModeToggle from '../components/DisplayModeToggle';
import ListView from '../components/ListView';
import TilesView from '../components/TilesView';
import RowsView from '../components/RowsView';

export async function getStaticProps() {
  const domains = getAllDomains();
  return { props: { domains } };
}

export default function Home({ domains }) {
  const [displayMode, setDisplayMode] = useState('tiles');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('displayMode');
    if (saved) {
      setDisplayMode(saved);
    }
    setMounted(true);
  }, []);

  const handleModeChange = (mode) => {
    setDisplayMode(mode);
  };

  // Map domains to the format expected by view components
  const domainItems = domains.map(d => ({
    href: d.href,
    title: d.title,
    imageSrc: d.headerImage
  }));

  const headerImageSrc = '/img/index_header.avif';
  const githubRepoUrl = 'https://github.com/Gitopedia/gitopedia';

  return (
    <main style={{ maxWidth: '100%', margin: 0, padding: 0 }}>
      {/* Header Image - Full Width, responsive height (shorter on larger screens) */}
      <div style={{ 
        width: '100%', 
        height: 'clamp(35vh, 50vw, 50vh)', 
        overflow: 'hidden',
        position: 'relative'
      }}>
        <img 
          src={headerImageSrc} 
          alt="Index header"
          style={{ 
            width: '100%', 
            height: '100%',
            display: 'block',
            objectFit: 'cover',
            objectPosition: 'center'
          }} 
        />
        {/* Title overlay on image */}
        <h1 style={{ 
          position: 'absolute',
          bottom: 'clamp(24px, 6vw, 64px)',
          left: 'clamp(16px, 4vw, 56px)',
          right: 'clamp(16px, 4vw, 56px)',
          margin: 0,
          color: '#fff',
          fontFamily: '"DM Sans", "Outfit", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 'clamp(2.5rem, 9vw, 7rem)',
          fontWeight: 800,
          textShadow: '0 2px 12px rgba(0,0,0,0.7), 0 6px 32px rgba(0,0,0,0.5)',
          lineHeight: 1.05,
          letterSpacing: '-0.025em'
        }}>
          Index
        </h1>
      </div>

      <div style={{ 
        width: 'min(95%, max(70%, calc(100% - 40vw + 200px)))', 
        maxWidth: 1800, 
        margin: '0 auto', 
        padding: 'clamp(16px, 3vw, 24px) clamp(12px, 4vw, 24px) 40px',
        boxSizing: 'border-box',
        minWidth: 0
      }}>
        {/* View Source Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '24px'
        }}>
          <a
            href={githubRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'var(--button-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-color)',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
            title="View source on GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            View Source
          </a>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ 
            margin: 0,
            fontFamily: '"DM Sans", "Outfit", system-ui, -apple-system, sans-serif',
            fontWeight: 600,
            fontSize: '1.5rem',
            letterSpacing: '-0.01em'
          }}>Domains</h2>
          {mounted && (
            <DisplayModeToggle 
              storageKey="displayMode" 
              onChange={handleModeChange} 
            />
          )}
        </div>

        {displayMode === 'list' && <ListView items={domainItems} />}
        {displayMode === 'tiles' && <TilesView items={domainItems} />}
        {displayMode === 'rows' && <RowsView items={domainItems} />}

        <footer style={{ 
          marginTop: '40px', 
          paddingTop: '20px', 
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.9em',
          color: 'var(--text-muted)'
        }}>
          <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>
            <Link href="/license" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>License</Link>
            {' · '}
            <Link href="/terms" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>Terms of Use</Link>
            {' · '}
            <Link href="/privacy" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>Privacy Policy</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
