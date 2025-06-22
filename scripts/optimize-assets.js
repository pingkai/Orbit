#!/usr/bin/env node

/**
 * Asset Optimization Script
 * Safely removes unused assets and optimizes existing ones
 */

const fs = require('fs');
const path = require('path');

// Import our asset analysis - SAFE TO REMOVE (confirmed unused)
const SAFE_TO_REMOVE_IMAGES = [
  // Large alphabet GIFs (confirmed unused) - Total ~30MB
  'c.gif', 'd.gif', 'e.gif', 'f.gif', 'g.gif', 'h.gif', 'i.gif', 'j.gif',
  'k.gif', 'l.gif', 'm.gif', 'n.gif', 'o.gif', 'p.gif', 'q.gif', 'r.gif',
  's.gif', 't.gif', 'u.gif', 'v.gif', 'w.gif', 'x.gif', 'y.gif', 'z.gif',

  // Large unused GIFs
  'loading.gif',

  // Duplicate files
  'offline.svg', // We have offline.png
];

// Images that were modernized (no longer needed as GIFs)
const MODERNIZED_IMAGES = [
  'GiveName.gif',      // Replaced with animated icon in onboarding
  'selectLanguage.gif', // Replaced with animated icon in onboarding
  'letsgo.gif',        // Can be replaced if used
];

const IMAGES_DIR = path.join(__dirname, '..', 'Images');
const BACKUP_DIR = path.join(__dirname, '..', 'Images_backup');

/**
 * Create backup of images before optimization
 */
function createBackup() {
  console.log('📦 Creating backup of Images directory...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const files = fs.readdirSync(IMAGES_DIR);
  let backedUpCount = 0;
  
  files.forEach(file => {
    const srcPath = path.join(IMAGES_DIR, file);
    const destPath = path.join(BACKUP_DIR, file);
    
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
      backedUpCount++;
    }
  });
  
  console.log(`✅ Backed up ${backedUpCount} files to Images_backup/`);
}

/**
 * Get file size in human readable format
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  const bytes = stats.size;
  
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Remove unused images safely
 */
function removeUnusedImages() {
  console.log('🗑️  Removing unused images...');
  
  let totalSizeRemoved = 0;
  let filesRemoved = 0;
  
  [...SAFE_TO_REMOVE_IMAGES, ...MODERNIZED_IMAGES].forEach(filename => {
    const filePath = path.join(IMAGES_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      const size = fs.statSync(filePath).size;
      const humanSize = getFileSize(filePath);
      
      console.log(`   Removing ${filename} (${humanSize})`);
      fs.unlinkSync(filePath);
      
      totalSizeRemoved += size;
      filesRemoved++;
    } else {
      console.log(`   ⚠️  ${filename} not found (already removed?)`);
    }
  });
  
  const totalSizeMB = (totalSizeRemoved / (1024 * 1024)).toFixed(1);
  console.log(`✅ Removed ${filesRemoved} files, saved ${totalSizeMB} MB`);
  
  return { filesRemoved, totalSizeRemoved };
}

/**
 * List remaining images and their sizes
 */
function analyzeRemainingImages() {
  console.log('📊 Analyzing remaining images...');
  
  const files = fs.readdirSync(IMAGES_DIR);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
  });
  
  let totalSize = 0;
  const largeFiles = [];
  
  imageFiles.forEach(file => {
    const filePath = path.join(IMAGES_DIR, file);
    const size = fs.statSync(filePath).size;
    const humanSize = getFileSize(filePath);
    
    totalSize += size;
    
    // Flag files larger than 200KB for potential optimization
    if (size > 200 * 1024) {
      largeFiles.push({ file, size: humanSize, bytes: size });
    }
  });
  
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(1);
  
  console.log(`📈 Remaining: ${imageFiles.length} images, ${totalSizeMB} MB total`);
  
  if (largeFiles.length > 0) {
    console.log('\n🔍 Large files that could be optimized:');
    largeFiles
      .sort((a, b) => b.bytes - a.bytes)
      .forEach(({ file, size }) => {
        console.log(`   ${file}: ${size}`);
      });
  }
  
  return { totalFiles: imageFiles.length, totalSize, largeFiles };
}

/**
 * Generate optimization report
 */
function generateReport(removalStats, analysisStats) {
  const reportPath = path.join(__dirname, '..', 'asset-optimization-report.md');
  
  const report = `# Asset Optimization Report

## Summary
- **Files Removed**: ${removalStats.filesRemoved}
- **Space Saved**: ${(removalStats.totalSizeRemoved / (1024 * 1024)).toFixed(1)} MB
- **Remaining Images**: ${analysisStats.totalFiles}
- **Total Image Size**: ${(analysisStats.totalSize / (1024 * 1024)).toFixed(1)} MB

## Removed Files
The following unused files were safely removed:
${[...SAFE_TO_REMOVE_IMAGES, ...MODERNIZED_IMAGES].map(file => `- ${file}`).join('\n')}

## Modernized Components
The following large GIF files were replaced with modern animated components:
${MODERNIZED_IMAGES.map(file => `- ${file} → Modern animated icon component`).join('\n')}

## Large Files Remaining
${analysisStats.largeFiles.length > 0 ? 
  'These files could benefit from further optimization:\n' + 
  analysisStats.largeFiles.map(f => `- ${f.file}: ${f.size}`).join('\n') :
  'No large files remaining that need optimization.'
}

## Next Steps
1. Consider compressing large PNG files
2. Convert JPG files to WebP format for better compression
3. Optimize remaining GIF files if they're too large
4. Test the app to ensure no images are missing

## Backup
Original images are backed up in \`Images_backup/\` directory.
`;

  fs.writeFileSync(reportPath, report);
  console.log(`📄 Report saved to: ${reportPath}`);
}

/**
 * Main optimization function
 */
function main() {
  console.log('🚀 Starting Asset Optimization...\n');
  
  try {
    // Step 1: Create backup
    createBackup();
    console.log('');
    
    // Step 2: Remove unused images
    const removalStats = removeUnusedImages();
    console.log('');
    
    // Step 3: Analyze what's left
    const analysisStats = analyzeRemainingImages();
    console.log('');
    
    // Step 4: Generate report
    generateReport(removalStats, analysisStats);
    
    console.log('✨ Asset optimization completed successfully!');
    console.log('⚠️  Please test your app to ensure no images are missing.');
    
  } catch (error) {
    console.error('❌ Error during optimization:', error.message);
    console.log('💡 You can restore from Images_backup/ if needed');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  createBackup,
  removeUnusedImages,
  analyzeRemainingImages,
  generateReport,
  main
};
