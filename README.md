# vite-plugin-handlebars-precompile

A Vite plugin for precompiling Handlebars templates with HTML minification support.

## Features

- ✨ **Precompile Handlebars templates** at build time for optimal performance
- 🗜️ **HTML minification** with Handlebars-aware parsing and category-based optimization
- 📊 **Detailed build statistics** with comprehensive reporting and metrics
- 🔄 **Auto-registration of partials** with recursive directory scanning
- 🎯 **Category-based optimization** with customizable minification levels
- 🔥 **Hot reload support** in development mode
- 📦 **TypeScript support** with full type definitions
- 🛠️ **ESM and CommonJS** compatible

## Installation

```bash
npm install vite-plugin-handlebars-precompile --save-dev
```

## Quick Start

### Basic Usage

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { handlebarsPrecompile } from 'vite-plugin-handlebars-precompile';

export default defineConfig({
  plugins: [
    handlebarsPrecompile({
      enableMinification: true,
      minificationLevel: 'aggressive'
    })
  ]
});
```

### Using Templates

```javascript
// Import and use precompiled templates
import template from './template.hbs?compiled';

// Render with data
const html = template({
  title: 'Hello World',
  content: 'This is a precompiled template!'
});

document.body.innerHTML = html;
```

## Configuration

### Plugin Options

```typescript
interface PluginOptions {
  partialsDir?: string;                    // Default: 'src/shared'
  enableMinification?: boolean;            // Default: true
  mode?: string;                          // Default: 'development'
  minificationLevel?: 'conservative' | 'aggressive'; // Default: 'aggressive'
  patterns?: MinificationPattern[];       // Custom file categorization
  categoryConfigs?: Record<string, CategoryConfig>; // Category-specific settings
  exportStats?: boolean;                  // Default: false
  detailedLog?: boolean;                  // Default: false
}
```

### Example with Custom Configuration

```javascript
// vite.config.js
export default defineConfig(({ mode }) => ({
  plugins: [
    handlebarsPrecompile({
      partialsDir: 'src/components',
      enableMinification: mode === 'production',
      mode: mode,
      minificationLevel: 'conservative',
      patterns: [
        { pattern: 'src/pages/**/*.hbs', category: 'pages' },
        { pattern: 'src/components/**/*.hbs', category: 'components' }
      ],
      categoryConfigs: {
        pages: { level: 'aggressive', priority: 'high' },
        components: { level: 'conservative', priority: 'critical' }
      }
    })
  ]
}));
```

## File Structure

### Recommended Project Structure

```
src/
├── pages/
│   ├── home.hbs
│   └── about.hbs
├── components/          # Partials directory
│   ├── header.hbs
│   ├── footer.hbs
│   └── ui/
│       └── button.hbs
└── layouts/
    └── main.hbs
```

### Template Usage

```handlebars
<!-- src/pages/home.hbs -->
<div class="page">
  {{> header title="Welcome"}}
  
  <main>
    <h1>{{pageTitle}}</h1>
    <p>{{description}}</p>
    
    {{#if showButton}}
      {{> ui/button text="Click me"}}
    {{/if}}
  </main>
  
  {{> footer}}
</div>
```

## Minification

### Category-based Optimization

The plugin automatically categorizes templates and applies appropriate minification settings:

- **Screens/Pages**: Aggressive minification for better performance
- **Components**: Conservative minification to preserve functionality
- **Layouts**: Aggressive minification for structural templates
- **Error Pages**: Conservative minification for reliability

### Default Categories

```javascript
const CATEGORY_CONFIGS = {
  screens: { level: 'aggressive', priority: 'high' },
  components: { level: 'conservative', priority: 'critical' },
  layout: { level: 'aggressive', priority: 'high' },
  'error-pages': { level: 'conservative', priority: 'medium' }
};
```

### Minification Levels

#### Conservative Mode
- Collapse whitespace
- Remove comments
- Preserve line breaks for debugging
- Safe Handlebars expression handling

#### Aggressive Mode
- All conservative optimizations
- Remove attribute quotes
- Remove empty attributes
- Minify CSS and JavaScript
- Maximum compression

## Build Statistics

### Development Output

```
📊 [handlebars-minify] Comprehensive Build Statistics:
═══════════════════════════════════════════════════════════
📈 Overall Performance:
   Files processed: 12
   Original size: 45,230 bytes
   Minified size: 32,891 bytes
   Total reduction: 27.3% (12,339 bytes saved)
   Processing time: 156ms

📊 Category Breakdown:
   screens: 8 files, 32.1% reduction (8,934 bytes saved)
   components: 3 files, 18.7% reduction (2,156 bytes saved)
   layout: 1 files, 29.4% reduction (1,249 bytes saved)

🏆 Performance Highlights:
   Largest file: src/pages/dashboard.hbs (4,123 bytes, 35.2% reduction)
   Best compression: src/layouts/main.hbs (41.7% reduction)
   Average reduction: 28.1%
   Average file size: 3,769 bytes
═══════════════════════════════════════════════════════════
✅ Minification completed successfully in 156ms
```

### Statistics Export

Enable detailed statistics export:

```bash
# Export detailed JSON statistics
VITE_MINIFY_EXPORT_STATS=true npm run build

# Enable detailed file-by-file logging
VITE_MINIFY_DETAILED_LOG=true npm run build
```

## Development

### Hot Reload

The plugin supports hot reload in development mode. When you modify `.hbs` files, the precompiled templates are automatically updated.

### Debugging

```javascript
// Check if CSS variables are detected
// The plugin logs when CSS custom properties are found
.my-component {
  color: var(--primary-color);
}
```

## Advanced Usage

### Custom Patterns

```javascript
handlebarsPrecompile({
  patterns: [
    { pattern: 'src/emails/**/*.hbs', category: 'emails' },
    { pattern: 'src/admin/**/*.hbs', category: 'admin' },
    { pattern: 'src/public/**/*.hbs', category: 'public' }
  ],
  categoryConfigs: {
    emails: { level: 'conservative', priority: 'critical' },
    admin: { level: 'aggressive', priority: 'medium' },
    public: { level: 'aggressive', priority: 'high' }
  }
})
```

### TypeScript Integration

```typescript
// types.d.ts
declare module '*.hbs?compiled' {
  import { TemplateDelegate } from 'handlebars';
  const template: TemplateDelegate;
  export default template;
}

// usage.ts
import template from './my-template.hbs?compiled';

interface TemplateData {
  title: string;
  items: string[];
}

const html = template({
  title: 'My Page',
  items: ['item1', 'item2', 'item3']
} as TemplateData);
```

## Performance

### Build Performance

- **Fast compilation**: Leverages Handlebars' native precompilation
- **Parallel processing**: Minification runs in parallel where possible
- **Incremental builds**: Only processes changed templates in development
- **Memory efficient**: Streaming approach for large template sets

### Runtime Performance

- **Zero runtime compilation**: Templates are precompiled at build time
- **Smaller bundle size**: Minified templates reduce overall bundle size
- **Faster rendering**: Precompiled templates execute faster than runtime compilation

## Troubleshooting

### Common Issues

#### Template Not Found
```bash
Error: Handlebars template file not found: /path/to/template.hbs
```
**Solution**: Ensure the template file exists and the path is correct.

#### Minification Failed
```bash
Warning: Minification failed for template.hbs: unexpected token
```
**Solution**: Check for malformed HTML or Handlebars syntax. The plugin will fall back to the original template.

#### Partials Not Found
```bash
Warning: Partials directory not found: src/shared
```
**Solution**: Create the partials directory or configure the correct path with `partialsDir` option.

### Debug Mode

```javascript
// Enable verbose logging
handlebarsPrecompile({
  detailedLog: true
})
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/vite-plugin-handlebars-precompile.git
cd vite-plugin-handlebars-precompile

# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build the package
npm run build

# Lint code
npm run lint
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## License

MIT License. See [LICENSE](LICENSE) for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## Related

- [Handlebars.js](https://handlebarsjs.com/) - The template engine
- [Vite](https://vitejs.dev/) - The build tool
- [html-minifier-terser](https://github.com/terser/html-minifier-terser) - HTML minification
