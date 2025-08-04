import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  createMinificationStats, 
  updateFileStats, 
  exportStatistics, 
  printStatisticsReport 
} from '../src/utils/statistics.js';
import type { FileDetail } from '../src/types.js';

describe('statistics utils', () => {
  describe('createMinificationStats', () => {
    it('should create initial stats object', () => {
      const stats = createMinificationStats();
      
      expect(stats.totalFiles).toBe(0);
      expect(stats.totalOriginalSize).toBe(0);
      expect(stats.totalMinifiedSize).toBe(0);
      expect(stats.errors).toEqual([]);
      expect(stats.warnings).toEqual([]);
      expect(stats.fileDetails).toEqual([]);
      expect(stats.startTime).toBeNull();
      expect(stats.endTime).toBeNull();
      
      // カテゴリが初期化されていることを確認
      expect(stats.categories.screens).toBeDefined();
      expect(stats.categories.components).toBeDefined();
      expect(stats.categories.layout).toBeDefined();
      expect(stats.categories['error-pages']).toBeDefined();
      
      // パフォーマンスメトリクスが初期化されていることを確認
      expect(stats.performanceMetrics.largestFile).toBeDefined();
      expect(stats.performanceMetrics.smallestFile).toBeDefined();
      expect(stats.performanceMetrics.bestReduction).toBeDefined();
      expect(stats.performanceMetrics.worstReduction).toBeDefined();
    });
  });

  describe('updateFileStats', () => {
    it('should update stats with file details', () => {
      const stats = createMinificationStats();
      const fileDetail: FileDetail = {
        name: 'test.hbs',
        category: 'screens',
        originalSize: 1000,
        minifiedSize: 800,
        reduction: 20,
        minificationLevel: 'aggressive',
        timestamp: new Date().toISOString()
      };

      updateFileStats(stats, fileDetail);

      expect(stats.totalFiles).toBe(1);
      expect(stats.totalOriginalSize).toBe(1000);
      expect(stats.totalMinifiedSize).toBe(800);
      expect(stats.fileDetails).toHaveLength(1);
      expect(stats.fileDetails[0]).toEqual(fileDetail);
      
      // カテゴリ別統計が更新されていることを確認
      expect(stats.categories.screens.files).toBe(1);
      expect(stats.categories.screens.originalSize).toBe(1000);
      expect(stats.categories.screens.minifiedSize).toBe(800);
      
      // パフォーマンスメトリクスが更新されていることを確認
      expect(stats.performanceMetrics.largestFile.name).toBe('test.hbs');
      expect(stats.performanceMetrics.smallestFile.name).toBe('test.hbs');
      expect(stats.performanceMetrics.bestReduction.name).toBe('test.hbs');
      expect(stats.performanceMetrics.worstReduction.name).toBe('test.hbs');
    });

    it('should track largest and smallest files', () => {
      const stats = createMinificationStats();
      
      const smallFile: FileDetail = {
        name: 'small.hbs',
        category: 'components',
        originalSize: 100,
        minifiedSize: 80,
        reduction: 20,
        minificationLevel: 'conservative',
        timestamp: new Date().toISOString()
      };

      const largeFile: FileDetail = {
        name: 'large.hbs',
        category: 'screens',
        originalSize: 2000,
        minifiedSize: 1500,
        reduction: 25,
        minificationLevel: 'aggressive',
        timestamp: new Date().toISOString()
      };

      updateFileStats(stats, smallFile);
      updateFileStats(stats, largeFile);

      expect(stats.performanceMetrics.largestFile.name).toBe('large.hbs');
      expect(stats.performanceMetrics.smallestFile.name).toBe('small.hbs');
      expect(stats.performanceMetrics.bestReduction.name).toBe('large.hbs');
    });
  });

  describe('printStatisticsReport', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should print comprehensive statistics report', () => {
      const stats = createMinificationStats();
      stats.startTime = Date.now() - 1000;
      stats.endTime = Date.now();
      
      const fileDetail: FileDetail = {
        name: 'test.hbs',
        category: 'screens',
        originalSize: 1000,
        minifiedSize: 800,
        reduction: 20,
        minificationLevel: 'aggressive',
        timestamp: new Date().toISOString()
      };

      updateFileStats(stats, fileDetail);
      printStatisticsReport(stats);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[handlebars-minify] Comprehensive Build Statistics')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Files processed: 1')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Category Breakdown')
      );
    });

    it('should not print anything for empty stats', () => {
      const stats = createMinificationStats();
      printStatisticsReport(stats);

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('exportStatistics', () => {
    it('should export statistics to JSON file', () => {
      const stats = createMinificationStats();
      stats.startTime = Date.now() - 1000;
      stats.endTime = Date.now();
      
      const fileDetail: FileDetail = {
        name: 'test.hbs',
        category: 'screens',
        originalSize: 1000,
        minifiedSize: 800,
        reduction: 20,
        minificationLevel: 'aggressive',
        timestamp: new Date().toISOString()
      };

      updateFileStats(stats, fileDetail);

      // ファイル出力をモック
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      expect(() => {
        exportStatistics(stats, 'aggressive');
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});
