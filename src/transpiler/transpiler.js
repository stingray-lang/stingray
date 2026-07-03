// Stingray Transpiler - Converts .stngr to HTML/CSS/JS/React
const path = require('path');
const fs = require('fs');

class StingrayTranspiler {
  constructor(options = {}) {
    this.options = {
      react: true,
      materialWeb: true,
      minify: false,
      sourcemap: false,
      targetEnv: 'auto', // 'browser', 'node', 'auto'
      ...options
    };
  }

  transpile(ast, filename = 'input.stngr') {
    const result = {
      html: '',
      css: '',
      js: '',
      react: '',
      metadata: {
        filename,
        features: ast.metadata?.features || [],
        imports: ast.imports || [],
        exports: ast.exports || []
      }
    };

    for (const node of ast.children) {
      switch (node.type) {
        case 'ComponentDeclaration':
          this.transpileComponent(node, result);
          break;
        case 'PageDeclaration':
          this.transpilePage(node, result);
          break;
        case 'LayoutDeclaration':
          this.transpileLayout(node, result);
          break;
        case 'StyleBlock':
          result.css += this.transpileStyle(node);
          break;
        case 'ScriptBlock':
          result.js += this.transpileScript(node);
          break;
        case 'TemplateBlock':
          result.html += this.transpileTemplate(node);
          break;
        case 'StateDeclaration':
          result.react += this.transpileState(node);
          break;
        case 'EffectDeclaration':
          result.react += this.transpileEffect(node);
          break;
        case 'HookDeclaration':
          result.js += this.transpileHook(node);
          break;
        case 'EventDeclaration':
          result.js += this.transpileEvent(node);
          break;
        case 'MixinDeclaration':
          result.js += this.transpileMixin(node);
          break;
        case 'ThemeDeclaration':
          result.css += this.transpileTheme(node);
          break;
        case 'FragmentBlock':
          result.html += this.transpileFragment(node);
          break;
        case 'RawNode':
          result.html += node.content;
          break;
      }
    }

    // Process imports
    for (const imp of ast.imports) {
      this.transpileImport(imp, result);
    }

    return result;
  }

  transpileComponent(node, result) {
    const componentName = node.name;
    const baseName = componentName.charAt(0).toLowerCase() + componentName.slice(1);
    
    // Generate React component
    result.react += `\nimport React, { useState, useEffect, useRef } from 'react';\n`;
    result.react += `import { ${this.getMaterialComponents(node)} } from '@material/web/';\n`;
    
    if (node.extends) {
      result.react += `export class ${componentName} extends ${node.extends} {\n`;
    } else {
      result.react += `export function ${componentName}(props) {\n`;
    }

    // Process JavaScript content
    if (node.javascript) {
      result.js += this.injectIntoFunction(node.javascript, componentName);
    }

    // Process template
    if (node.template) {
      result.html += this.processTemplate(node.template, componentName);
    }

    // Process styles
    if (node.styles) {
      result.css += this.processStyles(node.styles, baseName);
    }

    result.react += `  return (\n    <${componentName} />\n  );\n}\n`;
  }

  transpilePage(node, result) {
    result.html += `<!-- Page: ${node.name} -->\n`;
    result.html += `<div class="page-${node.name.toLowerCase()}">\n`;
    result.html += this.processTemplate(node.content, node.name);
    result.html += `</div>\n`;
    
    result.react += `\nexport function Page${node.name}(props) {\n`;
    result.react += `  return <${node.name} {...props} />;\n`;
    result.react += `}\n`;
  }

  transpileLayout(node, result) {
    result.html += `<!-- Layout: ${node.name} -->\n`;
    result.html += `<div class="layout-${node.name.toLowerCase()}" data-layout="${node.name}">\n`;
    result.html += this.processTemplate(node.content, node.name);
    result.html += `</div>\n`;
  }

  transpileStyle(node) {
    return `\n/* Style Block */\n${node.content}\n`;
  }

  transpileScript(node) {
    if (node.ast) {
      return `\n// Script Block (parsed)\n${node.content}\n`;
    }
    return `\n// Script Block\n${node.content}\n`;
  }

  transpileTemplate(node) {
    return this.processTemplate(node.content, 'template');
  }

  transpileState(node) {
    return `\n// State Declaration\n${node.content}\n`;
  }

  transpileEffect(node) {
    return `\n// Effect Declaration\n${node.content}\n`;
  }

  transpileHook(node) {
    return `\n// Hook: ${node.name}\n${node.content}\n`;
  }

  transpileEvent(node) {
    return `\n// Event: ${node.name}\n${node.content}\n`;
  }

  transpileMixin(node) {
    return `\n// Mixin: ${node.name}\n${node.content}\n`;
  }

  transpileTheme(node) {
    return `\n/* Theme: ${node.name} */\n${node.content}\n`;
  }

  transpileFragment(node) {
    return this.processTemplate(node.content, 'fragment');
  }

  transpileImport(imp, result) {
    for (const spec of imp.specifiers) {
      if (spec.type === 'named') {
        result.js += `import { ${spec.imported} } from '${imp.source}';\n`;
      } else {
        result.js += `import ${spec.local} from '${imp.source}';\n`;
      }
    }
  }

  processTemplate(content, context) {
    let processed = content;

    // Convert Stingray template syntax to HTML/JSX
    // Handle event bindings: @click="handler"
    processed = processed.replace(/@(\w+)\s*=\s*"([^"]*)"/g, (match, event, handler) => {
      return `on${event.charAt(0).toUpperCase() + event.slice(1)}={() => ${handler}}`;
    });

    // Handle property binding: prop={value}
    processed = processed.replace(/\{([^}]+)\}/g, (match, expr) => {
      if (expr.startsWith('$')) {
        return `{${expr.substring(1)}}`;
      }
      return expr;
    });

    // Handle conditional rendering: #if condition
    processed = processed.replace(/#if\s+(\w+)/g, '(($1) ? (');
    processed = processed.replace(/#else/g, ') : (');
    processed = processed.replace(/#endif/g, ')');

    // Handle for loops: #for item in collection
    processed = processed.replace(/#for\s+(\w+)\s+in\s+(\w+)/g, '$2.map(($1) => (');
    processed = processed.replace(/#endfor/g, '))');

    // Handle component references
    processed = processed.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

    return processed;
  }

  processStyles(content, context) {
    // Convert Stingray CSS to standard CSS with component scoping
    let processed = content;
    
    // Add component-specific selectors
    processed = processed.replace(/:root/g, `:root, .${context}`);
    processed = processed.replace(/:host/g, `.${context}`);
    
    // Convert custom properties
    processed = processed.replace(/--([\w-]+)\s*:/g, '--stingray-$1:');
    
    return `\n.${context} {\n${processed}\n}\n`;
  }

  injectIntoFunction(code, functionName) {
    return `${code}\n`;
  }

  getMaterialComponents(node) {
    const components = new Set();
    const materialKeywords = [
      'MDCButton', 'MDCCard', 'MDCTextField', 'MDCToggleButton',
      'MDCSwitch', 'MDCTabs', 'MDCTooltip', 'MDCLink',
      'MDCIconButton', 'MDCMenu', 'MDCDialog', 'MDCSnackbar',
      'MDCLinearProgress', 'MDCCircularProgress', 'MDCCheckbox',
      'MDCRadio', 'MDCSlider', 'MDCSelect', 'MDCList',
      'MDCDrawer', 'MDCTopAppBar', 'MDCFooter', 'MDCHeader'
    ];

    if (node.content) {
      for (const comp of materialKeywords) {
        if (node.content.toLowerCase().includes(comp.toLowerCase()) ||
            node.content.toLowerCase().includes(comp.toLowerCase().replace('mdc', 'md').replace('button', 'button'))) {
          components.add(comp);
        }
      }
    }

    // Default Material Web components
    components.add('MDCButton');
    components.add('MDCCard');
    components.add('MDCTextField');
    components.add('MDCSwitch');
    components.add('MDCTabs');

    return Array.from(components).join(', ');
  }

  transpileToString(ast, filename) {
    const result = this.transpile(ast, filename);
    return {
      html: result.html,
      css: result.css,
      js: result.js,
      react: result.react,
      metadata: result.metadata
    };
  }
}

module.exports = { StingrayTranspiler };
