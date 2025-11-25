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
    <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 16px', fontFamily: '-apple-system, sans-serif' }}>
      <nav style={{ marginBottom: 24 }}>
        <Link href="/" style={{ textDecoration: 'none', fontWeight: 'bold', color: '#0070f3' }}>← Back to Search</Link>
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
                    background: '#f0f0f0',
                    borderRadius: 20,
                    textDecoration: 'none',
                    color: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: '1px solid #ddd'
                }}
            >
                <strong>{tag.name}</strong>
                <span style={{ fontSize: '0.8em', color: '#666', background: '#fff', padding: '2px 6px', borderRadius: 10 }}>{tag.count}</span>
            </Link>
          ))}
          {tags.length === 0 && <p>No topics found.</p>}
        </div>
      )}

      <footer style={{ marginTop: 40, borderTop: '1px solid #eee', paddingTop: 20, color: '#888', fontSize: '0.8rem', textAlign: 'center' }}>
        <p>Gitopedia v{process.env.NEXT_PUBLIC_GITOPEDIA_VERSION || 'dev'}</p>
      </footer>
    </main>
  );
}

