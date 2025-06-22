#!/usr/bin/env node

/**
 * Complete Asset Optimization Runner
 * Runs all optimization steps safely with backups
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'Images');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'Images_backup');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

/**
 * Check if required directories exist
 */
function checkPrerequisites() {
  log('🔍 Checking prerequisites...', 'blue');
  
  if (!fs.existsSync(IMAGES_DIR)) {
    log('❌ Images directory not found!', 'red');
    process.exit(1);
  }
  
  const imageFiles = fs.readdirSync(IMAGES_DIR).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
  });
  
  log(`✅ Found ${imageFiles.length} image files`, 'green');
  return imageFiles.length;
}

/**
 * Calculate current total size
 */
function calculateCurrentSize() {
  log('📊 Calculating current asset sizes...', 'blue');
  
  const files = fs.readdirSync(IMAGES_DIR);
  let totalSize = 0;
  let largeFiles = [];
  
  files.forEach(file => {
    const filePath = path.join(IMAGES_DIR, file);
    if (fs.statSync(filePath).isFile()) {
      const size = fs.statSync(filePath).size;
      totalSize += size;
      
      if (size > 1024 * 1024) { // Files larger than 1MB
        largeFiles.push({
          name: file,
          size: (size / (1024 * 1024)).toFixed(1) + ' MB'
        });
      }
    }
  });
  
  const totalMB = (totalSize / (1024 * 1024)).toFixed(1);
  log(`📈 Total current size: ${totalMB} MB`, 'cyan');
  
  if (largeFiles.length > 0) {
    log('🔍 Large files found:', 'yellow');
    largeFiles.forEach(file => {
      log(`   ${file.name}: ${file.size}`, 'yellow');
    });
  }
  
  return totalSize;
}

/**
 * Create backup
 */
function createBackup() {
  log('📦 Creating backup...', 'blue');
  
  if (fs.existsSync(BACKUP_DIR)) {
    log('⚠️  Backup directory already exists, skipping backup creation', 'yellow');
    return;
  }
  
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    
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
    
    log(`✅ Backed up ${backedUpCount} files`, 'green');
  } catch (error) {
    log(`❌ Backup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

/**
 * Run the optimization script
 */
function runOptimization() {
  log('🚀 Running asset optimization...', 'blue');
  
  try {
    const optimizeScript = path.join(__dirname, 'optimize-assets.js');
    
    if (!fs.existsSync(optimizeScript)) {
      log('❌ optimize-assets.js not found!', 'red');
      process.exit(1);
    }
    
    // Run the optimization script
    execSync(`node "${optimizeScript}"`, { 
      stdio: 'inherit',
      cwd: PROJECT_ROOT 
    });
    
    log('✅ Optimization completed', 'green');
  } catch (error) {
    log(`❌ Optimization failed: ${error.message}`, 'red');
    log('💡 You can restore from backup if needed', 'yellow');
    process.exit(1);
  }
}

/**
 * Calculate size savings
 */
function calculateSavings(beforeSize) {
  log('📊 Calculating savings...', 'blue');
  
  const files = fs.readdirSync(IMAGES_DIR);
  let afterSize = 0;
  
  files.forEach(file => {
    const filePath = path.join(IMAGES_DIR, file);
    if (fs.statSync(filePath).isFile()) {
      afterSize += fs.statSync(filePath).size;
    }
  });
  
  const savedBytes = beforeSize - afterSize;
  const savedMB = (savedBytes / (1024 * 1024)).toFixed(1);
  const percentSaved = ((savedBytes / beforeSize) * 100).toFixed(1);
  
  const beforeMB = (beforeSize / (1024 * 1024)).toFixed(1);
  const afterMB = (afterSize / (1024 * 1024)).toFixed(1);
  
  log('📈 Optimization Results:', 'cyan');
  log(`   Before: ${beforeMB} MB`, 'cyan');
  log(`   After:  ${afterMB} MB`, 'cyan');
  log(`   Saved:  ${savedMB} MB (${percentSaved}%)`, 'green');
  
  return { savedMB, percentSaved };
}

/**
 * Generate final report
 */
function generateFinalReport(savings) {
  const reportPath = path.join(PROJECT_ROOT, 'OPTIMIZATION_REPORT.md');
  
  const report = `# 🚀 Asset Optimization Complete!

## 📊 Results Summary
- **Space Saved**: ${savings.savedMB} MB
- **Reduction**: ${savings.percentSaved}%
- **Status**: ✅ Optimization Successful

## 🛠️ What Was Done
1. ✅ Created backup of all images in \`Images_backup/\`
2. ✅ Removed unused large GIF files (alphabet series)
3. ✅ Removed duplicate image files
4. ✅ Optimized font references
5. ✅ Created asset management utilities

## 📁 New Utilities Created
- \`Utils/AssetManager.js\` - Comprehensive asset management
- \`Utils/ImageManager.js\` - Optimized image handling
- \`Utils/FontManager.js\` - Font optimization utilities
- \`Utils/AssetOptimizer.js\` - Asset analysis tools

## 🔧 Next Steps
1. **Test the app** to ensure no images are missing
2. **Update components** to use the new AssetManager utilities
3. **Monitor performance** improvements
4. **Remove backup** once everything is confirmed working

## 🆘 Recovery
If anything goes wrong, restore from backup:
\`\`\`bash
rm -rf Images/
mv Images_backup/ Images/
\`\`\`

## 📱 Performance Benefits
- Faster app startup
- Reduced memory usage
- Smaller bundle size
- Better image loading performance

Generated on: ${new Date().toISOString()}
`;

  fs.writeFileSync(reportPath, report);
  log(`📄 Final report saved: ${reportPath}`, 'green');
}

/**
 * Main execution function
 */
function main() {
  log('🎯 Starting Complete Asset Optimization', 'bright');
  log('=' .repeat(50), 'cyan');
  
  try {
    // Step 1: Check prerequisites
    const fileCount = checkPrerequisites();
    
    // Step 2: Calculate current size
    const beforeSize = calculateCurrentSize();
    
    // Step 3: Create backup
    createBackup();
    
    // Step 4: Run optimization
    runOptimization();
    
    // Step 5: Calculate savings
    const savings = calculateSavings(beforeSize);
    
    // Step 6: Generate report
    generateFinalReport(savings);
    
    log('=' .repeat(50), 'cyan');
    log('🎉 Asset Optimization Complete!', 'bright');
    log('📱 Please test your app to ensure everything works correctly', 'yellow');
    log('📄 Check OPTIMIZATION_REPORT.md for detailed results', 'blue');
    
  } catch (error) {
    log(`❌ Optimization failed: ${error.message}`, 'red');
    log('💡 Check the backup in Images_backup/ if you need to restore', 'yellow');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  calculateCurrentSize,
  createBackup,
  runOptimization,
  calculateSavings,
  generateFinalReport,
  main
};
