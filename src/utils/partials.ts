import Handlebars from 'handlebars';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { minifyTemplate, getFileCategory } from './minification';
import type { MinificationPattern } from '../types';

/**
 * パーシャルを再帰的に検索して登録する関数
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
      // サブディレクトリも再帰的に処理
      registerPartials(filePath);
    } else if (extname(file) === '.hbs') {
      // .hbs ファイルをパーシャルとして登録
      const partialContent = readFileSync(filePath, 'utf-8');
      
      // パーシャル名にディレクトリ構造を反映
      const relativePath = filePath.replace(partialsDir, '').replace(/^[\/\\]/, '');
      const partialKey = relativePath.replace(/\.hbs$/, '').replace(/[\/\\]/g, '/');
      
      Handlebars.registerPartial(partialKey, partialContent);
      console.log(`[handlebars-precompile] Registered partial: ${partialKey} (file: ${file})`);
    }
  });
}

/**
 * パーシャル登録用のJavaScriptコードを生成（minification対応）
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
        // サブディレクトリも再帰的に処理
        await processDirectory(filePath);
      } else if (extname(file) === '.hbs') {
        let partialContent = readFileSync(filePath, 'utf-8');
        
        // minificationが有効な場合は適用
        if (enableMinification && mode === 'production') {
          try {
            const category = getFileCategory(filePath, patterns);
            partialContent = await minifyTemplate(partialContent, category, minificationLevel);
            console.log(`[handlebars-minify] [${category}] Partial ${filePath}: minified for registration`);
          } catch (error) {
            console.warn(`[handlebars-minify] Failed to minify partial ${filePath}:`, (error as Error).message);
          }
        }
        
        // JavaScript文字列として安全にエスケープ
        const escapedContent = JSON.stringify(partialContent);
        
        // パーシャル名にディレクトリ構造を反映
        const relativePath = filePath.replace(partialsDir, '').replace(/^[\/\\]/, '');
        const partialKey = relativePath.replace(/\.hbs$/, '').replace(/[\/\\]/g, '/');
        
        // パーシャルもプリコンパイルする場合
        const precompiledPartial = Handlebars.precompile(partialContent);
        registrationCode.push(`  Handlebars.registerPartial('${partialKey}', Handlebars.template(${precompiledPartial}));`);
        
        // 生の文字列として登録する場合 実行時コンパイル）
        // registrationCode.push(`  Handlebars.registerPartial('${partialKey}', ${escapedContent});`);
      }
    }
  }
  
  await processDirectory(partialsDir);
  return registrationCode.join('\n');
}
