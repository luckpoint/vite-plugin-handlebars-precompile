import { build, createServer } from 'vite';
import { handlebarsPrecompile } from '../src/index.js';
import { join, resolve } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import chalk from 'chalk';

// Viteビルドのベンチマーク
class ViteBuildBenchmark {
  constructor() {
    this.results = [];
    this.setupTestProject();
  }

  setupTestProject() {
    const testDir = join(process.cwd(), 'test-project');
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }

    // テストプロジェクトの構造を作成
    const srcDir = join(testDir, 'src');
    const templatesDir = join(srcDir, 'templates');
    const partialsDir = join(srcDir, 'partials');

    [srcDir, templatesDir, partialsDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });

    // メインテンプレートファイル
    const mainTemplate = `
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  <header>{{> header}}</header>
  <main>
    <h1>{{heading}}</h1>
    {{#each articles}}
    <article>
      <h2>{{title}}</h2>
      <p>{{content}}</p>
      <footer>By {{author}} on {{date}}</footer>
    </article>
    {{/each}}
  </main>
  <footer>{{> footer}}</footer>
</body>
</html>`;

    // パーシャルテンプレート
    const headerPartial = `
<nav>
  <ul>
    {{#each navigation}}
    <li><a href="{{url}}">{{title}}</a></li>
    {{/each}}
  </ul>
</nav>`;

    const footerPartial = `
<div class="footer">
  <p>&copy; 2024 {{siteName}}. All rights reserved.</p>
</div>`;

    // JavaScriptファイル
    const mainJs = `
import template from './templates/main.hbs?compiled';

const data = {
  title: 'Benchmark Test',
  heading: 'Performance Test',
  articles: [
    {
      title: 'Article 1',
      content: 'This is the first article content.',
      author: 'John Doe',
      date: '2024-01-01'
    },
    {
      title: 'Article 2',
      content: 'This is the second article content.',
      author: 'Jane Smith',
      date: '2024-01-02'
    }
  ],
  navigation: [
    { title: 'Home', url: '/' },
    { title: 'About', url: '/about' },
    { title: 'Contact', url: '/contact' }
  ],
  siteName: 'Benchmark Site'
};

const html = template(data);
document.body.innerHTML = html;
`;

    // ファイルを書き込み
    writeFileSync(join(templatesDir, 'main.hbs'), mainTemplate);
    writeFileSync(join(partialsDir, 'header.hbs'), headerPartial);
    writeFileSync(join(partialsDir, 'footer.hbs'), footerPartial);
    writeFileSync(join(srcDir, 'main.js'), mainJs);

    // index.htmlファイル
    const indexHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Vite Benchmark</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>`;

    writeFileSync(join(testDir, 'index.html'), indexHtml);
  }

  async benchmarkWithPlugin() {
    const testDir = join(process.cwd(), 'test-project');
    
    console.log(chalk.yellow('🔧 Building with handlebars-precompile plugin...'));
    
    const startTime = performance.now();
    
    try {
      await build({
        root: testDir,
        plugins: [
          handlebarsPrecompile({
            partialsDir: 'src/partials',
            enableMinification: true,
            minificationLevel: 'aggressive'
          })
        ],
        build: {
          outDir: 'dist-with-plugin',
          emptyOutDir: true
        },
        logLevel: 'warn'
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(chalk.green(`✅ Build completed in ${duration.toFixed(2)}ms`));
      
      return {
        type: 'with-plugin',
        duration: duration,
        success: true
      };
    } catch (error) {
      console.error(chalk.red('❌ Build failed:'), error.message);
      return {
        type: 'with-plugin',
        duration: -1,
        success: false,
        error: error.message
      };
    }
  }

  async benchmarkWithoutPlugin() {
    const testDir = join(process.cwd(), 'test-project');
    
    console.log(chalk.yellow('⚡ Building without plugin (standard Vite)...'));
    
    // main.jsを修正（プラグインなしバージョン）
    const mainJsWithoutPlugin = `
import { readFileSync } from 'fs';
import Handlebars from 'handlebars';

// ランタイムでテンプレートを読み込み・コンパイル
const templateSource = await fetch('/src/templates/main.hbs').then(r => r.text());
const template = Handlebars.compile(templateSource);

const data = {
  title: 'Benchmark Test',
  heading: 'Performance Test',
  articles: [
    {
      title: 'Article 1',
      content: 'This is the first article content.',
      author: 'John Doe',
      date: '2024-01-01'
    },
    {
      title: 'Article 2',
      content: 'This is the second article content.',
      author: 'Jane Smith',
      date: '2024-01-02'
    }
  ],
  navigation: [
    { title: 'Home', url: '/' },
    { title: 'About', url: '/about' },
    { title: 'Contact', url: '/contact' }
  ],
  siteName: 'Benchmark Site'
};

const html = template(data);
document.body.innerHTML = html;
`;

    writeFileSync(join(testDir, 'src', 'main-runtime.js'), mainJsWithoutPlugin);
    
    const startTime = performance.now();
    
    try {
      await build({
        root: testDir,
        build: {
          outDir: 'dist-without-plugin',
          emptyOutDir: true,
          rollupOptions: {
            input: {
              main: join(testDir, 'index.html')
            }
          }
        },
        logLevel: 'warn'
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(chalk.green(`✅ Build completed in ${duration.toFixed(2)}ms`));
      
      return {
        type: 'without-plugin',
        duration: duration,
        success: true
      };
    } catch (error) {
      console.error(chalk.red('❌ Build failed:'), error.message);
      return {
        type: 'without-plugin',
        duration: -1,
        success: false,
        error: error.message
      };
    }
  }

  async runBenchmarks() {
    console.log(chalk.blue('🚀 Starting Vite Build Benchmark...\n'));

    const withPluginResult = await this.benchmarkWithPlugin();
    this.results.push(withPluginResult);

    console.log(''); // 空行

    const withoutPluginResult = await this.benchmarkWithoutPlugin();
    this.results.push(withoutPluginResult);

    this.generateReport();
  }

  generateReport() {
    console.log(chalk.blue.bold('\n📊 Vite Build Benchmark Results\n'));

    this.results.forEach(result => {
      const status = result.success ? chalk.green('✅ Success') : chalk.red('❌ Failed');
      const duration = result.success ? `${result.duration.toFixed(2)}ms` : 'N/A';
      
      console.log(`${chalk.yellow(result.type.toUpperCase())}: ${status} - ${duration}`);
      if (!result.success) {
        console.log(chalk.red(`  Error: ${result.error}`));
      }
    });

    const successfulResults = this.results.filter(r => r.success);
    if (successfulResults.length === 2) {
      const withPlugin = successfulResults.find(r => r.type === 'with-plugin');
      const withoutPlugin = successfulResults.find(r => r.type === 'without-plugin');
      
      if (withPlugin && withoutPlugin) {
        const difference = withoutPlugin.duration - withPlugin.duration;
        const percentChange = (difference / withoutPlugin.duration) * 100;
        
        console.log(chalk.blue.bold('\n🔍 Analysis:'));
        if (difference > 0) {
          console.log(chalk.green(`Plugin is ${difference.toFixed(2)}ms faster (${percentChange.toFixed(1)}% improvement)`));
        } else {
          console.log(chalk.red(`Plugin is ${Math.abs(difference).toFixed(2)}ms slower (${Math.abs(percentChange).toFixed(1)}% degradation)`));
        }
      }
    }

    // 結果をJSONで保存
    const reportData = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      results: this.results
    };

    writeFileSync('vite-build-benchmark.json', JSON.stringify(reportData, null, 2));
    console.log(chalk.green('\n✅ Results saved to vite-build-benchmark.json'));
  }
}

// ベンチマーク実行
async function main() {
  const benchmark = new ViteBuildBenchmark();
  await benchmark.runBenchmarks();
}

main().catch(console.error);
