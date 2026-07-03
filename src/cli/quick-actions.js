// Stingray Quick Actions - One-click workflow system
// Makes Stingray incredibly easy to use

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');

class StingrayQuickActions {
  constructor() {
    this.platform = os.platform();
    this.home = os.homedir();
  }

  // One-click: Create a new project and start dev server
  quickStart(projectName) {
    console.log(`\n  🚀 Quick starting "${projectName}"...\n`);
    
    const steps = [
      { name: 'Creating project structure', fn: () => this.createProjectStructure(projectName) },
      { name: 'Generating starter files', fn: () => this.generateStarterFiles(projectName) },
      { name: 'Installing dependencies', fn: () => this.installDeps() },
      { name: 'Starting dev server', fn: () => this.startDevServer() }
    ];

    let step = 0;
    const runStep = () => {
      if (step >= steps.length) {
        console.log(`\n  ✅ "${projectName}" is ready!`);
        console.log(`  🌐 Open: http://localhost:8080`);
        console.log(`  📁 Project: ${steps[0].result}\n`);
        return;
      }
      
      console.log(`  ${step + 1}/${steps.length} ${steps[step].name}...`);
      try {
        steps[step].fn();
        step++;
        setTimeout(runStep, 100);
      } catch (err) {
        console.log(`  ⚠️  ${steps[step].name} failed: ${err.message}`);
        step++;
        setTimeout(runStep, 100);
      }
    };

    runStep();
  }

  createProjectStructure(name) {
    const dir = path.resolve(name);
    const subdirs = [
      'src/components', 'src/pages', 'src/hooks', 'src/styles', 'src/utils',
      'public', 'tests', 'dist'
    ];
    
    fs.mkdirSync(dir, { recursive: true });
    for (const sub of subdirs) {
      fs.mkdirSync(path.join(dir, sub), { recursive: true });
    }
    
    // Create main app file
    fs.writeFileSync(path.join(dir, 'src', 'app.stngr'), this.getAppTemplate(name));
    fs.writeFileSync(path.join(dir, 'src', 'components', 'App.stngr'), this.getComponentTemplate('App'));
    fs.writeFileSync(path.join(dir, 'src', 'pages', 'Home.stngr'), this.getPageTemplate('Home'));
    fs.writeFileSync(path.join(dir, 'stingray.json'), this.getConfig(name));
    fs.writeFileSync(path.join(dir, 'package.json'), this.getPkgTemplate(name));
    fs.writeFileSync(path.join(dir, '.gitignore'), this.getGitIgnore());
    
    return dir;
  }

  generateStarterFiles(name) {
    const src = path.resolve(name, 'src');
    
    // Create a default theme
    fs.writeFileSync(path.join(src, 'styles', 'theme.stngr'), 
      `theme default {\n  style {\n    :root {\n      --primary: #0066cc;\n      --secondary: #ff6b35;\n      --surface: #ffffff;\n      --background: #f5f5f5;\n      --error: #b00020;\n      --font: system-ui, -apple-system, sans-serif;\n    }\n    body {\n      font-family: var(--font);\n      margin: 0;\n      padding: 0;\n      background: var(--background);\n    }\n  }\n}`
    );
    
    // Create a useFetch hook
    fs.writeFileSync(path.join(src, 'hooks', 'useFetch.stngr'),
      `hook useFetch {\n  script {\n    function useFetch(url, options = {}) {\n      const [data, setData] = useState(null);\n      const [loading, setLoading] = useState(true);\n      const [error, setError] = useState(null);\n\n      useEffect(() => {\n        async function fetchData() {\n          try {\n            setLoading(true);\n            const response = await fetch(url, options);\n            const result = await response.json();\n            setData(result);\n          } catch (err) {\n            setError(err);\n          } finally {\n            setLoading(false);\n          }\n        }\n        fetchData();\n      }, [url]);\n\n      return { data, loading, error, refetch: fetchData };\n    }\n    export default useFetch;\n  }\n}`
    );
    
    // Create a reusable card component
    fs.writeFileSync(path.join(src, 'components', 'Card.stngr'),
      `component Card {\n  template {\n    <mdc-card>\n      <h3>{title}</h3>\n      <p>{content}</p>\n      <mdc-button @click="onClick">${buttonText || 'Action'}</mdc-button>\n    </mdc-card>\n  }\n  \n  style {\n    mdc-card {\n      margin: 8px;\n      padding: 16px;\n    }\n  }\n}`
    );
  }

  installDeps() {
    const dir = process.cwd();
    try {
      execSync('npm install --no-audit --no-fund', { cwd: dir, stdio: 'pipe' });
    } catch (e) {
      // Non-fatal
    }
  }

  startDevServer() {
    const { StingrayRuntime } = require('../runtime/runtime');
    const runtime = new StingrayRuntime({ port: 8080, host: 'localhost', hotReload: true });
    runtime.init().then(() => runtime.startServer());
  }

  getAppTemplate(name) {
    return `// ${name} - Stingray Application
import { PageHome } from './pages/Home.stngr';
import { Card } from './components/Card.stngr';

component App {
  state {
    title = "${name}";
    count = 0;
  }

  template {
    <div class="app">
      <mdc-top-app-bar title="{title}"></mdc-top-app-bar>
      
      <div class="content">
        <Card title="Welcome to ${name}" content="Start building with Stingray!" buttonText="Get Started" />
        <Card title="Features" content="HTML + CSS + JS + React in one file" buttonText="Learn More" />
        <Card title="Material Design" content="Built-in Material Web components" buttonText="Explore" />
      </div>
      
      <mdc-snackbar id="snackbar" label-message="Welcome to ${name}!"></mdc-snackbar>
    </div>
  }

  script {
    function handleClick(msg) {
      console.log('Clicked:', msg);
    }
  }

  style {
    .app {
      min-height: 100vh;
    }
    .content {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
  }
}

export default App;`;
  }

  getComponentTemplate(name) {
    return `component ${name} {\n  template {\n    <div class="${name.toLowerCase()}">\n      <h1>${name}</h1>\n      <p>Welcome to ${name}!</p>\n      <mdc-button @click="sayHello">Say Hello</mdc-button>\n    </div>\n  }\n  \n  script {\n    function sayHello() {\n      alert('Hello from ${name}!');\n    }\n  }\n  \n  style {\n    .${name.toLowerCase()} {\n      text-align: center;\n      padding: 40px;\n    }\n  }\n}`;
  }

  getPageTemplate(name) {
    return `page ${name} {\n  template {\n    <div class="page-${name.toLowerCase()}">\n      <h1>${name}</h1>\n      <p>This is the ${name} page.</p>\n    </div>\n  }\n  \n  script {\n    console.log('${name} page loaded');\n  }\n}`;
  }

  getConfig(name) {
    return JSON.stringify({
      name,
      version: '1.0.0',
      language: 'stingray',
      runtime: 'browser-node-hybrid',
      target: ['web', 'desktop', 'mobile'],
      compiler: { transpile: true, optimize: true, minify: true, sourcemap: true },
      features: { html: true, css: true, javascript: true, react: true, materialWeb: true, fetch: true, filesystem: true }
    }, null, 2);
  }

  getPkgTemplate(name) {
    return JSON.stringify({
      name: name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: `${name} - Built with Stingray`,
      scripts: {
        dev: 'stingray dev',
        build: 'stingray build --prod',
        serve: 'stingray serve',
        test: 'stingray test',
        lint: 'stingray lint'
      },
      dependencies: { stingray: '*' },
      devDependencies: {}
    }, null, 2);
  }

  getGitIgnore() {
    return `node_modules/\ndist/\ncoverage/\n.env*\n*.log\n.DS_Store
`;
  }

  // One-click: Open a .stngr file in the easiest way possible
  openFile(filePath) {
    const resolved = path.resolve(filePath);
    
    // Try VS Code first
    try {
      execSync(`code "${resolved}"`, { stdio: 'pipe' });
      console.log(`  Opened "${path.basename(resolved)}" in VS Code`);
      return;
    } catch(e) {}
    
    // Try browser (compile and open)
    try {
      this.compileAndOpen(resolved);
    } catch(e) {
      console.log(`  File: ${resolved}`);
    }
  }

  compileAndOpen(filePath) {
    const { StingrayCompiler } = require('../compiler/compiler');
    const compiler = new StingrayCompiler({ minify: false });
    
    compiler.compile(filePath, './.stingray-temp').then(result => {
      if (result.success && result.results[0]?.files?.html) {
        const htmlFile = result.results[0].files.html;
        console.log(`  ✅ Compiled! Open: ${htmlFile}`);
        
        // Open in browser
        try {
          if (this.platform === 'win32') {
            execSync(`start "" "${htmlFile}"`, { stdio: 'pipe' });
          } else if (this.platform === 'darwin') {
            execSync(`open "${htmlFile}"`, { stdio: 'pipe' });
          } else {
            execSync(`xdg-open "${htmlFile}"`, { stdio: 'pipe' });
          }
        } catch(e) {}
      }
    }).catch(err => {
      console.log(`  Compilation error: ${err.message}`);
    });
  }

  // Drag and drop handler: process dropped files
  handleDrop(files) {
    const results = [];
    for (const file of files) {
      if (file.endsWith('.stngr')) {
        results.push({ type: 'stingray', file });
      } else if (file.endsWith('.html')) {
        results.push({ type: 'html', file });
      } else if (file.endsWith('.css')) {
        results.push({ type: 'css', file });
      } else if (file.endsWith('.js')) {
        results.push({ type: 'js', file });
      } else {
        results.push({ type: 'other', file });
      }
    }
    return results;
  }

  // Clipboard integration: paste code and get syntax help
  analyzeClipboard(content) {
    const analysis = {
      hasHTML: /<[\w-]+[\s>]/.test(content),
      hasCSS: /[\w-]+\s*:/.test(content),
      hasJS: /\b(function|const|let|var|=>|async|await|class|import|export)\b/.test(content),
      hasReact: /\b(React|useState|useEffect|useCallback)\b/.test(content),
      hasStingray: /\b(component|page|layout|hook|mixin|theme)\b/.test(content),
      hasMaterial: /mdc-[\w-]+/.test(content),
      issues: []
    };

    // Check for common issues
    if (analysis.hasHTML && !analysis.hasCSS && !analysis.hasStingray) {
      analysis.issues.push('HTML detected without styles - consider adding a style block');
    }
    if (content.includes('eval(')) {
      analysis.issues.push('eval() detected - consider using Function constructor or safe alternatives');
    }
    if (content.includes('var ')) {
      analysis.issues.push('var detected - consider using const/let');
    }

    return analysis;
  }

  // Quick template generator
  generateTemplate(type, name) {
    const templates = {
      component: (n) => `component ${n} {\n  state {\n    ${0}\n  }\n  \n  template {\n    <div class="${n.toLowerCase()}">\n      <h1>${n}</h1>\n      ${0}\n    </div>\n  }\n  \n  script {\n    ${0}\n  }\n  \n  style {\n    .${n.toLowerCase()} {\n      padding: 20px;\n    }\n  }\n}`,
      page: (n) => `page ${n} {\n  template {\n    <div class="page-${n.toLowerCase()}">\n      <h1>${n}</h1>\n      ${0}\n    </div>\n  }\n  \n  script {\n    console.log('${n} loaded');\n  }\n}`,
      hook: (n) => `hook ${n} {\n  script {\n    function ${n}(initialValue) {\n      const [value, setValue] = useState(initialValue);\n      ${0}\n      return [value, setValue];\n    }\n    export default ${n};\n  }\n}`,
      theme: (n) => `theme ${n} {\n  style {\n    :root {\n      --primary: #0066cc;\n      --secondary: #ff6b35;\n      --surface: #ffffff;\n      --background: #f5f5f5;\n    }\n  }\n}`,
      layout: (n) => `layout ${n} {\n  template {\n    <div class="layout-${n.toLowerCase()}">\n      <header><nav></nav></header>\n      <main>{children}</main>\n      <footer><p>Footer</p></footer>\n    </div>\n  }\n}`
    };
    
    return (templates[type] || templates.component)(name);
  }

  // System tray / notification integration
  notify(title, message) {
    if (this.platform === 'win32') {
      try {
        const script = `Add-Type -AssemblyName System.Windows.Forms; $notify = New-Object System.Windows.Forms.NotifyIcon; $notify.Icon = [System.Drawing.SystemIcons]::Information; $notify.Visible = $true; $notify.ShowBalloonTip(3000, '${title.replace(/'/g, "\\'")}', '${message.replace(/'/g, "\\'")}', 'Info'); $notify.Dispose();`;
        execSync(`powershell -Command "${script}"`, { stdio: 'pipe' });
      } catch(e) {}
    }
  }
}

module.exports = { StingrayQuickActions };
