import { writeFileSync } from 'fs';
import type { MinificationStats, FileDetail } from '../types';

/**
 * JSON export of statistics data
 */
export function exportStatistics(stats: MinificationStats, minificationLevel: string): void {
  const statsOutput = {
    timestamp: new Date().toISOString(),
    summary: {
      filesProcessed: stats.totalFiles,
      originalSize: stats.totalOriginalSize,
      minifiedSize: stats.totalMinifiedSize,
      totalReduction: ((stats.totalOriginalSize - stats.totalMinifiedSize) / stats.totalOriginalSize * 100).toFixed(2),
      buildTime: (stats.endTime || Date.now()) - (stats.startTime || Date.now()),
      minificationLevel: minificationLevel
    },
    categories: Object.fromEntries(
      Object.entries(stats.categories).map(([category, categoryStats]) => [
        category,
        {
          ...categoryStats,
          reduction: categoryStats.originalSize > 0 
            ? ((categoryStats.originalSize - categoryStats.minifiedSize) / categoryStats.originalSize * 100).toFixed(2)
            : 0,
          bytesSaved: categoryStats.originalSize - categoryStats.minifiedSize
        }
      ])
    ),
    performance: stats.performanceMetrics,
    files: stats.fileDetails,
    errors: stats.errors,
    warnings: stats.warnings
  };
  
  const outputPath = 'dist/minification-stats.json';
  
  try {
    writeFileSync(outputPath, JSON.stringify(statsOutput, null, 2));
    console.log(`📊 Detailed statistics exported to: ${outputPath}`);
  } catch (error) {
    console.warn(`[handlebars-minify] Failed to export statistics: ${(error as Error).message}`);
  }
}

/**
 * Initialize statistics data
 */
export function createMinificationStats(): MinificationStats {
  return {
    totalFiles: 0,
    totalOriginalSize: 0,
    totalMinifiedSize: 0,
    errors: [],
    warnings: [],
    startTime: null,
    endTime: null,
    fileDetails: [],
    categories: {
      screens: { files: 0, originalSize: 0, minifiedSize: 0, reduction: 0 },
      components: { files: 0, originalSize: 0, minifiedSize: 0, reduction: 0 },
      layout: { files: 0, originalSize: 0, minifiedSize: 0, reduction: 0 },
      'error-pages': { files: 0, originalSize: 0, minifiedSize: 0, reduction: 0 }
    },
    performanceMetrics: {
      largestFile: { name: '', originalSize: 0, minifiedSize: 0, reduction: 0, category: '', minificationLevel: '', timestamp: '' },
      smallestFile: { name: '', originalSize: Infinity, minifiedSize: 0, reduction: 0, category: '', minificationLevel: '', timestamp: '' },
      bestReduction: { name: '', originalSize: 0, minifiedSize: 0, reduction: 0, category: '', minificationLevel: '', timestamp: '' },
      worstReduction: { name: '', originalSize: 0, minifiedSize: 0, reduction: 100, category: '', minificationLevel: '', timestamp: '' }
    }
  };
}

/**
 * Add file detail information to statistics
 */
export function updateFileStats(
  stats: MinificationStats,
  fileDetail: FileDetail
): void {
  stats.totalFiles++;
  stats.totalOriginalSize += fileDetail.originalSize;
  stats.totalMinifiedSize += fileDetail.minifiedSize;
  stats.fileDetails.push(fileDetail);
  
  // Update category-specific statistics
  if (stats.categories[fileDetail.category]) {
    stats.categories[fileDetail.category].files++;
    stats.categories[fileDetail.category].originalSize += fileDetail.originalSize;
    stats.categories[fileDetail.category].minifiedSize += fileDetail.minifiedSize;
  }
  
  // Update performance metrics
  const metrics = stats.performanceMetrics;
  
  // Track largest and smallest file sizes
  if (fileDetail.originalSize > metrics.largestFile.originalSize) {
    metrics.largestFile = { ...fileDetail };
  }
  if (fileDetail.originalSize < metrics.smallestFile.originalSize) {
    metrics.smallestFile = { ...fileDetail };
  }
  
  // Track best and worst compression ratios
  if (fileDetail.reduction > metrics.bestReduction.reduction) {
    metrics.bestReduction = { ...fileDetail };
  }
  if (fileDetail.reduction < metrics.worstReduction.reduction) {
    metrics.worstReduction = { ...fileDetail };
  }
}

/**
 * Output statistics report
 */
export function printStatisticsReport(stats: MinificationStats): void {
  if (stats.totalFiles === 0) return;
  
  const totalReduction = ((stats.totalOriginalSize - stats.totalMinifiedSize) / stats.totalOriginalSize * 100).toFixed(2);
  const buildTime = (stats.endTime || Date.now()) - (stats.startTime || Date.now());
  const metrics = stats.performanceMetrics;
  
  console.log('\n📊 [handlebars-minify] Comprehensive Build Statistics:');
  console.log('═'.repeat(60));
  
  // Basic statistics
  console.log('📈 Overall Performance:');
  console.log(`   Files processed: ${stats.totalFiles}`);
  console.log(`   Original size: ${stats.totalOriginalSize.toLocaleString()} bytes`);
  console.log(`   Minified size: ${stats.totalMinifiedSize.toLocaleString()} bytes`);
  console.log(`   Total reduction: ${totalReduction}% (${(stats.totalOriginalSize - stats.totalMinifiedSize).toLocaleString()} bytes saved)`);
  console.log(`   Processing time: ${buildTime}ms`);
  
  // カテゴリ別統計
  // Category-specific statistics
  console.log('\n📊 Category Breakdown:');
  Object.entries(stats.categories).forEach(([category, categoryStats]) => {
    if (categoryStats.files > 0) {
      const categoryReduction = ((categoryStats.originalSize - categoryStats.minifiedSize) / categoryStats.originalSize * 100).toFixed(1);
      const bytesSaved = categoryStats.originalSize - categoryStats.minifiedSize;
      console.log(`   ${category}: ${categoryStats.files} files, ${categoryReduction}% reduction (${bytesSaved.toLocaleString()} bytes saved)`);
    }
  });
  
  // Performance highlights
  if (stats.fileDetails.length > 0) {
    console.log('\n🏆 Performance Highlights:');
    
    if (metrics.largestFile.name) {
      console.log(`   Largest file: ${metrics.largestFile.name} (${metrics.largestFile.originalSize.toLocaleString()} bytes, ${metrics.largestFile.reduction}% reduction)`);
    }
    
    if (metrics.bestReduction.name && metrics.bestReduction.reduction > 0) {
      console.log(`   Best compression: ${metrics.bestReduction.name} (${metrics.bestReduction.reduction}% reduction)`);
    }
    
    if (metrics.worstReduction.name && metrics.worstReduction.reduction < 100) {
      console.log(`   Lowest compression: ${metrics.worstReduction.name} (${metrics.worstReduction.reduction}% reduction)`);
    }
    
    // Calculate averages
    const avgReduction = (stats.fileDetails.reduce((sum, file) => sum + file.reduction, 0) / stats.fileDetails.length).toFixed(1);
    const avgFileSize = Math.round(stats.totalOriginalSize / stats.totalFiles);
    console.log(`   Average reduction: ${avgReduction}%`);
    console.log(`   Average file size: ${avgFileSize.toLocaleString()} bytes`);
  }
  
  // Error and warning report
  if (stats.errors.length > 0 || stats.warnings.length > 0) {
    console.log('\n⚠️  Issues Summary:');
    if (stats.errors.length > 0) {
      console.log(`   Errors: ${stats.errors.length} files failed to minify`);
      stats.errors.forEach(error => {
        console.log(`     • ${error.file}: ${error.error}`);
      });
    }
    if (stats.warnings.length > 0) {
      console.log(`   Warnings: ${stats.warnings.length} issues`);
    }
  }
  
  // Detailed file report (optional)
  if (process.env.VITE_MINIFY_DETAILED_LOG === 'true') {
    console.log('\n📄 Detailed File Report:');
    stats.fileDetails
      .sort((a, b) => b.reduction - a.reduction)
      .forEach(file => {
        console.log(`   [${file.category}] ${file.name}: ${file.originalSize} → ${file.minifiedSize} bytes (${file.reduction}%, ${file.minificationLevel})`);
      });
  }
  
  console.log('═'.repeat(60));
  console.log(`✅ Minification completed successfully in ${buildTime}ms\n`);
}
