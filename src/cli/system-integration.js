// Stingray System Integration - OS-level integration
const { exec, execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class StingraySystemIntegration {
  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
    this.homeDir = os.homedir();
    this.tempDir = os.tmpdir();
  }

  // Get system information
  getSystemInfo() {
    return {
      platform: this.platform,
      arch: this.arch,
      hostname: os.hostname(),
      cpus: os.cpus().length,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        available: os.availableMemory || os.totalmem() - os.freemem()
      },
      uptime: os.uptime(),
      release: os.release(),
      tempDir: this.tempDir,
      homeDir: this.homeDir
    };
  }

  // Execute system commands
  exec(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env },
        timeout: options.timeout || 30000,
        maxBuffer: options.maxBuffer || 10 * 1024 * 1024
      }, (error, stdout, stderr) => {
        if (error) {
          reject({ error, stdout: stdout?.trim(), stderr: stderr?.trim() });
        } else {
          resolve({ stdout: stdout?.trim(), stderr: stderr?.trim() });
        }
      });
    });
  }

  // Execute synchronously
  execSync(command, options = {}) {
    try {
      const output = execSync(command, {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env },
        timeout: options.timeout || 30000,
        maxBuffer: options.maxBuffer || 10 * 1024 * 1024,
        encoding: 'utf-8'
      });
      return { stdout: output?.trim(), stderr: '' };
    } catch (error) {
      return {
        error: error.message,
        stdout: error.stdout?.trim(),
        stderr: error.stderr?.trim()
      };
    }
  }

  // Spawn a process
  spawn(command, args = [], options = {}) {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env },
        stdio: options.stdio || 'inherit'
      });

      child.on('close', (code) => {
        resolve({ code, signal: null });
      });

      child.on('error', (error) => {
        resolve({ code: null, signal: null, error: error.message });
      });
    });
  }

  // File system operations
  async readFile(file, encoding = 'utf-8') {
    try {
      const content = await fs.promises.readFile(file, encoding);
      return { success: true, content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async writeFile(file, content, encoding = 'utf-8') {
    try {
      await fs.promises.writeFile(file, content, encoding);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async mkdir(dir, recursive = true) {
    try {
      await fs.promises.mkdir(dir, { recursive });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async copy(src, dest) {
    try {
      await fs.promises.copyFile(src, dest);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async remove(file) {
    try {
      await fs.promises.unlink(file);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async readdir(dir) {
    try {
      const items = await fs.promises.readdir(dir, { withFileTypes: true });
      return {
        success: true,
        items: items.map(item => ({
          name: item.name,
          isDirectory: item.isDirectory(),
          isFile: item.isFile(),
          isSymbolicLink: item.isSymbolicLink()
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Environment variables
  getEnv(key) {
    return process.env[key];
  }

  setEnv(key, value) {
    process.env[key] = value;
  }

  // Package management
  async npmInstall(dir = '.') {
    return this.exec('npm install', { cwd: dir });
  }

  async npmRun(script, dir = '.') {
    return this.exec(`npm run ${script}`, { cwd: dir });
  }

  async yarnInstall(dir = '.') {
    return this.exec('yarn', { cwd: dir });
  }

  // Process management
  getProcesses() {
    try {
      if (this.platform === 'win32') {
        const output = execSync('tasklist /FO CSV').toString();
        return this.parseTasklist(output);
      } else {
        const output = execSync('ps aux').toString();
        return this.parsePs(output);
      }
    } catch {
      return [];
    }
  }

  // Port checking
  async checkPort(port, host = 'localhost') {
    return new Promise((resolve) => {
      const net = require('net');
      const client = new net.Socket();
      
      client.setTimeout(2000);
      client.once('connect', () => {
        client.destroy();
        resolve({ port, available: false });
      });
      client.once('timeout', () => {
        client.destroy();
        resolve({ port, available: true });
      });
      client.once('error', () => {
        resolve({ port, available: true });
      });
      
      client.connect(port, host);
    });
  }

  // Find available port
  async findAvailablePort(startPort = 3000, maxPorts = 100) {
    for (let port = startPort; port < startPort + maxPorts; port++) {
      const result = await this.checkPort(port);
      if (result.available) {
        return port;
      }
    }
    throw new Error(`No available ports found between ${startPort} and ${startPort + maxPorts}`);
  }

  // MIME type detection
  getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.htm': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.mjs': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.xml': 'application/xml',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Path utilities
  resolvePath(...paths) {
    return path.resolve(...paths);
  }

  joinPaths(...paths) {
    return path.join(...paths);
  }

  basename(filepath) {
    return path.basename(filepath);
  }

  dirname(filepath) {
    return path.dirname(filepath);
  }

  extname(filepath) {
    return path.extname(filepath);
  }

  // Parse helpers
  parseTasklist(output) {
    const lines = output.trim().split('\n');
    const processes = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].replace(/"/g, '').split(',');
      if (parts.length >= 2) {
        processes.push({
          name: parts[0],
          pid: parts[1],
          session: parts[2],
          cpuTime: parts[3],
          memUsage: parts[4]
        });
      }
    }
    return processes;
  }

  parsePs(output) {
    const lines = output.trim().split('\n');
    const processes = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/\s+/);
      if (parts.length >= 11) {
        processes.push({
          user: parts[0],
          pid: parts[1],
          cpu: parts[2],
          mem: parts[3],
          command: parts.slice(10).join(' ')
        });
      }
    }
    return processes;
  }
}

module.exports = { StingraySystemIntegration };
