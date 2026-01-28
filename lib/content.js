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
function wrapEquations(content) {
  let result = content;
  
  // Don't process content inside code blocks or existing $ delimiters
  // Split by code blocks and process only non-code parts
  const codeBlockRegex = /(```[\s\S]*?```|`[^`]+`|\$\$[\s\S]*?\$\$|\$[^\$\n]+\$)/g;
  const parts = result.split(codeBlockRegex);
  
  result = parts.map((part, index) => {
    // Skip code blocks and existing math
    if (part.match(/^(```|`|\$)/)) {
      return part;
    }
    
    let processed = part;
    
    // 1. Display math: Square brackets containing LaTeX commands [ ... ] -> $$ ... $$
    // Match [ content ] where content contains backslash commands
    processed = processed.replace(/\[\s*([^\[\]]*\\[a-zA-Z]+[^\[\]]*)\s*\]/g, (match, inner) => {
      // Don't wrap if it looks like a markdown link [text](url)
      if (match.includes('](')) return match;
      return `$$${inner.trim()}$$`;
    });
    
    // 2. Display math: Lines that are primarily equations (start with backslash or contain = with backslash)
    processed = processed.replace(/^(\s*)(\\[a-zA-Z]+[^]*?=.*|.*=\s*\\[a-zA-Z]+[^]*)$/gm, (match, indent, eq) => {
      // Skip if already wrapped or is a markdown element
      if (eq.trim().startsWith('$') || eq.trim().startsWith('#') || eq.trim().startsWith('-') || eq.trim().startsWith('*')) {
        return match;
      }
      return `${indent}$$${eq.trim()}$$`;
    });
    
    // 3. Inline math: Expressions with LaTeX commands like \gamma, \partial, \psi, etc.
    // Match sequences containing backslash commands not already in $ delimiters
    processed = processed.replace(/(?<!\$)(\([^()]*\\[a-zA-Z]+[^()]*\))(?!\$)/g, (match, inner) => {
      return `$${inner}$`;
    });
    
    // 4. Inline: Standalone LaTeX expressions with backslash (like \psi or \gamma^\mu)
    // Match \command possibly followed by ^{} or _{} or ^letter or _letter
    processed = processed.replace(/(?<![\\$a-zA-Z])(\\[a-zA-Z]+(?:\^\{[^}]+\}|\^[a-zA-Z0-9]|_\{[^}]+\}|_[a-zA-Z0-9])*(?:\s*[=<>]\s*\d+)?)(?![a-zA-Z$])/g, (match, expr) => {
      // Don't wrap if it's already part of larger math or a markdown escape
      if (expr === '\\n' || expr === '\\t' || expr === '\\r') return match;
      return `$${expr}$`;
    });
    
    // 5. Famous equations - wrap if found as standalone
    const famousEquations = [
      { pattern: /\bE\s*=\s*mc²/g, replacement: '$E = mc^2$' },
      { pattern: /\bE\s*=\s*mc\^2/g, replacement: '$E = mc^2$' },
      { pattern: /\bF\s*=\s*ma\b/g, replacement: '$F = ma$' },
      { pattern: /\bPV\s*=\s*nRT\b/g, replacement: '$PV = nRT$' },
      { pattern: /\ba²\s*\+\s*b²\s*=\s*c²/g, replacement: '$a^2 + b^2 = c^2$' },
      { pattern: /\bv\s*=\s*fλ\b/gi, replacement: '$v = f\\lambda$' },
    ];
    
    for (const eq of famousEquations) {
      processed = processed.replace(eq.pattern, eq.replacement);
    }
    
    // 6. Wrap standalone Greek letters used as variables (Unicode)
    processed = processed.replace(/(?<![a-zA-Z$])([αβγδεζηθικλμνξπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΠΡΣΤΥΦΧΨΩ])(?![a-zA-Z$])/g, (match, letter) => {
      const greekMap = {
        'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta',
        'ε': '\\epsilon', 'ζ': '\\zeta', 'η': '\\eta', 'θ': '\\theta',
        'ι': '\\iota', 'κ': '\\kappa', 'λ': '\\lambda', 'μ': '\\mu',
        'ν': '\\nu', 'ξ': '\\xi', 'π': '\\pi', 'ρ': '\\rho',
        'σ': '\\sigma', 'τ': '\\tau', 'υ': '\\upsilon', 'φ': '\\phi',
        'χ': '\\chi', 'ψ': '\\psi', 'ω': '\\omega',
        'Γ': '\\Gamma', 'Δ': '\\Delta', 'Θ': '\\Theta',
        'Λ': '\\Lambda', 'Ξ': '\\Xi', 'Π': '\\Pi',
        'Σ': '\\Sigma', 'Υ': '\\Upsilon', 'Φ': '\\Phi',
        'Ψ': '\\Psi', 'Ω': '\\Omega'
      };
      const latex = greekMap[letter] || letter;
      return `$${latex}$`;
    });
    
    // 7. Wrap superscript/subscript Unicode characters
    processed = processed.replace(/([A-Za-z])([²³⁴⁵⁶⁷⁸⁹⁰₀₁₂₃₄₅₆₇₈₉]+)/g, (match, base, script) => {
      const superMap = { '²': '^2', '³': '^3', '⁴': '^4', '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9', '⁰': '^0' };
      const subMap = { '₀': '_0', '₁': '_1', '₂': '_2', '₃': '_3', '₄': '_4', '₅': '_5', '₆': '_6', '₇': '_7', '₈': '_8', '₉': '_9' };
      
      let latex = base;
      for (const char of script) {
        if (superMap[char]) latex += superMap[char];
        else if (subMap[char]) latex += subMap[char];
        else latex += char;
      }
      return `$${latex}$`;
    });
    
    // 8. Clean up any double-wrapped math ($$$$) 
    processed = processed.replace(/\$\$\$\$/g, '$$');
    processed = processed.replace(/\$\$/g, (match, offset, str) => {
      // Keep $$ only if it's display math (has content between)
      return match;
    });
    
    return processed;
  }).join('');
  
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
  
  // Remove any existing footnote definitions that may have been poorly rendered
  // They often appear as paragraphs starting with [^1]:
  html = html.replace(/<p>\[\^\d+\]:[^<]*<\/p>/g, '');
  
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
