import { describe, it, expect } from 'vitest';
import { getFileCategory, matchesPattern, minifyTemplate } from '../src/utils/minification.js';

describe('minification utils', () => {
  describe('matchesPattern', () => {
    it('should match exact patterns', () => {
      expect(matchesPattern('src/header.hbs', 'src/header.hbs')).toBe(true);
      expect(matchesPattern('src/layout.hbs', 'src/layout.hbs')).toBe(true);
      expect(matchesPattern('src/other.hbs', 'src/header.hbs')).toBe(false);
    });

    it('should match wildcard patterns', () => {
      expect(matchesPattern('src/screens/login.hbs', 'src/screens/**/*.hbs')).toBe(true);
      expect(matchesPattern('src/screens/deep/nested.hbs', 'src/screens/**/*.hbs')).toBe(true);
      expect(matchesPattern('src/shared/component.hbs', 'src/screens/**/*.hbs')).toBe(false);
    });

    it('should handle different path separators', () => {
      expect(matchesPattern('src\\screens\\login.hbs', 'src/screens/**/*.hbs')).toBe(true);
      expect(matchesPattern('src/screens/login.hbs', 'src\\screens\\**\\*.hbs')).toBe(true);
    });
  });

  describe('getFileCategory', () => {
    it('should use custom patterns when provided', () => {
      const customPatterns = [
        { pattern: 'custom/pages/**/*.hbs', category: 'pages' },
        { pattern: 'custom/components/**/*.hbs', category: 'components' }
      ];
      
      expect(getFileCategory('custom/pages/home.hbs', customPatterns)).toBe('pages');
      expect(getFileCategory('custom/components/button.hbs', customPatterns)).toBe('components');
      expect(getFileCategory('src/screens/login.hbs', customPatterns)).toBe('unknown');
    });
  });

  describe('minifyTemplate', () => {
    it('should minify HTML content', async () => {
      const input = `
        <div    class="test"   >
          <h1>   Title   </h1>
          <!-- comment -->
          <p>   Content   </p>
        </div>
      `;

      const result = await minifyTemplate(input, 'screens', 'aggressive');
      
      expect(result).toBeDefined();
      expect(result.length).toBeLessThan(input.length);
      expect(result).not.toContain('<!-- comment -->');
    });

    it('should preserve Handlebars expressions', async () => {
      const input = `
        <div>
          <h1>{{title}}</h1>
          {{#if condition}}
            <p>{{content}}</p>
          {{/if}}
          {{> partial}}
        </div>
      `;

      const result = await minifyTemplate(input, 'components', 'conservative');
      
      expect(result).toContain('{{title}}');
      expect(result).toContain('{{#if condition}}');
      expect(result).toContain('{{/if}}');
      expect(result).toContain('{{> partial}}');
    });

    it('should use custom category configs when provided', async () => {
      const input = `
        <div>
          <!-- comment -->
          <h1>   Title   </h1>
          <p>   Content   </p>
        </div>
      `;
      const customCategoryConfigs = {
        'test-category': { level: 'aggressive' as const, priority: 'high' as const }
      };
      
      const result = await minifyTemplate(input, 'test-category', 'conservative', customCategoryConfigs);
      
      expect(result).toBeDefined();
      expect(result.length).toBeLessThan(input.length);
    });
  });
});
