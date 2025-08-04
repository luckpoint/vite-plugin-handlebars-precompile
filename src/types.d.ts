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
    [key: string]: any;
  }

  function minify(text: string, options?: Options): Promise<string>;
  export { minify, Options };
}

declare module 'handlebars' {
  export interface TemplateDelegate<T = any> {
    (context: T, options?: RuntimeOptions): string;
  }

  export interface RuntimeOptions {
    data?: any;
    helpers?: { [name: string]: Function };
    partials?: { [name: string]: any };
    decorators?: { [name: string]: Function };
  }

  export function precompile(input: string, options?: any): string;
  export function template(precompiled: any): TemplateDelegate;
  export function registerPartial(name: string, partial: string): void;

  const Handlebars: {
    precompile: typeof precompile;
    template: typeof template;
    registerPartial: typeof registerPartial;
  };

  export default Handlebars;
}
