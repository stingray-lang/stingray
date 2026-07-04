// Stingray Compiler - Main compilation engine
const fs = require('fs');
const path = require('path');
const { StingrayParser } = require('../parser/parser');
const { StingrayTranspiler } = require('../transpiler/transpiler');
const Terser = require('terser');

// Error display utilities
function printWutError(error, context = '') {
  const colors = {
    reset: '\x1b[0m', red: '\x1b[31m', yellow: '\x1b[33m',
    cyan: '\x1b[36m', bold: '\x1b[1m',
    dim: '\x1b[2m', bgRed: '\x1b[41m',
    white: '\x1b[37m'
  };
  
  function c(text, color) {
    return color ? colors[color] + text + colors.reset : text;
  }
  
  console.log(c('\n+======================================================+', 'red'));
  console.log(c('|                                                      |', 'red'));
  const wutLine = '|   ' + c('WUT?', 'bgRed') + '                                     |';
  console.log(c(wutLine, 'red'));
  console.log(c('|                                                      |', 'red'));
  console.log(c('+======================================================+', 'red'));
  
  console.log(c('\n' + '-'.repeat(55), 'dim'));
  console.log(c('  Full Error Log:', 'underline' + 'bold'));
  console.log(c('  ' + '-'.repeat(50), 'dim'));
  console.log(`    Timestamp:  ${new Date().toISOString()}`);
  console.log(`    Node:       ${process.version}`);
  console.log(`    Platform:   ${process.platform}`);
  console.log(`    Context:    ${context}`);
  console.log(`    Error:      ${c(error.message, 'red')}`);
  
  if (error.stack) {
    console.log(c('\n    Stack Trace:', 'dim'));
    error.stack.split('\n').slice(0, 5).forEach(line => {
      console.log(c('      ' + line, 'dim'));
    });
  }
  
  console.log(c('  ' + '-'.repeat(50), 'dim'));
  console.log(c('\n  Tip: Check your .stngr file syntax.\n', 'cyan'));
}

class StingrayCompiler {
  constructor(options = {}) {
    this.parser = new StingrayParser(options);
    this.transpiler = new StingrayTranspiler(options);
    this.options = {
      watch: false,
      sourcemap: true,
      minify: true,
      optimize: true,
      target: 'es2020',
      env: 'development',
      ...options
    };
    this.stats = {
      filesProcessed: 0,
      errors: [],
      warnings: [],
      buildTime: 0
    };
  }

  async compile(input, outputDir = './dist') {
    const startTime = Date.now();
    this.stats = { filesProcessed: 0, errors: [], warnings: [], buildTime: 0 };

    const inputs = Array.isArray(input) ? input : [input];
    const results = [];

    for (const inputFile of inputs) {
      try {
        const result = await this.compileFile(inputFile, outputDir);
        results.push(result);
        this.stats.filesProcessed++;
      } catch (error) {
        this.stats.errors.push({
          file: inputFile,
          error: error.message
        });
        // Don't print WUT? here - the caller handles it
      }
    }

    this.stats.buildTime = Date.now() - startTime;
    return {
      success: this.stats.errors.length === 0,
      results,
      stats: this.stats
    };
  }

  async compileFile(inputFile, outputDir) {
    const filePath = path.resolve(inputFile);
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath);

    if (ext !== '.stngr') {
      // Try to parse as regular file
      return this.handleNonStingrayFile(filePath, outputDir);
    }

    // Read source
    const source = fs.readFileSync(filePath, 'utf-8');

    // Parse
    const ast = this.parser.parse(source, fileName);

    // Transpile
    const transpiled = this.transpiler.transpile(ast, fileName);

    // Optimize if enabled
    let optimizedJS = transpiled.js;
    let optimizedCSS = transpiled.css;

    if (this.options.minify) {
      optimizedJS = await this.minifyJS(optimizedJS);
      optimizedCSS = this.minifyCSS(optimizedCSS);
    }

    // Generate output files
    const baseName = path.basename(filePath, '.stngr');
    const output = {
      inputFile: filePath,
      baseName,
      outputDir,
      files: {}
    };

    // Write JS
    if (optimizedJS.trim()) {
      const jsPath = path.join(outputDir, `${baseName}.js`);
      fs.writeFileSync(jsPath, optimizedJS);
      output.files.js = jsPath;
    }

    // Write CSS
    if (optimizedCSS.trim()) {
      const cssPath = path.join(outputDir, `${baseName}.css`);
      fs.writeFileSync(cssPath, optimizedCSS);
      output.files.css = cssPath;
    }

    // Write HTML
    if (transpiled.html.trim()) {
      const htmlPath = path.join(outputDir, `${baseName}.html`);
      const htmlContent = this.generateHTML(baseName, transpiled.html, transpiled.css, optimizedJS);
      fs.writeFileSync(htmlPath, htmlContent);
      output.files.html = htmlPath;
    }

    // Write React component
    if (transpiled.react.trim()) {
      const reactPath = path.join(outputDir, `${baseName}.jsx`);
      fs.writeFileSync(reactPath, transpiled.react);
      output.files.react = reactPath;
    }

    return output;
  }

  async compileProject(projectDir, outputDir = './dist') {
    const projectPath = path.resolve(projectDir);
    
    // Find all .stngr files
    const stngrFiles = this.findStingrayFiles(projectPath);
    
    // Check for stingray.json config
    let config = {};
    const configFile = path.join(projectPath, 'stingray.json');
    if (fs.existsSync(configFile)) {
      config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
      Object.assign(this.options, config.compiler || {});
    }

    // Compile all files
    return this.compile(stngrFiles, outputDir);
  }

  async compileAndBundle(input, outputDir = './dist') {
    const result = await this.compile(input, outputDir);
    
    if (result.success) {
      // Bundle the compiled files
      const bundlePath = await this.bundle(result.results, outputDir);
      result.bundle = bundlePath;
    }

    return result;
  }

  async bundle(results, outputDir) {
    const jsFiles = results
      .filter(r => r.files.js)
      .map(r => r.files.js);

    if (jsFiles.length === 0) return null;

    const bundlePath = path.join(outputDir, 'bundle.js');
    
    // Simple bundling - concatenate with module system
    let bundle = '// Stingray Bundled Output\n';
    bundle += `'use strict';\n\n`;

    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      bundle += `// From: ${path.basename(file)}\n`;
      bundle += `${content}\n\n`;
    }

    fs.writeFileSync(bundlePath, bundle);
    return bundlePath;
  }

  async minifyJS(code) {
    if (!code.trim()) return code;
    
    try {
      const result = await Terser.minify(code, {
        compress: this.options.optimize,
        mangle: this.options.optimize,
        output: { beautify: !this.options.minify }
      });
      return result.code || code;
    } catch (e) {
      console.warn('Minification failed, returning original:', e.message);
      return code;
    }
  }

  minifyCSS(css) {
    if (!css.trim()) return css;
    
    // Basic CSS minification
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove comments
      .replace(/\s+/g, ' ')               // Collapse whitespace
      .replace(/\s*{\s*/g, '{')           // Remove space before {
      .replace(/\s*}\s*/g, '}')           // Remove space after }
      .replace(/\s*:\s*/g, ':')           // Remove space around :
      .replace(/\s*;\s*/g, ';')           // Remove space around ;
      .replace(/;\}/g, '}')               // Remove trailing semicolon
      .trim();
  }

  generateHTML(baseName, body, css, js) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${baseName}</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐟</text></svg>">
  ${css ? `<style>${css}</style>` : ''}
  <script type="module" src="https://cdn.jsdelivr.net/npm/@material/web/all.js" defer></script>
</head>
<body>
  ${body}
  ${js ? `<script>${js}</script>` : ''}
</body>
</html>`;
  }

  handleNonStingrayFile(filePath, outputDir) {
    // Copy non-.stngr files as-is
    const dest = path.join(outputDir, path.basename(filePath));
    fs.copyFileSync(filePath, dest);
    return { inputFile: filePath, files: { copy: dest } };
  }

  findStingrayFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (item.name === 'node_modules' || item.name === '.git') continue;
        files.push(...this.findStingrayFiles(fullPath));
      } else if (item.name.endsWith('.stngr')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  getStats() {
    return this.stats;
  }
}

module.exports = { StingrayCompiler };
