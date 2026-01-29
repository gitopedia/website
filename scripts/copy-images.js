#!/usr/bin/env node
/**
 * Copies article and index page images from the Compendium to public/ before the Next.js build.
 * This ensures images are available at the correct URL paths.
 * Handles AVIF format images (including -medium variants).
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_COMPENDIUM = path.resolve(__dirname, '../../gitopedia/Compendium');
const COMPENDIUM_DIR = process.env.GITOPEDIA_DIR ? path.resolve(process.env.GITOPEDIA_DIR) : DEFAULT_COMPENDIUM;
const PUBLIC_DIR = path.resolve(__dirname, '../public');

// Supported image extensions
const IMAGE_EXTENSIONS = ['.avif', '.png', '.jpg', '.jpeg', '.gif', '.webp'];

function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

// Walk and collect article markdown files (non-index.md)
function walkArticles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    if (e.name === '_incoming') continue;
    if (e.name === '_debug') continue;
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
    if (e.name === '_debug') continue;
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

function copyImagesFromDir(imgSourceDir, imgDestDir) {
  let count = 0;
  if (!fs.existsSync(imgSourceDir)) return count;
  
  fs.mkdirSync(imgDestDir, { recursive: true });
  
  const files = fs.readdirSync(imgSourceDir);
  for (const file of files) {
    if (!isImageFile(file)) continue;
    const src = path.join(imgSourceDir, file);
    const dest = path.join(imgDestDir, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
      count++;
    }
  }
  return count;
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
    
    // Destination: public/{article-url-path}/img/
    const imgDestDir = path.join(PUBLIC_DIR, ...slugParts, 'img');
    
    copiedCount += copyImagesFromDir(imgSourceDir, imgDestDir);
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
    
    // Destination: public/{index-url-path}/img/
    const imgDestDir = path.join(PUBLIC_DIR, ...slugParts, 'img');
    
    copiedCount += copyImagesFromDir(imgSourceDir, imgDestDir);
  }
  
  console.log(`Copied ${copiedCount} image files`);
}

copyImages();
