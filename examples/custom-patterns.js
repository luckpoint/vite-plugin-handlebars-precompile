// Custom patterns configuration example
import { handlebarsPrecompile } from 'vite-plugin-handlebars-precompile';

export default {
  plugins: [
    handlebarsPrecompile({
      // カスタムパターンの設定
      patterns: [
        { pattern: 'src/pages/**/*.hbs', category: 'pages' },
        { pattern: 'src/components/**/*.hbs', category: 'components' },
        { pattern: 'src/emails/**/*.hbs', category: 'emails' },
        { pattern: 'src/layouts/*.hbs', category: 'layouts' },
        { pattern: 'src/partials/**/*.hbs', category: 'partials' }
      ],
      
      // カテゴリ別の最適化設定
      categoryConfigs: {
        pages: { level: 'aggressive', priority: 'high' },
        components: { level: 'conservative', priority: 'critical' },
        emails: { level: 'conservative', priority: 'high' },
        layouts: { level: 'aggressive', priority: 'medium' },
        partials: { level: 'conservative', priority: 'critical' }
      },
      
      // その他の設定
      partialsDir: 'src/partials',
      enableMinification: true,
      minificationLevel: 'aggressive',
      exportStats: true,
      detailedLog: true
    })
  ]
};

// 使用方法の説明:
//
// 1. patterns: ファイルパスのパターンマッチング
//    - Globパターンを使用してファイルをカテゴリ分け
//    - より具体的なパターンを先に配置することを推奨
//
// 2. categoryConfigs: カテゴリ別の最適化レベル
//    - level: 'conservative' | 'aggressive'
//    - priority: 'low' | 'medium' | 'high' | 'critical'
//
// 3. 環境変数での制御も可能:
//    - VITE_MINIFY_EXPORT_STATS=true
//    - VITE_MINIFY_DETAILED_LOG=true
