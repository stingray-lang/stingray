// Stingray Bundler - Webpack/Vite integration for Stingray
const path = require('path');
const fs = require('fs');

class StingrayBundler {
  constructor(options = {}) {
    this.options = {
      target: 'web',
      mode: 'development',
      entry: './src/index.stngr',
      output: './dist',
      minify: false,
      sourcemap: true,
      splitChunks: true,
      treeShaking: true,
      ...options
    };
  }

  async bundle() {
    console.log('[Stingray Bundler] Starting bundle...');
    console.log(`  Entry: ${this.options.entry}`);
    console.log(`  Output: ${this.options.output}`);
    console.log(`  Mode: ${this.options.mode}`);

    const startTime = Date.now();

    // Resolve entry point
    const entryPath = path.resolve(this.options.entry);
    
    if (!fs.existsSync(entryPath)) {
      throw new Error(`Entry file not found: ${entryPath}`);
    }

    // Read and parse entry
    const source = fs.readFileSync(entryPath, 'utf-8');
    const { StingrayParser } = require('../parser/parser');
    const { StingrayTranspiler } = require('../transpiler/transpiler');

    const parser = new StingrayParser();
    const transpiler = new StingrayTranspiler();

    const ast = parser.parse(source, path.basename(entryPath));
    const transpiled = transpiler.transpile(ast, path.basename(entryPath));

    // Create output directory
    const outputDir = path.resolve(this.options.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write output files
    const outputFile = path.join(outputDir, 'index.html');
    const htmlContent = this.generateBundleHTML(transpiled);
    fs.writeFileSync(outputFile, htmlContent);

    // Write JS bundle
    if (transpiled.js) {
      const jsFile = path.join(outputDir, 'bundle.js');
      fs.writeFileSync(jsFile, transpiled.js);
    }

    // Write CSS bundle
    if (transpiled.css) {
      const cssFile = path.join(outputDir, 'bundle.css');
      fs.writeFileSync(cssFile, transpiled.css);
    }

    const buildTime = Date.now() - startTime;
    console.log(`[Stingray Bundler] Complete in ${buildTime}ms`);
    console.log(`  Output: ${outputFile}`);

    return {
      success: true,
      outputDir,
      files: {
        html: outputFile,
        js: transpiled.js ? path.join(outputDir, 'bundle.js') : null,
        css: transpiled.css ? path.join(outputDir, 'bundle.css') : null
      },
      buildTime
    };
  }

  generateBundleHTML(transpiled) {
    const cssTag = transpiled.css 
      ? `<style>${transpiled.css}</style>` 
      : '';
    const jsTag = transpiled.js 
      ? `<script type="module">${transpiled.js}</script>` 
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stingray App</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐟</text></svg>">
  ${cssTag}
  <script type="module" src="https://cdn.jsdelivr.net/npm/@material/web/all.js" defer></script>
</head>
<body>
  ${transpiled.html}
  ${jsTag}
</body>
</html>`;
  }

  async bundleProduction() {
    this.options.mode = 'production';
    this.options.minify = true;
    return this.bundle();
  }

  async bundleDevelopment() {
    this.options.mode = 'development';
    this.options.minify = false;
    this.options.sourcemap = true;
    return this.bundle();
  }
}

module.exports = { StingrayBundler };
