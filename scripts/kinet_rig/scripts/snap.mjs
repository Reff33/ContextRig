/* =========================================================
   KinetRig Visual Keyframe Snapshot Tool (144 FPS Engine)
   By Reff33 — https://github.com/Reff33/KinetRig

   Visual validation tool: freeze and inspect critical keyframe seconds
   without a full video render. Essential for AI coding agents to inspect
   text overlaps, camera coordinates, typography clipping, and scene rhythm.

   Prerequisites:
     npm i -D puppeteer

   Usage:
     node scripts/snap.mjs shots 1 3.5 8 12 18
     URL="file:///D:/laragon/www/KinetRig/assets/kinet-opener.html?clean=1" node scripts/snap.mjs shots 1 3 5 10

   Output:
     shots/t1_00.png, shots/t3_50.png, etc.

   Protocol:
     Target page must expose window.OPENER = { W, H, ready, seek(t) }
     ?clean=1 parameter prevents autoplay and suppresses HUD/scrubbers.
   ========================================================= */

import puppeteer from 'puppeteer';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';

const [outDir, ...times] = process.argv.slice(2);
if (!outDir || !times.length) {
  console.log('Usage: node scripts/snap.mjs <output_dir> <sec1> [<sec2> ...]');
  process.exit(1);
}

const URL = process.env.URL || pathToFileURL(process.cwd()).href + '/index.html?clean=1';
await mkdir(outDir, { recursive: true });

console.log(`[KinetRig] Snapshotting keyframes from: ${URL}`);
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--enable-gpu', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required']
});

const page = await browser.newPage();
page.on('pageerror', e => console.error('[PageError]', e.message));
await page.goto(URL, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.OPENER && window.OPENER.ready && (!window.OPENER.clipsReady || window.OPENER.clipsReady())', { timeout: 60000 });

const { W, H } = await page.evaluate(() => ({ W: window.OPENER.W || 1920, H: window.OPENER.H || 1080 }));
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

for (const ts of times) {
  const t = Number(ts);
  await page.evaluate(async (time) => {
    if (window.OPENER.seekFrame) {
      await window.OPENER.seekFrame(time);
      window.OPENER.seek(time);
    } else {
      window.OPENER.seek(time);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      window.OPENER.seek(time);
    }
  }, t);

  const outPath = `${outDir}/t${t.toFixed(2).replace('.', '_')}.png`;
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: W, height: H } });
  process.stdout.write(` Captured ${t.toFixed(2)}s -> ${outPath}\n`);
}

await browser.close();
console.log('[KinetRig] Snapshots complete.');
