# Handlebars Precompile Performance Benchmark

このディレクトリには、`vite-plugin-handlebars-precompile`のパフォーマンスをテストするためのベンチマークスクリプトが含まれています。

## 📋 概要

プリコンパイル済みテンプレートとランタイムコンパイルのパフォーマンス比較を行い、以下の項目を測定します：

- **実行速度** (ops/sec)
- **平均実行時間** (ms)
- **ビルド時間** (Vite)

## 🚀 使用方法

### セットアップ

```bash
cd benchmark
npm install
```

### ベンチマーク実行

#### 基本ベンチマーク
```bash
npm run benchmark
```

#### 個別テスト
```bash
# プリコンパイル済みテンプレートのテスト
npm run test:precompiled

# ランタイムコンパイルのテスト
npm run test:runtime
```

#### Viteビルドベンチマーク
```bash
node vite-benchmark.js
```

## 📊 ベンチマーク内容

### 1. テンプレートベンチマーク (`benchmark.js`)

4種類のテンプレートでパフォーマンステスト：

- **simple.hbs**: シンプルな変数埋め込み
- **complex.hbs**: ネストされたオブジェクト、配列、条件分岐
- **list.hbs**: 大量のデータ（100件）のリスト表示
- **nested.hbs**: 深くネストされた構造

### 2. ランタイムテスト (`test-runtime.js`)

ランタイムでのテンプレートコンパイルと実行のテスト

### 3. プリコンパイルテスト (`test-precompiled.js`)

事前コンパイル済みテンプレートの実行テスト

### 4. Viteビルドベンチマーク (`vite-benchmark.js`)

プラグインありとなしでのViteビルド時間の比較

## 📈 結果の見方

### パフォーマンステーブル

| Template | Type | Ops/sec | Mean (ms) | Deviation (ms) | Samples |
|----------|------|---------|-----------|----------------|---------|
| simple.hbs | Runtime | 50,000 | 0.02 | 0.001 | 100 |
| simple.hbs | Precompiled | 150,000 | 0.007 | 0.0003 | 100 |

### 改善指標

| Template | Runtime Ops/sec | Precompiled Ops/sec | Improvement | Speedup |
|----------|----------------|-------------------|-------------|---------|
| simple.hbs | 50,000 | 150,000 | +200.0% | 3.0x |

### 指標の説明

- **Ops/sec**: 1秒間に実行可能な操作数（高いほど良い）
- **Mean (ms)**: 平均実行時間（低いほど良い）
- **Deviation (ms)**: 実行時間のばらつき（低いほど安定）
- **Samples**: 測定サンプル数
- **Improvement**: ランタイムと比較した改善率
- **Speedup**: ランタイムと比較した速度向上倍率

## 📁 出力ファイル

- `benchmark-results.json`: 詳細なベンチマーク結果
- `vite-build-benchmark.json`: Viteビルドベンチマーク結果
- `templates/`: 自動生成されるテストテンプレート
- `test-project/`: Viteベンチマーク用テストプロジェクト

## 🔧 カスタマイズ

### ベンチマーク設定

`benchmark.js`の`BENCHMARK_CONFIG`で設定変更可能：

```javascript
const BENCHMARK_CONFIG = {
  minSamples: 100,    // 最小サンプル数
  maxTime: 10,        // 最大実行時間（秒）
  templates: [        // テストするテンプレート
    'simple.hbs',
    'complex.hbs',
    'list.hbs',
    'nested.hbs'
  ]
};
```

### データサイズの調整

`SAMPLE_DATA`でテストデータのサイズを調整：

```javascript
const SAMPLE_DATA = {
  list: {
    items: Array.from({ length: 1000 }, (_, i) => ({ // 100 → 1000に変更
      // ...
    }))
  }
};
```

## 💡 使用例

### CI/CDでの継続的パフォーマンステスト

```yaml
# .github/workflows/performance.yml
- name: Run Performance Benchmark
  run: |
    cd benchmark
    npm install
    npm run benchmark
    
- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: benchmark-results
    path: benchmark/benchmark-results.json
```

### 開発中のパフォーマンス確認

```bash
# 開発前のベースライン取得
npm run benchmark > baseline.txt

# 変更後のパフォーマンス確認
npm run benchmark > after-changes.txt

# 結果の比較
diff baseline.txt after-changes.txt
```

## 📚 参考情報

- [Handlebars.js Documentation](https://handlebarsjs.com/)
- [Benchmark.js](https://benchmarkjs.com/)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
