# Stingray Language Documentation

## Overview

Stingray is a programming language that fuses HTML, CSS, JavaScript, and React into a single `.stngr` file. It compiles to plain web-compatible code that runs in any browser.

## Installation

```bash
npm install -g stingray-lang
stingray --install
```

## CLI Commands

### Core Commands

| Command | Description |
|---------|-------------|
| `stingray init <name>` | Create a new Stingray project |
| `stingray dev [src]` | Start development server (localhost:8080) |
| `stingray build [src] [out]` | Build for production |
| `stingray compile <file>` | Compile a single .stngr file |
| `stingray run <file>` | Compile and execute a .stngr file |
| `stingray serve [dir]` | Serve static files |
| `stingray new <type> <name>` | Create component/page/hook |
| `stingray test [dir]` | Run test files |
| `stingray lint [dir]` | Lint .stngr files |
| `stingray transpile [src]` | Transpile to React/JSX |
| `stingray example` | Show code snippets and compilation guide |
| `stingray help` | Show help message |

### Shortcuts

| Shortcut | Command |
|----------|---------|
| `sr` | stingray |
| `stngr` | stingray |
| `s` | serve |
| `d` | dev |
| `r` | run |
| `h` | help |
| `e` | example |

## File Format (.stngr)

A `.stngr` file contains four sections:

```stingray
component MyComponent {
  state {
    count = 0;
    name = "World";
  }

  template {
    <div class="app">
      <h1>Hello {name}!</h1>
      <p>Count: {count}</p>
      <mdc-button @click="increment">+</mdc-button>
    </div>
  }

  script {
    function increment() {
      count++;
    }
  }

  style {
    .app { text-align: center; padding: 40px; }
    h1 { color: #0066cc; }
  }
}
```

### Sections

1. **state** - Reactive state variables
2. **template** - HTML-like markup with interpolation `{var}` and loops `#for/#endfor`
3. **script** - JavaScript logic
4. **style** - CSS styles

## Project Structure

```
my-app/
├── src/
│   ├── components/    ← Component files (.stngr)
│   ├── pages/         ← Page files (.stngr)
│   ├── hooks/         ← Custom hooks
│   └── styles/        ← Theme files
├── public/            ← Static assets
├── stingray.json      ← Configuration
└── package.json       ← npm packages
```

## Configuration (stingray.json)

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "runtime": "browser-node-hybrid",
  "target": ["web", "desktop", "mobile"],
  "compiler": {
    "transpile": true,
    "optimize": true,
    "minify": true,
    "sourcemap": true
  },
  "features": {
    "html": true,
    "css": true,
    "javascript": true,
    "react": true,
    "materialWeb": true
  }
}
```

## Building the VS Code Extension

```bash
# Build the extension
npm run build:extension
```

This compiles TypeScript sources and bundles the extension for distribution.

## Deployment

### GitHub Pages

```bash
npm run deploy
```

Or push to `main` branch - GitHub Actions automatically deploys.

### npm

```bash
npm publish --access public
```

## Error Handling

Stingray uses "WUT?" error messages with full stack traces:

```
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   WUT?                                               ║
║                                                      ║
╚══════════════════════════════════════════════════════╝

  Full Error Log:
  ─────────────────────────────────────────────────────
    Timestamp:  2026-07-03T...
    File:       app.stngr
    Line:       15:3
    Error:      Unexpected token '}'
```

## License

MIT