// Stingray Language Parser - Core Parser Engine
// Parses .stngr files into AST representation

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

// ANSI color codes for error display
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  underline: '\x1b[4m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
  white: '\x1b[37m'
};

function colorize(text, color) {
  return COLORS[color] ? COLORS[color] + text + COLORS.reset : text;
}

function printErrorBanner() {
  const banner = [
    colorize('+======================================================+', COLORS.red),
    colorize('|                                                      |', COLORS.red),
    colorize('|   ' + colorize('WUT?', COLORS.bgRed + COLORS.white + COLORS.bold) + colorize('                                     |', COLORS.red)),
    colorize('|                                                      |', COLORS.red),
    colorize('+======================================================+', COLORS.red)
  ].join('\n');
  console.log(banner);
}

function printStackTrace(errors) {
  console.log(colorize('\n' + '-'.repeat(55), COLORS.dim));
  console.log(colorize('  Stack Trace:', COLORS.yellow + COLORS.bold));
  console.log(colorize('  ' + '-'.repeat(50), COLORS.dim));
  
  for (let i = 0; i < errors.length; i++) {
    const err = errors[i];
    const num = colorize(`[${i + 1}]`, COLORS.cyan);
    const file = colorize(err.file || 'unknown.stngr', COLORS.bold);
    const line = colorize(`line ${err.line || '?'}`, COLORS.yellow);
    const msg = colorize(err.message || 'Unknown error', COLORS.red);
    
    console.log(`  ${num} ${file}:${line}`);
    console.log(`      ${msg}`);
    
    if (err.column) {
      const caret = ' '.repeat(err.column) + colorize('^', COLORS.bgRed + COLORS.white);
      console.log(`      ${caret} <-- here`);
    }
    
    if (i < errors.length - 1) {
      console.log(colorize('  │', COLORS.dim));
    }
  }
  
  console.log(colorize('  ' + '-'.repeat(50), COLORS.dim));
}

function printSuggestions(warnings) {
  if (warnings.length === 0) return;
  
  console.log(colorize('\n  Suggestions:', COLORS.magenta + COLORS.bold));
  console.log(colorize('  ' + '-'.repeat(50), COLORS.dim));
  
  for (const warn of warnings) {
    const icon = colorize('⚠', COLORS.yellow);
    const msg = colorize(warn.message || '', COLORS.dim);
    console.log(`  ${icon} ${msg}`);
  }
  
  console.log(colorize('  ' + '-'.repeat(50), COLORS.dim));
}

function printSummary(errorCount, warningCount) {
  console.log(colorize('\n  Summary:', COLORS.bold));
  console.log(`    ${colorize(errorCount, COLORS.red)} error(s), ${colorize(warningCount, COLORS.yellow)} warning(s)`);
  console.log(colorize('  ' + '-'.repeat(50), COLORS.dim));
}

function printFullErrorLog(error, context = {}) {
  const timestamp = new Date().toISOString();
  const nodeVersion = process.version;
  const platform = process.platform;
  
  console.log(colorize('\n  Full Error Log:', COLORS.underline + COLORS.bold));
  console.log(colorize('  ' + '-'.repeat(50), COLORS.dim));
  console.log(`    Timestamp:  ${timestamp}`);
  console.log(`    Node:       ${nodeVersion}`);
  console.log(`    Platform:   ${platform}`);
  console.log(`    File:       ${error.file || context.file || 'unknown.stngr'}`);
  console.log(`    Line:       ${error.line || '?'}:${error.column || '?'}`);
  console.log(`    Type:       ${error.type || 'ParseError'}`);
  console.log(`    Message:    ${error.message}`);
  
  if (error.stack) {
    console.log(colorize('\n    Stack Trace:', COLORS.dim));
    error.stack.split('\n').forEach(line => {
      console.log(colorize('      ' + line, COLORS.dim));
    });
  }
  
  if (context.source) {
    console.log(colorize('\n    Source Context:', COLORS.dim));
    const lines = context.source.split('\n');
    const startLine = Math.max(0, (error.line || 1) - 3);
    const endLine = Math.min(lines.length, (error.line || 1) + 2);
    
    for (let i = startLine; i < endLine; i++) {
      const num = i + 1;
      const isActive = num === (error.line || 1);
      const prefix = isActive ? colorize('  >', COLORS.bgRed + COLORS.white) : colorize('    ', COLORS.dim);
      const lineText = isActive ? colorize(lines[i], COLORS.bold) : colorize(lines[i], COLORS.dim);
      console.log(`${prefix} ${num}: ${lineText}`);
    }
  }
  
  console.log(colorize('  ' + '-'.repeat(50), COLORS.dim));
}

class StingrayParser {
  constructor(options = {}) {
    this.options = {
      react: true,
      materialWeb: true,
      strictMode: true,
      showErrorDetails: true,
      ...options
    };
    this.errors = [];
    this.warnings = [];
    this.sourceMap = {};
  }

  parse(source, filename = 'unknown.stngr') {
    this.errors = [];
    this.warnings = [];
    
    const ast = {
      type: 'StingrayProgram',
      filename,
      children: [],
      imports: [],
      exports: [],
      metadata: {
        language: 'stingray',
        version: '1.0.0',
        features: []
      }
    };

    try {
      const tokens = this.tokenize(source);
      
      for (const token of tokens) {
        switch (token.type) {
          case 'import':
            ast.imports.push(this.parseImport(token));
            break;
          case 'export':
            ast.exports.push(this.parseExport(token));
            break;
          case 'component':
            ast.children.push(this.parseComponent(token));
            ast.metadata.features.push('component');
            break;
          case 'page':
            ast.children.push(this.parsePage(token));
            ast.metadata.features.push('page');
            break;
          case 'style':
            ast.children.push(this.parseStyle(token));
            ast.metadata.features.push('style');
            break;
          case 'script':
            ast.children.push(this.parseScript(token));
            ast.metadata.features.push('script');
            break;
          case 'template':
            ast.children.push(this.parseTemplate(token));
            ast.metadata.features.push('template');
            break;
          case 'layout':
            ast.children.push(this.parseLayout(token));
            ast.metadata.features.push('layout');
            break;
          case 'state':
            ast.children.push(this.parseState(token));
            ast.metadata.features.push('state');
            break;
          case 'effect':
            ast.children.push(this.parseEffect(token));
            ast.metadata.features.push('effect');
            break;
          case 'hook':
            ast.children.push(this.parseHook(token));
            ast.metadata.features.push('hook');
            break;
          case 'event':
            ast.children.push(this.parseEvent(token));
            ast.metadata.features.push('event');
            break;
          case 'mixin':
            ast.children.push(this.parseMixin(token));
            ast.metadata.features.push('mixin');
            break;
          case 'theme':
            ast.children.push(this.parseTheme(token));
            ast.metadata.features.push('theme');
            break;
          case 'fragment':
            ast.children.push(this.parseFragment(token));
            ast.metadata.features.push('fragment');
            break;
          case 'expression':
            ast.children.push(this.parseExpression(token));
            break;
          case 'raw':
            ast.children.push({ type: 'RawNode', content: token.content });
            break;
          default:
            this.warnings.push({
              file: filename,
              line: token.line,
              message: `Unknown token type: ${token.type}`
            });
        }
      }
    } catch (error) {
      this.handleFatalError(error, source, filename);
      throw error;
    }

    return ast;
  }

  handleFatalError(error, source, filename) {
    const parseError = {
      file: filename,
      line: error.line || 1,
      column: error.column || 0,
      message: error.message,
      type: error.name || 'ParseError',
      stack: error.stack
    };
    
    this.errors.push(parseError);
    
    // Print WUT? banner
    printErrorBanner();
    
    // Print full error log
    printFullErrorLog(parseError, { source, file: filename });
    
    // Print stack trace
    printStackTrace(this.errors);
    
    // Print suggestions if any
    printSuggestions(this.warnings);
    
    // Print summary
    printSummary(this.errors.length, this.warnings.length);
    
    // Also log to stderr for programmatic access
    const errorLog = {
      type: 'stingray-error',
      timestamp: new Date().toISOString(),
      error: parseError,
      warnings: this.warnings
    };
    
    if (this.options.showErrorDetails) {
      console.error('\n[Stingray Parser Error Log]:', JSON.stringify(errorLog, null, 2));
    }
  }

  tokenize(source) {
    const tokens = [];
    const lines = source.split('\n');
    let currentLine = 0;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      currentLine = i + 1;
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) {
        i++;
        continue;
      }

      // Import statements
      if (trimmed.match(/^import\s+.+\s+from\s+['"].+['"]\s*;?$/)) {
        tokens.push({
          type: 'import',
          content: trimmed,
          line: currentLine,
          parsed: this.parseImportStatement(trimmed)
        });
        i++;
        continue;
      }

      // Export statements
      if (trimmed.match(/^export\s+/)) {
        tokens.push({
          type: 'export',
          content: trimmed,
          line: currentLine
        });
        i++;
        continue;
      }

      // Component declaration
      if (trimmed.match(/^(component|page|layout)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*(extends\s+[a-zA-Z_$][a-zA-Z0-9_$]*)?\s*\{?/)) {
        const match = trimmed.match(/^(component|page|layout)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\s+extends\s+([a-zA-Z_$][a-zA-Z0-9_$]*))?\s*(\{?)?/);
        if (match) {
          try {
            const block = this.extractBlock(lines, i);
            tokens.push({
              type: match[1],
              name: match[2],
              extends: match[3] || null,
              content: block.content,
              line: currentLine,
              braceCount: block.braceCount
            });
            i += block.linesConsumed;
            continue;
          } catch (blockError) {
            this.handleTokenError(blockError, source, currentLine, filename || 'unknown.stngr');
          }
        }
      }

      // Style block
      if (trimmed.match(/^style\s+(?:global\s+)?(?:class|module)?\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\{?/)) {
        try {
          const block = this.extractBlock(lines, i);
          tokens.push({
            type: 'style',
            content: block.content,
            global: trimmed.includes('global'),
            line: currentLine
          });
          i += block.linesConsumed;
          continue;
        } catch (blockError) {
          this.handleTokenError(blockError, source, currentLine, filename || 'unknown.stngr');
        }
      }

      // Script block
      if (trimmed.match(/^script\s+(?:module|context)?\s*\{?/)) {
        try {
          const block = this.extractBlock(lines, i);
          tokens.push({
            type: 'script',
            content: block.content,
            module: trimmed.includes('module'),
            line: currentLine
          });
          i += block.linesConsumed;
          continue;
        } catch (blockError) {
          this.handleTokenError(blockError, source, currentLine, filename || 'unknown.stngr');
        }
      }

      // Template block
      if (trimmed.match(/^template\s*\{?/)) {
        try {
          const block = this.extractBlock(lines, i);
          tokens.push({
            type: 'template',
            content: block.content,
            line: currentLine
          });
          i += block.linesConsumed;
          continue;
        } catch (blockError) {
          this.handleTokenError(blockError, source, currentLine, filename || 'unknown.stngr');
        }
      }

      // State declaration
      if (trimmed.match(/^state\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*[:=]/)) {
        try {
          const block = this.extractBlock(lines, i);
          tokens.push({
            type: 'state',
            content: block.content,
            line: currentLine
          });
          i += block.linesConsumed;
          continue;
        } catch (blockError) {
          this.handleTokenError(blockError, source, currentLine, filename || 'unknown.stngr');
        }
      }

      // Effect declaration
      if (trimmed.match(/^effect\s*\{?/)) {
        try {
          const block = this.extractBlock(lines, i);
          tokens.push({
            type: 'effect',
            content: block.content,
            line: currentLine
          });
          i += block.linesConsumed;
          continue;
        } catch (blockError) {
          this.handleTokenError(blockError, source, currentLine, filename || 'unknown.stngr');
        }
      }

      // Hook declaration
      if (trimmed.match(/^hook\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\{?/)) {
        try {
          const block = this.extractBlock(lines, i);
          tokens.push({
            type: 'hook',
            name: trimmed.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/)[0],
            content: block.content,
            line: currentLine
          });
          i += block.linesConsumed;
          continue;
        } catch (blockError) {
          this.handleTokenError(blockError, source, currentLine, filename || 'unknown.stngr');
        }
      }

      // Event declaration
      if (trimmed.match(/^event\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\{?/)) {
        try {
          const block = this.extractBlock(lines, i);
          tokens.push({
            type: 'event',
            name: trimmed.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/)[0],
            content: block.content,
            line: currentLine
          });
          i += block.linesConsumed;
          continue;
        } catch (blockError) {
          this.handleTokenError(blockError, source, currentLine, filename || 'unknown.stngr');
        }
      }

      // Mixin declaration
      if (trimmed.match(/^mixin\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\{?/)) {
        try {
          const block = this.extractBlock(lines, i);
          tokens.push({
            type: 'mixin',
            name: trimmed.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/)[0],
            content: block.content,
            line: currentLine
          });
          i += block.linesConsumed;
          continue;
        } catch (blockError) {
          this.handleTokenError(blockError, source, currentLine, filename || 'unknown.stngr');
        }
      }

      // Theme declaration
      if (trimmed.match(/^theme\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\{?/)) {
        try {
          const block = this.extractBlock(lines, i);
          tokens.push({
            type: 'theme',
            name: trimmed.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/)[0],
            content: block.content,
            line: currentLine
          });
          i += block.linesConsumed;
          continue;
        } catch (blockError) {
          this.handleTokenError(blockError, source, currentLine, filename || 'unknown.stngr');
        }
      }

      // Fragment
      if (trimmed.match(/^fragment\s*\{?/)) {
        try {
          const block = this.extractBlock(lines, i);
          tokens.push({
            type: 'fragment',
            content: block.content,
            line: currentLine
          });
          i += block.linesConsumed;
          continue;
        } catch (blockError) {
          this.handleTokenError(blockError, source, currentLine, filename || 'unknown.stngr');
        }
      }

      // Expression statement
      if (trimmed.match(/^(const|let|var|function|class|return|await|async)\s/)) {
        try {
          const block = this.extractBlock(lines, i);
          tokens.push({
            type: 'expression',
            content: block.content,
            line: currentLine
          });
          i += block.linesConsumed;
          continue;
        } catch (blockError) {
          this.handleTokenError(blockError, source, currentLine, filename || 'unknown.stngr');
        }
      }

      // Raw HTML-like content
      if (trimmed.match(/^<[a-zA-Z][a-zA-Z0-9_-]*(\s[^>]*)?\/?>|<\/?[a-zA-Z][a-zA-Z0-9_-]*>/)) {
        try {
          const block = this.extractRawHTML(lines, i);
          tokens.push({
            type: 'raw',
            content: block.content,
            line: currentLine
          });
          i += block.linesConsumed;
          continue;
        } catch (blockError) {
          this.handleTokenError(blockError, source, currentLine, filename || 'unknown.stngr');
        }
      }

      i++;
    }

    return tokens;
  }

  handleTokenError(error, source, line, filename) {
    const tokenError = {
      file: filename,
      line: line,
      column: 0,
      message: error.message || 'Unexpected token',
      type: 'TokenError',
      source: source
    };
    
    this.errors.push(tokenError);
    
    printErrorBanner();
    printFullErrorLog(tokenError, { source, file: filename });
    printStackTrace(this.errors);
    printSummary(this.errors.length, this.warnings.length);
  }

  extractBlock(lines, startIndex) {
    let content = '';
    let braceCount = 0;
    let started = false;
    let linesConsumed = 0;
    const startLine = lines[startIndex];
    const trimmedStart = startLine.trim();

    // Check if block starts with { on same line
    if (trimmedStart.includes('{')) {
      braceCount = (trimmedStart.match(/{/g) || []).length - (trimmedStart.match(/}/g) || []).length;
      started = true;
      content = trimmedStart;
      linesConsumed = 1;
    }

    // Continue reading lines until braces are balanced
    let idx = startIndex + (started ? 1 : 0);
    while (idx < lines.length && !(started && braceCount <= 0)) {
      const line = lines[idx];
      const trimmed = line.trim();
      
      if (trimmed.includes('{')) {
        braceCount += (trimmed.match(/{/g) || []).length;
        started = true;
      }
      if (trimmed.includes('}')) {
        braceCount -= (trimmed.match(/}/g) || []).length;
      }

      if (!started) {
        content = trimmed;
      } else {
        content += '\n' + trimmed;
      }
      
      linesConsumed++;
      idx++;
    }

    // If no braces found, treat single line as content
    if (!started && !content) {
      content = trimmedStart;
      linesConsumed = 1;
    }

    return { content, braceCount, linesConsumed };
  }

  extractRawHTML(lines, startIndex) {
    let content = '';
    let linesConsumed = 0;
    let tagStack = [];

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      linesConsumed++;
      content += (content ? '\n' : '') + line;

      // Simple tag tracking
      const openTags = line.match(/<[a-zA-Z][a-zA-Z0-9_-]*(?:\s[^>]*)?>/g) || [];
      const closeTags = line.match(/<\/[a-zA-Z][a-zA-Z0-9_-]*>/g) || [];
      const selfClosing = line.match(/<[a-zA-Z][a-zA-Z0-9_-]*\s*\/>/g) || [];

      for (const tag of openTags) {
        if (!selfClosing.some(sc => tag === sc) && !tag.endsWith('/>')) {
          const tagName = tag.match(/<([a-zA-Z][a-zA-Z0-9_-]*)/)[1];
          tagStack.push(tagName);
        }
      }

      for (const tag of closeTags) {
        const tagName = tag.match(/<\/([a-zA-Z][a-zA-Z0-9_-]*)/)[1];
        if (tagStack[tagStack.length - 1] === tagName) {
          tagStack.pop();
        }
      }

      if (tagStack.length === 0 && linesConsumed > 1) {
        break;
      }
    }

    return { content, linesConsumed };
  }

  parseImportStatement(str) {
    const match = str.match(/^import\s+(.+)\s+from\s+['"](.+)['"]/);
    if (match) {
      return {
        specifiers: this.parseImportSpecifiers(match[1]),
        module: match[2]
      };
    }
    return { specifiers: ['default'], module: '' };
  }

  parseImportSpecifiers(specifiers) {
    const result = [];
    const parts = specifiers.split(',').map(s => s.trim());
    
    for (const part of parts) {
      if (part.includes(' as ')) {
        const [name, alias] = part.split(' as ').map(s => s.trim());
        result.push({ type: 'named', imported: name, local: alias });
      } else if (part.startsWith('{')) {
        const inner = part.replace(/[{}]/g, '').split(',').map(s => s.trim());
        for (const item of inner) {
          if (item.includes(' as ')) {
            const [name, alias] = item.split(' as ').map(s => s.trim());
            result.push({ type: 'named', imported: name, local: alias });
          } else {
            result.push({ type: 'named', imported: item, local: item });
          }
        }
      } else {
        result.push({ type: 'default', local: part });
      }
    }
    return result;
  }

  parseImport(token) {
    return {
      type: 'ImportDeclaration',
      specifiers: token.parsed.specifiers,
      source: token.parsed.module,
      line: token.line
    };
  }

  parseExport(token) {
    return {
      type: 'ExportDeclaration',
      content: token.content,
      line: token.line
    };
  }

  parseComponent(token) {
    let jsContent = '';
    let htmlContent = '';
    let cssContent = '';
    let currentSection = 'js';

    const lines = token.content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('<style>') || trimmed.startsWith('.styles')) {
        currentSection = 'css';
        continue;
      }
      if (trimmed === '</style>' || trimmed === '.styles.end') {
        currentSection = 'js';
        continue;
      }
      if (trimmed.startsWith('<template>') || trimmed.startsWith('.html')) {
        currentSection = 'html';
        continue;
      }
      if (trimmed === '</template>' || trimmed === '.html.end') {
        currentSection = 'js';
        continue;
      }

      switch (currentSection) {
        case 'js':
          jsContent += (jsContent ? '\n' : '') + line;
          break;
        case 'html':
          htmlContent += (htmlContent ? '\n' : '') + line;
          break;
        case 'css':
          cssContent += (cssContent ? '\n' : '') + line;
          break;
      }
    }

    return {
      type: 'ComponentDeclaration',
      name: token.name,
      extends: token.extends,
      javascript: jsContent,
      template: htmlContent,
      styles: cssContent,
      line: token.line
    };
  }

  parsePage(token) {
    return {
      type: 'PageDeclaration',
      name: token.name,
      content: token.content,
      line: token.line,
      meta: {
        title: '',
        description: '',
        routes: []
      }
    };
  }

  parseLayout(token) {
    return {
      type: 'LayoutDeclaration',
      name: token.name,
      content: token.content,
      line: token.line
    };
  }

  parseStyle(token) {
    return {
      type: 'StyleBlock',
      content: token.content,
      global: token.global || false,
      line: token.line
    };
  }

  parseScript(token) {
    let ast = null;
    try {
      ast = acorn.parse(token.content, {
        ecmaVersion: 'latest',
        sourceType: token.module ? 'module' : 'script',
        locations: true
      });
    } catch (e) {
      this.warnings.push({
        file: token.file || 'unknown.stngr',
        line: token.line,
        message: `JavaScript parse warning: ${e.message}`
      });
    }

    return {
      type: 'ScriptBlock',
      content: token.content,
      ast,
      module: token.module || false,
      line: token.line
    };
  }

  parseTemplate(token) {
    return {
      type: 'TemplateBlock',
      content: token.content,
      line: token.line
    };
  }

  parseState(token) {
    return {
      type: 'StateDeclaration',
      content: token.content,
      line: token.line
    };
  }

  parseEffect(token) {
    return {
      type: 'EffectDeclaration',
      content: token.content,
      line: token.line
    };
  }

  parseHook(token) {
    return {
      type: 'HookDeclaration',
      name: token.name,
      content: token.content,
      line: token.line
    };
  }

  parseEvent(token) {
    return {
      type: 'EventDeclaration',
      name: token.name,
      content: token.content,
      line: token.line
    };
  }

  parseMixin(token) {
    return {
      type: 'MixinDeclaration',
      name: token.name,
      content: token.content,
      line: token.line
    };
  }

  parseTheme(token) {
    return {
      type: 'ThemeDeclaration',
      name: token.name,
      content: token.content,
      line: token.line
    };
  }

  parseFragment(token) {
    return {
      type: 'FragmentBlock',
      content: token.content,
      line: token.line
    };
  }

  parseExpression(token) {
    let ast = null;
    try {
      ast = acorn.parseExpressionAt(token.content, 0, {
        ecmaVersion: 'latest',
        sourceType: 'module'
      });
    } catch (e) {
      this.warnings.push({
        file: token.file || 'unknown.stngr',
        line: token.line,
        message: `Expression parse warning: ${e.message}`
      });
    }

    return {
      type: 'ExpressionStatement',
      content: token.content,
      ast,
      line: token.line
    };
  }

  parseFile(filename) {
    const source = fs.readFileSync(filename, 'utf-8');
    return this.parse(source, path.basename(filename));
  }

  getErrors() {
    return this.errors;
  }

  getWarnings() {
    return this.warnings;
  }
}

module.exports = { StingrayParser, printErrorBanner, printFullErrorLog, printStackTrace, printSuggestions, printSummary };
