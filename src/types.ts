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

export interface FileDetail {
  name: string;
  category: string;
  originalSize: number;
  minifiedSize: number;
  reduction: number;
  minificationLevel: string;
  timestamp: string;
}

export interface CategoryStats {
  files: number;
  originalSize: number;
  minifiedSize: number;
  reduction: number;
}

export interface PerformanceMetrics {
  largestFile: FileDetail;
  smallestFile: FileDetail;
  bestReduction: FileDetail;
  worstReduction: FileDetail;
}

export interface MinificationError {
  file: string;
  error: string;
  timestamp: string;
  fallbackUsed?: boolean;
}

export interface MinificationWarning {
  file: string;
  message: string;
  timestamp: string;
}

export interface MinificationStats {
  totalFiles: number;
  totalOriginalSize: number;
  totalMinifiedSize: number;
  errors: MinificationError[];
  warnings: MinificationWarning[];
  startTime: number | null;
  endTime: number | null;
  fileDetails: FileDetail[];
  categories: Record<string, CategoryStats>;
  performanceMetrics: PerformanceMetrics;
}
