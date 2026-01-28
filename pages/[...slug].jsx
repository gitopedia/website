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

// Inline cascading breadcrumb component with chevron separator
function CascadingBreadcrumbs({ items }) {
  if (!items || items.length === 0) return null;
  
  return (
    <nav style={{ 
      marginBottom: '24px',
      fontSize: '0.85em',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      gap: '0'
    }}>
      {items.map((item, index) => (
        <span 
          key={item.href || index}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            position: 'relative',
            top: `${index * 2}px`
          }}
        >
          {index > 0 && (
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="var(--text-muted)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ 
                margin: '0 6px',
                opacity: 0.5,
                flexShrink: 0
              }}
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          )}
          {item.href ? (
            <Link 
              href={item.href} 
              style={{ 
                color: 'var(--link-color)', 
                textDecoration: 'none',
                fontWeight: index === items.length - 1 ? 500 : 400
              }}
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ 
              color: 'var(--text-muted)',
              fontWeight: 500
            }}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
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

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/' }
  ];
  
  if (domain && domainSlug && page.pageType !== 'domain') {
    breadcrumbItems.push({ label: domain, href: `/${domainSlug}` });
  }
  if (category && categorySlug && page.pageType === 'topic') {
    breadcrumbItems.push({ label: category, href: `/${domainSlug}/${categorySlug}` });
  }
  
  return (
    <main style={{ 
      width: 'min(95%, max(70%, calc(100% - 40vw + 200px)))', 
      maxWidth: 1800, 
      margin: '40px auto', 
      padding: '0 clamp(12px, 4vw, 24px)',
      boxSizing: 'border-box'
    }}>
      <h1>{title}</h1>
      
      {/* Cascading Breadcrumb Navigation */}
      <CascadingBreadcrumbs items={breadcrumbItems} />

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

  // GitHub repo URL (adjust as needed)
  const githubRepoUrl = 'https://github.com/Gitopedia/gitopedia';

  // Build breadcrumb items for article
  const breadcrumbItems = [];
  if (domain && domainSlug) {
    breadcrumbItems.push({ label: domain, href: `/${domainSlug}` });
  }
  if (category && categorySlug && domainSlug) {
    breadcrumbItems.push({ label: category, href: `/${domainSlug}/${categorySlug}` });
  }
  if (topic && topicSlug && categorySlug && domainSlug) {
    breadcrumbItems.push({ label: topic, href: `/${domainSlug}/${categorySlug}/${topicSlug}` });
  }
  
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
        minWidth: 0
      }}>
        {/* Title shown only if no header image */}
        {!headerImageSrc && (
          <h1 style={{ 
            marginBottom: '8px',
            fontSize: 'clamp(2.2rem, 6vw, 4rem)',
            fontFamily: '"DM Sans", "Outfit", system-ui, -apple-system, sans-serif',
            fontWeight: 700,
            letterSpacing: '-0.025em'
          }}>
            {articleTitle}
          </h1>
        )}

        {/* Cascading Breadcrumb Navigation */}
        <CascadingBreadcrumbs items={breadcrumbItems} />

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
