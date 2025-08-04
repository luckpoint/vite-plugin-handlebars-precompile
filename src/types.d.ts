declare module 'html-minifier-terser' {
  interface Options {
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
    [key: string]: unknown;
  }

  function minify(text: string, options?: Options): Promise<string>;
  export { minify, Options };
}
