import { minify as minifyHTML } from 'html-minifier-terser';
import type { MinificationOptions, MinificationPattern, CategoryConfig } from '../types';

/**
 * Category-specific optimization settings
 */
export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  screens: { level: 'aggressive', priority: 'high' },
  components: { level: 'conservative', priority: 'critical' },
  layout: { level: 'aggressive', priority: 'high' },
  'error-pages': { level: 'conservative', priority: 'medium' }
};

/**
 * HTML minification settings for Handlebars
 */
export const MINIFY_OPTIONS: Record<'conservative' | 'aggressive', MinificationOptions> = {
  // Conservative settings
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
  // Aggressive settings  
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
 * Helper function to determine category from file path
 */
export function getFileCategory(
  filePath: string, 
  customPatterns: MinificationPattern[]
): string {
  for (const pattern of customPatterns) {
    if (matchesPattern(filePath, pattern.pattern)) {
      return pattern.category;
    }
  }
  return 'unknown';
}

/**
 * Pattern matching (simple implementation)
 */
export function matchesPattern(filePath: string, pattern: string): boolean {
  // Convert absolute path to relative path
  const normalizedPath = filePath.replace(/\\/g, '/');
  const relativePath = normalizedPath.replace(process.cwd().replace(/\\/g, '/') + '/', '');
  const normalizedPattern = pattern.replace(/\\/g, '/');
  
  if (pattern.includes('**')) {
    const parts = normalizedPattern.split('**');
    if (parts.length === 2) {
      const prefix = parts[0];
      const suffix = parts[1];
      
      // For **/*.hbs patterns, check prefix match and .hbs extension
      const cleanSuffix = suffix.startsWith('/') ? suffix.substring(1) : suffix;
      
      if (cleanSuffix === '*.hbs') {
        // For *.hbs, just check that it ends with .hbs
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
 * Function to execute HTML minification
 */
export async function minifyTemplate(
  templateSource: string,
  category: string,
  level: 'conservative' | 'aggressive' = 'conservative',
  customCategoryConfigs?: Record<string, CategoryConfig>
): Promise<string> {
  const categoryConfigs = customCategoryConfigs || CATEGORY_CONFIGS;
  const categoryConfig = categoryConfigs[category] || { level };
  const effectiveLevel = categoryConfig.level;
  const minifyOptions = MINIFY_OPTIONS[effectiveLevel] || MINIFY_OPTIONS.conservative;
  
  return await minifyHTML(templateSource, minifyOptions);
}
