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
  // Dynamic import for ESM packages
  const { remark } = await import('remark');
  const html = await import('remark-html');
  const processed = await remark().use(html.default).process(content);
  const contentHtml = processed.toString();
  return {
    frontMatter: data || {},
    contentHtml
  };
}

module.exports = {
  getAllArticles,
  getArticle
};


