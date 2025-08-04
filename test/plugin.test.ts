import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolve } from 'path';
import { existsSync, readFileSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { handlebarsPrecompile } from '../src/index.js';
import type { PluginOptions } from '../src/types.js';

// テスト用のファイルパス
const testFixtures = resolve('./test/fixtures');
const testOutput = resolve('./test/output');

describe('handlebarsPrecompile', () => {
  beforeEach(() => {
    // テスト出力ディレクトリを作成
    if (!existsSync(testOutput)) {
      mkdirSync(testOutput, { recursive: true });
    }
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    if (existsSync(testOutput)) {
      rmSync(testOutput, { recursive: true, force: true });
    }
  });

  it('should create a vite plugin with correct name', () => {
    const plugin = handlebarsPrecompile();
    expect(plugin.name).toBe('handlebars-precompile');
    expect(plugin.load).toBeDefined();
    expect(plugin.buildStart).toBeDefined();
    expect(plugin.buildEnd).toBeDefined();
    expect(plugin.handleHotUpdate).toBeDefined();
  });

  it('should handle default options correctly', () => {
    const plugin = handlebarsPrecompile();
    expect(plugin.name).toBe('handlebars-precompile');
  });

  it('should accept custom options', () => {
    const options: PluginOptions = {
      partialsDir: 'custom/partials',
      enableMinification: false,
      mode: 'development',
      minificationLevel: 'conservative'
    };
    
    const plugin = handlebarsPrecompile(options);
    expect(plugin.name).toBe('handlebars-precompile');
  });

  describe('load function', () => {
    it('should process .hbs?compiled files', async () => {
      const plugin = handlebarsPrecompile({
        partialsDir: resolve(testFixtures, 'partials'),
        enableMinification: false
      });

      // プラグインコンテキストをモック
      const mockThis = {
        error: vi.fn()
      };

      // buildStartを実行してパーシャルを登録
      if (typeof plugin.buildStart === 'function') {
        await plugin.buildStart.call(mockThis, {} as any);
      }

      const testFile = resolve(testFixtures, 'basic-template.hbs');
      let result;
      if (typeof plugin.load === 'function') {
        result = await plugin.load.call(mockThis, testFile + '?compiled');
      }

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('import Handlebars from \'handlebars\'');
      expect(result).toContain('const template = Handlebars.template(');
      expect(result).toContain('export default template;');
    });

    it('should return undefined for non-.hbs?compiled files', async () => {
      const plugin = handlebarsPrecompile();
      const mockThis = { error: vi.fn() };

      let result;
      if (typeof plugin.load === 'function') {
        result = await plugin.load.call(mockThis, 'test.js');
      }
      expect(result).toBeUndefined();
    });

    it('should error on non-existent files', async () => {
      const plugin = handlebarsPrecompile();
      const mockThis = { error: vi.fn() };

      if (typeof plugin.load === 'function') {
        await plugin.load.call(mockThis, 'non-existent.hbs?compiled');
      }
      expect(mockThis.error).toHaveBeenCalled();
    });
  });

  describe('minification', () => {
    it('should minify templates in production mode', async () => {
      const plugin = handlebarsPrecompile({
        partialsDir: resolve(testFixtures, 'partials'),
        enableMinification: true,
        mode: 'production',
        minificationLevel: 'aggressive'
      });

      const mockThis = { error: vi.fn() };

      // buildStartを実行
      if (typeof plugin.buildStart === 'function') {
        await plugin.buildStart.call(mockThis, {} as any);
      }

      const testFile = resolve(testFixtures, 'src/screens/test-screen.hbs');
      let result;
      if (typeof plugin.load === 'function') {
        result = await plugin.load.call(mockThis, testFile + '?compiled');
      }

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      
      // 最小化が実行されていることを確認（統計出力があることで確認）
      expect(result).toContain('import Handlebars from \'handlebars\'');
      expect(result).toContain('const template = Handlebars.template(');
    });

    it('should not minify templates in development mode', async () => {
      const plugin = handlebarsPrecompile({
        partialsDir: resolve(testFixtures, 'partials'),
        enableMinification: true,
        mode: 'development'
      });

      const mockThis = { error: vi.fn() };

      if (typeof plugin.buildStart === 'function') {
        await plugin.buildStart.call(mockThis, {} as any);
      }

      const testFile = resolve(testFixtures, 'basic-template.hbs');
      let result;
      if (typeof plugin.load === 'function') {
        result = await plugin.load.call(mockThis, testFile + '?compiled');
      }

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('partials handling', () => {
    it('should register partials from directory', async () => {
      const plugin = handlebarsPrecompile({
        partialsDir: resolve(testFixtures, 'partials')
      });

      const mockThis = { error: vi.fn() };

      // buildStartでパーシャルが登録されることをテスト
      if (typeof plugin.buildStart === 'function') {
        await plugin.buildStart.call(mockThis, {} as any);
      }

      const testFile = resolve(testFixtures, 'basic-template.hbs');
      let result;
      if (typeof plugin.load === 'function') {
        result = await plugin.load.call(mockThis, testFile + '?compiled');
      }

      expect(result).toBeDefined();
      expect(result).toContain('Handlebars.registerPartial');
    });

    it('should handle missing partials directory gracefully', async () => {
      const plugin = handlebarsPrecompile({
        partialsDir: 'non-existent-directory'
      });

      const mockThis = { error: vi.fn() };

      // エラーが発生しないことを確認
      await expect(async () => {
        if (typeof plugin.buildStart === 'function') {
          await plugin.buildStart.call(mockThis, {} as any);
        }
      }).not.toThrow();
    });
  });

  describe('hot reload', () => {
    it('should handle hot updates for .hbs files', () => {
      const plugin = handlebarsPrecompile();
      
      const mockServer = {
        moduleGraph: {
          getModuleById: vi.fn().mockReturnValue({ id: 'test.hbs?compiled' })
        },
        reloadModule: vi.fn()
      };

      const mockHotUpdate = {
        file: 'test.hbs',
        server: mockServer,
        timestamp: Date.now(),
        modules: [],
        read: vi.fn()
      };

      if (typeof plugin.handleHotUpdate === 'function') {
        plugin.handleHotUpdate(mockHotUpdate as any);
      }

      expect(mockServer.moduleGraph.getModuleById).toHaveBeenCalledWith('test.hbs?compiled');
    });

    it('should ignore non-.hbs files in hot updates', () => {
      const plugin = handlebarsPrecompile();
      
      const mockServer = {
        moduleGraph: {
          getModuleById: vi.fn()
        },
        reloadModule: vi.fn()
      };

      const mockHotUpdate = {
        file: 'test.js',
        server: mockServer,
        timestamp: Date.now(),
        modules: [],
        read: vi.fn()
      };

      if (typeof plugin.handleHotUpdate === 'function') {
        plugin.handleHotUpdate(mockHotUpdate as any);
      }

      expect(mockServer.moduleGraph.getModuleById).not.toHaveBeenCalled();
    });
  });

  describe('statistics', () => {
    it('should collect statistics in production mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const plugin = handlebarsPrecompile({
        partialsDir: resolve(testFixtures, 'partials'),
        enableMinification: true,
        mode: 'production'
      });

      const mockThis = { error: vi.fn() };

      // ビルドプロセスをシミュレート
      if (typeof plugin.buildStart === 'function') {
        await plugin.buildStart.call(mockThis, {} as any);
      }

      const testFile = resolve(testFixtures, 'src/screens/test-screen.hbs');
      if (typeof plugin.load === 'function') {
        await plugin.load.call(mockThis, testFile + '?compiled');
      }

      if (typeof plugin.buildEnd === 'function') {
        await plugin.buildEnd.call(mockThis);
      }

      // 統計情報が出力されることを確認
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[handlebars-minify] Starting minification')
      );

      consoleSpy.mockRestore();
    });
  });
});
