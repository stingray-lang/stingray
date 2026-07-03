// Stingray Main Module - Exports all core functionality
const { StingrayParser } = require('./parser/parser');
const { StingrayTranspiler } = require('./transpiler/transpiler');
const { StingrayCompiler } = require('./compiler/compiler');
const { StingrayRuntime } = require('./runtime/runtime');
const { COMPONENTS, generateComponentDefinitions, THEMES } = require('./components/components');
const { StingrayBundler } = require('./bundler/bundler');
const { StingrayOptimizer } = require('./optimizer/optimizer');
const { StingrayCLI } = require('./cli/cli');

module.exports = {
  // Core
  StingrayParser,
  StingrayTranspiler,
  StingrayCompiler,
  StingrayRuntime,
  StingrayBundler,
  StingrayOptimizer,
  StingrayCLI,

  // Components
  COMPONENTS,
  generateComponentDefinitions,
  THEMES,

  // Convenience function
  compile: async (input, output) => {
    const compiler = new StingrayCompiler();
    return compiler.compile(input, output);
  },

  transpile: (ast, filename) => {
    const transpiler = new StingrayTranspiler();
    return transpiler.transpile(ast, filename);
  },

  run: async (args) => {
    const cli = new StingrayCLI();
    return cli.run(args);
  }
};
