import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Browse() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_SEARCH_API_URL;
    if (!apiUrl) {
        // If running locally without env, might fail.
        // setError('Search API not configured');
        setLoading(false);
        return;
    }
    
    const fetchTags = async () => {
      try {
        const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
        const res = await fetch(`${baseUrl}/search?action=tags`);
        if (!res.ok) throw new Error('Failed to fetch tags');
        const data = await res.json();
        setTags(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  return (
    <main style={{ width: 'min(95%, max(70%, calc(100% - 40vw + 200px)))', maxWidth: 1800, margin: '40px auto', padding: '0 24px' }}>
      <nav style={{ marginBottom: 24 }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'var(--link-color)' }}>← Back to Home</Link>
      </nav>
      
      <h1>Browse Topics</h1>
      
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {!loading && !error && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {tags.map(tag => (
            <Link 
                key={tag.name} 
                href={`/?tag=${encodeURIComponent(tag.name)}`}
                style={{
                    padding: '8px 16px',
                    background: 'var(--border-color)',
                    borderRadius: 20,
                    textDecoration: 'none',
                    color: 'var(--text-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: '1px solid var(--border-color)'
                }}
            >
                <strong>{tag.name}</strong>
                <span style={{ fontSize: '0.8em', color: 'var(--text-muted)', background: 'var(--bg-color)', padding: '2px 6px', borderRadius: 10 }}>{tag.count}</span>
            </Link>
          ))}
          {tags.length === 0 && <p>No topics found.</p>}
        </div>
      )}

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

