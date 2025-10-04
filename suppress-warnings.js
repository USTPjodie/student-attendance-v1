#!/usr/bin/env node

// This script suppresses specific npm deprecation warnings
// that are not actionable by the user

const { spawn } = require('child_process');

// Get the command to run
const command = process.argv.slice(2).join(' ');

// Run the command with NODE_OPTIONS to suppress specific warnings
const child = spawn('node', process.argv.slice(2), {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--no-warnings',
    // For npm specifically, we can't easily suppress individual warnings
    // but we can document that these are known issues
  }
});

child.on('close', (code) => {
  process.exit(code);
});