import Handlebars from 'handlebars';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { Plugin } from 'vite';
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
    partialsDir = 'src/shared', 
    enableMinification = true, 
    mode = 'development',
    minificationLevel = 'aggressive',
    patterns,
    categoryConfigs,
    exportStats = process.env.VITE_MINIFY_EXPORT_STATS === 'true',
    detailedLog = process.env.VITE_MINIFY_DETAILED_LOG === 'true'
  } = options;
  
  let partialsRegistered = false;
  let minificationStats = createMinificationStats();
  
  return {
    name: 'handlebars-precompile',
    buildStart() {
      // ビルド開始時にパーシャルを登録
      const fullPartialsDir = resolve(partialsDir);
      registerPartials(fullPartialsDir);
      partialsRegistered = true;
      
      // 統計データ初期化
      if (enableMinification && mode === 'production') {
        minificationStats.startTime = Date.now();
        console.log(`[handlebars-minify] Starting minification with ${minificationLevel} level`);
      }
    },
    
    async load(id: string) {
      // ?compiled クエリパラメータが付いた .hbs ファイルを処理
      if (id.endsWith('.hbs?compiled')) {
        const filePath = id.replace('?compiled', '');
        
        // ファイルの存在確認
        if (!existsSync(filePath)) {
          this.error(`Handlebars template file not found: ${filePath}`);
          return;
        }
        
        // パーシャルがまだ登録されていない場合は登録
        if (!partialsRegistered) {
          const fullPartialsDir = resolve(partialsDir);
          registerPartials(fullPartialsDir);
          partialsRegistered = true;
        }
        
        try {
          // .hbs ファイルを読み込み
          let templateSource = readFileSync(filePath, 'utf-8');
          
          // HTML minificationをproductionビルドでのみ有効化
          if (enableMinification && mode === 'production') {
            try {
              const originalSize = templateSource.length;
              
              // ファイルパスからカテゴリを判定
              const category = getFileCategory(filePath, patterns || []);
              templateSource = await minifyTemplate(templateSource, category, minificationLevel, categoryConfigs);

              const minifiedSize = templateSource.length;
              const reduction = parseFloat(((originalSize - minifiedSize) / originalSize * 100).toFixed(1));
              
              // ファイル詳細情報を記録
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
              
              // エラー統計
              minificationStats.errors.push({
                file: filePath.replace(process.cwd(), ''),
                error: (minifyError as Error).message,
                timestamp: new Date().toISOString(),
                fallbackUsed: true
              });
              
              // 警告としても記録
              minificationStats.warnings.push({
                file: filePath.replace(process.cwd(), ''),
                message: `Minification failed, using original template`,
                timestamp: new Date().toISOString()
              });
            }
          }
          
          // デバッグ用：テンプレートソースにCSS変数が含まれているか確認
          if (templateSource.includes('var(--')) {
            console.log(`[handlebars-precompile] CSS variables found in: ${filePath}`);
          }
          
          // Handlebars でプリコンパイル
          const precompiled = Handlebars.precompile(templateSource, {
            strict: false,
            assumeObjects: false
          });
          
          // プリコンパイルされたテンプレート関数を返すESモジュールとして出力
          const partialRegistrationCode = await generatePartialRegistrationCode(
            resolve(partialsDir),
            enableMinification,
            mode,
            minificationLevel,
            patterns
          );
          
          const moduleCode = `
import Handlebars from 'handlebars';

// パーシャルを登録
${partialRegistrationCode}

// プリコンパイルされたテンプレート (from: ${filePath})
const template = Handlebars.template(${precompiled});

export default template;
`;
          
          return moduleCode;
        } catch (error) {
          this.error(`Failed to precompile Handlebars template: ${filePath}\n${(error as Error).message}`);
        }
      }
    },
    
    // ビルド終了時の詳細統計出力
    buildEnd() {
      if (enableMinification && mode === 'production' && minificationStats.totalFiles > 0) {
        minificationStats.endTime = Date.now();
        printStatisticsReport(minificationStats);
        
        // JSON統計ファイル出力（オプション）
        if (exportStats) {
          exportStatistics(minificationStats, minificationLevel);
        }
      }
    },
    
    // 開発時のホットリロード対応
    handleHotUpdate({ file, server }: { file: string; server: any }) {
      if (file.endsWith('.hbs')) {
        // .hbs ファイルが変更されたら、?compiled を使用しているモジュールも更新
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

// 型定義をエクスポート
export type { 
  PluginOptions, 
  MinificationOptions, 
  MinificationStats,
  CategoryConfig,
  MinificationPattern,
  FileDetail
} from './types';
