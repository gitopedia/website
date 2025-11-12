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
  return (
    <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 16px' }}>
      <h1>Gitopedia</h1>
      <p>A static export of Markdown articles from the Gitopedia repository.</p>
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


