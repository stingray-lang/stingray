// Stingray Runtime Browser Integration
// Makes Stingray fully compatible with HTML, CSS, JS, and the web

(function(global) {
  'use strict';

  const Stingray = {
    version: '1.0.0',
    name: 'Stingray',
    extension: '.stngr',
    ready: false
  };

  // Initialize Stingray in browser
  Stingray.init = function(options = {}) {
    console.log('🐟 Stingray v' + Stingray.version + ' initialized');
    
    // Register custom elements for Material Web components
    this.registerCustomElements();
    
    // Setup fetch polyfill/enhancement
    this.setupFetch();
    
    // Setup state management
    this.setupState(options);
    
    // Setup routing
    this.setupRouting(options);
    
    // Mark as ready
    Stingray.ready = true;
    
    // Dispatch ready event
    document.dispatchEvent(new CustomEvent('stingray:ready', { detail: Stingray }));
    
    return Stingray;
  };

  // Register Material Web custom elements
  Stingray.registerCustomElements = function() {
    // Dynamic import of Material Web components
    if (typeof window !== 'undefined') {
      window.stingrayComponents = {
        button: 'mdc-button',
        card: 'mdc-card',
        textField: 'mdc-text-field',
        switch: 'mdc-switch',
        tabs: 'mdc-tabs',
        dialog: 'mdc-dialog',
        snackbar: 'mdc-snackbar',
        menu: 'mdc-menu',
        list: 'mdc-list',
        drawer: 'mdc-drawer',
        tooltip: 'mdc-tooltip',
        link: 'mdc-link',
        checkbox: 'mdc-checkbox',
        radio: 'mdc-radio',
        slider: 'mdc-slider',
        select: 'mdc-select',
        progressBar: 'mdc-linear-progress',
        circularProgress: 'mdc-circular-progress',
        topAppBar: 'mdc-top-app-bar',
        iconButton: 'mdc-icon-button'
      };
    }
  };

  // Enhanced fetch with Stingray context
  Stingray.setupFetch = function() {
    const originalFetch = global.fetch;
    
    global.fetch = async function(url, options = {}) {
      // Add Stingray headers
      if (!options.headers) {
        options.headers = {};
      }
      options.headers['X-Stingray-Version'] = Stingray.version;
      options.headers['X-Stingray-Env'] = Stingray.env || 'browser';
      
      try {
        const response = await originalFetch(url, options);
        
        // Enhance response with Stingray methods
        const enhancedResponse = {
          ...response,
          json: async () => {
            const data = await response.json();
            return this.processResponse(data);
          },
          text: async () => {
            const text = await response.text();
            return this.processResponse(text);
          }
        };
        
        return enhancedResponse;
      } catch (error) {
        console.error('[Stingray Fetch] Error:', error);
        throw error;
      }
    };
  };

  // State management
  Stingray.setupState = function(options) {
    global.stingrayState = {
      _store: new Map(),
      _listeners: new Map(),
      
      get: function(key) {
        return this._store.get(key);
      },
      
      set: function(key, value) {
        this._store.set(key, value);
        this.notify(key, value);
      },
      
      delete: function(key) {
        this._store.delete(key);
      },
      
      subscribe: function(key, callback) {
        if (!this._listeners.has(key)) {
          this._listeners.set(key, []);
        }
        this._listeners.get(key).push(callback);
      },
      
      notify: function(key, value) {
        const listeners = this._listeners.get(key) || [];
        listeners.forEach(cb => cb(value));
      }
    };

    // Auto-import from stingray.json config
    if (options.config) {
      for (const [key, value] of Object.entries(options.config)) {
        stingrayState.set(key, value);
      }
    }
  };

  // Basic routing
  Stingray.setupRouting = function(options) {
    global.stingrayRouter = {
      routes: new Map(),
      current: '/',
      
      add: function(path, handler) {
        this.routes.set(path, handler);
      },
      
      navigate: function(path) {
        this.current = path;
        const handler = this.routes.get(path);
        if (handler) {
          handler();
        }
        window.history.pushState({}, '', path);
      },
      
      handleRoute: function() {
        const path = window.location.pathname;
        this.navigate(path);
      }
    };

    window.addEventListener('popstate', () => {
      stingrayRouter.handleRoute();
    });
  };

  // Process responses
  Stingray.processResponse = function(data) {
    return data;
  };

  // Utility functions
  Stingray.utils = {
    debounce: function(fn, ms) {
      let timer;
      return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => { fn.apply(this, args); }, ms);
      };
    },
    
    throttle: function(fn, ms) {
      let last = 0;
      return function(...args) {
        const now = Date.now();
        if (now - last >= ms) {
          last = now;
          fn.apply(this, args);
        }
      };
    },
    
    uuid: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    }
  };

  // Expose to global
  global.Stingray = Stingray;

})(typeof window !== 'undefined' ? window : global);

// ESM export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Stingray };
}
