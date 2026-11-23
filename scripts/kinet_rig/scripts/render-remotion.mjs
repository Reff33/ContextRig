#!/usr/bin/env node
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const compositionId = process.argv[2] || 'CinematicTitle';
const outDir = path.resolve('renders');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outputFile = path.join(outDir, `${compositionId}.mp4`);

// Forward extra arguments or props if passed (e.g. node scripts/render-remotion.mjs CinematicTitle '{"title":"Halo"}' )
const rawProps = process.argv[3];
const propsFlag = rawProps ? `--props='${rawProps.replace(/'/g, "\\'")}'` : '';

console.log(`› Rendering Remotion composition: ${compositionId}...`);
try {
  execSync(`npx remotion render remotion/index.ts ${compositionId} "${outputFile}" --gl=angle ${propsFlag}`, {
    stdio: 'inherit',
  });

  console.log(`\n✔ Render successful: ${outputFile}`);

  // Automatically open the rendered video in the default system media player
  console.log('› Opening rendered video in default player...');
  if (process.platform === 'win32') {
    execSync(`cmd.exe /c start "" "${outputFile}"`);
  } else if (process.platform === 'darwin') {
    execSync(`open "${outputFile}"`);
  } else {
    execSync(`xdg-open "${outputFile}"`);
  }
} catch (err) {
  console.error('\n× Rendering failed:', err.message);
  process.exit(1);
}
