#!/usr/bin/env node
/**
 * Converts PNG images in the Compendium to AVIF format.
 * Creates two versions:
 * - Full size: <filename>.avif
 * - Medium (50%): <filename>-medium.avif
 * Removes the original PNG after successful conversion.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DEFAULT_COMPENDIUM = path.resolve(__dirname, '../../gitopedia/Compendium');
const COMPENDIUM_DIR = process.env.GITOPEDIA_DIR ? path.resolve(process.env.GITOPEDIA_DIR) : DEFAULT_COMPENDIUM;

// Walk and collect all PNG files
function walkPngFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    if (e.name === '_incoming') continue;
    if (e.name === '_debug') continue;
    const cur = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkPngFiles(cur, list);
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.png')) {
      list.push(cur);
    }
  }
  return list;
}

async function convertImage(pngPath) {
  const dir = path.dirname(pngPath);
  const basename = path.basename(pngPath, '.png');
  
  const fullAvifPath = path.join(dir, `${basename}.avif`);
  const mediumAvifPath = path.join(dir, `${basename}-medium.avif`);
  
  try {
    // Get image metadata for dimensions
    const metadata = await sharp(pngPath).metadata();
    const { width, height } = metadata;
    
    // Convert to full-size AVIF
    await sharp(pngPath)
      .avif({ quality: 80 })
      .toFile(fullAvifPath);
    
    // Convert to medium (50%) AVIF
    const mediumWidth = Math.round(width / 2);
    const mediumHeight = Math.round(height / 2);
    
    await sharp(pngPath)
      .resize(mediumWidth, mediumHeight)
      .avif({ quality: 80 })
      .toFile(mediumAvifPath);
    
    // Remove original PNG
    fs.unlinkSync(pngPath);
    
    const rel = path.relative(COMPENDIUM_DIR, pngPath);
    console.log(`✓ ${rel} → ${basename}.avif (${width}x${height}) + ${basename}-medium.avif (${mediumWidth}x${mediumHeight})`);
    
    return true;
  } catch (error) {
    console.error(`✗ Failed to convert ${pngPath}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`Converting PNG images in ${COMPENDIUM_DIR} to AVIF format...\n`);
  
  if (!fs.existsSync(COMPENDIUM_DIR)) {
    console.log('Compendium directory not found');
    process.exit(1);
  }

  const pngFiles = walkPngFiles(COMPENDIUM_DIR);
  
  if (pngFiles.length === 0) {
    console.log('No PNG files found to convert.');
    return;
  }
  
  console.log(`Found ${pngFiles.length} PNG file(s) to convert.\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const pngPath of pngFiles) {
    const success = await convertImage(pngPath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log(`\nConversion complete: ${successCount} succeeded, ${failCount} failed`);
}

main().catch(console.error);
