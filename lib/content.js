const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const DEFAULT_COMPENDIUM = path.resolve(__dirname, '../../gitopedia/gitopedia/Compendium');
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
    return {
      absPath,
      relPath: rel,
      slugParts
    };
  });
}

async function getArticle(slugParts) {
  const mdPath = path.join(COMPENDIUM_DIR, ...slugParts) + '.md';
  const raw = fs.readFileSync(mdPath, 'utf-8');
  const { data, content } = matter(raw);
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


