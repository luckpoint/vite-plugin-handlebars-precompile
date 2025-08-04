// @ts-ignore - html-minifier-terserの型定義が不完全
import { minify as minifyHTML } from 'html-minifier-terser';
import type { MinificationOptions, MinificationPattern, CategoryConfig } from '../types';

/**
 * パターンマッチング拡張 - Week 4 Option A
 */
export const MINIFICATION_PATTERNS: MinificationPattern[] = [
  { pattern: 'src/screens/**/*.hbs', category: 'screens' },
  { pattern: 'src/shared/**/*.hbs', category: 'components' },
  { pattern: 'src/header.hbs', category: 'layout' },
  { pattern: 'src/layout.hbs', category: 'layout' },
  { pattern: 'src/error-page/**/*.hbs', category: 'error-pages' }
];

/**
 * カテゴリ別最適化設定
 */
export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  screens: { level: 'aggressive', priority: 'high' },
  components: { level: 'conservative', priority: 'critical' },
  layout: { level: 'aggressive', priority: 'high' },
  'error-pages': { level: 'conservative', priority: 'medium' }
};

/**
 * Handlebars用HTML minification設定
 */
export const MINIFY_OPTIONS: Record<'conservative' | 'aggressive', MinificationOptions> = {
  // 保守的設定
  conservative: {
    collapseWhitespace: true,
    removeComments: true,
    preserveLineBreaks: false,
    ignoreCustomFragments: [
      /\{\{[\s\S]*?\}\}/,        // Handlebars expressions
      /\{\{\{[\s\S]*?\}\}\}/,    // Handlebars unescaped expressions  
      /\{\{#[\s\S]*?\}\}/,       // Handlebars block helpers
      /\{\{\/[\s\S]*?\}\}/,      // Handlebars block helper endings
      /\{\{![\s\S]*?\}\}/,       // Handlebars comments
    ]
  },
  // 積極的設定  
  aggressive: {
    collapseWhitespace: true,
    removeComments: true,
    removeAttributeQuotes: true,
    removeEmptyAttributes: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    minifyCSS: true,
    minifyJS: true,
    preserveLineBreaks: false,
    ignoreCustomFragments: [
      /\{\{[\s\S]*?\}\}/,        // Handlebars expressions
      /\{\{\{[\s\S]*?\}\}\}/,    // Handlebars unescaped expressions  
      /\{\{#[\s\S]*?\}\}/,       // Handlebars block helpers
      /\{\{\/[\s\S]*?\}\}/,      // Handlebars block helper endings
      /\{\{![\s\S]*?\}\}/,       // Handlebars comments
    ]
  }
};

/**
 * ファイルパスからカテゴリを判定するヘルパー関数
 */
export function getFileCategory(
  filePath: string, 
  customPatterns?: MinificationPattern[]
): string {
  const patterns = customPatterns || MINIFICATION_PATTERNS;
  
  for (const pattern of patterns) {
    if (matchesPattern(filePath, pattern.pattern)) {
      return pattern.category;
    }
  }
  return 'unknown';
}

/**
 * パターンマッチング（簡易実装）
 */
export function matchesPattern(filePath: string, pattern: string): boolean {
  // 絶対パスを相対パスに変換
  const normalizedPath = filePath.replace(/\\/g, '/');
  const relativePath = normalizedPath.replace(process.cwd().replace(/\\/g, '/') + '/', '');
  const normalizedPattern = pattern.replace(/\\/g, '/');
  
  if (pattern.includes('**')) {
    const parts = normalizedPattern.split('**');
    if (parts.length === 2) {
      const prefix = parts[0];
      const suffix = parts[1];
      
      // **/*.hbs パターンの場合、prefix部分のマッチと.hbsの拡張子をチェック
      const cleanSuffix = suffix.startsWith('/') ? suffix.substring(1) : suffix;
      
      if (cleanSuffix === '*.hbs') {
        // *.hbs の場合は .hbs で終わることだけをチェック
        return relativePath.startsWith(prefix) && relativePath.endsWith('.hbs');
      } else {
        return relativePath.startsWith(prefix) && relativePath.endsWith(cleanSuffix);
      }
    }
  } else {
    return relativePath === normalizedPattern;
  }
  return false;
}

/**
 * HTML最小化を実行する関数
 */
export async function minifyTemplate(
  templateSource: string,
  category: string,
  level: 'conservative' | 'aggressive' = 'conservative',
  customCategoryConfigs?: Record<string, CategoryConfig>
): Promise<string> {
  const categoryConfigs = customCategoryConfigs || CATEGORY_CONFIGS;
  const categoryConfig = categoryConfigs[category] || { level: 'conservative' };
  const effectiveLevel = categoryConfig.level;
  const minifyOptions = MINIFY_OPTIONS[effectiveLevel] || MINIFY_OPTIONS.conservative;
  
  return await minifyHTML(templateSource, minifyOptions);
}
