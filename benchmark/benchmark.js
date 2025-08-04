import Benchmark from 'benchmark';
import Handlebars from 'handlebars';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import chalk from 'chalk';
import { table } from 'table';

// ベンチマーク設定
const BENCHMARK_CONFIG = {
  minSamples: 100,
  maxTime: 10, // seconds
  templates: [
    'simple.hbs',
    'complex.hbs',
    'list.hbs',
    'nested.hbs'
  ]
};

// テンプレートサンプルデータ
const SAMPLE_DATA = {
  simple: {
    title: 'Hello World',
    message: 'This is a simple template'
  },
  complex: {
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      profile: {
        age: 30,
        location: 'Tokyo',
        skills: ['JavaScript', 'TypeScript', 'Node.js']
      }
    },
    posts: [
      { title: 'Post 1', content: 'Content 1', date: '2024-01-01' },
      { title: 'Post 2', content: 'Content 2', date: '2024-01-02' },
      { title: 'Post 3', content: 'Content 3', date: '2024-01-03' }
    ],
    settings: {
      theme: 'dark',
      notifications: true,
      language: 'ja'
    }
  },
  list: {
    items: Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      value: Math.random() * 100,
      active: Math.random() > 0.5
    }))
  },
  nested: {
    company: {
      name: 'Tech Corp',
      departments: [
        {
          name: 'Engineering',
          teams: [
            { name: 'Frontend', members: 5 },
            { name: 'Backend', members: 8 },
            { name: 'DevOps', members: 3 }
          ]
        },
        {
          name: 'Design',
          teams: [
            { name: 'UX', members: 4 },
            { name: 'UI', members: 6 }
          ]
        }
      ]
    }
  }
};

class HandlebarsPerformanceBenchmark {
  constructor() {
    this.results = [];
    this.compiledTemplates = new Map();
    this.sourceTemplates = new Map();
    
    this.setupTemplates();
    this.precompileTemplates();
  }

  setupTemplates() {
    const templatesDir = join(process.cwd(), 'templates');
    if (!existsSync(templatesDir)) {
      mkdirSync(templatesDir, { recursive: true });
    }

    // シンプルテンプレート
    const simpleTemplate = `
<div class="container">
  <h1>{{title}}</h1>
  <p>{{message}}</p>
</div>`;

    // 複雑なテンプレート
    const complexTemplate = `
<div class="user-profile">
  <header>
    <h1>{{user.name}}</h1>
    <p>{{user.email}} | {{user.profile.age}} years old | {{user.profile.location}}</p>
  </header>
  
  <section class="skills">
    <h2>Skills</h2>
    <ul>
      {{#each user.profile.skills}}
      <li>{{this}}</li>
      {{/each}}
    </ul>
  </section>
  
  <section class="posts">
    <h2>Recent Posts</h2>
    {{#each posts}}
    <article>
      <h3>{{title}}</h3>
      <p>{{content}}</p>
      <time>{{date}}</time>
    </article>
    {{/each}}
  </section>
  
  <section class="settings">
    <h2>Settings</h2>
    <ul>
      <li>Theme: {{settings.theme}}</li>
      <li>Notifications: {{#if settings.notifications}}Enabled{{else}}Disabled{{/if}}</li>
      <li>Language: {{settings.language}}</li>
    </ul>
  </section>
</div>`;

    // リストテンプレート
    const listTemplate = `
<div class="item-list">
  <h1>Items ({{items.length}})</h1>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Value</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr class="{{#if active}}active{{else}}inactive{{/if}}">
        <td>{{id}}</td>
        <td>{{name}}</td>
        <td>{{value}}</td>
        <td>{{#if active}}Active{{else}}Inactive{{/if}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</div>`;

    // ネストされたテンプレート
    const nestedTemplate = `
<div class="company">
  <h1>{{company.name}}</h1>
  
  {{#each company.departments}}
  <div class="department">
    <h2>{{name}} Department</h2>
    
    {{#each teams}}
    <div class="team">
      <h3>{{name}} Team</h3>
      <p>Members: {{members}}</p>
      
      {{#if (gt members 5)}}
      <span class="badge large">Large Team</span>
      {{else}}
      <span class="badge small">Small Team</span>
      {{/if}}
    </div>
    {{/each}}
  </div>
  {{/each}}
</div>`;

    // テンプレートファイルを作成
    writeFileSync(join(templatesDir, 'simple.hbs'), simpleTemplate);
    writeFileSync(join(templatesDir, 'complex.hbs'), complexTemplate);
    writeFileSync(join(templatesDir, 'list.hbs'), listTemplate);
    writeFileSync(join(templatesDir, 'nested.hbs'), nestedTemplate);

    // Handlebarsヘルパーを登録
    Handlebars.registerHelper('gt', function(a, b) {
      return a > b;
    });

    // ソーステンプレートを読み込み
    BENCHMARK_CONFIG.templates.forEach(templateName => {
      const templatePath = join(templatesDir, templateName);
      const source = readFileSync(templatePath, 'utf8');
      this.sourceTemplates.set(templateName, source);
    });
  }

  precompileTemplates() {
    this.sourceTemplates.forEach((source, templateName) => {
      const compiled = Handlebars.precompile(source);
      const template = Handlebars.template(eval(`(${compiled})`));
      this.compiledTemplates.set(templateName, template);
    });
  }



  runRuntimeBenchmark(templateName) {
    const source = this.sourceTemplates.get(templateName);
    const dataKey = templateName.replace('.hbs', '');
    const data = SAMPLE_DATA[dataKey];

    return new Promise((resolve) => {
      const suite = new Benchmark.Suite();
      
      suite
        .add(`Runtime Compilation - ${templateName}`, () => {
          const template = Handlebars.compile(source);
          template(data);
        }, {
          minSamples: BENCHMARK_CONFIG.minSamples,
          maxTime: BENCHMARK_CONFIG.maxTime
        })
        .on('complete', (event) => {
          const result = event.target;
          
          resolve({
            name: `Runtime - ${templateName}`,
            hz: result.hz,
            mean: result.stats.mean * 1000, // Convert to milliseconds
            deviation: result.stats.deviation * 1000,
            samples: result.stats.sample.length
          });
        })
        .run();
    });
  }

  runPrecompiledBenchmark(templateName) {
    const template = this.compiledTemplates.get(templateName);
    const dataKey = templateName.replace('.hbs', '');
    const data = SAMPLE_DATA[dataKey];

    return new Promise((resolve) => {
      const suite = new Benchmark.Suite();
      
      suite
        .add(`Precompiled - ${templateName}`, () => {
          template(data);
        }, {
          minSamples: BENCHMARK_CONFIG.minSamples,
          maxTime: BENCHMARK_CONFIG.maxTime
        })
        .on('complete', (event) => {
          const result = event.target;
          
          resolve({
            name: `Precompiled - ${templateName}`,
            hz: result.hz,
            mean: result.stats.mean * 1000,
            deviation: result.stats.deviation * 1000,
            samples: result.stats.sample.length
          });
        })
        .run();
    });
  }

  async runBenchmarks() {
    console.log(chalk.blue('🚀 Starting Handlebars Performance Benchmark...\n'));

    for (const templateName of BENCHMARK_CONFIG.templates) {
      console.log(chalk.yellow(`⏱️  Benchmarking ${templateName}...`));
      
      // Runtime compilation benchmark
      const runtimeResult = await this.runRuntimeBenchmark(templateName);
      this.results.push(runtimeResult);
      
      // Precompiled benchmark
      const precompiledResult = await this.runPrecompiledBenchmark(templateName);
      this.results.push(precompiledResult);
      
      console.log(chalk.green(`✅ Completed ${templateName}\n`));
    }
  }

  generateReport() {
    console.log(chalk.blue.bold('\n📊 Benchmark Results\n'));

    // Performance comparison table
    const performanceData = [
      ['Template', 'Type', 'Ops/sec', 'Mean (ms)', 'Deviation (ms)', 'Samples']
    ];

    this.results.forEach(result => {
      performanceData.push([
        result.name.split(' - ')[1] || result.name,
        result.name.includes('Runtime') ? 'Runtime' : 'Precompiled',
        Math.round(result.hz).toLocaleString(),
        result.mean.toFixed(4),
        result.deviation.toFixed(4),
        result.samples.toString()
      ]);
    });

    console.log(table(performanceData, {
      border: {
        topBody: '─',
        topJoin: '┬',
        topLeft: '┌',
        topRight: '┐',
        bottomBody: '─',
        bottomJoin: '┴',
        bottomLeft: '└',
        bottomRight: '┘',
        bodyLeft: '│',
        bodyRight: '│',
        bodyJoin: '│',
        joinBody: '─',
        joinLeft: '├',
        joinRight: '┤',
        joinJoin: '┼'
      }
    }));

    // Performance improvements
    console.log(chalk.blue.bold('\n🚀 Performance Improvements\n'));

    const improvementData = [
      ['Template', 'Runtime Ops/sec', 'Precompiled Ops/sec', 'Improvement', 'Speedup']
    ];

    for (let i = 0; i < this.results.length; i += 2) {
      const runtime = this.results[i];
      const precompiled = this.results[i + 1];
      
      if (runtime && precompiled) {
        const improvement = ((precompiled.hz - runtime.hz) / runtime.hz * 100);
        const speedup = precompiled.hz / runtime.hz;
        
        improvementData.push([
          runtime.name.split(' - ')[1],
          Math.round(runtime.hz).toLocaleString(),
          Math.round(precompiled.hz).toLocaleString(),
          `+${improvement.toFixed(1)}%`,
          `${speedup.toFixed(1)}x`
        ]);
      }
    }

    console.log(table(improvementData, {
      border: {
        topBody: '─',
        topJoin: '┬',
        topLeft: '┌',
        topRight: '┐',
        bottomBody: '─',
        bottomJoin: '┴',
        bottomLeft: '└',
        bottomRight: '┘',
        bodyLeft: '│',
        bodyRight: '│',
        bodyJoin: '│',
        joinBody: '─',
        joinLeft: '├',
        joinRight: '┤',
        joinJoin: '┼'
      }
    }));

    // Save results to JSON
    const reportData = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      handlebarsVersion: Handlebars.VERSION,
      config: BENCHMARK_CONFIG,
      results: this.results,
      improvements: improvementData.slice(1).map((row, i) => ({
        template: row[0],
        runtimeOpsPerSec: parseInt(row[1].replace(/,/g, '')),
        precompiledOpsPerSec: parseInt(row[2].replace(/,/g, '')),
        improvement: row[3],
        speedup: row[4]
      }))
    };

    writeFileSync('benchmark-results.json', JSON.stringify(reportData, null, 2));
    console.log(chalk.green('\n✅ Results saved to benchmark-results.json'));
  }
}

// Run benchmark
async function main() {
  const benchmark = new HandlebarsPerformanceBenchmark();
  await benchmark.runBenchmarks();
  benchmark.generateReport();
}

main().catch(console.error);
