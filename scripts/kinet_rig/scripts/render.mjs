/* =========================================================
   KinetRig All-in-One Ultra-HFR Studio Renderer
   By Reff33 — https://github.com/Reff33/KinetRig

   Renders HTML5/GSAP timelines frame-by-frame with zero drops
   and compiles directly into visually lossless MP4 video.

   Prerequisites:
     npm i -D puppeteer-core (or puppeteer)
     ffmpeg (optional, for auto-encoding MP4)
   ========================================================= */

import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';

async function getPuppeteer() {
  try {
    const mod = await import('puppeteer');
    return { puppeteer: mod.default, launchOpts: { headless: 'new' } };
  } catch {
    try {
      const mod = await import('puppeteer-core');
      const edgeChromePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/microsoft-edge'
      ];
      let execPath = edgeChromePaths.find(p => existsSync(p));
      return {
        puppeteer: mod.default,
        launchOpts: {
          executablePath: execPath,
          headless: 'new'
        }
      };
    } catch (e) {
      throw new Error("Neither 'puppeteer' nor 'puppeteer-core' is installed. Run 'npm i -D puppeteer-core'.");
    }
  }
}

export async function renderTimeline({
  input = 'assets/kinet-opener.html',
  output = 'output.mp4',
  fps = 144,
  audio = null,
  keepFrames = false,
  jobControl = null,
  onProgress = null
} = {}) {
  const { puppeteer, launchOpts } = await getPuppeteer();

  const targetUrl = input.startsWith('http://') || input.startsWith('https://')
    ? (input.includes('?') ? `${input}&clean=1` : `${input}?clean=1`)
    : `${pathToFileURL(resolve(input)).href}?clean=1`;

  const tempDir = resolve(`frames_temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
  await mkdir(tempDir, { recursive: true });

  const browser = await puppeteer.launch({
    ...launchOpts,
    args: [
      '--enable-gpu',
      '--use-gl=angle',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  });

  try {
    const page = await browser.newPage();
    page.on('pageerror', e => console.error('[PageError]', e.message));

    await page.goto(targetUrl, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.OPENER && window.OPENER.ready', { timeout: 120000 });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => { if (window.OPENER.tl) window.OPENER.tl.pause(0); });

    const { W, H, DURATION, audioManifest } = await page.evaluate(() => ({
      W: window.OPENER.W || 1920,
      H: window.OPENER.H || 1080,
      DURATION: window.OPENER.DURATION || 6,
      audioManifest: window.OPENER.audioManifest || null
    }));

    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    const totalFrames = Math.ceil(DURATION * fps);

    for (let i = 0; i < totalFrames; i++) {
      if (jobControl?.cancelled) {
        throw new Error('RENDER_CANCELLED');
      }
      while (jobControl?.paused) {
        await new Promise(r => setTimeout(r, 200));
        if (jobControl?.cancelled) throw new Error('RENDER_CANCELLED');
      }

      const t = i / fps;
      await page.evaluate((time) => {
        if (window.OPENER.seekFrame) window.OPENER.seekFrame(time);
        else if (window.OPENER.seek) window.OPENER.seek(time);
        else if (window.OPENER.tl) window.OPENER.tl.time(time);
      }, t);

      const framePath = `${tempDir}/f${String(i).padStart(6, '0')}.jpg`;
      await page.screenshot({
        path: framePath,
        type: 'jpeg',
        quality: 98,
        clip: { x: 0, y: 0, width: W, height: H }
      });

      if (onProgress) {
        onProgress({ current: i + 1, total: totalFrames, percent: Math.round(((i + 1) / totalFrames) * 100), time: t });
      }
    }

    await browser.close();

    // Procedural Audio Synthesis
    let audioFile = audio;
    if (!audioFile && audioManifest) {
      try {
        const { synthesizeManifest } = await import('./audio-synth.mjs');
        const autoAudio = resolve(tempDir, 'procedural_audio.wav');
        synthesizeManifest(audioManifest, autoAudio);
        audioFile = autoAudio;
      } catch (err) {
        console.warn(`Procedural audio synthesis skipped: ${err.message}`);
      }
    }

    const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;
    if (hasFfmpeg) {
      const audioOptions = (audioFile && existsSync(audioFile))
        ? `-i "${audioFile}" -c:a aac -b:a 320k -shortest`
        : '';

      // Multi-tier Hardware Acceleration Auto-Detection (GPU & Platform Agnostic)
      let videoEncoder = '-c:v libx264 -preset ultrafast -crf 18 -pix_fmt yuv420p';
      try {
        const encCheck = spawnSync('ffmpeg', ['-hide_banner', '-encoders']);
        const encOut = encCheck.stdout ? encCheck.stdout.toString() : '';
        if (encOut.includes('h264_nvenc')) {
          videoEncoder = '-c:v h264_nvenc -preset p5 -cq 16 -pix_fmt yuv420p';
        } else if (encOut.includes('h264_videotoolbox')) {
          videoEncoder = '-c:v h264_videotoolbox -q:v 65 -pix_fmt yuv420p';
        } else if (encOut.includes('h264_qsv')) {
          videoEncoder = '-c:v h264_qsv -preset veryfast -global_quality 20 -pix_fmt yuv420p';
        } else if (encOut.includes('h264_amf')) {
          videoEncoder = '-c:v h264_amf -quality speed -rc cqp -qp_i 18 -qp_p 20 -pix_fmt yuv420p';
        }
      } catch {}

      const ffmpegCmd = `ffmpeg -y -framerate ${fps} -i "${tempDir}/f%06d.jpg" ${audioOptions} ${videoEncoder} "${output}"`;
      execSync(ffmpegCmd, { stdio: 'inherit' });

      if (!keepFrames) {
        await rm(tempDir, { recursive: true, force: true });
      }
      return { success: true, output, frames: totalFrames, fps };
    } else {
      return { success: false, error: 'FFmpeg not found', framesPath: tempDir };
    }
  } catch (err) {
    try { await browser.close(); } catch {}
    try { if (!keepFrames) await rm(tempDir, { recursive: true, force: true }); } catch {}
    throw err;
  }
}

// CLI execution check
if (process.argv[1] && process.argv[1].endsWith('render.mjs')) {
  const args = process.argv.slice(2);
  const inputArg = args[0] || 'assets/kinet-opener.html';
  const outputMp4 = args[1] && !args[1].startsWith('--') ? args[1] : 'output.mp4';
  const fpsArg = args[2] && !args[2].startsWith('--') ? Number(args[2]) : (Number(process.env.FPS) || 144);
  const keepFrames = args.includes('--keep-frames');

  console.log(`\n======================================================`);
  console.log(`🎬 KinetRig Ultra-HFR Studio Renderer`);
  console.log(`   Source: ${inputArg}`);
  console.log(`   Target: ${outputMp4}`);
  console.log(`   Framerate: ${fpsArg} FPS (Deterministic Stepping)`);
  console.log(`======================================================\n`);

  renderTimeline({
    input: inputArg,
    output: outputMp4,
    fps: fpsArg,
    keepFrames,
    onProgress: ({ current, total, percent, time }) => {
      if (current % Math.max(1, Math.floor(fpsArg / 4)) === 0 || current === total) {
        process.stdout.write(`\r   Progress: [${percent}%] Frame ${current}/${total} (${time.toFixed(2)}s)`);
      }
    }
  }).then(res => {
    if (res.success) {
      console.log(`\n\n🎉 Success! Ultra-HFR video generated: ${res.output}`);
    }
  }).catch(err => {
    console.error(`\n❌ Render failed:`, err);
    process.exit(1);
  });
}
