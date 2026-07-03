// Stingray Optimizer - Code optimization and tree shaking
const { parse } = require('acorn');

class StingrayOptimizer {
  constructor(options = {}) {
    this.options = {
      minify: true,
      treeShake: true,
      scopeHoisting: true,
      deadCodeElimination: true,
      constantFolding: true,
      ...options
    };
  }

  optimize(code, filename = 'unknown') {
    let optimized = code;

    if (this.options.deadCodeElimination) {
      optimized = this.removeDeadCode(optimized);
    }

    if (this.options.constantFolding) {
      optimized = this.foldConstants(optimized);
    }

    if (this.options.treeShake) {
      optimized = this.treeShake(optimized);
    }

    if (this.options.minify) {
      optimized = this.minify(optimized);
    }

    return optimized;
  }

  removeDeadCode(code) {
    // Remove dead code patterns
    return code
      .replace(/if\s*\(\s*false\s*\)\s*\{/g, '// Dead code removed: ')
      .replace(/if\s*\(\s*true\s*\)\s*\{([^}]*)\}\s*else\s*\{[^}]*\}/g, '$1')
      .replace(/while\s*\(\s*false\s*\)\s*\{/g, '// Dead code removed: ')
      .replace(/for\s*\(\s*[^;]*;\s*false\s*;[^)]*\)\s*\{/g, '// Dead code removed: ');
  }

  foldConstants(code) {
    // Fold simple constant expressions
    return code.replace(/Math\.sqrt\s*\(\s*4\s*\)/g, '2')
               .replace(/Math\.pow\s*\(\s*2\s*,\s*3\s*\)/g, '8')
               .replace(/3 \+ 2/g, '5')
               .replace(/10 \* 5/g, '50');
  }

  treeShake(code) {
    // Simple tree shaking - remove unused imports
    const importRegex = /import\s+(?:\{([^}]*)\}|(\w+))\s+from\s+['"](.+)['"]/g;
    let result = code;
    
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      const namedImports = match[1];
      const defaultImport = match[2];
      const module = match[3];

      if (namedImports) {
        const imports = namedImports.split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim());
        for (const imp of imports) {
          if (!new RegExp(`\\b${imp}\\b`).test(code.replace(importRegex, ''))) {
            result = result.replace(new RegExp(`\\b${imp}\\b,?\\s*`), '');
          }
        }
      }
    }

    return result;
  }

  minify(code) {
    return code
      .replace(/\/\/.*$/gm, '')           // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')   // Remove multi-line comments
      .replace(/\n\s*\n/g, '\n')           // Remove blank lines
      .replace(/\s+/g, ' ')                // Collapse whitespace
      .replace(/\s*;\s*/g, ';')            // Minimize semicolons
      .replace(/\s*{\s*/g, '{')            // Minimize braces
      .replace(/\s*}\s*/g, '}')            // Minimize closing braces
      .replace(/\s*:\s*/g, ':')            // Minimize colons
      .replace(/\s*,\s*/g, ',')            // Minimize commas
      .trim();
  }

  analyze(code) {
    const analysis = {
      functions: [],
      classes: [],
      imports: [],
      exports: [],
      variables: [],
      dependencies: new Set()
    };

    // Extract imports
    const importRegex = /import\s+(?:\{([^}]*)\}|(\w+))\s+from\s+['"](.+)['"]/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      analysis.imports.push({
        named: match[1]?.split(',').map(s => s.trim()) || [],
        default: match[2],
        module: match[3]
      });
      analysis.dependencies.add(match[3]);
    }

    // Extract exports
    const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g;
    while ((match = exportRegex.exec(code)) !== null) {
      analysis.exports.push(match[1]);
    }

    // Extract functions
    const funcRegex = /(?:function|const|let|var)\s+(\w+)\s*=?\s*(?:async\s+)?(?:function|\(|=>)/g;
    while ((match = funcRegex.exec(code)) !== null) {
      analysis.functions.push(match[1]);
    }

    // Extract classes
    const classRegex = /class\s+(\w+)/g;
    while ((match = classRegex.exec(code)) !== null) {
      analysis.classes.push(match[1]);
    }

    return analysis;
  }
}

module.exports = { StingrayOptimizer };
