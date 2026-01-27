import Link from 'next/link';
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

export default function ArticlePage({ article, slug }) {
  const fm = article.frontMatter || {};
  
  // Extract frontmatter fields
  const articleTitle = fm.article || fm.title || 'Untitled';
  const topic = fm.topic;
  const topicSlug = fm['topic-slug'];
  const category = fm.category;
  const categorySlug = fm['category-slug'];
  const domain = fm.domain;
  const domainSlug = fm['domain-slug'];
  const articleSlug = fm['article-slug'];
  const created = fm.created;
  const model = fm.model;
  const researcherVersion = fm.researcher_version;
  const githubIssueIds = fm.github_issue_ids || [];
  const githubPrIds = fm.github_pr_ids || [];
  
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

  // Extract header image from content (first image)
  const headerImageMatch = article.contentHtml?.match(/<img[^>]*src="([^"]*)"[^>]*>/);
  const headerImageSrc = headerImageMatch ? headerImageMatch[1] : null;
  
  // Remove header image from content to avoid duplication
  let contentWithoutHeader = article.contentHtml;
  if (headerImageMatch) {
    // Remove the first <p> containing the image
    contentWithoutHeader = article.contentHtml.replace(/<p><img[^>]*><\/p>/, '');
  }

  // GitHub repo URL (adjust as needed)
  const githubRepoUrl = 'https://github.com/Gitopedia/gitopedia';
  
  return (
    <main style={{ maxWidth: '100%', margin: 0, padding: 0 }}>
      {/* Header Image - Full Width */}
      {headerImageSrc && (
        <div style={{ width: '100%', overflow: 'hidden', marginBottom: '24px' }}>
          <img 
            src={headerImageSrc} 
            alt={`${articleTitle} header`}
            style={{ 
              width: '100%', 
              height: 'auto', 
              display: 'block',
              objectFit: 'cover'
            }} 
          />
        </div>
      )}

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px 40px' }}>
        {/* Topic Heading */}
        <h1 style={{ marginBottom: '8px' }}>{articleTitle}</h1>

        {/* Breadcrumb Navigation */}
        <nav style={{ 
          marginBottom: '24px', 
          fontSize: '0.9em', 
          color: '#666',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          alignItems: 'center'
        }}>
          {domain && domainSlug && (
            <>
              <Link href={`/${domainSlug}`} style={{ color: '#0066cc', textDecoration: 'none' }}>
                {domain}
              </Link>
              <span style={{ margin: '0 4px' }}>/</span>
            </>
          )}
          {category && categorySlug && domainSlug && (
            <>
              <Link href={`/${domainSlug}/${categorySlug}`} style={{ color: '#0066cc', textDecoration: 'none' }}>
                {category}
              </Link>
              <span style={{ margin: '0 4px' }}>/</span>
            </>
          )}
          {topic && topicSlug && categorySlug && domainSlug && (
            <Link href={`/${domainSlug}/${categorySlug}/${topicSlug}`} style={{ color: '#0066cc', textDecoration: 'none' }}>
              {topic}
            </Link>
          )}
        </nav>

        {/* Article Content */}
        <article dangerouslySetInnerHTML={{ __html: contentWithoutHeader }} />

        {/* Footer Metadata */}
        <footer style={{ 
          marginTop: '40px', 
          paddingTop: '20px', 
          borderTop: '1px solid #eee',
          fontSize: '0.9em',
          color: '#666'
        }}>
          {/* Created & Model Info */}
          <div style={{ marginBottom: '16px' }}>
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
              <div style={{ marginBottom: '4px' }}>
                <strong>Model:</strong> {model}
              </div>
            )}
            {researcherVersion && (
              <div>
                <strong>Researcher:</strong> v{researcherVersion}
              </div>
            )}
          </div>

          {/* GitHub Links */}
          {(githubIssueIds.length > 0 || githubPrIds.length > 0) && (
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '16px',
              marginTop: '12px'
            }}>
              {githubIssueIds.length > 0 && (
                <div>
                  <strong>GitHub Issues:</strong>{' '}
                  {githubIssueIds.map((id, index) => (
                    <span key={id}>
                      <a 
                        href={`${githubRepoUrl}/issues/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#0066cc', textDecoration: 'none' }}
                      >
                        #{id}
                      </a>
                      {index < githubIssueIds.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}
              {githubPrIds.length > 0 && (
                <div>
                  <strong>Pull Requests:</strong>{' '}
                  {githubPrIds.map((id, index) => (
                    <span key={id}>
                      <a 
                        href={`${githubRepoUrl}/pull/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#0066cc', textDecoration: 'none' }}
                      >
                        #{id}
                      </a>
                      {index < githubPrIds.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </footer>
      </div>
    </main>
  );
}


