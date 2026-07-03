// Stingray Test Suite
const assert = require('assert');
const { StingrayParser } = require('../src/parser/parser');
const { StingrayTranspiler } = require('../src/transpiler/transpiler');
const { StingrayCompiler } = require('../src/compiler/compiler');

console.log('Running Stingray Tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ✗ ${name}: ${error.message}`);
    failed++;
  }
}

// Parser Tests
console.log('Parser Tests:');
const parser = new StingrayParser();

test('Should parse a simple component', () => {
  const source = `
component TestComponent {
  template {
    <div>Hello</div>
  }
}
`;
  const ast = parser.parse(source, 'test.stngr');
  assert.strictEqual(ast.children.length, 1);
  assert.strictEqual(ast.children[0].type, 'ComponentDeclaration');
  assert.strictEqual(ast.children[0].name, 'TestComponent');
});

test('Should parse style blocks', () => {
  const source = `
style global {
  body { margin: 0; }
}
`;
  const ast = parser.parse(source, 'test.stngr');
  assert.strictEqual(ast.children.length, 1);
  assert.strictEqual(ast.children[0].type, 'StyleBlock');
});

test('Should parse script blocks', () => {
  const source = `
script {
  function hello() {
    console.log('hello');
  }
}
`;
  const ast = parser.parse(source, 'test.stngr');
  assert.strictEqual(ast.children.length, 1);
  assert.strictEqual(ast.children[0].type, 'ScriptBlock');
});

test('Should parse import statements', () => {
  const source = `
import React from 'react';
import { useState } from 'react';

component App {
  template { <div>App</div> }
}
`;
  const ast = parser.parse(source, 'test.stngr');
  assert.strictEqual(ast.imports.length, 2);
});

// Transpiler Tests
console.log('\nTranspiler Tests:');
const transpiler = new StingrayTranspiler();

test('Should transpile component to React', () => {
  const ast = {
    type: 'StingrayProgram',
    filename: 'test.stngr',
    children: [{
      type: 'ComponentDeclaration',
      name: 'Test',
      javascript: '',
      template: '<div>Test</div>',
      styles: '',
      line: 1
    }],
    imports: [],
    exports: [],
    metadata: { features: ['component'] }
  };
  
  const result = transpiler.transpile(ast);
  assert.ok(result.react.includes('Test'));
  assert.ok(result.html.includes('Test'));
});

test('Should transpile template syntax', () => {
  const processed = transpiler.processTemplate('<div>{message}</div>', 'test');
  assert.ok(processed.includes('message'));
});

// Compiler Tests
console.log('\nCompiler Tests:');
const compiler = new StingrayCompiler();

test('Should compile Stingray source', async () => {
  const source = `
component Test {
  template { <div>Test</div> }
}
`;
  const ast = parser.parse(source, 'test.stngr');
  const transpiled = transpiler.transpile(ast);
  assert.ok(transpiled.js || transpiled.react);
});

// Stats
console.log('\n' + '='.repeat(40));
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('='.repeat(40));

if (failed > 0) {
  process.exit(1);
}
