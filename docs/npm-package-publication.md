# vite-plugin-handlebars-precompile NPM Package Publication Guide

## Overview

このドキュメントでは、現在プロジェクト内で使用している`vite-plugin-handlebars-precompile.js`を独立したNPMパッケージとして公開し、OSSプロジェクトとして管理するためのステップを説明します。

## 目標

1. **NPMパッケージ化**: `vite-plugin-handlebars-precompile`として独立したパッケージを作成
2. **OSS公開**: GitHubでのオープンソースプロジェクトとして管理
3. **本プロジェクトでの利用**: NPMモジュールとしてインストール・利用

## Phase 1: NPMパッケージプロジェクトの作成

### 1.1 新しいリポジトリの作成

```bash
# 新しいディレクトリを作成
mkdir vite-plugin-handlebars-precompile
cd vite-plugin-handlebars-precompile

# Git リポジトリを初期化
git init

# GitHub で新しいリポジトリを作成
gh repo create vite-plugin-handlebars-precompile --public --description "A Vite plugin for precompiling Handlebars templates with HTML minification support"
```

### 1.2 package.json の作成

```bash
npm init -y
```

`package.json`を以下のように編集:

```json
{
  "name": "vite-plugin-handlebars-precompile",
  "version": "1.0.0",
  "description": "A Vite plugin for precompiling Handlebars templates with HTML minification support",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.esm.js",
      "require": "./dist/index.js"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext .js,.ts",
    "lint:fix": "eslint src --ext .js,.ts --fix",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm run test && npm run lint"
  },
  "keywords": [
    "vite",
    "plugin",
    "handlebars",
    "precompile",
    "template",
    "minification",
    "html",
    "build-tool"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/vite-plugin-handlebars-precompile.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/vite-plugin-handlebars-precompile/issues"
  },
  "homepage": "https://github.com/yourusername/vite-plugin-handlebars-precompile#readme",
  "peerDependencies": {
    "vite": "^4.0.0 || ^5.0.0",
    "handlebars": "^4.7.0"
  },
  "dependencies": {
    "html-minifier-terser": "^7.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "handlebars": "^4.7.8",
    "rollup": "^4.0.0",
    "@rollup/plugin-node-resolve": "^15.0.0",
    "@rollup/plugin-commonjs": "^25.0.0",
    "@rollup/plugin-typescript": "^11.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  }
}
```

### 1.3 プロジェクト構造の作成

```
vite-plugin-handlebars-precompile/
├── src/
│   ├── index.ts
│   ├── types.ts
│   └── utils/
│       ├── minification.ts
│       ├── partials.ts
│       └── statistics.ts
├── test/
│   ├── fixtures/
│   └── plugin.test.ts
├── docs/
│   └── api.md
├── examples/
│   └── basic/
├── dist/          # ビルド出力
├── package.json
├── tsconfig.json
├── rollup.config.js
├── vitest.config.js
├── .eslintrc.js
├── .gitignore
├── README.md
└── LICENSE
```

## Phase 2: ソースコードの移行とリファクタリング

### 2.1 TypeScript への変換

現在の`vite-plugin-handlebars-precompile.js`をTypeScriptに変換し、モジュール化します。

#### `src/types.ts`
```typescript
export interface MinificationOptions {
  collapseWhitespace?: boolean;
  removeComments?: boolean;
  removeAttributeQuotes?: boolean;
  removeEmptyAttributes?: boolean;
  removeRedundantAttributes?: boolean;
  removeScriptTypeAttributes?: boolean;
  removeStyleLinkTypeAttributes?: boolean;
  minifyCSS?: boolean;
  minifyJS?: boolean;
  preserveLineBreaks?: boolean;
  ignoreCustomFragments?: RegExp[];
}

export interface CategoryConfig {
  level: 'conservative' | 'aggressive';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface MinificationPattern {
  pattern: string;
  category: string;
}

export interface PluginOptions {
  partialsDir?: string;
  enableMinification?: boolean;
  mode?: string;
  minificationLevel?: 'conservative' | 'aggressive';
  patterns?: MinificationPattern[];
  categoryConfigs?: Record<string, CategoryConfig>;
  exportStats?: boolean;
  detailedLog?: boolean;
}

export interface MinificationStats {
  totalFiles: number;
  totalOriginalSize: number;
  totalMinifiedSize: number;
  errors: Array<{
    file: string;
    error: string;
    timestamp: string;
    fallbackUsed?: boolean;
  }>;
  warnings: Array<{
    file: string;
    message: string;
    timestamp: string;
  }>;
  startTime: number | null;
  endTime: number | null;
  fileDetails: Array<{
    name: string;
    category: string;
    originalSize: number;
    minifiedSize: number;
    reduction: number;
    minificationLevel: string;
    timestamp: string;
  }>;
  categories: Record<string, {
    files: number;
    originalSize: number;
    minifiedSize: number;
    reduction: number;
  }>;
  performanceMetrics: {
    largestFile: { name: string; originalSize: number; minifiedSize: number; reduction: number };
    smallestFile: { name: string; originalSize: number; minifiedSize: number; reduction: number };
    bestReduction: { name: string; originalSize: number; minifiedSize: number; reduction: number };
    worstReduction: { name: string; originalSize: number; minifiedSize: number; reduction: number };
  };
}
```

#### `src/index.ts`
```typescript
import { Plugin } from 'vite';
import { PluginOptions } from './types';
import { createMinificationHandler } from './utils/minification';
import { createPartialHandler } from './utils/partials';
import { createStatisticsHandler } from './utils/statistics';

export function handlebarsPrecompile(options: PluginOptions = {}): Plugin {
  // プラグインの実装
}

export type { PluginOptions, MinificationOptions, MinificationStats } from './types';
```

### 2.2 ユーティリティモジュールの分離

#### `src/utils/minification.ts`
- HTML最小化ロジック
- カテゴリ別設定管理
- パターンマッチング

#### `src/utils/partials.ts`
- パーシャル検出・登録ロジック
- ディレクトリ走査
- パーシャル名生成

#### `src/utils/statistics.ts`
- 統計データ収集
- レポート生成
- JSON出力

## Phase 3: ビルド設定とテスト

### 3.1 TypeScript設定 (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### 3.2 Rollup設定 (`rollup.config.js`)

```javascript
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist'
      })
    ],
    external: ['vite', 'handlebars', 'html-minifier-terser', 'fs', 'path']
  },
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json'
      })
    ],
    external: ['vite', 'handlebars', 'html-minifier-terser', 'fs', 'path']
  }
];
```

### 3.3 テスト設定 (`vitest.config.js`)

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
});
```

### 3.4 テストファイルの作成

#### `test/plugin.test.ts`
```typescript
import { describe, it, expect, vi } from 'vitest';
import { handlebarsPrecompile } from '../src';

describe('handlebarsPrecompile', () => {
  it('should create a vite plugin', () => {
    const plugin = handlebarsPrecompile();
    expect(plugin.name).toBe('handlebars-precompile');
  });

  // 他のテストケース
});
```

## Phase 4: ドキュメント作成

### 4.1 README.md

```markdown
# vite-plugin-handlebars-precompile

A Vite plugin for precompiling Handlebars templates with HTML minification support.

## Features

- ✨ Precompile Handlebars templates at build time
- 🗜️ HTML minification with Handlebars-aware parsing
- 📊 Detailed build statistics
- 🔄 Auto-registration of partials
- 🎯 Category-based optimization
- 🔥 Hot reload support in development

## Installation

```bash
npm install vite-plugin-handlebars-precompile --save-dev
```

## Usage

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { handlebarsPrecompile } from 'vite-plugin-handlebars-precompile';

export default defineConfig({
  plugins: [
    handlebarsPrecompile({
      enableMinification: true,
      minificationLevel: 'aggressive'
    })
  ]
});
```

## API Documentation

[Detailed API documentation](./docs/api.md)
```

### 4.2 API Documentation (`docs/api.md`)

詳細なAPIドキュメント、設定オプション、使用例を記載。

## Phase 5: CI/CD とリリース準備

### 5.1 GitHub Actions (`/.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm run lint
    - run: npm run typecheck
    - run: npm run test
    - run: npm run build
```

### 5.2 リリースワークフロー (`/.github/workflows/release.yml`)

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        registry-url: 'https://registry.npmjs.org'
        cache: 'npm'
    - run: npm ci
    - run: npm run build
    - run: npm publish
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Phase 6: NPM公開

### 6.1 NPMアカウント設定

```bash
# NPMアカウントでログイン
npm login

# 2FA設定（推奨）
npm profile enable-2fa auth-and-writes
```

### 6.2 初回公開

```bash
# ビルド実行
npm run build

# テスト実行
npm test

# 公開前のドライランチェック
npm publish --dry-run

# 公開実行
npm publish
```

### 6.3 バージョン管理

```bash
# パッチバージョンアップ
npm version patch

# マイナーバージョンアップ
npm version minor

# メジャーバージョンアップ
npm version major

# タグをプッシュ（GitHub Actionsのリリースをトリガー）
git push origin --tags
```

## Phase 7: 元プロジェクトでの利用切り替え

### 7.1 NPMパッケージのインストール

```bash
# acul-login-vanilla プロジェクトで実行
cd /path/to/acul-login-vanilla
npm install vite-plugin-handlebars-precompile --save-dev
```

### 7.2 vite.config.js の更新

```javascript
import { defineConfig } from 'vite';
import { handlebarsPrecompile } from 'vite-plugin-handlebars-precompile';

export default defineConfig(({ mode }) => ({
  plugins: [
    handlebarsPrecompile({
      enableMinification: mode === 'production',
      mode: mode,
      minificationLevel: 'aggressive'
    })
  ],
  // ... 既存の設定
}));
```

### 7.3 既存ファイルのクリーンアップ

```bash
# 既存のローカルプラグインファイルを削除
rm vite-plugin-handlebars-precompile.js

# package.json から不要な devDependencies を削除
# html-minifier-terser は NPM パッケージに含まれるため削除可能
```

## Phase 8: メンテナンスと改善

### 8.1 継続的改善

- ユーザーフィードバックの収集
- バグ修正とパフォーマンス改善
- 新機能の追加
- ドキュメントの更新

### 8.2 コミュニティ構築

- GitHub Issues/Discussions の活用
- Contributing ガイドラインの作成
- コミュニティからのPR受け入れ

## 注意事項

1. **Breaking Changes**: メジャーバージョンアップ時の互換性に注意
2. **Security**: 依存関係の脆弱性定期チェック
3. **Performance**: 大規模プロジェクトでのパフォーマンステスト
4. **Documentation**: API変更時のドキュメント同期更新

## 参考リンク

- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Vite Plugin Development](https://vitejs.dev/guide/api-plugin.html)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
