#!/usr/bin/env node
// Stingray - Universal Installer & Launcher
// Auto-installs everything, sets up file associations, and launches the CLI

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const STINGRAY_ROOT = path.resolve(__dirname, '..');
const BIN_DIR = path.join(STINGRAY_ROOT, 'bin');
const GLOBAL_BIN = path.join(os.homedir(), '.stingray', 'bin');

function printBanner() {
  console.log('\n' + '═'.repeat(60));
  console.log('  🐟  S T I N G R A Y   L A N G U A G E   v1.0.0');
  console.log('  HTML + CSS + JS + React  →  .stngr');
  console.log('═'.repeat(60) + '\n');
}

function installDependencies() {
  console.log('  📦 Installing dependencies...');
  try {
    execSync('npm install --prefer-offline --no-audit --no-fund', {
      cwd: STINGRAY_ROOT,
      stdio: 'inherit',
      timeout: 120000
    });
    console.log('  ✅ Dependencies installed!\n');
    return true;
  } catch (err) {
    console.log('  ⚠️  npm install failed, trying with yarn...\n');
    try {
      execSync('yarn install --silent', {
        cwd: STINGRAY_ROOT,
        stdio: 'inherit',
        timeout: 120000
      });
      console.log('  ✅ Yarn install succeeded!\n');
      return true;
    } catch (e) {
      console.log('  ❌ Could not install dependencies automatically.\n');
      console.log('  Run: npm install\n');
      return false;
    }
  }
}

function setupSystemIntegration() {
  const platform = os.platform();
  console.log(`  🔧 Setting up system integration (${platform})...`);

  try {
    // Create global bin directory
    if (!fs.existsSync(GLOBAL_BIN)) {
      fs.mkdirSync(GLOBAL_BIN, { recursive: true });
    }

    // Copy stingray binary to global bin
    const srcBin = path.join(STINGRAY_ROOT, 'bin', 'stingray.js');
    const dstBin = path.join(GLOBAL_BIN, 'stingray.js');
    if (fs.existsSync(srcBin) && (!fs.existsSync(dstBin) || fs.statSync(srcBin).mtime > fs.statSync(dstBin).mtime)) {
      fs.copyFileSync(srcBin, dstBin);
    }

    // Create global wrapper scripts
    const wrapper = `#!/usr/bin/env node\nrequire('${dstBin.replace(/\\/g, '\\\\')}');\n`;
    const wrapperPath = path.join(GLOBAL_BIN, 'stingray');
    try { fs.writeFileSync(wrapperPath, wrapper); } catch(e) {}

    // Add to PATH
    const home = os.homedir();
    const rcFiles = [];
    
    if (platform === 'win32') {
      // Windows: Set environment variable via registry
      try {
        execSync(
          `reg add "HKCU\\Environment" /v STINGRAY_HOME /t REG_SZ /d "${STINGRAY_ROOT}" /f`,
          { stdio: 'pipe' }
        );
        execSync(
          `reg add "HKCU\\Environment" /v Path /t REG_EXPAND_SZ /d "%Path%;%STINGRAY_HOME%\\bin" /f`,
          { stdio: 'pipe' }
        );
      } catch(e) {}
      
      rcFiles.push(path.join(home, '.stingray-env.bat'));
      fs.writeFileSync(rcFiles[0], `@echo off\nset STINGRAY_HOME=${STINGRAY_ROOT}\nset PATH=%PATH%;%STINGRAY_HOME%\\bin\n`);
    } else {
      // Unix: Add to shell profile
      const shell = process.env.SHELL || '/bin/bash';
      const shellName = shell.split('/').pop();
      
      if (['bash'].includes(shellName)) rcFiles.push(path.join(home, '.bashrc'));
      if (['zsh'].includes(shellName)) rcFiles.push(path.join(home, '.zshrc'));
      if (['fish'].includes(shellName)) rcFiles.push(path.join(home, '.config', 'fish', 'config.fish'));
      
      for (const rc of rcFiles) {
        if (fs.existsSync(rc)) {
          const line = '\n# Stingray Language\nexport STINGRAY_HOME="' + STINGRAY_ROOT + '"\nexport PATH="$STINGRAY_HOME/bin:$PATH"\n';
          const content = fs.readFileSync(rc, 'utf-8');
          if (!content.includes('STINGRAY_HOME')) {
            fs.appendFileSync(rc, line);
          }
        }
      }
    }

    // File association for .stngr
    try {
      if (platform === 'win32') {
        // Associate .stngr extension
        execSync(`assoc .stngr=Stingray.Source`, { stdio: 'pipe' });
        execSync(`ftype Stingray.Source="%s" "%1"`, { stdio: 'pipe' });
        
        // Set default icon
        const iconPath = path.join(STINGRAY_ROOT, 'Assets', 'logo.png');
        if (fs.existsSync(iconPath)) {
          const regCmd = `reg add "HKCR\\Stingray.Source\\DefaultIcon" /ve /d "${iconPath},0" /f`;
          execSync(regCmd, { stdio: 'pipe' });
        }
        
        // Open with command
        const openCmd = `reg add "HKCR\\Stingray.Source\\shell\\open\\command" /ve /d "\\"%s\\" \\"%1\\"" /f`;
        execSync(openCmd.replace('%s', process.execPath), { stdio: 'pipe' });
        
        // Context menu entry
        const ctxMenu = `reg add "HKCR\\Stingray.Source\\shell\\Stingray\\command" /ve /d "\\"%s\\" \\"%1\\"" /f`;
        execSync(ctxMenu.replace('%s', path.join(BIN_DIR, 'stingray.js')), { stdio: 'pipe' });
        
        // File type description
        execSync(`reg add "HKCR\\Stingray.Source" /ve /d "Stingray Source File" /f`, { stdio: 'pipe' });
        execSync(`reg add "HKCR\\Stingray.Source" /v "Content Type" /t REG_SZ /d "application/x-stingray" /f`, { stdio: 'pipe' });
        
        // Drag and drop command
        execSync(`reg add "HKCR\\Stingray.Source\\shell\\compile" /v MUIVerb /t REG_SZ /d "Compile with Stingray" /f`, { stdio: 'pipe' });
        execSync(`reg add "HKCR\\Stingray.Source\\shell\\compile\\command" /ve /d "\\"${path.join(BIN_DIR, 'stingray.js')}\\" compile \\"%1\\"" /f`, { stdio: 'pipe' });
        
        execSync(`reg add "HKCR\\Stingray.Source\\shell\\dev" /v MUIVerb /t REG_SZ /d "Dev Server" /f`, { stdio: 'pipe' });
        execSync(`reg add "HKCR\\Stingray.Source\\shell\\dev\\command" /ve /d "\\"${path.join(BIN_DIR, 'stingray.js')}\\" dev \\"%1\\"" /f`, { stdio: 'pipe' });
        
        execSync(`reg add "HKCR\\Stingray.Source\\shell\\build" /v MUIVerb /t REG_SZ /d "Build" /f`, { stdio: 'pipe' });
        execSync(`reg add "HKCR\\Stingray.Source\\shell\\build\\command" /ve /d "\\"${path.join(BIN_DIR, 'stingray.js')}\\" build \\"%1\\"" /f`, { stdio: 'pipe' });
        
        // New file context menu
        execSync(`reg add "HKCR\\Directory\\background\\shell\\StingrayNew" /v MUIVerb /t REG_SZ /d "New Stingray File" /f`, { stdio: 'pipe' });
        execSync(`reg add "HKCR\\Directory\\background\\shell\\StingrayNew\\shell\\NewComponent" /v MUIVerb /t REG_SZ /d "Component" /f`, { stdio: 'pipe' });
        execSync(`reg add "HKCR\\Directory\\background\\shell\\StingrayNew\\shell\\NewComponent\\command" /ve /d "\\"${path.join(BIN_DIR, 'stingray.js')}\\" new component %1" /f`, { stdio: 'pipe' });
        execSync(`reg add "HKCR\\Directory\\background\\shell\\StingrayNew\\shell\\NewPage" /v MUIVerb /t REG_SZ /d "Page" /f`, { stdio: 'pipe' });
        execSync(`reg add "HKCR\\Directory\\background\\shell\\StingrayNew\\shell\\NewPage\\command" /ve /d "\\"${path.join(BIN_DIR, 'stingray.js')}\\" new page %1" /f`, { stdio: 'pipe' });
        
        // Open with VS Code option
        try {
          const vscodePath = execSync('where code', { stdio: 'pipe' }).toString().trim().split('\n')[0];
          if (vscodePath) {
            execSync(`reg add "HKCR\\Stingray.Source\\shell\\Open with VS Code\\command" /ve /d "\\"${vscodePath}\\" \\"%1\\"" /f`, { stdio: 'pipe' });
          }
        } catch(e) {}
        
        console.log('  ✅ File associations & context menu set up!');
      }
    } catch(e) {}

    // Create shell aliases for Unix
    if (platform !== 'win32') {
      try {
        const aliasDir = path.join(os.homedir(), '.stingray-aliases');
        if (!fs.existsSync(aliasDir)) {
          fs.mkdirSync(aliasDir, { recursive: true });
        }
        fs.writeFileSync(path.join(aliasDir, 'stingray.sh'), `alias stngr='stingray'\nalias sr='stingray'\nalias srun='stingray run'\nalias sdev='stingray dev'\nalias sb='stingray build'\nalias si='stingray init'\n`);
        console.log('  ✅ Shell aliases created!');
      } catch(e) {}
    }

  } catch (err) {
    console.log('  ⚠️  Some system integrations may need admin privileges');
  }
}

function createGlobalWrapper() {
  const platform = os.platform();
  
  if (platform === 'win32') {
    // Create .bat wrapper
    const batPath = path.join(BIN_DIR, 'stingray.bat');
    const batContent = `@echo off\nnode "%~dp0\\stingray.js" %*\n`;
    fs.writeFileSync(batPath, batContent);
    
    // Create stngr.bat alias
    const stngrBatPath = path.join(BIN_DIR, 'stngr.bat');
    fs.writeFileSync(stngrBatPath, batContent);
  }
}

function setupVSCodeIntegration() {
  const platform = os.platform();
  const home = os.homedir();
  
  // Find VS Code installation
  let vscodePath = '';
  try {
    if (platform === 'win32') {
      vscodePath = execSync('where code 2>nul', { shell: 'cmd' }).toString().trim().split('\n')[0];
    } else {
      vscodePath = execSync('which code 2>/dev/null || echo ""').toString().trim();
    }
  } catch(e) {}
  
  if (vscodePath && fs.existsSync(vscodePath)) {
    try {
      console.log('  📋 Installing VS Code extension...');
      const extPath = path.join(STINGRAY_ROOT, 'extension');
      execSync(`"${vscodePath}" --install-extension "${extPath}"`, { stdio: 'pipe' });
      console.log('  ✅ VS Code extension installed!');
    } catch(e) {
      console.log('  ⚠️  VS Code extension install skipped (run manually if needed)');
    }
  }
}

function createQuickStartScripts() {
  const platform = os.platform();
  
  if (platform === 'win32') {
    // Quick start .bat files
    const scripts = [
      ['stingray-new-project.bat', 'call stingray init %*'],
      ['stingray-dev.bat', 'call stingray dev %*'],
      ['stingray-build.bat', 'call stingray build %*'],
      ['stingray-run.bat', 'call stingray run %*'],
      ['stingray-serve.bat', 'call stingray serve %*'],
      ['stingray-open.bat', 'start .']
    ];
    
    for (const [name, content] of scripts) {
      const batPath = path.join(BIN_DIR, name);
      if (!fs.existsSync(batPath)) {
        fs.writeFileSync(batPath, `@echo off\n${content}\n`);
      }
    }
  }
}

async function main() {
  printBanner();
  
  // Check if already installed globally
  const args = process.argv.slice(2);
  const isInstall = args[0] === '--install' || args[0] === '-i' || args[0] === 'install';
  
  if (isInstall) {
    console.log('  🚀 Full Stingray installation...\n');
    installDependencies();
    createGlobalWrapper();
    setupSystemIntegration();
    setupVSCodeIntegration();
    createQuickStartScripts();
    console.log('\n' + '═'.repeat(60));
    console.log('  🐟 Stingray is ready to use!');
    console.log('  Commands: stingray init | dev | build | run | serve');
    console.log('  File extension: .stngr');
    console.log('  Right-click .stngr files for quick actions');
    console.log('═'.repeat(60) + '\n');
    return;
  }
  
  // Normal operation - auto-setup on every run
  const needsInstall = !fs.existsSync(path.join(STINGRAY_ROOT, 'node_modules'));
  
  if (needsInstall) {
    console.log('  📦 First time setup - installing dependencies...\n');
    installDependencies();
    createGlobalWrapper();
    setupSystemIntegration();
    createQuickStartScripts();
    console.log('');
  }
  
  // Load and run CLI
  try {
    const { StingrayCLI } = require('./cli/cli');
    const cli = new StingrayCLI();
    await cli.run(args);
  } catch (err) {
    if (needsInstall) {
      console.log('  📦 Trying to install dependencies first...\n');
      installDependencies();
      createGlobalWrapper();
      setupSystemIntegration();
      
      try {
        const { StingrayCLI } = require('./cli/cli');
        const cli = new StingrayCLI();
        await cli.run(args);
      } catch (e2) {
        console.error('  ❌ Error:', e2.message);
        process.exit(1);
      }
    } else {
      console.error('  ❌ Error:', err.message);
      process.exit(1);
    }
  }
}

main();
