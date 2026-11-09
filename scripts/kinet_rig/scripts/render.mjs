/* =========================================================
   KinetRig All-in-One Ultra-HFR Studio Renderer
   By Reff33 — https://github.com/Reff33/KinetRig

   Renders HTML5/GSAP timelines frame-by-frame with zero drops
   and compiles directly into visually lossless MP4 video.

   Prerequisites:
     npm i -D puppeteer
     ffmpeg (optional, for auto-encoding MP4)

   Usage:
     node scripts/render.mjs assets/kinet-opener.html
     node scripts/render.mjs assets/kinet-opener.html output_240fps.mp4 240
     node scripts/render.mjs index.html promo.mp4 144 --audio=assets/audio.mp3 --keep-frames
   ========================================================= */

import puppeteer from 'puppeteer';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const inputArg = args[0] || 'assets/kinet-opener.html';
const outputMp4 = args[1] && !args[1].startsWith('--') ? args[1] : 'output.mp4';
const fpsArg = args[2] && !args[2].startsWith('--') ? Number(args[2]) : (Number(process.env.FPS) || 144);
const keepFrames = args.includes('--keep-frames');

// Audio discovery: explicit --audio flag or auto-discover adjacent audio file
let audioFile = null;
const audioFlag = args.find(a => a.startsWith('--audio='));
if (audioFlag) {
  audioFile = resolve(audioFlag.split('=')[1]);
} else if (args.includes('--audio')) {
  const nextVal = args[args.indexOf('--audio') + 1];
  if (nextVal && !nextVal.startsWith('--')) audioFile = resolve(nextVal);
} else {
  // Check common adjacent audio locations
  const inputDir = dirname(resolve(inputArg));
  const autoPaths = [
    resolve(inputDir, 'audio.mp3'),
    resolve(inputDir, 'audio.wav'),
    resolve(inputDir, 'assets/audio.mp3'),
    resolve('assets/audio.mp3')
  ];
  for (const p of autoPaths) {
    if (existsSync(p)) { audioFile = p; break; }
  }
}

const targetUrl = inputArg.startsWith('http://') || inputArg.startsWith('https://')
  ? (inputArg.includes('?') ? `${inputArg}&clean=1` : `${inputArg}?clean=1`)
  : `${pathToFileURL(resolve(inputArg)).href}?clean=1`;

const tempDir = resolve(`frames_temp_${Date.now()}`);
await mkdir(tempDir, { recursive: true });

console.log(`\n======================================================`);
console.log(`🎬 KinetRig Ultra-HFR Studio Renderer`);
console.log(`   Source: ${inputArg}`);
console.log(`   Target: ${outputMp4}`);
console.log(`   Framerate: ${fpsArg} FPS (Deterministic Stepping)`);
console.log(`======================================================\n`);

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--enable-gpu', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required']
});

const page = await browser.newPage();
page.on('pageerror', e => console.error('[PageError]', e.message));

console.log(`[1/3] Loading stage: ${targetUrl}`);
await page.goto(targetUrl, { waitUntil: 'networkidle0' });

await page.waitForFunction('window.OPENER && window.OPENER.ready', { timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => { if (window.OPENER.tl) window.OPENER.tl.pause(0); });

const { W, H, DURATION, audioManifest } = await page.evaluate(() => ({
  W: window.OPENER.W || 1920,
  H: window.OPENER.H || 1080,
  DURATION: window.OPENER.DURATION || 20,
  audioManifest: window.OPENER.audioManifest || null
}));

await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

const totalFrames = Math.ceil(DURATION * fpsArg);
console.log(`[2/3] Capturing ${totalFrames} frames @ ${fpsArg} FPS (${DURATION}s, ${W}x${H})...\n`);

const startTime = Date.now();
for (let i = 0; i < totalFrames; i++) {
  const t = i / fpsArg;

  await page.evaluate(async (time) => {
    if (window.OPENER.seekFrame) await window.OPENER.seekFrame(time);
    else if (window.OPENER.seek) window.OPENER.seek(time);
    else if (window.OPENER.tl) window.OPENER.tl.time(time);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, t);

  const framePath = `${tempDir}/f${String(i).padStart(6, '0')}.png`;
  await page.screenshot({
    path: framePath,
    clip: { x: 0, y: 0, width: W, height: H },
    optimizeForSpeed: true
  });

  if (i % Math.max(1, Math.floor(fpsArg / 4)) === 0 || i === totalFrames - 1) {
    const pct = Math.round(((i + 1) / totalFrames) * 100);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stdout.write(`\r   Progress: [${pct}%] Frame ${i + 1}/${totalFrames} (${t.toFixed(2)}s / ${elapsed}s elapsed)`);
  }
}

await browser.close();
console.log(`\n\n✔ All ${totalFrames} frames rendered deterministically.`);

console.log(`[3/3] Encoding MP4 with FFmpeg...`);
if (!audioFile && audioManifest) {
  try {
    const { synthesizeManifest } = await import('./audio-synth.mjs');
    const autoAudio = resolve(tempDir, 'procedural_audio.wav');
    synthesizeManifest(audioManifest, autoAudio);
    audioFile = autoAudio;
    console.log(`   Procedural Audio: Synthesized ${audioManifest.events?.length || 0} timeline SFX events via audio-synth.mjs`);
  } catch (err) {
    console.warn(`   ⚠️ Procedural audio synthesis skipped: ${err.message}`);
  }
}

if (audioFile && existsSync(audioFile)) {
  console.log(`   Audio Track: ${audioFile}`);
} else if (audioFlag) {
  console.warn(`   ⚠️ Specified audio file not found: ${audioFile}`);
  audioFile = null;
}

const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;

if (hasFfmpeg) {
  try {
    const audioOptions = (audioFile && existsSync(audioFile))
      ? `-i "${audioFile}" -c:a aac -b:a 320k -shortest`
      : '';
    const ffmpegCmd = `ffmpeg -y -framerate ${fpsArg} -i "${tempDir}/f%06d.png" ${audioOptions} -c:v libx264 -pix_fmt yuv420p -crf 14 -preset slow "${outputMp4}"`;
    execSync(ffmpegCmd, { stdio: 'inherit' });
    console.log(`\n🎉 Success! Ultra-HFR video generated: ${outputMp4}`);

    if (!keepFrames) {
      await rm(tempDir, { recursive: true, force: true });
    } else {
      console.log(`   Frames retained in: ${tempDir}`);
    }
  } catch (err) {
    console.error('❌ FFmpeg encoding failed:', err.message);
    console.log(`Frames kept at: ${tempDir}`);
  }
} else {
  console.log(`⚠️ FFmpeg not found on system PATH.`);
  console.log(`Frames saved to: ${tempDir}`);
  console.log(`Encode manually with:`);
  console.log(`ffmpeg -framerate ${fpsArg} -i "${tempDir}/f%06d.png" -c:v libx264 -pix_fmt yuv420p -crf 14 -preset slow "${outputMp4}"\n`);
}
