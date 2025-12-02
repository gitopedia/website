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
  const created = article.frontMatter?.created;
  const model = article.frontMatter?.model;
  
  // Parse created date if it exists
  let createdDate = null;
  if (created) {
    const dateStr = String(created);
    if (dateStr.includes('T')) {
      createdDate = new Date(dateStr);
    } else {
      createdDate = new Date(dateStr + 'T00:00:00Z');
    }
  }
  
  return (
    <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 16px' }}>
      <h1>{title}</h1>
      {(createdDate || model) && (
        <div style={{ marginBottom: '20px', fontSize: '0.9em', color: '#666', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
          {createdDate && (
            <div style={{ marginBottom: '4px' }}>
              <strong>Created:</strong> {createdDate.toLocaleString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
                timeZoneName: 'short'
              })}
            </div>
          )}
          {model && (
            <div>
              <strong>Model:</strong> {model}
            </div>
          )}
        </div>
      )}
      <article dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
    </main>
  );
}


