const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const OUT_DIR = path.resolve(__dirname, '../out');
const DEFAULT_COMPENDIUM = path.resolve(__dirname, '../../gitopedia/gitopedia/Compendium');
const COMPENDIUM_DIR = process.env.GITOPEDIA_DIR ? path.resolve(process.env.GITOPEDIA_DIR) : DEFAULT_COMPENDIUM;

function walk(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
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

function generateRedirect(source, destination) {
  // Ensure source starts with /
  if (!source.startsWith('/')) source = '/' + source;
  
  let filePath = path.join(OUT_DIR, source);
  
  if (source.endsWith('/')) {
    filePath = path.join(filePath, 'index.html');
  } else {
    filePath += '.html';
  }

  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=${destination}">
<link rel="canonical" href="${destination}">
<title>Redirecting...</title>
</head>
<body>
<p>Redirecting to <a href="${destination}">${destination}</a>...</p>
<script>window.location.href="${destination}"</script>
</body>
</html>`;

  fs.writeFileSync(filePath, html);
  console.log(`Created redirect: ${source} -> ${destination}`);
}

function main() {
  if (!fs.existsSync(COMPENDIUM_DIR)) {
    console.log('Compendium directory not found:', COMPENDIUM_DIR);
    return;
  }

  console.log('Scanning for redirects in:', COMPENDIUM_DIR);
  const files = walk(COMPENDIUM_DIR);
  let count = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const { data } = matter(content);
      
      if (data.redirect_from && Array.isArray(data.redirect_from)) {
        // Determine destination slug for this file
        const rel = path.relative(COMPENDIUM_DIR, file);
        const slugParts = rel.replace(/\.md$/i, '').split(path.sep);
        // Assuming website structure mirrors Compendium structure
        const destination = '/' + slugParts.join('/');

        for (const source of data.redirect_from) {
          generateRedirect(source, destination);
          count++;
        }
      }
    } catch (e) {
      console.error(`Error parsing ${file}:`, e);
    }
  }
  console.log(`Generated ${count} redirects.`);
}

main();
