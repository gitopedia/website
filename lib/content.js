const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const DEFAULT_COMPENDIUM = path.resolve(__dirname, '../../gitopedia/Compendium');
const COMPENDIUM_DIR = process.env.GITOPEDIA_DIR ? path.resolve(process.env.GITOPEDIA_DIR) : DEFAULT_COMPENDIUM;

function walk(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    if (e.name === '_incoming') continue;
    const cur = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(cur, list);
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.md') && e.name.toLowerCase() !== 'index.md') {
      list.push(cur);
    }
  }
  return list;
}

// Walk and collect index.md files for domain/category/topic pages
function walkIndexPages(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    if (e.name === '_incoming') continue;
    const cur = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkIndexPages(cur, list);
    } else if (e.isFile() && e.name.toLowerCase() === 'index.md') {
      // Don't include root index.md (that's the homepage)
      const rel = path.relative(COMPENDIUM_DIR, cur);
      if (rel !== 'index.md') {
        list.push(cur);
      }
    }
  }
  return list;
}

// Strip .md extension from links in HTML content
function stripMdExtension(html) {
  // Replace href="...something.md" with href="...something"
  return html.replace(/href="([^"]*?)\.md"/g, 'href="$1"');
}

// Convert relative image paths to absolute paths based on the article's slug
function makeImagePathsAbsolute(html, slugParts) {
  const basePath = '/' + slugParts.join('/');
  // Match src="..." that don't start with http, https, or /
  return html.replace(/src="(?!https?:\/\/)(?!\/)([^"]*)"/g, (match, relativePath) => {
    return `src="${basePath}/${relativePath}"`;
  });
}

// Detect and wrap equations in markdown content with $ delimiters for KaTeX
// This is intentionally conservative to avoid breaking existing content
function wrapEquations(content) {
  let result = content;
  
  // 1. Display math: Square brackets on their own line containing LaTeX commands
  // [ (i \gamma^\mu \partial_\mu - m) \psi = 0 ] -> $$ ... $$
  // Only match if it's on its own line and contains backslash commands
  result = result.replace(/^\s*\[\s*([^\[\]]*\\[a-zA-Z][^\[\]]*)\s*\]\s*$/gm, (match, inner) => {
    return `$$${inner.trim()}$$`;
  });
  
  // 2. Fix malformed dollar signs (escaped or doubled incorrectly)
  // \$$ -> $$, $$ $$ -> $$ (with content)
  result = result.replace(/\\\$\$/g, '$$');
  result = result.replace(/\$\s*\$/g, '$$');
  
  // 3. Normalize multiline math - collapse newlines within $...$ or $$...$$
  // This fixes equations that got split across lines
  result = result.replace(/\$\$([^$]+)\$\$/g, (match, inner) => {
    // Collapse multiple whitespace/newlines to single space
    const normalized = inner.replace(/\s+/g, ' ').trim();
    return `$$${normalized}$$`;
  });
  
  result = result.replace(/\$([^$\n]+)\$/g, (match, inner) => {
    // Collapse whitespace in inline math too
    const normalized = inner.replace(/\s+/g, ' ').trim();
    return `$${normalized}$`;
  });
  
  return result;
}

// Convert frontMatter to JSON-serializable format (Date objects -> ISO strings)
function serializeFrontMatter(data) {
  if (!data) return {};
  const serialized = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Date) {
      serialized[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      serialized[key] = value.map(v => v instanceof Date ? v.toISOString() : v);
    } else {
      serialized[key] = value;
    }
  }
  return serialized;
}

function getAllArticles() {
  if (!fs.existsSync(COMPENDIUM_DIR)) return [];
  const files = walk(COMPENDIUM_DIR, []);
  return files.map((absPath) => {
    const rel = path.relative(COMPENDIUM_DIR, absPath);
    const slugParts = rel.replace(/\.md$/i, '').split(path.sep);
    
    // Read frontmatter to get created date, model, and version
    let created = null;
    let model = null;
    let researcherVersion = null;
    try {
      const raw = fs.readFileSync(absPath, 'utf-8');
      const { data } = matter(raw);
      if (data.created) {
        // Parse date - support both "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM:SSZ" formats
        const dateStr = String(data.created);
        if (dateStr.includes('T')) {
          created = new Date(dateStr);
        } else {
          // Old format: just date, add midnight UTC
          created = new Date(dateStr + 'T00:00:00Z');
        }
      }
      if (data.model) {
        model = String(data.model);
      }
      if (data.researcher_version) {
        researcherVersion = String(data.researcher_version);
      }
    } catch (err) {
      // Ignore errors reading frontmatter
    }
    
    return {
      absPath,
      relPath: rel,
      slugParts,
      created,
      model,
      researcherVersion
    };
  });
}

// Get all index pages (domain, category, topic)
function getAllIndexPages() {
  if (!fs.existsSync(COMPENDIUM_DIR)) return [];
  const files = walkIndexPages(COMPENDIUM_DIR, []);
  return files.map((absPath) => {
    const rel = path.relative(COMPENDIUM_DIR, absPath);
    // Remove /index.md from the path to get the slug
    const slugParts = path.dirname(rel).split(path.sep);
    
    // Determine page type based on depth
    let pageType = 'domain'; // depth 1: science
    if (slugParts.length === 2) pageType = 'category'; // depth 2: science/physics
    if (slugParts.length >= 3) pageType = 'topic'; // depth 3+: science/physics/quantum-mechanics
    
    return {
      absPath,
      relPath: rel,
      slugParts,
      pageType
    };
  });
}

// Process markdown to HTML with KaTeX math support
async function processMarkdown(content, slugParts) {
  // Pre-process: detect and wrap equations
  const contentWithMath = wrapEquations(content);
  
  // Use unified pipeline for proper math rendering
  const unified = (await import('unified')).unified;
  const remarkParse = (await import('remark-parse')).default;
  const remarkMath = (await import('remark-math')).default;
  const remarkRehype = (await import('remark-rehype')).default;
  const rehypeKatex = (await import('rehype-katex')).default;
  const rehypeStringify = (await import('rehype-stringify')).default;
  
  const processor = unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true });
  
  const result = await processor.process(contentWithMath);
  let html = result.toString();
  
  // Post-process: convert footnote references to proper format
  // [^1]: becomes a reference section
  html = processFootnotes(html, content);
  
  html = stripMdExtension(html);
  html = makeImagePathsAbsolute(html, slugParts);
  
  return html;
}

// Process footnotes from original content and append as References section
function processFootnotes(html, originalContent) {
  // Extract footnote definitions from original markdown
  const footnoteRegex = /^\[\^(\d+)\]:\s*(.+)$/gm;
  const footnotes = [];
  let match;
  
  while ((match = footnoteRegex.exec(originalContent)) !== null) {
    footnotes.push({
      id: match[1],
      text: match[2].trim()
    });
  }
  
  if (footnotes.length === 0) {
    return html;
  }
  
  // Remove any existing "References" section heading from the HTML 
  // (we'll rebuild it with proper formatting)
  html = html.replace(/<h2[^>]*>\s*References\s*<\/h2>/gi, '');
  
  // Remove any existing footnote definitions that may have been poorly rendered
  // They often appear as paragraphs starting with [^1]:
  html = html.replace(/<p>\[\^\d+\]:[^<]*<\/p>/g, '');
  // Also remove link-style footnote definitions
  html = html.replace(/<p>\[\^\d+\]:\s*<a[^>]*>[^<]*<\/a><\/p>/g, '');
  
  // Convert inline footnote references [^1] to superscript links
  html = html.replace(/\[\^(\d+)\]/g, '<sup><a href="#fn$1" id="fnref$1">[$1]</a></sup>');
  
  // Build references section
  let referencesHtml = '<section class="references"><h2>References</h2><ol>';
  for (const fn of footnotes) {
    // Extract link if present
    const linkMatch = fn.text.match(/\[([^\]]+)\]\(([^)]+)\)/);
    let refContent;
    if (linkMatch) {
      refContent = `<a href="${linkMatch[2]}" target="_blank" rel="noopener noreferrer">${linkMatch[1]}</a>`;
    } else {
      refContent = fn.text;
    }
    referencesHtml += `<li id="fn${fn.id}">${refContent} <a href="#fnref${fn.id}">↩</a></li>`;
  }
  referencesHtml += '</ol></section>';
  
  // Append references section before closing tags or at the end
  return html + referencesHtml;
}

// Get an index page by slug parts
async function getIndexPage(slugParts) {
  const indexPath = path.join(COMPENDIUM_DIR, ...slugParts, 'index.md');
  const raw = fs.readFileSync(indexPath, 'utf-8');
  const { data, content } = matter(raw);
  
  // Determine page type based on depth
  let pageType = 'domain';
  if (slugParts.length === 2) pageType = 'category';
  if (slugParts.length >= 3) pageType = 'topic';
  
  try {
    const contentHtml = await processMarkdown(content, slugParts);
    return {
      frontMatter: serializeFrontMatter(data),
      contentHtml,
      pageType
    };
  } catch (error) {
    console.error(`Error processing index page:`, error);
    return {
      frontMatter: serializeFrontMatter(data),
      contentHtml: `<pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
      pageType
    };
  }
}

async function getArticle(slugParts) {
  const mdPath = path.join(COMPENDIUM_DIR, ...slugParts) + '.md';
  const raw = fs.readFileSync(mdPath, 'utf-8');
  const { data, content } = matter(raw);
  
  try {
    const contentHtml = await processMarkdown(content, slugParts);
    return {
      frontMatter: serializeFrontMatter(data),
      contentHtml
    };
  } catch (error) {
    console.error(`Error processing article at ${mdPath}:`, error);
    // Fallback: return raw markdown as HTML-escaped text
    return {
      frontMatter: serializeFrontMatter(data),
      contentHtml: `<pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`
    };
  }
}

module.exports = {
  getAllArticles,
  getArticle,
  getAllIndexPages,
  getIndexPage
};
