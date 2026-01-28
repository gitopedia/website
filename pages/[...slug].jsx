import Link from 'next/link';
import { getAllArticles, getArticle, getAllIndexPages, getIndexPage } from '../lib/content';

export async function getStaticPaths() {
  const articles = getAllArticles();
  const indexPages = getAllIndexPages();
  
  const articlePaths = articles.map((a) => ({
    params: { slug: a.slugParts }
  }));
  
  const indexPaths = indexPages.map((p) => ({
    params: { slug: p.slugParts }
  }));
  
  return { paths: [...articlePaths, ...indexPaths], fallback: false };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  
  // Check if this is an index page (domain/category/topic)
  const indexPages = getAllIndexPages();
  const isIndexPage = indexPages.some(p => 
    p.slugParts.length === slug.length && 
    p.slugParts.every((part, i) => part === slug[i])
  );
  
  if (isIndexPage) {
    const indexPage = await getIndexPage(slug);
    return {
      props: {
        page: indexPage,
        slug,
        isIndexPage: true
      }
    };
  }
  
  const article = await getArticle(slug);
  return {
    props: {
      article,
      slug,
      isIndexPage: false
    }
  };
}

export default function ArticlePage({ article, page, slug, isIndexPage }) {
  // Handle index pages (domain/category/topic)
  if (isIndexPage && page) {
    return <IndexPageView page={page} slug={slug} />;
  }
  
  // Handle article pages
  return <ArticleView article={article} slug={slug} />;
}

// Component for domain/category/topic index pages
function IndexPageView({ page, slug }) {
  const fm = page.frontMatter || {};
  const title = fm.title || 'Untitled';
  const domain = fm.domain;
  const domainSlug = fm['domain-slug'];
  const category = fm.category;
  const categorySlug = fm['category-slug'];
  const topic = fm.topic;
  const topicSlug = fm['topic-slug'];
  const githubIssueIds = fm.github_issue_ids || [];
  
  const githubRepoUrl = 'https://github.com/Gitopedia/gitopedia';
  
  return (
    <main style={{ 
      width: 'min(95%, max(70%, calc(100% - 40vw + 200px)))', 
      maxWidth: 1800, 
      margin: '40px auto', 
      padding: '0 clamp(12px, 4vw, 24px)',
      boxSizing: 'border-box'
    }}>
      <h1>{title}</h1>
      
      {/* Breadcrumb Navigation */}
      <nav style={{ 
        marginBottom: '24px', 
        fontSize: '0.9em', 
        color: 'var(--text-muted)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        alignItems: 'center'
      }}>
        <Link href="/" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>
          Home
        </Link>
        {domain && domainSlug && page.pageType !== 'domain' && (
          <>
            <span style={{ margin: '0 4px' }}>/</span>
            <Link href={`/${domainSlug}`} style={{ color: 'var(--link-color)', textDecoration: 'none' }}>
              {domain}
            </Link>
          </>
        )}
        {category && categorySlug && page.pageType === 'topic' && (
          <>
            <span style={{ margin: '0 4px' }}>/</span>
            <Link href={`/${domainSlug}/${categorySlug}`} style={{ color: 'var(--link-color)', textDecoration: 'none' }}>
              {category}
            </Link>
          </>
        )}
      </nav>

      {/* Page Content */}
      <article 
        dangerouslySetInnerHTML={{ __html: page.contentHtml }}
        style={{
          overflowWrap: 'break-word',
          wordWrap: 'break-word',
          minWidth: 0
        }}
      />

      {/* Footer with GitHub Links */}
      {githubIssueIds.length > 0 && (
        <footer style={{ 
          marginTop: '40px', 
          paddingTop: '20px', 
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.9em',
          color: 'var(--text-muted)'
        }}>
          <div>
            <strong>GitHub Issues:</strong>{' '}
            {githubIssueIds.map((id, index) => (
              <span key={id}>
                <a 
                  href={`${githubRepoUrl}/issues/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--link-color)', textDecoration: 'none' }}
                >
                  #{id}
                </a>
                {index < githubIssueIds.length - 1 && ', '}
              </span>
            ))}
          </div>
        </footer>
      )}
    </main>
  );
}

// Component for article pages
function ArticleView({ article, slug }) {
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

  // GitHub repo URL and file path
  const githubRepoUrl = 'https://github.com/Gitopedia/gitopedia';
  const githubFileUrl = `${githubRepoUrl}/blob/main/Compendium/${slug.join('/')}.md`;
  
  return (
    <main style={{ maxWidth: '100%', margin: 0, padding: 0 }}>
      {/* Header Image - Full Width, responsive height */}
      {headerImageSrc && (
        <div style={{ 
          width: '100%', 
          height: 'clamp(40vh, 65vw, 75vh)', 
          overflow: 'hidden',
          position: 'relative'
        }}>
          <img 
            src={headerImageSrc} 
            alt={`${articleTitle} header`}
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
            {articleTitle}
          </h1>
        </div>
      )}

      <div style={{ 
        width: 'min(95%, max(70%, calc(100% - 40vw + 200px)))', 
        maxWidth: 1800, 
        margin: '0 auto', 
        padding: 'clamp(16px, 3vw, 24px) clamp(12px, 4vw, 24px) 40px',
        boxSizing: 'border-box',
        minWidth: 0,
        position: 'relative'
      }}>
        {/* GitHub Edit Button - Top Right */}
        <a
          href={githubFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'absolute',
            top: 'clamp(16px, 3vw, 24px)',
            right: 'clamp(12px, 4vw, 24px)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            backgroundColor: 'var(--bg-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transition: 'all 0.2s'
          }}
          title="View source on GitHub"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          View Source
        </a>

        {/* Title shown only if no header image */}
        {!headerImageSrc && (
          <h1 style={{ 
            marginBottom: '8px',
            fontSize: 'clamp(2.2rem, 6vw, 4rem)',
            fontFamily: '"DM Sans", "Outfit", system-ui, -apple-system, sans-serif',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            paddingRight: '120px'
          }}>
            {articleTitle}
          </h1>
        )}

        {/* Breadcrumb Navigation */}
        <nav style={{ 
          marginBottom: '24px', 
          fontSize: '0.9em', 
          color: 'var(--text-muted)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          alignItems: 'center'
        }}>
          {domain && domainSlug && (
            <>
              <Link href={`/${domainSlug}`} style={{ color: 'var(--link-color)', textDecoration: 'none' }}>
                {domain}
              </Link>
              <span style={{ margin: '0 4px' }}>/</span>
            </>
          )}
          {category && categorySlug && domainSlug && (
            <>
              <Link href={`/${domainSlug}/${categorySlug}`} style={{ color: 'var(--link-color)', textDecoration: 'none' }}>
                {category}
              </Link>
              <span style={{ margin: '0 4px' }}>/</span>
            </>
          )}
          {topic && topicSlug && categorySlug && domainSlug && (
            <Link href={`/${domainSlug}/${categorySlug}/${topicSlug}`} style={{ color: 'var(--link-color)', textDecoration: 'none' }}>
              {topic}
            </Link>
          )}
        </nav>

        {/* Article Content */}
        <article 
          dangerouslySetInnerHTML={{ __html: contentWithoutHeader }}
          style={{
            overflowWrap: 'break-word',
            wordWrap: 'break-word',
            minWidth: 0
          }}
        />

        {/* Footer Metadata */}
        <footer style={{ 
          marginTop: '40px', 
          paddingTop: '20px', 
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.9em',
          color: 'var(--text-muted)'
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
                        style={{ color: 'var(--link-color)', textDecoration: 'none' }}
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
                        style={{ color: 'var(--link-color)', textDecoration: 'none' }}
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
