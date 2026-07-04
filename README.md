# 🐟 Stingray - HTML + CSS + JS + React in ONE file

**A language where everything goes together.** Write `.stngr`, get the web.

## The Easiest Thing You'll Use

```bash
stingray init my-app     # Creates the entire project
cd my-app
stingray dev             # Starts dev server (auto-opens browser)
```

**Have a `.stngr` file?** Just pass it directly:

```bash
stingray app.stngr       # Compiles and opens automatically
```

## Commands That Matter

| Command | What it does |
|---------|----------|
| `stingray init <name>` | Creates a ready-to-use project |
| `stingray dev` | Dev server with hot reload + opens browser |
| `stingray build` | Compiles for production |
| `stingray compile x.stngr` | Compiles a file |
| `stingray run x.stngr` | Compiles and executes |
| `stingray new component MyButton` | Creates a component |
| `stingray new page Home` | Creates a page |
| `stingray serve` | Serves static files |

## Shortcuts

```bash
sr init my-app        → stingray init my-app
stngr dev             → stingray dev
sb                    → stingray build
stingray app.stngr    → auto-compiles and opens
```

## What is a `.stngr` file?

Everything in one. HTML, CSS, JS, and React in a single readable file:

```stingray
component Counter {
  state {
    count = 0;
  }

  template {
    <div class="app">
      <h1>Counter: {count}</h1>
      <mdc-button @click="increment">+ Add</mdc-button>
      <mdc-button @click="decrement">- Subtract</mdc-button>
    </div>
  }

  script {
    function increment() { count++; }
    function decrement() { count--; }
  }

  style {
    .app { text-align: center; padding: 40px; }
    h1 { color: #0066cc; }
  }
}
```

## Installation

### Option 1: Automatic Installer (recommended)

```bash
# Installs everything: dependencies, PATH, file associations, VS Code
stingray --install

# Or with global npm
npm install -g stingray-lang
```

### Option 2: Standalone Installer (.exe)

```bash
# Generate the installer
node bin/installer.js

# To create real .exe you need:
# Inno Setup: "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" Stingray.iss
# NSIS: makensis Stingray.nsi
```

Generates:
- `Stingray.iss` → Inno Setup (compiles to .exe)
- `Stingray.nsi` → NSIS (compiles to .exe)
- `Stingray-Installer.bat` → Self-installer without dependencies
- `installer-dist/portable/` → Portable package (ZIP)

### Option 3: Portable (no install)

```bash
node bin/installer.js portable
# Use: installer-dist/portable/start.bat
```

### Option 4: From npm

```bash
npm install -g stingray-lang
```

## System Integration

### Windows
- **File association**: double-click `.stngr` to compile
- **Context menu** (right-click): Compile, Dev Server, Build
- **Drag and drop**: drag `.stngr` to terminal
- **Quick scripts**: `stingray-dev.bat`, `stingray-build.bat`, etc.
- **Auto PATH**: `stingray` available from any folder
- **Environment variables**: `STINGRAY_HOME` configured

### VS Code
- **Auto installation** with `stingray --install`
- **Syntax highlighting** for HTML, CSS, JS inside `.stngr`
- **40+ snippets** (type `stng-btn` + Tab)
- **WUT? Errors** with full stack trace
- **Autocompletion** for Material Web components
- **Real-time validation** on save

### WUT? Errors

When something fails, you see exactly what:

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
    
    Source Context:
      13:   <mdc-button>Submit</mdc-button>
      14: </div>
    > 15: }
      16:
```

## File Extensions

- **`.stngr`** - Stingray source file
- **Logo**: `Assets/logo.ico`

## Web Compatible

Stingray compiles to plain HTML/CSS/JS. Everything that works on the web, works with Stingray:

- npm libraries
- Browser APIs (fetch, localStorage, etc.)
- React/Vue/Angular frameworks
- Any CDN

## Project Structure

```
my-app/
├── src/
│   ├── components/    ← Your components (.stngr)
│   ├── pages/         ← Pages (.stngr)
│   ├── hooks/         ← Custom hooks
│   └── styles/        ← Themes and styles
├── public/            ← Static files
├── stingray.json      ← Configuration
└── package.json       ← npm packages
```

## Generate Installers

```bash
# Generate ALL (Inno Setup + NSIS + Self-installer + Portable)
node bin/installer.js

# Generate single type
node bin/installer.js npm          # npm package only
node bin/installer.js inno         # Inno Setup only
node bin/installer.js nsis         # NSIS only
node bin/installer.js self         # Self-installer only
node bin/installer.js portable     # Portable only

# Help
node bin/installer.js --help
```

## License

MIT