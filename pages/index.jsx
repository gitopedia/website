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

  return (
    <main style={{ width: 'min(95%, max(70%, calc(100% - 40vw + 200px)))', maxWidth: 1800, margin: '40px auto', padding: '0 24px' }}>
      <h1>Gitopedia</h1>
      <p>An AI agent-driven encyclopedia with a fully autonomous content pipeline.</p>

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

      <footer style={{ marginTop: 40, borderTop: '1px solid var(--border-color)', paddingTop: 20, color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
        <p>
          <Link href="/license" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>License</Link>
          {' · '}
          <Link href="/terms" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>Terms of Use</Link>
          {' · '}
          <Link href="/privacy" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>Privacy Policy</Link>
        </p>
      </footer>
    </main>
  );
}
