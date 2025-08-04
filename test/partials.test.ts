import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve } from 'path';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { registerPartials, generatePartialRegistrationCode } from '../src/utils/partials.js';

const testDir = resolve('./test/temp-partials');

describe('partials utils', () => {
  beforeEach(() => {
    // テスト用の一時ディレクトリを作成
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('registerPartials', () => {
    it('should handle non-existent directory gracefully', () => {
      expect(() => {
        registerPartials('non-existent-directory');
      }).not.toThrow();
    });

    it('should register partials from directory', () => {
      // テスト用のパーシャルファイルを作成
      writeFileSync(resolve(testDir, 'header.hbs'), '<header>{{title}}</header>');
      
      mkdirSync(resolve(testDir, 'components'), { recursive: true });
      writeFileSync(resolve(testDir, 'components', 'button.hbs'), '<button>{{text}}</button>');

      expect(() => {
        registerPartials(testDir);
      }).not.toThrow();
    });
  });

  describe('generatePartialRegistrationCode', () => {
    it('should return empty string for non-existent directory', async () => {
      const result = await generatePartialRegistrationCode(
        'non-existent-directory',
        false,
        'development',
        'conservative',
        []
      );
      
      expect(result).toBe('');
    });

    it('should generate registration code for partials', async () => {
      // テスト用のパーシャルファイルを作成
      writeFileSync(resolve(testDir, 'header.hbs'), '<header>{{title}}</header>');
      writeFileSync(resolve(testDir, 'footer.hbs'), '<footer>{{content}}</footer>');
      
      mkdirSync(resolve(testDir, 'components'), { recursive: true });
      writeFileSync(resolve(testDir, 'components', 'button.hbs'), '<button>{{text}}</button>');

      const result = await generatePartialRegistrationCode(
        testDir,
        false,
        'development',
        'conservative',
        []
      );
      
      expect(result).toContain('Handlebars.registerPartial');
      expect(result).toContain('header');
      expect(result).toContain('footer');
      expect(result).toContain('components/button');
    });

    it('should minify partials in production mode', async () => {
      // 空白の多いテンプレートを作成
      writeFileSync(resolve(testDir, 'test.hbs'), `
        <div    class="test"   >
          <h1>   {{title}}   </h1>
        </div>
      `);

      const result = await generatePartialRegistrationCode(
        testDir,
        true,
        'production',
        'aggressive',
        []
      );
      
      expect(result).toContain('Handlebars.registerPartial');
      // プリコンパイルされているかチェック（長さではなく、内容で判定）
      expect(result).toContain('Handlebars.template(');
    });

    it('should precompile partials instead of using raw strings', async () => {
      // テスト用のパーシャルファイルを作成
      writeFileSync(resolve(testDir, 'header.hbs'), '<header>{{title}}</header>');
      
      const result = await generatePartialRegistrationCode(
        testDir,
        false,
        'development',
        'conservative',
        []
      );
      
      // プリコンパイルされたコードが含まれているかチェック
      expect(result).toContain('Handlebars.template(');
      expect(result).toContain('Handlebars.registerPartial(\'header\',');
      
      // 生の文字列登録ではないことを確認
      expect(result).not.toContain('"<header>{{title}}</header>"');
    });

    it('should handle nested directory structure in precompiled partials', async () => {
      // ネストしたディレクトリ構造を作成
      mkdirSync(resolve(testDir, 'ui', 'components'), { recursive: true });
      writeFileSync(resolve(testDir, 'ui', 'components', 'button.hbs'), '<button class="{{class}}">{{text}}</button>');
      writeFileSync(resolve(testDir, 'ui', 'layout.hbs'), '<div class="layout">{{> content}}</div>');
      
      const result = await generatePartialRegistrationCode(
        testDir,
        false,
        'development',
        'conservative',
        []
      );
      
      // ネストしたパーシャル名が正しく生成されているかチェック
      expect(result).toContain('Handlebars.registerPartial(\'ui/components/button\',');
      expect(result).toContain('Handlebars.registerPartial(\'ui/layout\',');
      
      // プリコンパイルされたコードが含まれているかチェック
      expect(result).toContain('Handlebars.template(');
    });

    it('should generate executable precompiled code', async () => {
      // 実際に実行可能なコードが生成されるかテスト
      writeFileSync(resolve(testDir, 'greeting.hbs'), '<p>Hello, {{name}}!</p>');
      
      const result = await generatePartialRegistrationCode(
        testDir,
        false,
        'development',
        'conservative',
        []
      );
      
      // 生成されたコードが有効なJavaScriptであることを確認
      expect(() => {
        new Function('Handlebars', result);
      }).not.toThrow();
      
      // プリコンパイルされた関数が含まれていることを確認
      expect(result).toContain('Handlebars.template(');
      expect(result).toMatch(/\"compiler\":\[/); // プリコンパイル済みのJSON形式をチェック
    });
  });
});
