import { useState } from 'react';
import Link from 'next/link';
import { getAllArticles } from '../lib/content';

export async function getStaticProps() {
  const articles = getAllArticles()
    .map(a => ({
      href: '/' + a.slugParts.map(encodeURIComponent).join('/'),
      title: a.slugParts[a.slugParts.length - 1].replace(/-/g, ' ')
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
  return { props: { articles } };
}

export default function Home({ articles }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const searchApiUrl = process.env.NEXT_PUBLIC_SEARCH_API_URL;

  async function handleSearch(e) {
    e.preventDefault();
    setError('');
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (!searchApiUrl) {
      setError('Search API URL is not configured.');
      return;
    }
    try {
      setSearching(true);
      const url = `${searchApiUrl.replace(/\\/$/, '')}/search?q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Search failed with status ${res.status}`);
      }
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err.message || 'Search failed.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 16px' }}>
      <h1>Gitopedia</h1>
      <p>An AI agent-driven encyclopedia with a fully autonomous content pipeline.</p>

      <section style={{ margin: '24px 0' }}>
        <h2>Search</h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            style={{ flex: 1, padding: '6px 8px' }}
          />
          <button type="submit" disabled={searching} style={{ padding: '6px 12px' }}>
            {searching ? 'Searching…' : 'Search'}
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {results.length > 0 && (
          <ul>
            {results.map((r) => (
              <li key={r.id}>
                <Link href={'/' + (r.path || '').replace(/\\.md$/i, '')}>
                  {r.title}
                </Link>
                {r.snippet && (
                  <div
                    style={{ fontSize: '0.9em', color: '#555' }}
                    dangerouslySetInnerHTML={{ __html: r.snippet }}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <h2>Articles</h2>
      <ul>
        {articles.map((a) => (
          <li key={a.href}>
            <Link href={a.href}>{a.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}


