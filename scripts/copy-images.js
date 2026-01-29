#!/usr/bin/env node
/**
 * Copies article and index page images from the Compendium to public/ before the Next.js build.
 * This ensures images are available at the correct URL paths.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_COMPENDIUM = path.resolve(__dirname, '../../gitopedia/Compendium');
const COMPENDIUM_DIR = process.env.GITOPEDIA_DIR ? path.resolve(process.env.GITOPEDIA_DIR) : DEFAULT_COMPENDIUM;
const PUBLIC_DIR = path.resolve(__dirname, '../public');

// Walk and collect article markdown files (non-index.md)
function walkArticles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    if (e.name === '_incoming') continue;
    const cur = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkArticles(cur, list);
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.md') && e.name.toLowerCase() !== 'index.md') {
      list.push(cur);
    }
  }
  return list;
}

// Walk and collect index.md files for domain/category/topic pages
function walkIndexPages(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
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

function copyImages() {
  console.log(`Copying images from ${COMPENDIUM_DIR} to ${PUBLIC_DIR}`);
  
  if (!fs.existsSync(COMPENDIUM_DIR)) {
    console.log('Compendium directory not found, skipping image copy');
    return;
  }

  let copiedCount = 0;

  // Copy images for articles
  const articles = walkArticles(COMPENDIUM_DIR);
  for (const articlePath of articles) {
    // Get slug parts from the article path
    const rel = path.relative(COMPENDIUM_DIR, articlePath);
    const slugParts = rel.replace(/\.md$/i, '').split(path.sep);
    
    // Source: img/ directory in the same folder as the markdown
    const parentDir = path.dirname(articlePath);
    const imgSourceDir = path.join(parentDir, 'img');
    
    if (!fs.existsSync(imgSourceDir)) continue;
    
    // Destination: public/{article-url-path}/img/
    // The article URL is /science/physics/quantum-mechanics/pauli-exclusion-principle/
    // so relative img/ paths resolve to /science/physics/quantum-mechanics/pauli-exclusion-principle/img/
    const imgDestDir = path.join(PUBLIC_DIR, ...slugParts, 'img');
    
    fs.mkdirSync(imgDestDir, { recursive: true });
    
    const files = fs.readdirSync(imgSourceDir);
    for (const file of files) {
      const src = path.join(imgSourceDir, file);
      const dest = path.join(imgDestDir, file);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dest);
        copiedCount++;
      }
    }
  }
  
  // Copy images for index pages (domain/category/topic)
  const indexPages = walkIndexPages(COMPENDIUM_DIR);
  for (const indexPath of indexPages) {
    // Get slug parts from the index path (directory containing index.md)
    const rel = path.relative(COMPENDIUM_DIR, indexPath);
    const slugParts = path.dirname(rel).split(path.sep);
    
    // Source: img/ directory in the same folder as index.md
    const parentDir = path.dirname(indexPath);
    const imgSourceDir = path.join(parentDir, 'img');
    
    if (!fs.existsSync(imgSourceDir)) continue;
    
    // Destination: public/{index-url-path}/img/
    // The index URL is /science/ or /science/physics/
    // so relative img/ paths resolve to /science/img/ or /science/physics/img/
    const imgDestDir = path.join(PUBLIC_DIR, ...slugParts, 'img');
    
    fs.mkdirSync(imgDestDir, { recursive: true });
    
    const files = fs.readdirSync(imgSourceDir);
    for (const file of files) {
      const src = path.join(imgSourceDir, file);
      const dest = path.join(imgDestDir, file);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dest);
        copiedCount++;
      }
    }
  }
  
  console.log(`Copied ${copiedCount} image files`);
}

copyImages();
