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
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { execSync, spawnSync, spawn } from 'node:child_process';

export function findFfmpegPath() {
  try {
    const res = spawnSync('ffmpeg', ['-version']);
    if (res.status === 0) return 'ffmpeg';
  } catch {}

  const userProfile = process.env.USERPROFILE || 'C:\\Users\\Reff';
  const localAppData = process.env.LOCALAPPDATA || resolve(userProfile, 'AppData/Local');

  const staticCandidates = [
    resolve(localAppData, 'Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe'),
    'C:\\laragon\\bin\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\laragon\\bin\\ffmpeg\\ffmpeg.exe',
    'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\ffmpeg\\bin\\ffmpeg.exe'
  ];

  try {
    const wingetDir = resolve(localAppData, 'Microsoft/WinGet/Packages');
    if (existsSync(wingetDir)) {
      const entries = readdirSync(wingetDir);
      for (const ent of entries) {
        if (ent.toLowerCase().includes('ffmpeg')) {
          const matchBin = resolve(wingetDir, ent);
          const subEntries = readdirSync(matchBin);
          for (const sub of subEntries) {
            const exeP = resolve(matchBin, sub, 'bin/ffmpeg.exe');
            if (existsSync(exeP)) return exeP;
          }
        }
      }
    }
  } catch {}

  for (const c of staticCandidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

async function getPuppeteer() {
  try {
    const mod = await import('puppeteer');
    return { puppeteer: mod.default, launchOpts: { headless: 'new', protocolTimeout: 300000 } };
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
          headless: 'new',
          protocolTimeout: 300000
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
  encoder = 'auto',
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
    protocolTimeout: 300000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=swiftshader',
      '--enable-webgl',
      '--disable-web-security',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  });

  try {
    const page = await browser.newPage();
    page.on('pageerror', e => console.error('[PageError]', e.message));

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction('window.OPENER && (window.OPENER.ready === true || window.OPENER.tl)', { timeout: 60000 });
    await page.evaluate(() => {
      if (!document.fonts || !document.fonts.ready) return Promise.resolve();
      return Promise.race([
        document.fonts.ready,
        new Promise(r => setTimeout(r, 3000))
      ]);
    });
    await page.evaluate(() => { if (window.OPENER && window.OPENER.tl) window.OPENER.tl.pause(0); });

    // Strict Clean Capture Law: purge all UI, buttons, scrubbers, and top-bars from render
    await page.evaluate(() => {
      document.body.classList.add('clean-capture', 'clean-mode');
      const style = document.createElement('style');
      style.id = 'kinet-clean-export-override';
      style.textContent = `
        .top-bar, #ui, #btn-export, #fps-menu, #btn-hud, #scrub, #clock, #btn-play, #btn-audio,
        .export-dropdown, [id*="render-controls"], [id*="fps-menu"], [id*="btn-render-"] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        body { cursor: none !important; }
      `;
      document.head.appendChild(style);
    });

    const { W, H, DURATION, audioManifest } = await page.evaluate(() => ({
      W: window.OPENER.W || 1920,
      H: window.OPENER.H || 1080,
      DURATION: window.OPENER.DURATION || 6,
      audioManifest: window.OPENER.audioManifest || null
    }));

    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    const totalFrames = Math.ceil(DURATION * fps);

    // Procedural Audio Synthesis upfront (muxed directly into stream)
    let audioFile = audio;
    if (!audioFile && audioManifest) {
      try {
        const { synthesizeManifest, prefetchManifestSounds } = await import('./audio-synth.mjs');
        if (prefetchManifestSounds) await prefetchManifestSounds(audioManifest);
        const autoAudio = resolve(tempDir, 'procedural_audio.wav');
        synthesizeManifest(audioManifest, autoAudio);
        audioFile = autoAudio;
      } catch (err) {
        console.warn(`Procedural audio synthesis skipped: ${err.message}`);
      }
    }

    const ffmpegBin = findFfmpegPath();
    const hasFfmpeg = !!ffmpegBin;
    let ffmpegProc = null;
    let ffmpegPromise = null;

    if (hasFfmpeg) {
      // Hardware Acceleration Selection & Safe Auto-Detection
      let videoEncoderArgs = ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18', '-pix_fmt', 'yuv420p'];
      const chosenEnc = String(encoder || 'auto').toLowerCase();
      let encOut = '';
      try {
        const encCheck = spawnSync(ffmpegBin, ['-hide_banner', '-encoders']);
        encOut = encCheck.stdout ? encCheck.stdout.toString() : '';
      } catch {}

      if (chosenEnc === 'nvenc' && encOut.includes('h264_nvenc')) {
        videoEncoderArgs = ['-c:v', 'h264_nvenc', '-preset', 'p4', '-cq', '16', '-pix_fmt', 'yuv420p'];
      } else if (chosenEnc === 'qsv' && encOut.includes('h264_qsv')) {
        videoEncoderArgs = ['-c:v', 'h264_qsv', '-preset', 'veryfast', '-global_quality', '20', '-pix_fmt', 'yuv420p'];
      } else if (chosenEnc === 'amf' && encOut.includes('h264_amf')) {
        videoEncoderArgs = ['-c:v', 'h264_amf', '-quality', 'speed', '-rc', 'cqp', '-qp_i', '18', '-qp_p', '20', '-pix_fmt', 'yuv420p'];
      } else if (chosenEnc === 'videotoolbox' && encOut.includes('h264_videotoolbox')) {
        videoEncoderArgs = ['-c:v', 'h264_videotoolbox', '-q:v', '65', '-pix_fmt', 'yuv420p'];
      } else if (chosenEnc === 'cpu' || chosenEnc === 'libx264') {
        videoEncoderArgs = ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18', '-pix_fmt', 'yuv420p'];
      } else {
        if (chosenEnc !== 'auto') {
          console.warn(`[Renderer] Requested encoder "${chosenEnc}" unavailable, falling back to auto/CPU.`);
        }
        if (encOut.includes('h264_nvenc')) {
          videoEncoderArgs = ['-c:v', 'h264_nvenc', '-preset', 'p4', '-cq', '16', '-pix_fmt', 'yuv420p'];
        } else if (encOut.includes('h264_videotoolbox')) {
          videoEncoderArgs = ['-c:v', 'h264_videotoolbox', '-q:v', '65', '-pix_fmt', 'yuv420p'];
        } else if (encOut.includes('h264_qsv')) {
          videoEncoderArgs = ['-c:v', 'h264_qsv', '-preset', 'veryfast', '-global_quality', '20', '-pix_fmt', 'yuv420p'];
        } else if (encOut.includes('h264_amf')) {
          videoEncoderArgs = ['-c:v', 'h264_amf', '-quality', 'speed', '-rc', 'cqp', '-qp_i', '18', '-qp_p', '20', '-pix_fmt', 'yuv420p'];
        }
      }

      const ffmpegArgs = [
        '-y',
        '-loglevel', 'error',
        '-framerate', String(fps),
        '-f', 'image2pipe',
        '-vcodec', 'mjpeg',
        '-i', 'pipe:0'
      ];

      if (audioFile && existsSync(audioFile)) {
        ffmpegArgs.push('-i', audioFile, '-c:a', 'aac', '-b:a', '320k', '-shortest');
      }

      ffmpegArgs.push(...videoEncoderArgs, output);

      ffmpegProc = spawn(ffmpegBin, ffmpegArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
      ffmpegProc.stdin.on('error', () => {});
      ffmpegPromise = new Promise((res, rej) => {
        ffmpegProc.on('close', code => {
          if (code === 0) res();
          else rej(new Error(`FFmpeg exited with code ${code}`));
        });
        ffmpegProc.on('error', rej);
      });
      ffmpegPromise.catch(() => {});
    }

    for (let i = 0; i < totalFrames; i++) {
      if (jobControl?.cancelled) {
        if (ffmpegProc) {
          try { ffmpegProc.kill(); } catch {}
        }
        throw new Error('RENDER_CANCELLED');
      }
      while (jobControl?.paused) {
        await new Promise(r => setTimeout(r, 200));
        if (jobControl?.cancelled) {
          if (ffmpegProc) {
            try { ffmpegProc.kill(); } catch {}
          }
          throw new Error('RENDER_CANCELLED');
        }
      }

      const t = i / fps;
      await page.evaluate((time) => {
        if (window.OPENER.seekFrame) window.OPENER.seekFrame(time);
        else if (window.OPENER.seek) window.OPENER.seek(time);
        else if (window.OPENER.tl) window.OPENER.tl.time(time);
      }, t);

      // RAM Direct Capture: stream directly into memory buffer
      const frameBuffer = await page.screenshot({
        type: 'jpeg',
        quality: 80,
        captureBeyondViewport: false,
        clip: { x: 0, y: 0, width: W, height: H }
      });

      if (ffmpegProc) {
        if (!ffmpegProc.stdin.write(frameBuffer)) {
          await new Promise(r => ffmpegProc.stdin.once('drain', r));
        }
      }

      if (keepFrames || !hasFfmpeg) {
        const framePath = `${tempDir}/f${String(i).padStart(6, '0')}.jpg`;
        await writeFile(framePath, frameBuffer);
      }

      if (onProgress) {
        onProgress({ current: i + 1, total: totalFrames, percent: Math.round(((i + 1) / totalFrames) * 100), time: t });
      }
    }

    await browser.close();

    if (ffmpegProc) {
      try { ffmpegProc.stdin.end(); } catch {}
      await ffmpegPromise;
    }

    if (!keepFrames) {
      await rm(tempDir, { recursive: true, force: true });
    }

    return { success: true, output, frames: totalFrames, fps };
  } catch (err) {
    if (ffmpegProc) {
      try { ffmpegProc.kill(); } catch {}
    }
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
