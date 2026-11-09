/* =========================================================
   KinetRig Headless 144 FPS Offline Frame Renderer

   Renders GSAP & Three.js timelines frame-by-frame with zero drops.
   Waits for browser paint before capturing screenshot.
   Zero HUD, zero scrubber, zero cursor artifacts.

   Prerequisites:
     npm i -D puppeteer
     npx serve . -p 5178

   Usage:
     node scripts/export-frames.mjs
     ffmpeg -framerate 144 -i frames/f%05d.png -c:v libx264 -pix_fmt yuv420p -crf 14 output_144fps.mp4
   ========================================================= */

import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';

const URL   = process.env.URL   || 'http://127.0.0.1:5178/index.html?clean=1';
const FPS   = Number(process.env.FPS   || 144);
const OUT   = process.env.OUT   || 'frames';
const SCALE = Number(process.env.SCALE || 1);   // 1 = 1920x1080

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--enable-gpu', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: SCALE });
await page.goto(URL, { waitUntil: 'networkidle0' });

// Wait until timeline and fonts are ready
await page.waitForFunction('window.OPENER && window.OPENER.ready', { timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => { window.OPENER.tl.pause(0); });

const DURATION = await page.evaluate(() => window.OPENER.DURATION);
const total = Math.ceil(DURATION * FPS);
console.log(`🎬 KinetRig: Rendering ${total} frames @ ${FPS} fps (${DURATION}s) -> ${OUT}/`);

for (let i = 0; i < total; i++) {
  const t = i / FPS;

  await page.evaluate(async (time) => {
    if (window.OPENER.seekFrame) await window.OPENER.seekFrame(time);
    else (window.OPENER.seek || window.OPENER.tl.time.bind(window.OPENER.tl))(time);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, t);

  await page.screenshot({
    path: `${OUT}/f${String(i).padStart(5, '0')}.png`,
    clip: { x: 0, y: 0, width: 1920, height: 1080 },
    optimizeForSpeed: true,
  });

  if (i % FPS === 0 || i === total - 1) {
    const pct = Math.round((i / total) * 100);
    process.stdout.write(`\r[${pct}%] Frame ${i}/${total} (${t.toFixed(1)}s)`);
  }
}

console.log(`\n✔ Complete: ${total} clean frames saved in ${OUT}/`);
console.log(`\nAssemble lossless MP4 with:\nffmpeg -framerate 144 -i ${OUT}/f%05d.png -c:v libx264 -pix_fmt yuv420p -crf 14 output_144fps.mp4\n`);
await browser.close();
