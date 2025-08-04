import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

// プリコンパイル済みテンプレートのテスト
console.log(chalk.blue('🔧 Testing Precompiled Templates...\n'));

// サンプルデータ
const sampleData = {
  title: 'Precompiled Template Test',
  message: 'This template was precompiled for better performance',
  items: [
    { name: 'Item 1', value: 100 },
    { name: 'Item 2', value: 200 },
    { name: 'Item 3', value: 300 }
  ]
};

try {
  // テンプレートファイルを読み込み
  const templateSource = readFileSync(join('templates', 'simple.hbs'), 'utf8');
  
  console.log(chalk.yellow('📄 Template Source:'));
  console.log(templateSource);
  
  // プリコンパイル
  const precompiled = Handlebars.precompile(templateSource);
  console.log(chalk.yellow('\n🔨 Precompiled Code:'));
  console.log(precompiled);
  
  // プリコンパイル済みテンプレートから実行可能な関数を作成
  const template = Handlebars.template(eval(`(${precompiled})`));
  
  // レンダリング実行
  const startTime = performance.now();
  const result = template(sampleData);
  const endTime = performance.now();
  
  console.log(chalk.yellow('\n🎨 Rendered Output:'));
  console.log(result);
  
  console.log(chalk.green(`\n⚡ Execution Time: ${(endTime - startTime).toFixed(4)}ms`));
  
} catch (error) {
  console.error(chalk.red('❌ Error:'), error.message);
}
