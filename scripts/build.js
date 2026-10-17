#!/usr/bin/env node
/**
 * Cross-platform build script
 * Works on Windows, Mac, and Linux
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building Agentic...\n');

// Step 1: Run TypeScript compiler
console.log('1️⃣  Compiling TypeScript...');
try {
  execSync('tsc', { stdio: 'inherit' });
  console.log('✓ TypeScript compilation successful\n');
} catch (error) {
  console.error('✗ TypeScript compilation failed');
  process.exit(1);
}

// Step 2: Ensure bin directory exists
const binDir = path.join(__dirname, '..', 'bin');
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

// Step 3: Create/update CLI entry point
const binFile = path.join(binDir, 'agentic.js');
const binContent = `#!/usr/bin/env node

require('../dist/cli.js');
`;

fs.writeFileSync(binFile, binContent);
console.log('2️⃣  Created bin/agentic.js');

// Step 4: Make executable on Unix systems (chmod equivalent)
if (process.platform !== 'win32') {
  try {
    fs.chmodSync(binFile, '755');
    console.log('✓ Made bin/agentic.js executable\n');
  } catch (error) {
    console.warn('⚠  Could not make file executable (non-critical)');
  }
}

console.log('✨ Build complete!\n');
console.log('Try it: node bin/agentic.js --version');
