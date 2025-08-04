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
        'conservative'
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
        'conservative'
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
        'aggressive'
      );
      
      expect(result).toContain('Handlebars.registerPartial');
      // 最小化されているかチェック（元のファイルより短い）
      expect(result.length).toBeLessThan(200);
    });
  });
});
