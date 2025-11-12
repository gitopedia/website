import { getAllArticles, getArticle } from '../lib/content';

export async function getStaticPaths() {
  const articles = getAllArticles();
  const paths = articles.map((a) => ({
    params: { slug: a.slugParts }
  }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const article = await getArticle(slug);
  return {
    props: {
      article,
      slug
    }
  };
}

export default function ArticlePage({ article }) {
  const title = article.frontMatter?.title || 'Untitled';
  return (
    <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 16px' }}>
      <h1>{title}</h1>
      <article dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
    </main>
  );
}


