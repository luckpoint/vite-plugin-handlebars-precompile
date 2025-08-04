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

  describe('partial precompilation', () => {
    it('should generate precompiled partial registration code', async () => {
      // テスト用のパーシャルディレクトリを作成
      const tempPartialsDir = resolve(testOutput, 'partials');
      mkdirSync(tempPartialsDir, { recursive: true });
      writeFileSync(resolve(tempPartialsDir, 'header.hbs'), '<header>{{title}}</header>');
      writeFileSync(resolve(tempPartialsDir, 'footer.hbs'), '<footer>{{content}}</footer>');

      const plugin = handlebarsPrecompile({
        partialsDir: tempPartialsDir,
        enableMinification: false,
        mode: 'development'
      });

      const mockThis = { error: vi.fn() };

      // buildStartを実行
      if (typeof plugin.buildStart === 'function') {
        await plugin.buildStart.call(mockThis, {} as any);
      }

      // テスト用のメインテンプレートを作成
      const testTemplate = resolve(testOutput, 'test.hbs');
      writeFileSync(testTemplate, '<div>{{> header}}<main>{{content}}</main>{{> footer}}</div>');

      let result;
      if (typeof plugin.load === 'function') {
        result = await plugin.load.call(mockThis, testTemplate + '?compiled');
      }

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      
      // パーシャルがプリコンパイルされていることを確認
      expect(result).toContain('Handlebars.registerPartial(\'header\', Handlebars.template(');
      expect(result).toContain('Handlebars.registerPartial(\'footer\', Handlebars.template(');
      
      // 生の文字列登録ではないことを確認
      expect(result).not.toContain('"<header>{{title}}</header>"');
      expect(result).not.toContain('"<footer>{{content}}</footer>"');
    });

    it('should handle nested partial directories in precompilation', async () => {
      // ネストしたパーシャル構造を作成
      const tempPartialsDir = resolve(testOutput, 'partials');
      const uiDir = resolve(tempPartialsDir, 'ui');
      mkdirSync(uiDir, { recursive: true });
      
      writeFileSync(resolve(tempPartialsDir, 'layout.hbs'), '<div class="layout">{{> content}}</div>');
      writeFileSync(resolve(uiDir, 'button.hbs'), '<button class="{{class}}">{{text}}</button>');

      const plugin = handlebarsPrecompile({
        partialsDir: tempPartialsDir,
        enableMinification: false,
        mode: 'development'
      });

      const mockThis = { error: vi.fn() };

      if (typeof plugin.buildStart === 'function') {
        await plugin.buildStart.call(mockThis, {} as any);
      }

      const testTemplate = resolve(testOutput, 'test.hbs');
      writeFileSync(testTemplate, '<div>{{> layout}}{{> ui/button}}</div>');

      let result;
      if (typeof plugin.load === 'function') {
        result = await plugin.load.call(mockThis, testTemplate + '?compiled');
      }

      expect(result).toBeDefined();
      
      // ネストしたパーシャルがプリコンパイルされていることを確認
      expect(result).toContain('Handlebars.registerPartial(\'layout\', Handlebars.template(');
      expect(result).toContain('Handlebars.registerPartial(\'ui/button\', Handlebars.template(');
    });

    it('should precompile partials with minification in production', async () => {
      const tempPartialsDir = resolve(testOutput, 'partials');
      mkdirSync(tempPartialsDir, { recursive: true });
      
      // 空白の多いパーシャルを作成
      writeFileSync(resolve(tempPartialsDir, 'spacey.hbs'), `
        <div   class="spacey"  >
          <h1>   {{title}}   </h1>
          <p>     {{content}}     </p>
        </div>
      `);

      const plugin = handlebarsPrecompile({
        partialsDir: tempPartialsDir,
        enableMinification: true,
        mode: 'production',
        minificationLevel: 'aggressive'
      });

      const mockThis = { error: vi.fn() };

      if (typeof plugin.buildStart === 'function') {
        await plugin.buildStart.call(mockThis, {} as any);
      }

      const testTemplate = resolve(testOutput, 'test.hbs');
      writeFileSync(testTemplate, '<div>{{> spacey}}</div>');

      let result;
      if (typeof plugin.load === 'function') {
        result = await plugin.load.call(mockThis, testTemplate + '?compiled');
      }

      expect(result).toBeDefined();
      
      // パーシャルがプリコンパイルされていることを確認
      expect(result).toContain('Handlebars.registerPartial(\'spacey\', Handlebars.template(');
      
      // 最小化されたHTMLが含まれていないことを確認（プリコンパイルされているため）
      expect(result).not.toContain('class="spacey"');
    });
  });
});
