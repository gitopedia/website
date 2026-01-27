#!/usr/bin/env node
/**
 * Copies article images from the Compendium to public/ before the Next.js build.
 * This ensures images are available at the correct URL paths.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_COMPENDIUM = path.resolve(__dirname, '../../gitopedia/Compendium');
const COMPENDIUM_DIR = process.env.GITOPEDIA_DIR ? path.resolve(process.env.GITOPEDIA_DIR) : DEFAULT_COMPENDIUM;
const PUBLIC_DIR = path.resolve(__dirname, '../public');

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

function copyImages() {
  console.log(`Copying images from ${COMPENDIUM_DIR} to ${PUBLIC_DIR}`);
  
  if (!fs.existsSync(COMPENDIUM_DIR)) {
    console.log('Compendium directory not found, skipping image copy');
    return;
  }

  const articles = walk(COMPENDIUM_DIR);
  let copiedCount = 0;

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
  
  console.log(`Copied ${copiedCount} image files`);
}

copyImages();
