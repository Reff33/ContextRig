#!/usr/bin/env node
import { exec, execSync } from 'node:child_process';
import fs from 'node:fs';

const entryPoint = fs.existsSync('remotion/index.ts')
  ? 'remotion/index.ts'
  : 'rigtools/kinet_rig/remotion/index.ts';

const port = process.env.PORT || 3000;
const url = `http://localhost:${port}`;

console.log(`› Launching Remotion Studio on ${url}...`);
console.log(`› Entry: ${entryPoint}`);

// 1. Automatically launch the browser
setTimeout(() => {
  console.log(`› Opening browser at ${url}...`);
  if (process.platform === 'win32') {
    exec(`cmd.exe /c start "" "${url}"`);
  } else if (process.platform === 'darwin') {
    exec(`open "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}, 1500);

// 2. Start Remotion Preview Server (keeps running for live edits)
try {
  execSync(`npx remotion preview ${entryPoint} --port=${port}`, {
    stdio: 'inherit',
  });
} catch (err) {
  // If user exits via Ctrl+C, exit gracefully
  process.exit(0);
}
