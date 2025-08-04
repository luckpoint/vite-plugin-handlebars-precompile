import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

// ランタイムコンパイルのテスト
console.log(chalk.blue('⚡ Testing Runtime Compilation...\n'));

// サンプルデータ
const sampleData = {
  title: 'Runtime Compilation Test',
  message: 'This template is compiled at runtime',
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
  
  // ランタイムコンパイル
  const startCompileTime = performance.now();
  const template = Handlebars.compile(templateSource);
  const endCompileTime = performance.now();
  
  console.log(chalk.green(`⚡ Compilation Time: ${(endCompileTime - startCompileTime).toFixed(4)}ms`));
  
  // レンダリング実行
  const startRenderTime = performance.now();
  const result = template(sampleData);
  const endRenderTime = performance.now();
  
  console.log(chalk.yellow('\n🎨 Rendered Output:'));
  console.log(result);
  
  console.log(chalk.green(`\n⚡ Rendering Time: ${(endRenderTime - startRenderTime).toFixed(4)}ms`));
  console.log(chalk.green(`📊 Total Time: ${(endRenderTime - startCompileTime).toFixed(4)}ms`));
  
} catch (error) {
  console.error(chalk.red('❌ Error:'), error.message);
}
