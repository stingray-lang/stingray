// Stingray Runtime - Integrated runtime with fetch, filesystem, and process APIs
const { fetch: undiciFetch, Request, Response, Headers } = require('undici');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const https = require('https');

class StingrayRuntime {
  constructor(options = {}) {
    this.options = {
      port: 8080,
      host: 'localhost',
      hotReload: true,
      debug: false,
      ...options
    };
    this.modules = new Map();
    this.components = new Map();
    this.events = new Map();
    this.state = new Map();
    this.middleware = [];
    this.isRunning = false;
  }

  // Initialize the runtime environment
  async init() {
    console.log('[Stingray Runtime] Initializing...');
    
    // Setup global APIs
    this.setupGlobals();
    
    // Load built-in modules
    await this.loadModules();
    
    if (this.options.debug) {
      console.log('[Stingray Runtime] Debug mode enabled');
    }
    
    console.log('[Stingray Runtime] Ready');
    return this;
  }

  // Setup global APIs available in Stingray
  setupGlobals() {
    // Global fetch with enhanced capabilities
    global.fetch = async (url, options = {}) => {
      try {
        const response = await undiciFetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });
        return this.createResponse(response);
      } catch (error) {
        if (this.options.debug) {
          console.error('[Stingray Runtime] Fetch error:', error);
        }
        return this.createErrorResponse(error.message);
      }
    };

    // Global state management
    global.state = {
      get: (key) => this.state.get(key),
      set: (key, value) => {
        this.state.set(key, value);
        this.emit('state:change', { key, value });
      },
      delete: (key) => this.state.delete(key),
      clear: () => this.state.clear(),
      keys: () => Array.from(this.state.keys()),
      has: (key) => this.state.has(key)
    };

    // Global event system
    global.events = {
      on: (name, handler) => {
        if (!this.events.has(name)) {
          this.events.set(name, []);
        }
        this.events.get(name).push(handler);
      },
      emit: (name, data) => {
        const handlers = this.events.get(name) || [];
        handlers.forEach(h => h(data));
      },
      off: (name, handler) => {
        const handlers = this.events.get(name) || [];
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };

    // Global process API (Node.js compatible)
    global.process = {
      cwd: () => process.cwd(),
      env: process.env,
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      exit: (code = 0) => process.exit(code),
      on: (event, handler) => process.on(event, handler),
      argv: process.argv,
      pid: process.pid
    };

    // Global filesystem API
    global.fs = {
      read: async (file) => {
        try {
          return await fs.readFile(file, 'utf-8');
        } catch (e) {
          throw new Error(`FS Read Error: ${e.message}`);
        }
      },
      write: async (file, content) => {
        try {
          await fs.writeFile(file, content, 'utf-8');
          return true;
        } catch (e) {
          throw new Error(`FS Write Error: ${e.message}`);
        }
      },
      exists: async (file) => {
        try {
          await fs.access(file);
          return true;
        } catch {
          return false;
        }
      },
      mkdir: async (dir, recursive = true) => {
        try {
          await fs.mkdir(dir, { recursive });
          return true;
        } catch (e) {
          throw new Error(`FS Mkdir Error: ${e.message}`);
        }
      },
      remove: async (file) => {
        try {
          await fs.unlink(file);
          return true;
        } catch (e) {
          throw new Error(`FS Remove Error: ${e.message}`);
        }
      },
      readdir: async (dir) => {
        try {
          return await fs.readdir(dir);
        } catch (e) {
          throw new Error(`FS Readdir Error: ${e.message}`);
        }
      },
      stat: async (file) => {
        try {
          return await fs.stat(file);
        } catch (e) {
          throw new Error(`FS Stat Error: ${e.message}`);
        }
      }
    };

    // Global console with Stingray branding
    global.console = {
      log: (...args) => {
        console.log('[Stingray]', ...args);
      },
      error: (...args) => {
        console.error('[Stingray ERROR]', ...args);
      },
      warn: (...args) => {
        console.warn('[Stingray WARN]', ...args);
      },
      info: (...args) => {
        console.info('[Stingray INFO]', ...args);
      },
      debug: (...args) => {
        if (this.options.debug) {
          console.debug('[Stingray DEBUG]', ...args);
        }
      }
    };

    // Global setTimeout/setInterval with cleanup
    global.setTimeout = (fn, delay, ...args) => {
      const id = setTimeout(() => fn(...args), delay);
      return id;
    };
    
    global.clearTimeout = (id) => clearTimeout(id);
    global.setInterval = (fn, delay, ...args) => setInterval(() => fn(...args), delay);
    global.clearInterval = (id) => clearInterval(id);

    // Global navigator (browser compatibility)
    global.navigator = {
      userAgent: 'Stingray Runtime',
      platform: process.platform,
      language: 'en',
      languages: ['en'],
      onLine: true
    };

    // Global document (simulated DOM)
    global.document = {
      createElement: (tag) => ({
        tag,
        attributes: {},
        children: [],
        setText: (text) => { this.text = text; return this; },
        setAttribute: (name, value) => { this.attributes[name] = value; return this; },
        append: (child) => { this.children.push(child); return this; },
        toString: () => this.toHTML()
      }),
      querySelector: (selector) => null,
      querySelectorAll: (selector) => [],
      getElementById: (id) => null,
      title: '',
      head: {},
      body: {}
    };

    // Global window (browser compatibility)
    global.window = {
      location: {
        href: '',
        pathname: '/',
        search: '',
        hash: ''
      },
      history: {
        pushState: () => {},
        replaceState: () => {}
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      fetch: global.fetch,
      state: global.state,
      events: global.events
    };

    // Global localStorage/sessionStorage
    global.localStorage = {
      _store: new Map(),
      getItem: (key) => this.localStorage._store.get(key) || null,
      setItem: (key, value) => {
        this.localStorage._store.set(key, value);
      },
      removeItem: (key) => {
        this.localStorage._store.delete(key);
      },
      clear: () => {
        this.localStorage._store.clear();
      }
    };

    // Global Stingray-specific APIs
    global.stingray = {
      version: '1.0.0',
      env: this.options.env || 'development',
      platform: process.platform,
      isBrowser: typeof window !== 'undefined',
      isNode: typeof process !== 'undefined',
      isDev: this.options.env === 'development',
      isProd: this.options.env === 'production',
      config: this.options,
      hotReload: this.options.hotReload
    };
  }

  // Load built-in Stingray modules
  async loadModules() {
    const builtinModules = [
      'fetch', 'state', 'events', 'fs', 'process',
      'components', 'router', 'middleware', 'utils'
    ];

    for (const mod of builtinModules) {
      this.modules.set(mod, true);
    }
  }

  // Start the development server
  async startServer() {
    const { port, host } = this.options;
    
    const server = http.createServer(async (req, res) => {
      // Apply middleware
      for (const mw of this.middleware) {
        if (await mw(req, res)) return;
      }

      // Route handling
      const url = new URL(req.url, `http://${host}:${port}`);
      
      switch (url.pathname) {
        case '/':
        case '/index.html':
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.write(this.getIndexHTML());
          res.end();
          break;
        case '/api/health':
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', version: '1.0.0' }));
          break;
        default:
          // Serve static files
          const filePath = path.join(process.cwd(), url.pathname);
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const ext = path.extname(filePath);
            const contentTypes = {
              '.html': 'text/html',
              '.css': 'text/css',
              '.js': 'application/javascript',
              '.json': 'application/json',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.svg': 'image/svg+xml'
            };
            res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
            res.end(content);
          } catch {
            res.writeHead(404);
            res.end('Not Found');
          }
      }
    });

    return new Promise((resolve) => {
      server.listen(port, host, () => {
        this.isRunning = true;
        console.log(`[Stingray Runtime] Server running at http://${host}:${port}`);
        resolve(server);
      });
    });
  }

  getIndexHTML() {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stingray Runtime</title>
  <style>
    body { font-family: system-ui; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #0066cc; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: #e3f2fd; color: #0066cc; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🐟 Stingray Runtime</h1>
    <p><span class="badge">v${stingray.version}</span> <span class="badge">${stingray.env}</span></p>
    <p>Stingray runtime is running successfully.</p>
  </div>
</body>
</html>`;
  }

  createResponse(fetchResponse) {
    return {
      ok: fetchResponse.ok,
      status: fetchResponse.status,
      statusText: fetchResponse.statusText,
      headers: fetchResponse.headers,
      json: () => fetchResponse.json(),
      text: () => fetchResponse.text(),
      blob: () => fetchResponse.blob()
    };
  }

  createErrorResponse(message) {
    return {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: message }),
      text: async () => message
    };
  }

  // Register middleware
  use(middleware) {
    this.middleware.push(middleware);
    return this;
  }

  // Register a component
  registerComponent(name, component) {
    this.components.set(name, component);
    return this;
  }

  // Get registered component
  getComponent(name) {
    return this.components.get(name);
  }

  // Shutdown runtime
  async shutdown() {
    this.isRunning = false;
    this.modules.clear();
    this.components.clear();
    this.events.clear();
    this.state.clear();
    console.log('[Stingray Runtime] Shutting down...');
  }
}

module.exports = { StingrayRuntime };
