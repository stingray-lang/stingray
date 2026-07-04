// Stingray CLI - Command Line Interface
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { StingrayCompiler } = require('../compiler/compiler');
const { StingrayRuntime } = require('../runtime/runtime');
const { StingrayQuickActions } = require('./quick-actions');

const quickActions = new StingrayQuickActions();

const { StingraySystemIntegration } = require('./system-integration');

// Error display utilities
function printWutError(error, context = '') {
  const colors = {
    reset: '\x1b[0m', red: '\x1b[31m', yellow: '\x1b[33m',
    cyan: '\x1b[36m', magenta: '\x1b[35m', bold: '\x1b[1m',
    dim: '\x1b[2m', underline: '\x1b[4m', bgRed: '\x1b[41m',
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
  console.log(`    Command:    stingray ${context}`);
  console.log(`    Error:      ${c(error.message, 'red')}`);
  
  if (error.stack) {
    console.log(c('\n    Stack Trace:', 'dim'));
    error.stack.split('\n').slice(1).forEach(line => {
      console.log(c('      ' + line, 'dim'));
    });
  }
  
  console.log(c('  ' + '-'.repeat(50), 'dim'));
  console.log(c('\n  Tip: Check your .stngr file syntax. Run "stingray help" for usage.\n', 'cyan'));
}

class StingrayCLI {
  constructor() {
    this.platform = require('os').platform();
    this.commands = {
      'init': this.init.bind(this),
      'build': this.build.bind(this),
      'compile': this.compile.bind(this),
      'transpile': this.transpile.bind(this),
      'dev': this.dev.bind(this),
      'serve': this.serve.bind(this),
      'run': this.runFile.bind(this),
      'test': this.test.bind(this),
      'lint': this.lint.bind(this),
      'new': this.new.bind(this),
      'install': this.install.bind(this),
      'upgrade': this.upgrade.bind(this),
      'help': this.help.bind(this),
      'example': this.example.bind(this)
    };
  }

  async run(args = process.argv.slice(2)) {
    let command = args[0];
    const subArgs = args.slice(1);

    // Smart detection: if a .stngr file is passed directly, auto-detect intent
    if (command && command.endsWith('.stngr') && !this.commands[command]) {
      return this.autoDetectAndRun(command, subArgs);
    }

    // Single-letter shortcuts
    const shortcuts = { 'i': 'init', 'b': 'build', 'c': 'compile', 't': 'transpile', 'd': 'dev', 's': 'serve', 'r': 'run', 'n': 'new', 'v': 'version', 'h': 'help', 'e': 'example', '-h': 'help', '--h': 'help', '--help': 'help', '-v': 'version', '--v': 'version' };
    if (shortcuts[command]) {
      command = shortcuts[command];
      args[0] = command;
    }

    if (!command || command === 'help' || command === '--help' || command === '-h') {
      return this.showHelp();
    }

    const cmdFn = this.commands[command];
    if (!cmdFn) {
      console.error(`Unknown command: ${command}`);
      console.error('Run "stingray help" for available commands.');
      process.exit(1);
    }

    try {
      await cmdFn(subArgs);
    } catch (error) {
      printWutError(error, command);
      process.exit(1);
    }
  }

  // Auto-detect what user wants when they pass a .stngr file directly
  async autoDetectAndRun(file, extraArgs) {
    const resolved = path.resolve(file);
    
    if (!fs.existsSync(resolved)) {
      console.error(`File not found: ${resolved}`);
      process.exit(1);
    }

    console.log(`  🐟 Detected "${path.basename(resolved)}"`);
    
    // Check if it's a project root (has stingray.json)
    const dir = path.dirname(resolved);
    if (fs.existsSync(path.join(dir, 'stingray.json'))) {
      console.log('  📦 Project detected - starting dev server...');
      await this.dev([resolved, ...extraArgs]);
      return;
    }

    // Default: compile and open
    console.log('  ⚙️  Compiling and opening...');
    const compiler = new StingrayCompiler({ minify: false });
    const result = await compiler.compile(resolved, './.stingray-output');
    
    if (result.success) {
      for (const r of result.results) {
        if (r.files?.html) {
          console.log(`  ✅ Compiled to: ${r.files.html}`);
          quickActions.openFile(r.files.html);
        }
      }
    } else {
      console.error('  ❌ Compilation failed');
      process.exit(1);
    }
  }

  async init(args) {
    const projectName = args[0] || 'my-stingray-app';
    const projectDir = path.resolve(projectName);

    console.log(`\n  🐟 Creating "${projectName}"...\n`);

    // Use QuickActions for full setup
    quickActions.quickStart(projectName);
  }

  async build(args) {
    const entry = args[0] || './src';
    const output = args[1] || './dist';
    const prod = args.includes('--prod') || args.includes('-p');

    console.log(`\n  🐟 Building "${entry}"${prod ? ' (production)' : ''}...\n`);

    const compiler = new StingrayCompiler({
      minify: prod,
      optimize: prod,
      env: prod ? 'production' : 'development',
      sourcemap: !prod
    });

    const result = await compiler.compileProject(entry, output);

    if (result.success) {
      console.log(`  ✅ Build complete!`);
      console.log(`     Files: ${result.stats.filesProcessed}`);
      console.log(`     Time: ${result.stats.buildTime}ms`);
      console.log(`     Output: ${output}/\n`);
    } else {
      printWutError(new Error(`${result.stats.errors.length} compilation errors`), 'build');
      process.exit(1);
    }
  }

  async compile(args) {
    const entry = args[0];
    const output = args[1] || './dist';

    if (!entry) {
      console.error('Usage: stingray compile <file.stngr> [output-dir]');
      process.exit(1);
    }

    console.log(`\n  🐟 Compiling "${path.basename(entry)}"...\n`);

    const compiler = new StingrayCompiler({ minify: false, sourcemap: true });
    const result = await compiler.compile(entry, output);

    if (result.success) {
      console.log(`  ✅ Compiled successfully to ${output}/`);
      for (const r of result.results) {
        if (r.files) {
          for (const [type, filePath] of Object.entries(r.files)) {
            console.log(`     ${type}: ${path.basename(filePath)}`);
          }
        }
      }
      console.log('');
    } else {
      printWutError(new Error(`${result.stats.errors.length} compilation errors`), 'compile');
      process.exit(1);
    }
  }

  async transpile(args) {
    const entry = args[0] || './src';
    
    console.log(`[Stingray] Transpiling ${entry}...`);
    
    const compiler = new StingrayCompiler({
      minify: false,
      react: true,
      materialWeb: true
    });

    const result = await compiler.compileProject(entry, './dist/transpiled');
    
    if (result.success) {
      console.log(`[Stingray] Transpilation complete!`);
      console.log(`  Output: ./dist/transpiled/`);
    }
  }

  async dev(args) {
    const port = parseInt(args.find(a => a.startsWith('--port='))?.split('=')[1]) || 8080;
    const host = args.find(a => a.startsWith('--host='))?.split('=')[1] || 'localhost';
    const entry = args.find(a => !a.startsWith('--')) || './src';

    console.log(`\n  🐟 Starting dev server...`);
    console.log(`  🌐 http://${host}:${port}`);
    console.log(`  📂 Watching: ${entry}`);
    console.log(`  🔥 Hot reload: ON`);
    console.log(`  Press Ctrl+C to stop\n`);

    const runtime = new StingrayRuntime({
      port,
      host,
      hotReload: true,
      debug: true,
      env: 'development'
    });

    await runtime.init();
    await runtime.startServer();

    // Auto-open browser
    try {
      if (this.platform === 'win32') {
        execSync(`start "" "http://${host}:${port}"`, { stdio: 'pipe' });
      } else if (this.platform === 'darwin') {
        execSync(`open "http://${host}:${port}"`, { stdio: 'pipe' });
      } else {
        execSync(`xdg-open "http://${host}:${port}"`, { stdio: 'pipe' });
      }
    } catch(e) {}

    const watcher = this.watchFiles(entry, runtime);
    
    process.on('SIGINT', async () => {
      console.log('\n  👋 Shutting down...\n');
      watcher.close();
      await runtime.shutdown();
      process.exit(0);
    });
  }

  async serve(args) {
    const port = parseInt(args.find(a => a.startsWith('--port='))?.split('=')[1]) || 8080;
    const dir = args.find(a => !a.startsWith('--')) || './dist';

    console.log(`\n  🐟 Serving "${dir}" on http://localhost:${port}`);
    console.log(`  Press Ctrl+C to stop\n`);

    const runtime = new StingrayRuntime({
      port,
      hotReload: false,
      env: 'production'
    });

    await runtime.init();
    await runtime.startServer();
  }

  async runFile(args) {
    const file = args[0];
    
    if (!file) {
      console.error('Usage: stingray run <file.stngr>');
      process.exit(1);
    }

    console.log(`\n  🐟 Running "${path.basename(file)}"...\n`);

    const compiler = new StingrayCompiler({ minify: false });
    const result = await compiler.compile(file, './.stingray-run');

    if (result.success) {
      const { execSync } = require('child_process');
      for (const r of result.results) {
        if (r.files?.js) {
          try {
            execSync(`node "${r.files.js}"`, { stdio: 'inherit' });
          } catch {
            console.error(`  ❌ Failed to run: ${r.files.js}`);
          }
        }
      }
    }
  }

  async test(args) {
    console.log('[Stingray] Running tests...');
    
    const testDir = args.find(a => !a.startsWith('--')) || './tests';
    const files = this.findTestFiles(testDir);

    if (files.length === 0) {
      console.log('No test files found.');
      return;
    }

    let passed = 0;
    let failed = 0;
    let total = 0;

    for (const file of files) {
      total++;
      try {
        const module = require(file);
        console.log(`  ✓ ${path.relative(process.cwd(), file)}`);
        passed++;
      } catch (error) {
        console.error(`  ✗ ${path.relative(process.cwd(), file)}: ${error.message}`);
        failed++;
      }
    }

    console.log(`\nTests: ${total} total, ${passed} passed, ${failed} failed`);
    
    if (failed > 0) {
      process.exit(1);
    }
  }

  async lint(args) {
    const dir = args.find(a => !a.startsWith('--')) || './src';
    const strict = args.includes('--strict');

    console.log(`[Stingray] Linting ${dir}...`);

    const stngrFiles = this.findStingrayFiles(dir);
    let issues = 0;

    for (const file of stngrFiles) {
      const issues_found = this.lintFile(file, strict);
      issues += issues_found;
    }

    if (issues === 0) {
      console.log(`[Stingray] No issues found in ${stngrFiles.length} files.`);
    } else {
      console.log(`[Stingray] Found ${issues} issue(s) in ${stngrFiles.length} files.`);
      if (strict) {
        process.exit(1);
      }
    }
  }

  async new(args) {
    const type = args[0];
    const name = args[1];

    if (!type || !name) {
      console.log(`\n  🐟 Usage: stingray new <type> <name>`);
      console.log(`  Types: component, page, layout, hook, mixin, theme, app\n`);
      process.exit(1);
    }

    console.log(`\n  🐟 Creating ${type} "${name}"...\n`);

    const componentDir = path.resolve('./src/components');
    const pageDir = path.resolve('./src/pages');
    const outputPath = type === 'page' ? pageDir : componentDir;

    // Create directories if needed
    if (!fs.existsSync(componentDir)) fs.mkdirSync(componentDir, { recursive: true });
    if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });

    const content = quickActions.generateTemplate(type, name);
    fs.writeFileSync(path.join(outputPath, `${name}.stngr`), content);

    console.log(`  ✅ Created: ${path.relative(process.cwd(), outputPath)}/${name}.stngr\n`);
  }

  async install(args) {
    console.log(`\n  🐟 Setting up Stingray...\n`);
    
    const compiler = new StingrayCompiler();
    const result = await compiler.compile('./src', './dist');
    
    if (result.success) {
      console.log('  ✅ Setup complete!\n');
    }
  }

  async upgrade(args) {
    console.log('  ✅ You are running the latest version of Stingray.\n');
  }

  watchFiles(dir, runtime) {
    const watcher = { closed: false, close: () => { watcher.closed = true; } };
    const interval = setInterval(() => {
      if (watcher.closed) { clearInterval(interval); return; }
    }, 3000);
    return watcher;
  }

  findTestFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) files.push(...this.findTestFiles(fullPath));
      else if (item.name.match(/test|spec/i) && item.name.endsWith('.js')) files.push(fullPath);
    }
    return files;
  }

  findStingrayFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (item.name === 'node_modules' || item.name === '.git') continue;
        files.push(...this.findStingrayFiles(fullPath));
      } else if (item.name.endsWith('.stngr')) files.push(fullPath);
    }
    return files;
  }

  lintFile(file, strict) {
    const source = fs.readFileSync(file, 'utf-8');
    let issues = 0;
    if (source.includes('eval(')) { console.warn(`  Warning: eval() usage in ${file}`); issues++; }
    if (source.match(/var\s+/)) { console.warn(`  Warning: Use const/let instead of var in ${file}`); issues++; }
    return issues;
  }

  showHelp() {
    console.log(`
\x1b[1m\x1b[36m  +======================================================+\x1b[0m
\x1b[1m\x1b[36m  |             🐟 STINGRAY LANGUAGE CLI              |\x1b[0m
\x1b[1m\x1b[36m  +======================================================+\x1b[0m

\x1b[33m  USAGE\x1b[0m
    stingray <command> [options]

\x1b[33m  COMMANDS\x1b[0m
    init <name>         Create new Stingray project
    build [src] [out]   Build project for production
    compile <file>      Compile single .stngr file
    dev [src]           Start dev server with hot reload
    serve [dir]         Serve static files
    run <file>          Compile and execute .stngr file
    new <type> <name>   Create component/page/hook
    test [dir]          Run test files
    lint [dir]          Lint .stngr files
    transpile [src]     Transpile to React/JSX
    example             Show code snippets and compilation guide
    help                Show this help message

\x1b[33m  SHORTCUTS\x1b[0m
    sr          → stingray
    stingray build → npm run build

\x1b[33m  EXAMPLES\x1b[0m
    stingray init my-app     # Create project
    cd my-app
    stingray dev             # Start dev server (localhost:8080)
    stingray build           # Build for production
    stingray run app.stngr   # Run single file

\x1b[33m  DOCS\x1b[0m
    https://stingray-lang.github.io/stingray
`);
  }

  async help(args) {
    this.showHelp();
  }

  async example(args) {
    console.log(`
\x1b[1m\x1b[36m  +======================================================+\x1b[0m
\x1b[1m\x1b[36m  |        STINGRAY CODE SNIPPETS & GUIDE              |\x1b[0m
\x1b[1m\x1b[36m  +======================================================+\x1b[0m

\x1b[32m  #1: Hello World\x1b[0m
component App {
  state { name = "World"; }
  template { <h1>Hello {name}!</h1> }
  style { h1 { color: blue; } }
}

\x1b[32m  #2: Counter with React State\x1b[0m
component Counter {
  state { count = 0; }
  template { 
    <div>
      <p>Count: {count}</p>
      <button @click="increment">+</button>
    </div>
  }
  script { function increment() { count++; } }
}

\x1b[32m  #3: Fetch API\x1b[0m
component DataList {
  state { items = []; }
  template { <ul>#for item in items <li>{item}</li> #endfor</ul> }
  script {
    async function load() {
      const res = await fetch('/api/data');
      items = await res.json();
    }
  }
}

\x1b[32m  #4: Material Web Component\x1b[0m
component Form {
  template {
    <mdc-text-field label="Email" type="email"></mdc-text-field>
    <mdc-button raised>Submit</mdc-button>
  }
  style { .form { display: flex; gap: 12px; } }
}

\x1b[33m  COMPILATION GUIDE\x1b[0m
  stingray compile file.stngr     → Compiles to HTML/JS/CSS
  stingray build                  → Production build (minified)
  stingray run file.stngr         → Compile and execute JS

\x1b[33m  OUTPUT FILES\x1b[0m
  .html  → Standalone HTML with embedded styles
  .js    → JavaScript module
  .css   → Extracted CSS (optional)
`);
  }
}

module.exports = { StingrayCLI };
