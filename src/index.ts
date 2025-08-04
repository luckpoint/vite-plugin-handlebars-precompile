import Handlebars from 'handlebars';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { Plugin, ViteDevServer } from 'vite';
import type { PluginOptions, FileDetail } from './types';
import { getFileCategory, minifyTemplate } from './utils/minification';
import { registerPartials, generatePartialRegistrationCode } from './utils/partials';
import { 
  createMinificationStats, 
  updateFileStats, 
  printStatisticsReport, 
  exportStatistics 
} from './utils/statistics';

/**
 * Vite plugin for precompiling Handlebars templates
 * Usage: import template from './template.hbs?compiled'
 */
export function handlebarsPrecompile(options: PluginOptions = {}): Plugin {
  const { 
    partialsDir = 'src/partials', 
    enableMinification = true, 
    mode = 'development',
    minificationLevel = 'aggressive',
    patterns,
    categoryConfigs,
    exportStats = process.env.VITE_MINIFY_EXPORT_STATS === 'true',
    detailedLog = process.env.VITE_MINIFY_DETAILED_LOG === 'true'
  } = options;
  
  let partialsRegistered = false;
  const minificationStats = createMinificationStats();
  
  return {
    name: 'handlebars-precompile',
    buildStart() {
      // Register partials at build start
      const fullPartialsDir = resolve(partialsDir);
      registerPartials(fullPartialsDir);
      partialsRegistered = true;
      
      // Initialize statistics data
      if (enableMinification && mode === 'production') {
        minificationStats.startTime = Date.now();
        console.log(`[handlebars-minify] Starting minification with ${minificationLevel} level`);
      }
    },
    
    async load(id: string) {
      // Process .hbs files with ?compiled query parameter
      if (id.endsWith('.hbs?compiled')) {
        const filePath = id.replace('?compiled', '');
        
        // Check file existence
        if (!existsSync(filePath)) {
          this.error(`Handlebars template file not found: ${filePath}`);
          return;
        }
        
        // Register partials if not already registered
        if (!partialsRegistered) {
          const fullPartialsDir = resolve(partialsDir);
          registerPartials(fullPartialsDir);
          partialsRegistered = true;
        }
        
        try {
          // Load .hbs file
          let templateSource = readFileSync(filePath, 'utf-8');
          
          // Enable HTML minification for production builds only
          if (enableMinification && mode === 'production') {
            try {
              const originalSize = templateSource.length;
              
              // Determine category from file path
              const category = getFileCategory(filePath, patterns || []);
              templateSource = await minifyTemplate(templateSource, category, minificationLevel, categoryConfigs);

              const minifiedSize = templateSource.length;
              const reduction = parseFloat(((originalSize - minifiedSize) / originalSize * 100).toFixed(1));
              
              // Record file detail information
              const fileDetail: FileDetail = {
                name: filePath.replace(process.cwd(), ''),
                category,
                originalSize,
                minifiedSize,
                reduction,
                minificationLevel,
                timestamp: new Date().toISOString()
              };
              
              updateFileStats(minificationStats, fileDetail);
              
              if (detailedLog) {
                console.log(`[handlebars-minify] [${category}] ${filePath}: ${originalSize} → ${minifiedSize} bytes (${reduction}% reduction, ${minificationLevel})`);
              }
            } catch (minifyError) {
              console.warn(`[handlebars-minify] Minification failed for ${filePath}:`, (minifyError as Error).message);
              console.warn(`[handlebars-minify] Using original template source as fallback`);
              
              // Error statistics
              minificationStats.errors.push({
                file: filePath.replace(process.cwd(), ''),
                error: (minifyError as Error).message,
                timestamp: new Date().toISOString(),
                fallbackUsed: true
              });
              
              // Also record as warning
              minificationStats.warnings.push({
                file: filePath.replace(process.cwd(), ''),
                message: `Minification failed, using original template`,
                timestamp: new Date().toISOString()
              });
            }
          }
          
          // Debug: Check if template source contains CSS variables
          if (templateSource.includes('var(--')) {
            console.log(`[handlebars-precompile] CSS variables found in: ${filePath}`);
          }
          
          // Precompile with Handlebars
          const precompiled = Handlebars.precompile(templateSource, {
            strict: false,
            assumeObjects: false
          });
          
          // Output as ES module that returns precompiled template functions
          const partialRegistrationCode = await generatePartialRegistrationCode(
            resolve(partialsDir),
            enableMinification,
            mode,
            minificationLevel,
            patterns
          );
          
          const moduleCode = `
import Handlebars from 'handlebars';

// Register partials
${partialRegistrationCode}

// Precompiled template (from: ${filePath})
const template = Handlebars.template(${precompiled});

export default template;
`;
          
          return moduleCode;
        } catch (error) {
          this.error(`Failed to precompile Handlebars template: ${filePath}\n${(error as Error).message}`);
        }
      }
    },
    
    // Output detailed statistics at build end
    buildEnd() {
      if (enableMinification && mode === 'production' && minificationStats.totalFiles > 0) {
        minificationStats.endTime = Date.now();
        printStatisticsReport(minificationStats);
        
        // JSON statistics file output (optional)
        if (exportStats) {
          exportStatistics(minificationStats, minificationLevel);
        }
      }
    },
    
    // Hot reload support for development
    handleHotUpdate({ file, server }: { file: string; server: ViteDevServer }) {
      if (file.endsWith('.hbs')) {
        // When .hbs file changes, also update modules using ?compiled
        const moduleGraph = server.moduleGraph;
        const compiledModuleId = file + '?compiled';
        const compiledModule = moduleGraph.getModuleById(compiledModuleId);
        
        if (compiledModule) {
          server.reloadModule(compiledModule);
        }
      }
    }
  };
}

// Export type definitions
export type { 
  PluginOptions, 
  MinificationOptions, 
  MinificationStats,
  CategoryConfig,
  MinificationPattern,
  FileDetail
} from './types';
