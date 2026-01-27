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

// Copy images from source img/ directory to public/ so they're available at build time
function copyArticleImages(slugParts) {
  // Source: images are in the parent directory of the markdown file
  // e.g., for slugParts ['science', 'physics', 'quantum-mechanics', 'pauli-exclusion-principle']
  // images are at Compendium/science/physics/quantum-mechanics/img/
  const parentSlug = slugParts.slice(0, -1);
  const articleDir = path.join(COMPENDIUM_DIR, ...parentSlug);
  const imgSourceDir = path.join(articleDir, 'img');
  
  if (!fs.existsSync(imgSourceDir)) return;
  
  // Destination: images need to be at the article's URL path
  // e.g., public/science/physics/quantum-mechanics/pauli-exclusion-principle/img/
  // because the article is served at /science/physics/quantum-mechanics/pauli-exclusion-principle/
  // and relative img/ paths resolve from there
  const publicDir = path.join(__dirname, '..', 'public');
  const imgDestDir = path.join(publicDir, ...slugParts, 'img');
  
  // Create destination directory
  fs.mkdirSync(imgDestDir, { recursive: true });
  
  // Copy all images
  const files = fs.readdirSync(imgSourceDir);
  for (const file of files) {
    const src = path.join(imgSourceDir, file);
    const dest = path.join(imgDestDir, file);
    // Only copy if source is a file (not directory)
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
    }
  }
}

async function getArticle(slugParts) {
  const mdPath = path.join(COMPENDIUM_DIR, ...slugParts) + '.md';
  const raw = fs.readFileSync(mdPath, 'utf-8');
  const { data, content } = matter(raw);
  
  // Copy images for this article to public/
  copyArticleImages(slugParts);
  
  try {
    // Dynamic import for ESM packages
    const { remark } = await import('remark');
    const remarkHtml = await import('remark-html');
    const processor = remark().use(remarkHtml.default);
    const processed = await processor.process(content);
    const contentHtml = processed.toString();
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
  getArticle
};


