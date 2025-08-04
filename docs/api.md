# API Documentation

This document provides detailed API reference for `vite-plugin-handlebars-precompile`.

## Table of Contents

- [Plugin Function](#plugin-function)
- [Plugin Options](#plugin-options)
- [Type Definitions](#type-definitions)
- [Configuration Objects](#configuration-objects)
- [Statistics API](#statistics-api)
- [Environment Variables](#environment-variables)
- [File Patterns](#file-patterns)
- [Error Handling](#error-handling)

## Plugin Function

### `handlebarsPrecompile(options?: PluginOptions): Plugin`

Creates a Vite plugin instance for Handlebars template precompilation.

```typescript
import { handlebarsPrecompile } from 'vite-plugin-handlebars-precompile';
import type { PluginOptions } from 'vite-plugin-handlebars-precompile';

const plugin = handlebarsPrecompile({
  enableMinification: true,
  minificationLevel: 'aggressive'
});
```

**Parameters:**
- `options` (optional): Configuration options for the plugin

**Returns:**
- `Plugin`: Vite plugin object with hooks and configuration

## Plugin Options

### `PluginOptions`

```typescript
interface PluginOptions {
  partialsDir?: string;
  enableMinification?: boolean;
  mode?: string;
  minificationLevel?: 'conservative' | 'aggressive';
  patterns?: MinificationPattern[];
  categoryConfigs?: Record<string, CategoryConfig>;
  exportStats?: boolean;
  detailedLog?: boolean;
}
```

#### `partialsDir`

- **Type:** `string`
- **Default:** `'src/shared'`
- **Description:** Directory path where partial templates are located. The plugin recursively scans this directory for `.hbs` files and automatically registers them as partials.

```typescript
handlebarsPrecompile({
  partialsDir: 'src/components'
})
```

#### `enableMinification`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** Enables HTML minification for templates. When `false`, templates are precompiled without minification.

```typescript
handlebarsPrecompile({
  enableMinification: process.env.NODE_ENV === 'production'
})
```

#### `mode`

- **Type:** `string`
- **Default:** `'development'`
- **Description:** Build mode that affects minification behavior. Minification is only applied when mode is `'production'`.

```typescript
handlebarsPrecompile({
  mode: 'production'
})
```

#### `minificationLevel`

- **Type:** `'conservative' | 'aggressive'`
- **Default:** `'aggressive'`
- **Description:** Level of HTML minification to apply.

- **`conservative`**: Safe optimizations that preserve functionality
- **`aggressive`**: Maximum compression with more aggressive optimizations

```typescript
handlebarsPrecompile({
  minificationLevel: 'conservative'
})
```

#### `patterns`

- **Type:** `MinificationPattern[]`
- **Default:** Predefined patterns for common project structures
- **Description:** Custom file patterns for categorizing templates.

```typescript
handlebarsPrecompile({
  patterns: [
    { pattern: 'src/pages/**/*.hbs', category: 'pages' },
    { pattern: 'src/emails/**/*.hbs', category: 'emails' }
  ]
})
```

#### `categoryConfigs`

- **Type:** `Record<string, CategoryConfig>`
- **Default:** Predefined configurations for common categories
- **Description:** Category-specific optimization settings.

```typescript
handlebarsPrecompile({
  categoryConfigs: {
    pages: { level: 'aggressive', priority: 'high' },
    emails: { level: 'conservative', priority: 'critical' }
  }
})
```

#### `exportStats`

- **Type:** `boolean`
- **Default:** `false`
- **Description:** When `true`, exports detailed build statistics to JSON file. Can also be controlled via `VITE_MINIFY_EXPORT_STATS` environment variable.

```typescript
handlebarsPrecompile({
  exportStats: true
})
```

#### `detailedLog`

- **Type:** `boolean`
- **Default:** `false`
- **Description:** Enables verbose logging for debugging. Can also be controlled via `VITE_MINIFY_DETAILED_LOG` environment variable.

```typescript
handlebarsPrecompile({
  detailedLog: process.env.NODE_ENV === 'development'
})
```

## Type Definitions

### `MinificationPattern`

Defines file patterns for template categorization.

```typescript
interface MinificationPattern {
  pattern: string;    // Glob pattern to match files
  category: string;   // Category name for the matched files
}
```

**Example:**
```typescript
const patterns: MinificationPattern[] = [
  { pattern: 'src/screens/**/*.hbs', category: 'screens' },
  { pattern: 'src/shared/**/*.hbs', category: 'components' },
  { pattern: 'src/layout.hbs', category: 'layout' }
];
```

### `CategoryConfig`

Configuration for specific template categories.

```typescript
interface CategoryConfig {
  level: 'conservative' | 'aggressive';
  priority: 'low' | 'medium' | 'high' | 'critical';
}
```

**Properties:**
- `level`: Minification level to apply to this category
- `priority`: Processing priority (affects build order and error handling)

### `MinificationOptions`

Detailed minification settings (extends html-minifier-terser options).

```typescript
interface MinificationOptions {
  collapseWhitespace?: boolean;
  removeComments?: boolean;
  removeAttributeQuotes?: boolean;
  removeEmptyAttributes?: boolean;
  removeRedundantAttributes?: boolean;
  removeScriptTypeAttributes?: boolean;
  removeStyleLinkTypeAttributes?: boolean;
  minifyCSS?: boolean;
  minifyJS?: boolean;
  preserveLineBreaks?: boolean;
  ignoreCustomFragments?: RegExp[];
}
```

### `FileDetail`

Represents processing information for a single template file.

```typescript
interface FileDetail {
  name: string;               // Relative file path
  category: string;           // Assigned category
  originalSize: number;       // Original file size in bytes
  minifiedSize: number;       // Minified file size in bytes
  reduction: number;          // Reduction percentage
  minificationLevel: string;  // Applied minification level
  timestamp: string;          // Processing timestamp (ISO 8601)
}
```

### `MinificationStats`

Complete build statistics object.

```typescript
interface MinificationStats {
  totalFiles: number;
  totalOriginalSize: number;
  totalMinifiedSize: number;
  errors: MinificationError[];
  warnings: MinificationWarning[];
  startTime: number | null;
  endTime: number | null;
  fileDetails: FileDetail[];
  categories: Record<string, CategoryStats>;
  performanceMetrics: PerformanceMetrics;
}
```

## Configuration Objects

### Default Category Configurations

```typescript
const CATEGORY_CONFIGS = {
  screens: { level: 'aggressive', priority: 'high' },
  components: { level: 'conservative', priority: 'critical' },
  layout: { level: 'aggressive', priority: 'high' },
  'error-pages': { level: 'conservative', priority: 'medium' }
};
```

### Default File Patterns

```typescript
const MINIFICATION_PATTERNS = [
  { pattern: 'src/screens/**/*.hbs', category: 'screens' },
  { pattern: 'src/shared/**/*.hbs', category: 'components' },
  { pattern: 'src/header.hbs', category: 'layout' },
  { pattern: 'src/layout.hbs', category: 'layout' },
  { pattern: 'src/error-page/**/*.hbs', category: 'error-pages' }
];
```

### Minification Option Presets

#### Conservative Preset

```typescript
const conservativeOptions: MinificationOptions = {
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
};
```

#### Aggressive Preset

```typescript
const aggressiveOptions: MinificationOptions = {
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
};
```

## Statistics API

### Accessing Build Statistics

Statistics are collected during the build process and can be accessed in several ways:

#### Console Output

Automatically displayed after production builds:

```
📊 [handlebars-minify] Comprehensive Build Statistics:
═══════════════════════════════════════════════════════════
📈 Overall Performance:
   Files processed: 12
   Original size: 45,230 bytes
   Minified size: 32,891 bytes
   Total reduction: 27.3% (12,339 bytes saved)
   Processing time: 156ms
```

#### JSON Export

Enable with environment variable or plugin option:

```bash
VITE_MINIFY_EXPORT_STATS=true npm run build
```

Generated file: `dist/minification-stats.json`

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "summary": {
    "filesProcessed": 12,
    "originalSize": 45230,
    "minifiedSize": 32891,
    "totalReduction": "27.30",
    "buildTime": 156,
    "minificationLevel": "aggressive"
  },
  "categories": {
    "screens": {
      "files": 8,
      "originalSize": 32450,
      "minifiedSize": 22016,
      "reduction": "32.10",
      "bytesSaved": 10434
    }
  },
  "performance": {
    "largestFile": {
      "name": "src/pages/dashboard.hbs",
      "originalSize": 4123,
      "minifiedSize": 2671,
      "reduction": 35.2
    }
  },
  "files": [...],
  "errors": [],
  "warnings": []
}
```

### Performance Metrics

The plugin tracks several performance metrics:

- **Largest File**: File with the highest original size
- **Smallest File**: File with the lowest original size  
- **Best Reduction**: File with the highest compression ratio
- **Worst Reduction**: File with the lowest compression ratio
- **Average Reduction**: Mean compression across all files
- **Average File Size**: Mean original file size

## Environment Variables

### `VITE_MINIFY_EXPORT_STATS`

- **Type:** `string` (`'true'` | `'false'`)
- **Default:** `'false'`
- **Description:** Enables JSON statistics export to `dist/minification-stats.json`

```bash
VITE_MINIFY_EXPORT_STATS=true npm run build
```

### `VITE_MINIFY_DETAILED_LOG`

- **Type:** `string` (`'true'` | `'false'`)
- **Default:** `'false'`
- **Description:** Enables detailed file-by-file logging in console output

```bash
VITE_MINIFY_DETAILED_LOG=true npm run build
```

**Example detailed output:**
```
📄 Detailed File Report:
   [screens] src/pages/home.hbs: 2,340 → 1,567 bytes (33.0%, aggressive)
   [components] src/shared/header.hbs: 890 → 712 bytes (20.0%, conservative)
   [layout] src/layout.hbs: 1,230 → 834 bytes (32.2%, aggressive)
```

## File Patterns

### Glob Pattern Support

The plugin supports glob patterns for file categorization:

#### Exact Match
```typescript
{ pattern: 'src/layout.hbs', category: 'layout' }
```

#### Wildcard Match
```typescript
{ pattern: 'src/pages/*.hbs', category: 'pages' }
```

#### Recursive Match
```typescript
{ pattern: 'src/components/**/*.hbs', category: 'components' }
```

#### Extension-specific Match
```typescript
{ pattern: '**/*.email.hbs', category: 'emails' }
```

### Pattern Resolution

Patterns are resolved in the order they are defined. The first matching pattern determines the category:

```typescript
handlebarsPrecompile({
  patterns: [
    { pattern: 'src/emails/**/*.hbs', category: 'emails' },     // More specific
    { pattern: 'src/**/*.hbs', category: 'general' }           // Less specific
  ]
})
```

### Path Normalization

All paths are normalized to use forward slashes (`/`) regardless of the operating system:

- Windows: `src\templates\home.hbs` → `src/templates/home.hbs`
- Unix/Linux: `src/templates/home.hbs` → `src/templates/home.hbs`

## Error Handling

### Error Types

#### Template Not Found

```typescript
interface TemplateNotFoundError {
  type: 'TEMPLATE_NOT_FOUND';
  file: string;
  message: string;
}
```

**Example:**
```
Error: Handlebars template file not found: /path/to/template.hbs
```

#### Minification Error

```typescript
interface MinificationError {
  file: string;
  error: string;
  timestamp: string;
  fallbackUsed?: boolean;
}
```

**Behavior:** When minification fails, the plugin:
1. Logs a warning message
2. Uses the original (unminified) template as fallback
3. Records the error in statistics
4. Continues processing other files

#### Partial Registration Error

```typescript
interface PartialError {
  type: 'PARTIAL_ERROR';
  directory: string;
  message: string;
}
```

**Behavior:** When partials directory is not found:
1. Logs an informational message
2. Continues without partial registration
3. Does not throw or stop the build

### Error Recovery

The plugin implements graceful error recovery:

1. **Template Errors**: Stop processing the specific template, log error
2. **Minification Errors**: Fall back to original template, continue build
3. **Partial Errors**: Continue without partials, log warning
4. **File System Errors**: Log error, skip affected files

### Debugging Errors

Enable detailed logging to diagnose issues:

```typescript
handlebarsPrecompile({
  detailedLog: true
})
```

Or use environment variable:

```bash
VITE_MINIFY_DETAILED_LOG=true npm run build
```

This provides additional context for troubleshooting:

```
[handlebars-precompile] Processing: src/templates/home.hbs
[handlebars-precompile] Category: screens
[handlebars-precompile] Minification: aggressive
[handlebars-minify] Error in src/templates/home.hbs: Invalid HTML syntax at line 23
[handlebars-minify] Fallback: Using original template
```

## Usage Examples

### Complete Configuration Example

```typescript
import { defineConfig } from 'vite';
import { handlebarsPrecompile } from 'vite-plugin-handlebars-precompile';

export default defineConfig(({ mode }) => ({
  plugins: [
    handlebarsPrecompile({
      // Basic settings
      partialsDir: 'src/components',
      enableMinification: mode === 'production',
      mode: mode,
      minificationLevel: 'aggressive',
      
      // Custom categorization
      patterns: [
        { pattern: 'src/pages/**/*.hbs', category: 'pages' },
        { pattern: 'src/components/**/*.hbs', category: 'components' },
        { pattern: 'src/emails/**/*.hbs', category: 'emails' },
        { pattern: 'src/layouts/*.hbs', category: 'layouts' }
      ],
      
      // Category-specific optimization
      categoryConfigs: {
        pages: { level: 'aggressive', priority: 'high' },
        components: { level: 'conservative', priority: 'critical' },
        emails: { level: 'conservative', priority: 'high' },
        layouts: { level: 'aggressive', priority: 'medium' }
      },
      
      // Development settings
      exportStats: mode === 'production',
      detailedLog: mode === 'development'
    })
  ]
}));
```

### TypeScript Usage

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { handlebarsPrecompile } from 'vite-plugin-handlebars-precompile';
import type { 
  PluginOptions, 
  MinificationPattern, 
  CategoryConfig 
} from 'vite-plugin-handlebars-precompile';

const patterns: MinificationPattern[] = [
  { pattern: 'src/pages/**/*.hbs', category: 'pages' },
  { pattern: 'src/components/**/*.hbs', category: 'components' }
];

const categoryConfigs: Record<string, CategoryConfig> = {
  pages: { level: 'aggressive', priority: 'high' },
  components: { level: 'conservative', priority: 'critical' }
};

const pluginOptions: PluginOptions = {
  partialsDir: 'src/components',
  enableMinification: true,
  minificationLevel: 'aggressive',
  patterns,
  categoryConfigs
};

export default defineConfig({
  plugins: [handlebarsPrecompile(pluginOptions)]
});
```
