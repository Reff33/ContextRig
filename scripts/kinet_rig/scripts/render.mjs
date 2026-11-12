/* =========================================================
   KinetRig All-in-One Ultra-HFR Studio Renderer
   By Reff33 — https://github.com/Reff33/KinetRig

   Renders HTML5/GSAP timelines frame-by-frame with zero drops
   and compiles directly into visually lossless MP4 video.

   Prerequisites:
     npm i -D puppeteer-core (or puppeteer)
     ffmpeg (optional, for auto-encoding MP4)
   ========================================================= */

import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { mkdir, rm, writeFile, copyFile, rename } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { spawnSync, spawn, execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SFX_DIR = resolve(__dirname, '../sfx');

export const ENCODER_PRESETS = {
  nvenc: {
    id: 'nvenc',
    codec: 'h264_nvenc',
    label: 'NVIDIA NVENC (RTX / GTX Silicon)',
    args: ['-c:v', 'h264_nvenc', '-preset', 'p4', '-cq', '16', '-pix_fmt', 'yuv420p']
  },
  videotoolbox: {
    id: 'videotoolbox',
    codec: 'h264_videotoolbox',
    label: 'Apple Silicon (VideoToolbox)',
    args: ['-c:v', 'h264_videotoolbox', '-q:v', '65', '-pix_fmt', 'yuv420p']
  },
  qsv: {
    id: 'qsv',
    codec: 'h264_qsv',
    label: 'Intel QuickSync (iGPU / Arc)',
    args: ['-c:v', 'h264_qsv', '-preset', 'veryfast', '-global_quality', '20', '-pix_fmt', 'yuv420p']
  },
  amf: {
    id: 'amf',
    codec: 'h264_amf',
    label: 'AMD Radeon AMF (RX / RDNA GPU)',
    args: ['-c:v', 'h264_amf', '-quality', 'speed', '-rc', 'cqp', '-qp_i', '18', '-qp_p', '20', '-pix_fmt', 'yuv420p']
  },
  cpu: {
    id: 'cpu',
    codec: 'libx264',
    label: 'CPU Fallback (libx264 Ultrafast)',
    args: ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18', '-pix_fmt', 'yuv420p']
  }
};

const encoderProbeCache = new Map();

export function probeEncoders(ffmpegBin, forceRefresh = false) {
  if (!ffmpegBin) {
    return {
      ffmpegAvailable: false,
      ffmpegPath: null,
      encoders: Object.fromEntries(
        Object.entries(ENCODER_PRESETS).map(([k, p]) => [
          k,
          { id: k, codec: p.codec, label: p.label, available: false, reason: 'FFmpeg not found' }
        ])
      )
    };
  }

  if (!forceRefresh && encoderProbeCache.has(ffmpegBin)) {
    return encoderProbeCache.get(ffmpegBin);
  }

  let encOut = '';
  try {
    const encCheck = spawnSync(ffmpegBin, ['-hide_banner', '-encoders'], { encoding: 'utf8', timeout: 5000, windowsHide: true });
    encOut = encCheck.stdout || '';
  } catch {}

  const encoders = {};
  for (const [key, preset] of Object.entries(ENCODER_PRESETS)) {
    if (!encOut.includes(preset.codec)) {
      encoders[key] = {
        id: key,
        codec: preset.codec,
        label: preset.label,
        available: false,
        reason: `Codec ${preset.codec} not built into this FFmpeg binary`
      };
      continue;
    }

    const probe = spawnSync(
      ffmpegBin,
      [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'lavfi', '-i', 'color=c=black:s=256x256:d=0.04',
        '-frames:v', '1',
        ...preset.args,
        '-f', 'null', '-'
      ],
      { encoding: 'utf8', timeout: 6000, windowsHide: true }
    );

    const errSummary = String(probe.stderr || probe.error?.message || '')
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(' | ');

    encoders[key] = {
      id: key,
      codec: preset.codec,
      label: preset.label,
      available: probe.status === 0,
      reason: probe.status === 0 ? 'Hardware verified (1-frame test passed)' : (errSummary || `Probe exited with code ${probe.status}`)
    };
  }

  const report = { ffmpegAvailable: true, ffmpegPath: ffmpegBin, encoders };
  encoderProbeCache.set(ffmpegBin, report);
  return report;
}

export function resolveEncoderSelection(ffmpegBin, requested = 'auto', forceRefresh = false) {
  const req = String(requested || 'auto').toLowerCase().trim() || 'auto';
  const normalizedReq = req === 'libx264' ? 'cpu' : req;
  const report = probeEncoders(ffmpegBin, forceRefresh);

  if (!report.ffmpegAvailable) {
    return {
      requested: normalizedReq,
      used: null,
      codec: null,
      args: [],
      fallbackReason: 'FFmpeg binary not found on system',
      report
    };
  }

  const autoOrder = ['nvenc', 'videotoolbox', 'qsv', 'amf', 'cpu'];

  if (normalizedReq === 'auto') {
    const picked = autoOrder.find(id => report.encoders[id]?.available) || 'cpu';
    return {
      requested: 'auto',
      used: picked,
      codec: ENCODER_PRESETS[picked].codec,
      args: ENCODER_PRESETS[picked].args,
      fallbackReason: null,
      report
    };
  }

  if (ENCODER_PRESETS[normalizedReq]) {
    const entry = report.encoders[normalizedReq];
    if (entry?.available) {
      return {
        requested: normalizedReq,
        used: normalizedReq,
        codec: ENCODER_PRESETS[normalizedReq].codec,
        args: ENCODER_PRESETS[normalizedReq].args,
        fallbackReason: null,
        report
      };
    }
    const fallback = report.encoders.cpu?.available ? 'cpu' : (autoOrder.find(id => report.encoders[id]?.available) || 'cpu');
    return {
      requested: normalizedReq,
      used: fallback,
      codec: ENCODER_PRESETS[fallback].codec,
      args: ENCODER_PRESETS[fallback].args,
      fallbackReason: `${ENCODER_PRESETS[normalizedReq].codec} unavailable (${entry?.reason || 'hardware probe failed'}), switched to ${ENCODER_PRESETS[fallback].codec}`,
      report
    };
  }

  const picked = autoOrder.find(id => report.encoders[id]?.available) || 'cpu';
  return {
    requested: normalizedReq,
    used: picked,
    codec: ENCODER_PRESETS[picked].codec,
    args: ENCODER_PRESETS[picked].args,
    fallbackReason: `Unknown encoder "${normalizedReq}", using ${ENCODER_PRESETS[picked].codec}`,
    report
  };
}

export function findFfmpegPath() {
  try {
    const res = spawnSync('ffmpeg', ['-version'], { windowsHide: true });
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

async function installBrowserAudioCapture(page) {
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (req.isInterceptResolutionHandled?.()) return;
    const url = req.url();
    const sfxMatch = url.match(/(?:wyzowl\/sfx-kit\/main\/|\/sfx\/)(sounds\/[^\s?#]+\.wav)/i);
    if (sfxMatch) {
      const localWav = resolve(SFX_DIR, sfxMatch[1]);
      if (existsSync(localWav)) {
        try {
          return req.respond({
            status: 200,
            contentType: 'audio/wav',
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: readFileSync(localWav)
          });
        } catch {}
      }
    }
    try { return req.continue(); } catch {}
  });

  await page.evaluateOnNewDocument(() => {
    const OrigOffline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OrigOffline) return;

    const SAMPLE_RATE = 48000;
    let virtualTime = 0;
    let sharedProxy = null;
    let rawCtx = null;
    let scheduledNodes = 0;
    const pendingDecodes = new Set();
    const pendingSfxFetches = new Set();

    const origFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : null;
    if (origFetch) {
      window.fetch = (...args) => {
        const u = String((args[0] && args[0].url) || args[0] || '');
        const p = origFetch(...args);
        if (/\.wav(\?|$)/i.test(u)) {
          let resolveGate;
          const gate = new Promise(r => { resolveGate = r; });
          pendingSfxFetches.add(gate);
          const done = () => { setTimeout(resolveGate, 20); };
          p.then(res => {
            if (!res || !res.ok || typeof res.arrayBuffer !== 'function') { done(); return res; }
            const origAb = res.arrayBuffer.bind(res);
            res.arrayBuffer = () => origAb().finally(done);
            if (typeof res.blob === 'function') {
              const origBlob = res.blob.bind(res);
              res.blob = () => origBlob().finally(done);
            }
            setTimeout(resolveGate, 3500);
            return res;
          }, done);
          gate.finally(() => pendingSfxFetches.delete(gate));
        }
        return p;
      };
    }

    const wrapSourceNode = (node) => {
      const origStart = node.start.bind(node);
      node.start = (when, ...rest) => {
        scheduledNodes++;
        const t = (when === undefined || when === null) ? virtualTime : Math.max(virtualTime, Number(when) || 0);
        return origStart(t, ...rest);
      };
      if (typeof node.stop === 'function') {
        const origStop = node.stop.bind(node);
        node.stop = (when) => {
          const t = (when === undefined || when === null) ? virtualTime : Math.max(virtualTime, Number(when) || 0);
          return origStop(t);
        };
      }
      return node;
    };

    const ensureCtx = () => {
      if (sharedProxy) return sharedProxy;
      const dur = (window.OPENER && Number(window.OPENER.DURATION)) || 90;
      const totalSamples = Math.max(SAMPLE_RATE, Math.ceil((dur + 1) * SAMPLE_RATE));
      rawCtx = new OrigOffline(2, totalSamples, SAMPLE_RATE);
      sharedProxy = new Proxy(rawCtx, {
        get(target, prop) {
          if (prop === 'currentTime') return virtualTime;
          if (prop === 'state') return 'running';
          if (prop === 'sampleRate') return SAMPLE_RATE;
          if (prop === 'resume' || prop === 'suspend' || prop === 'close') return () => Promise.resolve();
          if (prop === 'createMediaStreamDestination') {
            return () => {
              const g = target.createGain();
              try { g.stream = new MediaStream(); } catch { g.stream = { getAudioTracks: () => [] }; }
              return g;
            };
          }
          if (prop === 'createOscillator' || prop === 'createBufferSource' || prop === 'createConstantSource') {
            return (...args) => wrapSourceNode(target[prop](...args));
          }
          if (prop === 'decodeAudioData') {
            return (ab, ok, err) => {
              const p = target.decodeAudioData(ab).then(buf => {
                if (ok) ok(buf);
                return buf;
              }, e => {
                if (err) err(e);
                throw e;
              });
              pendingDecodes.add(p);
              p.finally(() => pendingDecodes.delete(p));
              return p;
            };
          }
          const val = target[prop];
          return typeof val === 'function' ? val.bind(target) : val;
        }
      });
      return sharedProxy;
    };

    window.AudioContext = function() { return ensureCtx(); };
    window.webkitAudioContext = window.AudioContext;

    window.__kinetAudioCapture = {
      setVirtualTime(t) { virtualTime = Number(t) || 0; },
      async prepare() {
        for (let pass = 0; pass < 6; pass++) {
          if (pendingSfxFetches.size > 0) {
            await Promise.race([Promise.allSettled([...pendingSfxFetches]), new Promise(r => setTimeout(r, 4000))]);
          }
          if (typeof window.initAudio === 'function') {
            try { window.initAudio(); } catch {}
          }
          await new Promise(r => setTimeout(r, 25));
          if (pendingDecodes.size > 0) {
            await Promise.race([Promise.allSettled([...pendingDecodes]), new Promise(r => setTimeout(r, 2500))]);
          }
          if (pendingSfxFetches.size === 0 && pendingDecodes.size === 0) break;
        }
      },
      async exportWavBase64(duration) {
        if (!rawCtx || scheduledNodes === 0) return { ok: false, reason: 'no_nodes', scheduledNodes };
        const rendered = await rawCtx.startRendering();
        const outSamples = Math.min(rendered.length, Math.max(SAMPLE_RATE, Math.ceil((Number(duration) || 6) * SAMPLE_RATE)));
        const ch0 = rendered.getChannelData(0);
        const ch1 = rendered.numberOfChannels > 1 ? rendered.getChannelData(1) : ch0;

        let peak = 0;
        for (let i = 0; i < outSamples; i++) {
          const a = Math.max(Math.abs(ch0[i]), Math.abs(ch1[i]));
          if (a > peak) peak = a;
        }
        if (peak < 1e-6) return { ok: false, reason: 'silent', scheduledNodes, peak };

        const dataBytes = outSamples * 4;
        const wavBytes = new Uint8Array(44 + dataBytes);
        const dv = new DataView(wavBytes.buffer);
        const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) wavBytes[off + i] = str.charCodeAt(i); };

        writeStr(0, 'RIFF');
        dv.setUint32(4, 36 + dataBytes, true);
        writeStr(8, 'WAVE');
        writeStr(12, 'fmt ');
        dv.setUint32(16, 16, true);
        dv.setUint16(20, 1, true);
        dv.setUint16(22, 2, true);
        dv.setUint32(24, SAMPLE_RATE, true);
        dv.setUint32(28, SAMPLE_RATE * 4, true);
        dv.setUint16(32, 4, true);
        dv.setUint16(34, 16, true);
        writeStr(36, 'data');
        dv.setUint32(40, dataBytes, true);

        const normScale = peak > 0.96 ? (0.96 / peak) : 1;
        let off = 44;
        for (let i = 0; i < outSamples; i++) {
          const l = Math.max(-1, Math.min(1, ch0[i] * normScale));
          const r = Math.max(-1, Math.min(1, ch1[i] * normScale));
          dv.setInt16(off, l < 0 ? l * 0x8000 : l * 0x7FFF, true);
          dv.setInt16(off + 2, r < 0 ? r * 0x8000 : r * 0x7FFF, true);
          off += 4;
        }

        const chunks = [];
        for (let i = 0; i < wavBytes.length; i += 0x8000) {
          chunks.push(String.fromCharCode(...wavBytes.subarray(i, i + 0x8000)));
        }
        return { ok: true, scheduledNodes, peak: Number(peak.toFixed(4)), base64: btoa(chunks.join('')) };
      }
    };
  });
}

export async function renderTimeline({
  input = 'assets/kinet-opener.html',
  output = 'output.mp4',
  fps = 144,
  encoder = 'auto',
  audio = null,
  muted = false,
  keepFrames = false,
  jobControl = null,
  onProgress = null
} = {}) {
  const { puppeteer, launchOpts } = await getPuppeteer();
  const captureWebAudio = !audio && !muted;

  let targetUrl;
  let localInputPath = null;
  if (/^https?:\/\//i.test(input)) {
    const u = new URL(input);
    u.searchParams.set('clean', '1');
    targetUrl = u.href;
  } else if (/^file:\/\//i.test(input)) {
    const u = new URL(input);
    u.searchParams.set('clean', '1');
    targetUrl = u.href;
    try { localInputPath = fileURLToPath(input.split('#')[0].split('?')[0]); } catch {}
  } else {
    localInputPath = resolve(input);
    const u = pathToFileURL(localInputPath);
    u.searchParams.set('clean', '1');
    targetUrl = u.href;
  }

  const tempDir = resolve(`frames_temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
  await mkdir(tempDir, { recursive: true });

  let browser = null;
  let ffmpegProc = null;
  let ffmpegPromise = null;
  let ffmpegFailed = null;
  const pageErrors = [];

  try {
    browser = await puppeteer.launch({
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

    const page = await browser.newPage();
    page.on('pageerror', e => {
      pageErrors.push(e.message);
      console.error('[PageError]', e.message);
    });

    if (captureWebAudio) {
      await installBrowserAudioCapture(page);
    }

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    try {
      await page.waitForFunction('Boolean(window.OPENER && (window.OPENER.ready === true || window.OPENER.tl))', { timeout: 60000 });
    } catch (waitErr) {
      const diag = pageErrors.length ? ` | PageErrors: ${pageErrors.join('; ')}` : '';
      throw new Error(`Template timeline did not initialize within 60s (${waitErr.message}${diag})`);
    }
    await page.evaluate(() => {
      if (!document.fonts || !document.fonts.ready) return Promise.resolve();
      return Promise.race([
        document.fonts.ready,
        new Promise(r => setTimeout(r, 3000))
      ]);
    });
    await page.evaluate(() => {
      if (window.OPENER && window.OPENER.tl) {
        window.OPENER.tl.pause();
        window.OPENER.tl.time(-0.001, true);
      }
    });

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

    if (captureWebAudio) {
      await page.mouse.click(1, 1);
      await page.evaluate(() => window.__kinetAudioCapture?.prepare?.());
      await page.evaluate(() => {
        window.__kinetAudioCapture?.setVirtualTime?.(0);
        if (window.OPENER && window.OPENER.tl) {
          window.OPENER.tl.pause();
          window.OPENER.tl.time(-0.001, true);
        }
      });
    }

    const ffmpegBin = findFfmpegPath();
    const hasFfmpeg = !!ffmpegBin;
    const resolvedEnc = resolveEncoderSelection(ffmpegBin, encoder);
    const videoStagePath = captureWebAudio ? resolve(tempDir, 'video_only.mp4') : output;

    if (hasFfmpeg) {
      if (resolvedEnc.fallbackReason) {
        console.warn(`[Renderer] ${resolvedEnc.fallbackReason}`);
      } else {
        console.log(`[Renderer] Encoder active: ${resolvedEnc.used} (${resolvedEnc.codec})`);
      }

      const ffmpegArgs = [
        '-y',
        '-loglevel', 'error',
        '-framerate', String(fps),
        '-f', 'image2pipe',
        '-vcodec', 'mjpeg',
        '-i', 'pipe:0'
      ];

      if (!muted && audio && existsSync(audio)) {
        ffmpegArgs.push('-i', audio, '-c:a', 'aac', '-b:a', '320k', '-shortest');
      }

      ffmpegArgs.push(...resolvedEnc.args, videoStagePath);

      ffmpegProc = spawn(ffmpegBin, ffmpegArgs, { stdio: ['pipe', 'ignore', 'pipe'], windowsHide: true });
      let stderrBuf = '';
      ffmpegProc.stderr?.on('data', chunk => {
        if (stderrBuf.length < 4096) stderrBuf += chunk.toString();
      });
      ffmpegProc.stdin.on('error', () => {});
      ffmpegPromise = new Promise((res, rej) => {
        ffmpegProc.on('close', code => {
          if (code === 0) res();
          else {
            const detail = stderrBuf.trim().split(/\r?\n/).slice(-3).join(' | ');
            const err = new Error(`FFmpeg (${resolvedEnc.codec}) exited with code ${code}${detail ? ': ' + detail : ''}`);
            ffmpegFailed = err;
            rej(err);
          }
        });
        ffmpegProc.on('error', err => {
          ffmpegFailed = err;
          rej(err);
        });
      });
      ffmpegPromise.catch(() => {});
    }

    for (let i = 0; i < totalFrames; i++) {
      if (ffmpegFailed) throw ffmpegFailed;
      if (jobControl?.cancelled) {
        if (ffmpegProc) {
          try { ffmpegProc.kill(); } catch {}
        }
        throw new Error('RENDER_CANCELLED');
      }
      while (jobControl?.paused) {
        await new Promise(r => setTimeout(r, 200));
        if (ffmpegFailed) throw ffmpegFailed;
        if (jobControl?.cancelled) {
          if (ffmpegProc) {
            try { ffmpegProc.kill(); } catch {}
          }
          throw new Error('RENDER_CANCELLED');
        }
      }

      const t = i / fps;
      const prevT = i > 0 ? (i - 1) / fps : -1;
      await page.evaluate((time, prevTime, frameIdx, targetFps, stepAudio) => {
        if (stepAudio && window.__kinetAudioCapture) {
          if (targetFps < 120 && frameIdx > 0 && window.OPENER?.tl) {
            const subSteps = Math.min(8, Math.ceil((time - prevTime) * 120));
            for (let s = 1; s < subSteps; s++) {
              const subT = prevTime + ((time - prevTime) * s) / subSteps;
              window.__kinetAudioCapture.setVirtualTime(subT);
              window.OPENER.tl.time(subT, false);
            }
          }
          window.__kinetAudioCapture.setVirtualTime(time);
        }
        if (window.OPENER.seekFrame) return window.OPENER.seekFrame(time);
        if (window.OPENER.seek) window.OPENER.seek(time);
        else if (window.OPENER.tl) window.OPENER.tl.time(time, false);
      }, t, prevT, i, fps, captureWebAudio);

      // RAM Direct Capture: stream directly into memory buffer
      const frameBuffer = await page.screenshot({
        type: 'jpeg',
        quality: 80,
        captureBeyondViewport: false,
        clip: { x: 0, y: 0, width: W, height: H }
      });

      if (ffmpegProc) {
        if (ffmpegFailed) throw ffmpegFailed;
        if (!ffmpegProc.stdin.write(frameBuffer)) {
          await new Promise(r => {
            const done = () => {
              ffmpegProc.stdin.off('drain', done);
              ffmpegProc.off('close', done);
              r();
            };
            ffmpegProc.stdin.once('drain', done);
            ffmpegProc.once('close', done);
          });
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

    let finalAudioPath = (!muted && audio && existsSync(audio)) ? audio : null;
    let audioMode = muted ? 'muted' : (finalAudioPath ? 'external' : 'none');
    let voAudioPath = null;

    if (captureWebAudio) {
      try {
        const captured = await page.evaluate(dur => window.__kinetAudioCapture?.exportWavBase64?.(dur), DURATION);
        if (captured?.ok && captured.base64) {
          const capturedWavPath = resolve(tempDir, 'captured_audio.wav');
          await writeFile(capturedWavPath, Buffer.from(captured.base64, 'base64'));
          finalAudioPath = capturedWavPath;
          audioMode = 'webaudio';
          console.log(`[Renderer] Captured Web Audio: ${captured.scheduledNodes} nodes, peak=${captured.peak}`);
        }
      } catch (err) {
        console.warn(`[Renderer] Web Audio capture extraction skipped: ${err.message}`);
      }

      try {
        const voSrcs = await page.evaluate(() =>
          Array.from(document.querySelectorAll('audio[src]'))
            .filter(a => !a.muted && a.getAttribute('src') && a.getAttribute('src').trim() !== '')
            .map(a => a.src)
        );
        if (voSrcs.length > 0) {
          const voUrl = voSrcs[0];
          if (/^file:\/\//i.test(voUrl)) {
            const p = fileURLToPath(voUrl.split('#')[0].split('?')[0]);
            if (existsSync(p)) voAudioPath = p;
          } else if (/^https?:\/\//i.test(voUrl)) {
            voAudioPath = voUrl;
          }
        }
      } catch {}
    }

    await browser.close();
    browser = null;

    if (ffmpegProc) {
      try { ffmpegProc.stdin.end(); } catch {}
      await ffmpegPromise;
    }

    if (captureWebAudio && !finalAudioPath && audioManifest) {
      try {
        const { synthesizeManifest, prefetchManifestSounds } = await import('./audio-synth.mjs');
        if (prefetchManifestSounds) await prefetchManifestSounds(audioManifest);
        const autoAudio = resolve(tempDir, 'procedural_audio.wav');
        synthesizeManifest(audioManifest, autoAudio);
        finalAudioPath = autoAudio;
        audioMode = 'manifest';
        console.log('[Renderer] Fallback audio synthesized from audioManifest');
      } catch (err) {
        console.warn(`[Renderer] audioManifest synthesis skipped: ${err.message}`);
      }
    }

    if (captureWebAudio && !finalAudioPath && localInputPath && existsSync(localInputPath)) {
      const tmpJson = resolve(tempDir, 'parsed_manifest.json');
      try {
        execFileSync(process.execPath, [resolve(__dirname, 'parse-timeline.mjs'), localInputPath, tmpJson], { stdio: 'pipe', windowsHide: true });
        if (existsSync(tmpJson)) {
          const parsedManifest = JSON.parse(readFileSync(tmpJson, 'utf8'));
          if (parsedManifest && ((parsedManifest.events && parsedManifest.events.length > 0) || parsedManifest.ambientBed)) {
            const { synthesizeManifest, prefetchManifestSounds } = await import('./audio-synth.mjs');
            if (prefetchManifestSounds) await prefetchManifestSounds(parsedManifest);
            const parsedAudio = resolve(tempDir, 'parsed_audio.wav');
            synthesizeManifest(parsedManifest, parsedAudio);
            finalAudioPath = parsedAudio;
            audioMode = 'parsed';
            console.log('[Renderer] Fallback audio synthesized from parse-timeline');
          }
        }
      } catch (err) {
        console.warn(`[Renderer] parse-timeline fallback skipped: ${err.message}`);
      }
    }

    if (hasFfmpeg && captureWebAudio) {
      if (finalAudioPath && voAudioPath) {
        const mux = spawnSync(ffmpegBin, [
          '-y', '-loglevel', 'error',
          '-i', videoStagePath, '-i', finalAudioPath, '-i', voAudioPath,
          '-filter_complex', '[1:a][2:a]amix=inputs=2:duration=longest:normalize=0[aout]',
          '-map', '0:v:0', '-map', '[aout]',
          '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-shortest', '-movflags', '+faststart',
          output
        ], { encoding: 'utf8', windowsHide: true });
        if (mux.status !== 0) throw new Error(`Audio+VO mux failed: ${mux.stderr || mux.status}`);
      } else if (finalAudioPath || voAudioPath) {
        const singleAudio = finalAudioPath || voAudioPath;
        if (voAudioPath && !finalAudioPath) audioMode = 'vo';
        const mux = spawnSync(ffmpegBin, [
          '-y', '-loglevel', 'error',
          '-i', videoStagePath, '-i', singleAudio,
          '-map', '0:v:0', '-map', '1:a:0',
          '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-shortest', '-movflags', '+faststart',
          output
        ], { encoding: 'utf8', windowsHide: true });
        if (mux.status !== 0) throw new Error(`Audio mux failed: ${mux.stderr || mux.status}`);
      } else {
        try {
          await rename(videoStagePath, output);
        } catch {
          await copyFile(videoStagePath, output);
        }
      }
    }

    if (!keepFrames) {
      await rm(tempDir, { recursive: true, force: true });
    }

    return {
      success: true,
      output,
      frames: totalFrames,
      fps,
      audioMode,
      encoder: resolvedEnc.used,
      codec: resolvedEnc.codec,
      requestedEncoder: resolvedEnc.requested,
      fallbackReason: resolvedEnc.fallbackReason || null
    };
  } catch (err) {
    if (ffmpegProc) {
      try { ffmpegProc.kill(); } catch {}
    }
    if (browser) {
      try { await browser.close(); } catch {}
    }
    try { if (!keepFrames) await rm(tempDir, { recursive: true, force: true }); } catch {}
    throw err;
  }
}

// CLI execution check
if (process.argv[1] && process.argv[1].endsWith('render.mjs')) {
  const rawArgs = process.argv.slice(2);
  const encFlag = rawArgs.find(a => a.startsWith('--encoder='))?.split('=')[1];
  const keepFrames = rawArgs.includes('--keep-frames');
  const mutedArg = rawArgs.includes('--muted');
  const posArgs = rawArgs.filter(a => !a.startsWith('--'));
  const inputArg = posArgs[0] || 'assets/kinet-opener.html';
  const outputMp4 = posArgs[1] || 'output.mp4';
  const fpsArg = posArgs[2] ? Number(posArgs[2]) : (Number(process.env.FPS) || 144);
  const encoderArg = encFlag || process.env.ENCODER || 'auto';

  console.log(`\n======================================================`);
  console.log(`🎬 KinetRig Ultra-HFR Studio Renderer`);
  console.log(`   Source: ${inputArg}`);
  console.log(`   Target: ${outputMp4}`);
  console.log(`   Framerate: ${fpsArg} FPS | Encoder: ${encoderArg}${mutedArg ? ' | Muted' : ''}`);
  console.log(`======================================================\n`);

  renderTimeline({
    input: inputArg,
    output: outputMp4,
    fps: fpsArg,
    encoder: encoderArg,
    muted: mutedArg,
    keepFrames,
    onProgress: ({ current, total, percent, time }) => {
      if (current % Math.max(1, Math.floor(fpsArg / 4)) === 0 || current === total) {
        process.stdout.write(`\r   Progress: [${percent}%] Frame ${current}/${total} (${time.toFixed(2)}s)`);
      }
    }
  }).then(res => {
    if (res.success) {
      console.log(`\n\n🎉 Success! Ultra-HFR video generated (${res.encoder || 'frames'}): ${res.output}`);
    }
  }).catch(err => {
    console.error(`\n❌ Render failed:`, err);
    process.exit(1);
  });
}
