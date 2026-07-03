// Stingray VS Code Extension - Main Entry
const vscode = require('vscode');
const { StingrayParser } = require('../../src/parser/parser');
const { StingrayCompiler } = require('../../src/compiler/compiler');

let diagnosticCollection;
let devServerProcess = null;

function activate(context) {
  console.log('Stingray VS Code Extension activated!');
  
  // Create diagnostic collection for error reporting
  diagnosticCollection = vscode.languages.createDiagnosticCollection('stingray');
  context.subscriptions.push(diagnosticCollection);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('stingray.compile', compileCurrentFile),
    vscode.commands.registerCommand('stingray.build', buildProject),
    vscode.commands.registerCommand('stingray.dev-server', startDevServer),
    vscode.commands.registerCommand('stingray.new-component', createNewComponent),
    vscode.commands.registerCommand('stingray.new-page', createNewPage),
    vscode.commands.registerCommand('stingray.new-hook', createNewHook),
    vscode.commands.registerCommand('stingray.validate', validateCurrentFile),
    vscode.commands.registerCommand('stingray.show-errors', showErrors)
  );

  // Set up file watcher for auto-validation
  const watcher = vscode.workspace.createFileSystemWatcher('**/*.stngr');
  watcher.onDidChange(onFileChange);
  watcher.onDidCreate(onFileChange);
  watcher.onDidDelete(onFileDelete);
  context.subscriptions.push(watcher);

  // Auto-validate on save
  vscode.workspace.onDidSaveTextDocument(validateDocument);

  // Activate syntax highlighting for embedded languages
  activateEmbeddedLanguages();

  // Show welcome message
  const config = vscode.workspace.getConfiguration('stingray');
  if (config.get('showWelcomeOnActivate', true)) {
    vscode.commands.executeCommand('setContext', 'stingray.showWelcome', true);
    setTimeout(() => {
      vscode.window.showInformationMessage(
        '🐟 Stingray extension activated! Open a .stngr file to get started.',
        'View Documentation',
        'Create New Component'
      ).then(selection => {
        if (selection === 'Create New Component') {
          vscode.commands.executeCommand('stingray.new-component');
        }
      });
    }, 500);
  }
}

function deactivate() {
  if (diagnosticCollection) {
    diagnosticCollection.dispose();
  }
  if (devServerProcess) {
    devServerProcess.kill();
    devServerProcess = null;
  }
}

// ============================================================
// Syntax Highlighting for Embedded HTML, CSS, JS
// ============================================================
function activateEmbeddedLanguages() {
  // Enable HTML syntax highlighting in .stngr files
  vscode.languages.setLanguageConfiguration('stingray', {
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
      ['<', '>']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '<!', close: '>' },
      { open: '<', close: '>', notIn: ['string'] },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ],
    folding: {
      markers: {
        start: /^\\s*(component|page|layout|style|script|template|state|effect|hook|event|mixin|theme|fragment)\\b/,
        end: /^\\s*\\}/
      }
    }
  });

  // Register document selector for embedded language injection
  const stingraySelector = { scheme: 'file', language: 'stingray' };
  
  // Register inline completion providers for HTML, CSS, JS snippets
  vscode.languages.registerInlineCompletionItemProvider(
    stingraySelector,
    {
      provideInlineCompletionItems(document, position) {
        const line = document.lineAt(position).text;
        const items = [];
        
        // Detect context and suggest relevant snippets
        if (line.includes('template') || line.includes('template {')) {
          items.push(createSnippetItem('div.container', 'html'));
          items.push(createSnippetItem('mdc-button @click="handler"', 'html'));
          items.push(createSnippetItem('<h1>Title</h1>', 'html'));
        }
        
        if (line.includes('style') || line.includes('style {')) {
          items.push(createSnippetItem('padding: 20px;', 'css'));
          items.push(createSnippetItem('display: flex;', 'css'));
          items.push(createSnippetItem('color: var(--primary-color);', 'css'));
        }
        
        if (line.includes('script') || line.includes('script {')) {
          items.push(createSnippetItem('function handler() {}', 'js'));
          items.push(createSnippetItem('const data = await fetch(url);', 'js'));
          items.push(createSnippetItem('console.log("debug");', 'js'));
        }
        
        return items;
      }
    }
  );
}

function createSnippetItem(snippet, lang) {
  return {
    insertText: snippet,
    range: new vscode.Range(0, 0, 0, 0)
  };
}

// ============================================================
// Validation & Diagnostics
// ============================================================
async function validateDocument(document) {
  if (document.languageId !== 'stingray') return;
  
  const diagnostics = await runValidation(document);
  diagnosticCollection.set(document.uri, diagnostics);
}

async function validateCurrentFile() {
  const document = vscode.window.activeTextEditor?.document;
  if (!document || document.languageId !== 'stingray') {
    vscode.window.showErrorMessage('No active .stngr file to validate.');
    return;
  }
  
  const diagnostics = await runValidation(document);
  diagnosticCollection.set(document.uri, diagnostics);
  
  if (diagnostics.length > 0) {
    vscode.commands.executeCommand('workbench.panel.markers.view.focus');
  }
}

async function runValidation(document) {
  const diagnostics = [];
  const source = document.getText();
  const uri = document.uri;
  const filename = path.basename(uri.fsPath);
  
  try {
    const parser = new StingrayParser({ showErrorDetails: true });
    const ast = parser.parse(source, filename);
    
    // Add parser errors as diagnostics
    for (const error of parser.getErrors()) {
      const line = error.line - 1;
      const col = error.column || 0;
      
      // Show WUT? message for errors
      const message = `WUT? ${error.message}`;
      
      diagnostics.push({
        range: new vscode.Range(line, col, line, col + 1),
        severity: vscode.DiagnosticSeverity.Error,
        source: 'stingray',
        code: 'stngr-parse-error',
        message: message,
        relatedInformation: error.stack ? [
          new vscode.DiagnosticRelatedInformation(
            new vscode.Location(uri, new vscode.Position(0, 0)),
            `Stack: ${error.stack?.split('\n')[0]}`
          )
        ] : undefined
      });
    }
    
    // Add warnings
    for (const warning of parser.getWarnings()) {
      const line = warning.line - 1;
      diagnostics.push({
        range: new vscode.Range(line, 0, line, 1),
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'stingray',
        code: 'stngr-warning',
        message: warning.message
      });
    }
    
    // Validate template syntax
    const templateDiagnostics = validateTemplateSyntax(source, document);
    diagnostics.push(...templateDiagnostics);
    
    // Validate CSS syntax
    const cssDiagnostics = validateCSSSyntax(source, document);
    diagnostics.push(...cssDiagnostics);
    
    // Validate JS syntax
    const jsDiagnostics = validateJSSyntax(source, document);
    diagnostics.push(...jsDiagnostics);
    
  } catch (error) {
    // WUT? error handling
    const line = error.line || 1;
    const col = error.column || 0;
    
    diagnostics.push({
      range: new vscode.Range(line - 1, col, line - 1, col + 1),
      severity: vscode.DiagnosticSeverity.Error,
      source: 'stingray',
      code: 'stngr-fatal',
      message: `WUT? ${error.message}`,
      relatedInformation: error.stack ? [
        new vscode.DiagnosticRelatedInformation(
          new vscode.Location(uri, new vscode.Position(0, 0)),
          `Full stack trace:\n${error.stack}`
        )
      ] : undefined
    });
    
    // Show error in output channel
    const outputChannel = getOutputChannel();
    outputChannel.appendLine(`\n${'='.repeat(50)}`);
    outputChannel.appendLine(`WUT? Error in ${filename}`);
    outputChannel.appendLine(`Line ${line}:${col}`);
    outputChannel.appendLine(`Message: ${error.message}`);
    if (error.stack) {
      outputChannel.appendLine(`\nStack Trace:`);
      outputChannel.appendLine(error.stack);
    }
    outputChannel.appendLine(`${'='.repeat(50)}`);
  }
  
  return diagnostics;
}

function validateTemplateSyntax(source, document) {
  const diagnostics = [];
  const lines = source.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for unclosed HTML tags
    const openTags = line.match(/<[a-zA-Z][a-zA-Z0-9_-]*(?![^>]*\/>)[^>]*>/g) || [];
    const closeTags = line.match(/<\/[a-zA-Z][a-zA-Z0-9_-]*>/g) || [];
    
    if (openTags.length > closeTags.length + 2) {
      diagnostics.push({
        range: new vscode.Range(i, 0, i, line.length),
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'stingray',
        code: 'stngr-html-warn',
        message: `Possible unclosed HTML tag near column ${line.indexOf('<')}`
      });
    }
    
    // Check for invalid Material Web component references
    const invalidComponents = line.match(/mdc-(?!button|card|textfield|switch|toggle-button|tabs|dialog|snackbar|menu|list|drawer|tooltip|link|checkbox|radio|slider|select|progress|icon-button|top-app-bar|footer|header|linear-progress|circular-progress)/g);
    if (invalidComponents) {
      diagnostics.push({
        range: new vscode.Range(i, 0, i, line.length),
        severity: vscode.DiagnosticSeverity.Information,
        source: 'stingray',
        code: 'stngr-component-info',
        message: 'Consider using @material/web components'
      });
    }
  }
  
  return diagnostics;
}

function validateCSSSyntax(source, document) {
  const diagnostics = [];
  const lines = source.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for unclosed braces
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    
    if (openBraces > closeBraces + 2) {
      diagnostics.push({
        range: new vscode.Range(i, 0, i, line.length),
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'stingray',
        code: 'stngr-css-warn',
        message: 'Possible unclosed CSS block'
      });
    }
    
    // Check for invalid CSS properties
    if (line.includes(':') && !line.includes('//')) {
      const propMatch = line.match(/^\\s*([a-zA-Z-]+)\\s*:/);
      if (propMatch) {
        const prop = propMatch[1];
        const validProps = ['margin', 'padding', 'color', 'background', 'font-size', 'display', 'position', 'top', 'right', 'bottom', 'left', 'width', 'height', 'border', 'box-shadow', 'border-radius', 'opacity', 'transform', 'transition', 'animation'];
        if (!validProps.includes(prop) && !prop.startsWith('--')) {
          diagnostics.push({
            range: new vscode.Range(i, 0, i, line.length),
            severity: vscode.DiagnosticSeverity.Information,
            source: 'stingray',
            code: 'stngr-css-info',
            message: `Unknown CSS property: ${prop}`
          });
        }
      }
    }
  }
  
  return diagnostics;
}

function validateJSSyntax(source, document) {
  const diagnostics = [];
  const lines = source.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for console.log usage
    if (line.includes('console.log') && !line.includes('//')) {
      diagnostics.push({
        range: new vscode.Range(i, 0, i, line.length),
        severity: vscode.DiagnosticSeverity.Information,
        source: 'stingray',
        code: 'stngr-js-info',
        message: 'Remove console.log before deploying'
      });
    }
    
    // Check for eval usage
    if (line.includes('eval(')) {
      diagnostics.push({
        range: new vscode.Range(i, 0, i, line.length),
        severity: vscode.DiagnosticSeverity.Warning,
        source: 'stingray',
        code: 'stngr-js-warn',
        message: 'Avoid eval() - security risk'
      });
    }
  }
  
  return diagnostics;
}

// ============================================================
// Commands
// ============================================================
async function compileCurrentFile() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active file to compile.');
    return;
  }
  
  const document = editor.document;
  if (document.languageId !== 'stingray') {
    vscode.window.showErrorMessage('Only .stngr files can be compiled.');
    return;
  }
  
  try {
    vscode.window.showInformationMessage('Compiling...');
    
    const compiler = new StingrayCompiler({ minify: false });
    const result = await compiler.compile(document.fileName, './dist');
    
    if (result.success) {
      vscode.window.showInformationMessage('✓ Compiled successfully!');
      
      // Show output files
      for (const r of result.results) {
        if (r.files) {
          for (const [type, filePath] of Object.entries(r.files)) {
            vscode.window.showInformationMessage(`  ${type}: ${filePath}`);
          }
        }
      }
    } else {
      vscode.window.showErrorMessage(`Compilation failed: ${result.stats.errors.length} errors`);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`WUT? ${error.message}`);
  }
}

async function buildProject() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace open.');
    return;
  }
  
  try {
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Building Stingray project...',
      cancellable: false
    }, async (progress) => {
      progress.report({ increment: 0 });
      
      const compiler = new StingrayCompiler({ minify: true, optimize: true });
      const result = await compiler.compileProject(workspaceFolders[0].uri.fsPath, './dist');
      
      if (result.success) {
        vscode.window.showInformationMessage(`Build complete! ${result.stats.filesProcessed} files in ${result.stats.buildTime}ms`);
      } else {
        vscode.window.showErrorMessage(`Build failed: ${result.stats.errors.length} errors`);
      }
    });
  } catch (error) {
    vscode.window.showErrorMessage(`WUT? ${error.message}`);
  }
}

async function startDevServer() {
  if (devServerProcess) {
    vscode.window.showInformationMessage('Dev server already running.');
    return;
  }
  
  try {
    const { exec } = require('child_process');
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const cwd = workspaceFolders ? workspaceFolders[0].uri.fsPath : process.cwd();
    
    devServerProcess = exec('stingray dev', { cwd });
    
    devServerProcess.stdout.on('data', (data) => {
      console.log(`[Stingray Dev]: ${data}`);
    });
    
    devServerProcess.stderr.on('data', (data) => {
      console.error(`[Stingray Dev Error]: ${data}`);
    });
    
    devServerProcess.on('close', (code) => {
      devServerProcess = null;
      vscode.window.showInformationMessage(`Dev server exited with code ${code}`);
    });
    
    vscode.window.showInformationMessage('🐟 Stingray dev server started!');
  } catch (error) {
    vscode.window.showErrorMessage(`WUT? Failed to start dev server: ${error.message}`);
  }
}

async function createNewComponent() {
  const name = await vscode.window.showInputBox({
    prompt: 'Component name (PascalCase)',
    placeHolder: 'MyComponent',
    validateInput: (value) => {
      if (!value.match(/^[A-Z][a-zA-Z0-9]*$/)) {
        return 'Name must be PascalCase (e.g., MyComponent)';
      }
      return null;
    }
  });
  
  if (!name) return;
  
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace open.');
    return;
  }
  
  const componentDir = path.join(workspaceFolders[0].uri.fsPath, 'src', 'components');
  const filePath = path.join(componentDir, `${name}.stngr`);
  
  if (require('fs').existsSync(filePath)) {
    vscode.window.showErrorMessage(`Component ${name} already exists.`);
    return;
  }
  
  const content = `component ${name} {\n  state {\n    ${0}\n  }\n  \n  template {\n    <div class="${name.toLowerCase()}">\n      <h1>${name}</h1>\n    </div>\n  }\n  \n  script {\n    ${0}\n  }\n  \n  style {\n    .${name.toLowerCase()} {\n      padding: 20px;\n    }\n  }\n}`;
  
  require('fs').mkdirSync(componentDir, { recursive: true });
  require('fs').writeFileSync(filePath, content);
  
  // Open the new file
  const doc = await vscode.workspace.openTextDocument(filePath);
  await vscode.window.showTextDocument(doc);
  
  vscode.window.showInformationMessage(`Component ${name} created!`);
}

async function createNewPage() {
  const name = await vscode.window.showInputBox({
    prompt: 'Page name (PascalCase)',
    placeHolder: 'HomePage'
  });
  
  if (!name) return;
  
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) return;
  
  const pageDir = path.join(workspaceFolders[0].uri.fsPath, 'src', 'pages');
  const filePath = path.join(pageDir, `${name}.stngr`);
  
  const content = `page ${name} {\n  template {\n    <div class="page-${name.toLowerCase()}">\n      <h1>${name}</h1>\n      ${0}\n    </div>\n  }\n  \n  script {\n    console.log('${name} page loaded');\n  }\n}`;
  
  require('fs').mkdirSync(pageDir, { recursive: true });
  require('fs').writeFileSync(filePath, content);
  
  const doc = await vscode.workspace.openTextDocument(filePath);
  await vscode.window.showTextDocument(doc);
  
  vscode.window.showInformationMessage(`Page ${name} created!`);
}

async function createNewHook() {
  const name = await vscode.window.showInputBox({
    prompt: 'Hook name (usePascalCase)',
    placeHolder: 'useLocalStorage'
  });
  
  if (!name) return;
  
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) return;
  
  const hooksDir = path.join(workspaceFolders[0].uri.fsPath, 'src', 'hooks');
  const filePath = path.join(hooksDir, `${name}.stngr`);
  
  const content = `hook ${name} {\n  script {\n    function ${name}(initialValue) {\n      const [value, setValue] = useState(initialValue);\n      ${0}\n      return [value, setValue];\n    }\n    \n    export default ${name};\n  }\n}`;
  
  require('fs').mkdirSync(hooksDir, { recursive: true });
  require('fs').writeFileSync(filePath, content);
  
  const doc = await vscode.workspace.openTextDocument(filePath);
  await vscode.window.showTextDocument(doc);
  
  vscode.window.showInformationMessage(`Hook ${name} created!`);
}

async function showErrors() {
  const outputChannel = getOutputChannel();
  outputChannel.show();
}

function getOutputChannel() {
  if (!getOutputChannel._channel) {
    getOutputChannel._channel = vscode.window.createOutputChannel('Stingray');
  }
  return getOutputChannel._channel;
}

function onFileChange(uri) {
  const document = vscode.workspace.textDocuments.find(d => d.uri.fsPath === uri.fsPath);
  if (document) {
    validateDocument(document);
  }
}

function onFileDelete(uri) {
  diagnosticCollection.delete(uri);
}

// Export for VS Code
module.exports = { activate, deactivate };

// Need path module
const path = require('path');
