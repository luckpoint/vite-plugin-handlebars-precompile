import Handlebars from 'handlebars';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { minifyTemplate, getFileCategory } from './minification';
import type { MinificationPattern } from '../types';

/**
 * Function to recursively search and register partials
 */
export function registerPartials(partialsDir: string): void {
  if (!existsSync(partialsDir)) {
    console.log(`[handlebars-precompile] Partials directory not found: ${partialsDir}`);
    return;
  }
  
  console.log(`[handlebars-precompile] Scanning partials directory: ${partialsDir}`);
  const files = readdirSync(partialsDir);
  
  files.forEach((file: string) => {
    const filePath = join(partialsDir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      // Process subdirectories recursively
      registerPartials(filePath);
    } else if (extname(file) === '.hbs') {
      // Register .hbs files as partials
      const partialContent = readFileSync(filePath, 'utf-8');
      
      // Reflect directory structure in partial names
      const relativePath = filePath.replace(partialsDir, '').replace(/^[/\\]/, '');
      const partialKey = relativePath.replace(/\.hbs$/, '').replace(/[/\\]/g, '/');
      
      Handlebars.registerPartial(partialKey, partialContent);
      console.log(`[handlebars-precompile] Registered partial: ${partialKey} (file: ${file})`);
    }
  });
}

/**
 * Generate JavaScript code for partial registration (with minification support)
 */
export async function generatePartialRegistrationCode(
  partialsDir: string,
  enableMinification: boolean,
  mode: string,
  minificationLevel: 'conservative' | 'aggressive' = 'conservative',
  patterns: MinificationPattern[] = []
): Promise<string> {
  if (!existsSync(partialsDir)) {
    return '';
  }
  
  const registrationCode: string[] = [];
  
  async function processDirectory(dir: string): Promise<void> {
    const files = readdirSync(dir);
    
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      
      if (stat.isDirectory()) {
        // Process subdirectories recursively
        await processDirectory(filePath);
      } else if (extname(file) === '.hbs') {
        let partialContent = readFileSync(filePath, 'utf-8');
        
        // Apply minification if enabled
        if (enableMinification && mode === 'production') {
          try {
            const category = getFileCategory(filePath, patterns);
            partialContent = await minifyTemplate(partialContent, category, minificationLevel);
            console.log(`[handlebars-minify] [${category}] Partial ${filePath}: minified for registration`);
          } catch (error) {
            console.warn(`[handlebars-minify] Failed to minify partial ${filePath}:`, (error as Error).message);
          }
        }
        
        // Reflect directory structure in partial names
        const relativePath = filePath.replace(partialsDir, '').replace(/^[/\\]/, '');
        const partialKey = relativePath.replace(/\.hbs$/, '').replace(/[/\\]/g, '/');
        
        // When precompiling partials as well
        const precompiledPartial = Handlebars.precompile(partialContent);
        registrationCode.push(`  Handlebars.registerPartial('${partialKey}', Handlebars.template(${precompiledPartial}));`);
        
        // When registering as raw strings (runtime compilation)
        // registrationCode.push(`  Handlebars.registerPartial('${partialKey}', ${escapedContent});`);
      }
    }
  }
  
  await processDirectory(partialsDir);
  return registrationCode.join('\n');
}
