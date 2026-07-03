// Stingray Main Entry - ESM version
export { StingrayParser } from './parser/parser.js';
export { StingrayTranspiler } from './transpiler/transpiler.js';
export { StingrayCompiler } from './compiler/compiler.js';
export { StingrayRuntime } from './runtime/runtime.js';
export { COMPONENTS, THEMES, generateComponentDefinitions } from './components/components.js';
export { StingrayBundler } from './bundler/bundler.js';
export { StingrayOptimizer } from './optimizer/optimizer.js';
export { StingrayCLI } from './cli/cli.js';

// Default export with convenience methods
export default {
  compile: async (input, output) => {
    const { StingrayCompiler } = await import('./compiler/compiler.js');
    const compiler = new StingrayCompiler();
    return compiler.compile(input, output);
  },
  run: async (args) => {
    const { StingrayCLI } = await import('./cli/cli.js');
    const cli = new StingrayCLI();
    return cli.run(args);
  }
};
