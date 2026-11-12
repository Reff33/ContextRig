/* =========================================================
   KinetRig Ultra-HFR Studio Local Bridge Server
   By Reff33 — https://github.com/Reff33/KinetRig

   Zero-dependency local HTTP bridge allowing in-browser
   Export buttons to trigger native 240 FPS Puppeteer & FFmpeg
   rendering and download visually lossless MP4s directly.

   Usage:
     node scripts/server.mjs
     node scripts/server.mjs 4004
   ========================================================= */

import http from 'node:http';
import fs from 'node:fs';
import { resolve, join, extname, basename, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { renderTimeline, probeEncoders, resolveEncoderSelection, findFfmpegPath } from './render.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');
const CONFIG_FILE = resolve(ROOT_DIR, 'kinet.config.json');
const BRIDGE_VERSION = '1.1.4';
const VALID_ENCODERS = new Set(['auto', 'nvenc', 'qsv', 'amf', 'videotoolbox', 'cpu']);

let kinetConfig = {
  host: '127.0.0.1',
  port: 4004,
  encoder: 'auto',
  defaultFps: 240,
  outputDir: 'renders'
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      kinetConfig = { ...kinetConfig, ...parsed };
    }
  } catch (e) {
    console.warn('[Studio Bridge] Warning reading kinet.config.json:', e.message);
  }
}
loadConfig();

const rawArgs = process.argv.slice(2);
const cliPort = rawArgs.find(a => /^\d+$/.test(a));
const cliHost = rawArgs.find(a => a.startsWith('--host='))?.split('=')[1]
  || (rawArgs.includes('--host') ? rawArgs[rawArgs.indexOf('--host') + 1] : null);

const PORT = Number(cliPort) || Number(process.env.PORT) || kinetConfig.port || 4004;
const HOST = cliHost || process.env.HOST || kinetConfig.host || '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

process.on('uncaughtException', err => {
  console.error('[Studio Bridge Uncaught Exception]:', err);
});
process.on('unhandledRejection', reason => {
  console.error('[Studio Bridge Unhandled Rejection]:', reason);
});

let currentProgress = { percent: 0, current: 0, total: 0, time: 0, status: 'idle' };
let activeJob = null;
const sseClients = new Set();

function broadcastProgress(data) {
  currentProgress = { ...currentProgress, ...data };
  const msg = `data: ${JSON.stringify(currentProgress)}\n\n`;
  for (const client of sseClients) {
    try { client.write(msg); } catch { sseClients.delete(client); }
  }
}

const server = http.createServer(async (req, res) => {
  // CORS support
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'X-KinetRig-Encoder, X-KinetRig-Requested-Encoder, X-KinetRig-Codec, X-KinetRig-Fallback-Reason');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const pathname = reqUrl.pathname;

  // 1. Healthcheck API
  if (pathname === '/api/health') {
    loadConfig();
    const encSelection = resolveEncoderSelection(findFfmpegPath(), kinetConfig.encoder || 'auto');
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    });
    return res.end(JSON.stringify({
      status: 'ok',
      engine: 'KinetRig Studio Bridge',
      version: BRIDGE_VERSION,
      host: HOST,
      port: PORT,
      encoder: kinetConfig.encoder || 'auto',
      resolvedEncoder: encSelection.used,
      resolvedCodec: encSelection.codec,
      encoderFallbackReason: encSelection.fallbackReason,
      defaultFps: Number(kinetConfig.defaultFps) || 240,
      busy: !!activeJob,
      supportedFps: [60, 120, 144, 240]
    }));
  }

  // 1a-ext. Real FFmpeg Hardware Encoder Probe API
  if (pathname === '/api/encoders' || pathname === '/api/encoders/') {
    loadConfig();
    const refresh = reqUrl.searchParams.get('refresh') === '1';
    const ffmpegBin = findFfmpegPath();
    const report = probeEncoders(ffmpegBin, refresh);
    const encSelection = resolveEncoderSelection(ffmpegBin, kinetConfig.encoder || 'auto');
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    });
    return res.end(JSON.stringify({
      ok: true,
      ffmpegAvailable: report.ffmpegAvailable,
      ffmpegPath: report.ffmpegPath,
      configuredEncoder: kinetConfig.encoder || 'auto',
      resolvedEncoder: encSelection.used,
      resolvedCodec: encSelection.codec,
      fallbackReason: encSelection.fallbackReason,
      encoders: report.encoders
    }));
  }

  // 1a. Configuration API (GET / POST)
  if (pathname === '/api/config' || pathname === '/api/config/') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          if (payload.host !== undefined) {
            const h = String(payload.host || '127.0.0.1').trim();
            if (!/^[a-zA-Z0-9.-]+$/.test(h)) {
              throw new Error('Host must be a valid hostname or IP address');
            }
            payload.host = h;
          }
          if (payload.port !== undefined) {
            const p = Number(payload.port);
            if (!Number.isInteger(p) || p < 1024 || p > 65535) {
              throw new Error('Port must be between 1024 and 65535');
            }
            payload.port = p;
          }
          if (payload.encoder !== undefined) {
            const enc = String(payload.encoder || 'auto').toLowerCase().trim();
            const normEnc = enc === 'libx264' ? 'cpu' : enc;
            if (!VALID_ENCODERS.has(normEnc)) {
              throw new Error(`Unsupported encoder "${payload.encoder}"`);
            }
            payload.encoder = normEnc;
          }
          if (payload.defaultFps !== undefined) {
            const f = Number(payload.defaultFps);
            if (!Number.isInteger(f) || f < 1 || f > 240) {
              throw new Error('Default FPS must be between 1 and 240');
            }
            payload.defaultFps = f;
          }
          kinetConfig = { ...kinetConfig, ...payload };
          fs.writeFileSync(CONFIG_FILE, JSON.stringify(kinetConfig, null, 2), 'utf8');
          const encSelection = resolveEncoderSelection(findFfmpegPath(), kinetConfig.encoder || 'auto');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            ok: true,
            config: kinetConfig,
            encoderSelection: {
              requested: encSelection.requested,
              used: encSelection.used,
              codec: encSelection.codec,
              fallbackReason: encSelection.fallbackReason
            },
            restartRequired: (kinetConfig.host !== HOST || Number(kinetConfig.port) !== PORT)
          }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
    loadConfig();
    const encSelection = resolveEncoderSelection(findFfmpegPath(), kinetConfig.encoder || 'auto');
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({
      ok: true,
      config: kinetConfig,
      encoderSelection: {
        requested: encSelection.requested,
        used: encSelection.used,
        codec: encSelection.codec,
        fallbackReason: encSelection.fallbackReason
      },
      activeHost: HOST,
      activePort: PORT
    }));
  }

  // 1b. Native Self-Restart API (works even without Apache/PHP)
  if (pathname === '/api/restart' || pathname === '/api/restart/') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      loadConfig();
      let payload = {};
      try { payload = JSON.parse(body || '{}'); } catch {}
      const rawHost = String(payload.host || reqUrl.searchParams.get('host') || kinetConfig.host || HOST || '127.0.0.1').trim();
      const targetHost = /^[a-zA-Z0-9.-]+$/.test(rawHost) ? rawHost : '127.0.0.1';
      const parsedPort = Number(payload.port || reqUrl.searchParams.get('port') || kinetConfig.port || PORT);
      const targetPort = (Number.isInteger(parsedPort) && parsedPort >= 1024 && parsedPort <= 65535) ? parsedPort : PORT;

      for (const client of sseClients) {
        try { client.end(); } catch {}
      }
      sseClients.clear();

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Connection': 'close'
      });
      res.end(JSON.stringify({ ok: true, restarting: true, host: targetHost, port: targetPort }), () => {
        setTimeout(() => {
          server.close(() => {
            const child = spawn(process.execPath, [resolve(__dirname, 'server.mjs'), String(targetPort), '--host', targetHost], {
              cwd: ROOT_DIR,
              detached: true,
              stdio: 'ignore',
              windowsHide: true
            });
            child.unref();
            process.exit(0);
          });
          if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
          setTimeout(() => process.exit(0), 2500).unref();
        }, 60);
      });
    });
    return;
  }

  // 2. Real-time Progress SSE Stream
  if (pathname === '/api/progress' || pathname === '/api/progress/') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    sseClients.add(res);
    res.write(`data: ${JSON.stringify(currentProgress)}\n\n`);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // 2a. Real-time Progress Polling Fallback API
  if (pathname === '/api/progress-poll' || pathname === '/api/progress-poll/') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify(currentProgress));
  }

  // 2b. Pause Render API
  if (pathname === '/api/pause') {
    if (activeJob && !activeJob.jobControl.cancelled) {
      activeJob.jobControl.paused = true;
      broadcastProgress({ status: 'paused' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'paused', percent: currentProgress.percent }));
    }
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'No active render to pause' }));
  }

  // 2c. Resume Render API
  if (pathname === '/api/resume') {
    if (activeJob && !activeJob.jobControl.cancelled) {
      activeJob.jobControl.paused = false;
      broadcastProgress({ status: 'rendering' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'rendering', percent: currentProgress.percent }));
    }
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'No active render to resume' }));
  }

  // 2d. Cancel Render API
  if (pathname === '/api/cancel') {
    if (activeJob) {
      activeJob.jobControl.cancelled = true;
      broadcastProgress({ status: 'cancelled' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'cancelled' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'idle' }));
  }

  // 3. Render MP4 API
  if (pathname === '/api/render') {
    if (activeJob) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Another render is already in progress. Cancel it before starting a new render.' }));
    }

    loadConfig();
    const templateParam = reqUrl.searchParams.get('template') || 'assets/kinet-opener.html';
    const fpsParam = Number(reqUrl.searchParams.get('fps')) || Number(kinetConfig.defaultFps) || 240;
    const encoderParam = reqUrl.searchParams.get('encoder') || kinetConfig.encoder || 'auto';
    const mutedParam = ['1', 'true', 'yes'].includes(String(reqUrl.searchParams.get('muted') || '').toLowerCase());

    const deriveBaseFromPath = (p) => {
      const b = basename(p, extname(p));
      if (!b || b.toLowerCase() === 'index') {
        const parent = basename(dirname(p));
        if (parent && parent !== '.' && parent !== '/' && !/^[a-zA-Z]:\\?$/.test(parent)) return parent;
      }
      return b || 'kinet-render';
    };

    let renderInput = null;
    let templateBase = 'kinet-render';

    if (/^https?:\/\//i.test(templateParam)) {
      let parsedTarget;
      try {
        parsedTarget = new URL(templateParam);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: `Invalid template URL: ${templateParam}` }));
      }
      renderInput = parsedTarget.href;
      const segs = parsedTarget.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
      const lastSeg = (segs[segs.length - 1] || '').replace(/\.html?$/i, '');
      const prevSeg = segs.length > 1 ? segs[segs.length - 2] : '';
      templateBase = (!lastSeg || lastSeg.toLowerCase() === 'index')
        ? (prevSeg || parsedTarget.hostname || 'kinet-render')
        : lastSeg;
    } else if (/^file:\/\//i.test(templateParam)) {
      let localPath;
      try {
        localPath = fileURLToPath(templateParam.split('#')[0].split('?')[0]);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: `Invalid file URL: ${templateParam}` }));
      }
      if (!/\.html?$/i.test(localPath) || !fs.existsSync(localPath) || !fs.statSync(localPath).isFile()) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: `Template HTML not found: ${localPath}` }));
      }
      renderInput = templateParam;
      templateBase = deriveBaseFromPath(localPath);
    } else {
      let targetFilePath = isAbsolute(templateParam)
        ? templateParam
        : resolve(ROOT_DIR, templateParam.replace(/^\/+/, ''));
      if (!fs.existsSync(targetFilePath)) {
        targetFilePath = resolve(ROOT_DIR, 'assets', basename(templateParam));
      }
      if (!fs.existsSync(targetFilePath)) {
        targetFilePath = resolve(process.cwd(), templateParam.replace(/^\/+/, ''));
      }
      if (!fs.existsSync(targetFilePath)) {
        targetFilePath = resolve(process.cwd(), 'assets', basename(templateParam));
      }

      if (!fs.existsSync(targetFilePath) || !fs.statSync(targetFilePath).isFile() || !/\.html?$/i.test(targetFilePath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: `Template not found: ${templateParam}` }));
      }
      renderInput = targetFilePath;
      templateBase = deriveBaseFromPath(targetFilePath);
    }

    templateBase = templateBase.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'kinet-render';
    const tempOutput = resolve(ROOT_DIR, `temp_render_${Date.now()}_${fpsParam}fps.mp4`);

    console.log(`\n[Studio Bridge] Incoming Render Request:`);
    console.log(`   Template: ${renderInput}`);
    console.log(`   Target FPS: ${fpsParam} | Encoder: ${encoderParam} | Audio: ${mutedParam ? 'Muted' : 'Capture+Sync'}`);

    const jobControl = { cancelled: false, paused: false };
    activeJob = { jobControl, tempOutput };

    let renderFinished = false;
    req.on('close', () => {
      if (!renderFinished && jobControl) {
        jobControl.cancelled = true;
        console.log('[Studio Bridge] Client disconnected or cancelled request.');
      }
    });

    broadcastProgress({ status: 'rendering', percent: 0, current: 0, total: 1 });

    try {
      const renderResult = await renderTimeline({
        input: renderInput,
        output: tempOutput,
        fps: fpsParam,
        encoder: encoderParam,
        muted: mutedParam,
        jobControl,
        onProgress: ({ current, total, percent, time }) => {
          broadcastProgress({ status: jobControl.paused ? 'paused' : 'rendering', percent, current, total, time });
        }
      });

      renderFinished = true;
      activeJob = null;
      broadcastProgress({
        status: 'complete',
        percent: 100,
        encoder: renderResult.encoder || null,
        codec: renderResult.codec || null,
        audioMode: renderResult.audioMode || null,
        fallbackReason: renderResult.fallbackReason || null
      });

      const stat = fs.statSync(tempOutput);
      const downloadFilename = `${templateBase}_${fpsParam}fps.mp4`;

      const cleanupTemp = () => {
        try { if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput); } catch {}
      };

      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'X-KinetRig-Encoder': String(renderResult.encoder || 'frames'),
        'X-KinetRig-Requested-Encoder': String(renderResult.requestedEncoder || encoderParam),
        'X-KinetRig-Codec': String(renderResult.codec || 'mjpeg'),
        'X-KinetRig-Audio': String(renderResult.audioMode || 'unknown'),
        'X-KinetRig-Fallback-Reason': String(renderResult.fallbackReason || '').replace(/[\r\n]+/g, ' ')
      });

      const readStream = fs.createReadStream(tempOutput);
      readStream.pipe(res);
      readStream.on('error', () => {
        cleanupTemp();
        broadcastProgress({ status: 'idle', percent: 0 });
      });
      res.on('close', cleanupTemp);
      readStream.on('end', () => {
        cleanupTemp();
        broadcastProgress({ status: 'idle', percent: 0 });
      });
    } catch (err) {
      renderFinished = true;
      activeJob = null;
      try { if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput); } catch {}
      if (err.message === 'RENDER_CANCELLED') {
        console.log('[Studio Bridge] Render was cancelled by user.');
        broadcastProgress({ status: 'cancelled', percent: 0 });
        if (!res.headersSent) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'cancelled' }));
        }
        return;
      }
      console.error('[Studio Bridge] Render Error:', err);
      broadcastProgress({ status: 'error', error: err.message });
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    }
    return;
  }

  // 4. JIT On-Demand Audio Auto-Download & Cache (wyzowl/sfx-kit)
  if (pathname.includes('/sounds/') || pathname.endsWith('.wav')) {
    const relMatch = pathname.match(/sounds\/[^\s\?#]+/);
    if (relMatch) {
      const relPath = relMatch[0];
      const localSfxPath = resolve(ROOT_DIR, 'sfx', relPath);
      if (!fs.existsSync(localSfxPath)) {
        const remoteUrl = `https://raw.githubusercontent.com/wyzowl/sfx-kit/main/${relPath}`;
        try {
          console.log(`[Studio Bridge] JIT auto-downloading on-demand SFX: ${relPath}...`);
          const fetchRes = await fetch(remoteUrl);
          if (fetchRes.ok) {
            const ab = await fetchRes.arrayBuffer();
            fs.mkdirSync(dirname(localSfxPath), { recursive: true });
            fs.writeFileSync(localSfxPath, Buffer.from(ab));
            console.log(`[Studio Bridge] Successfully cached to disk: ${relPath}`);
          }
        } catch (err) {
          console.warn(`[Studio Bridge] Failed to auto-download ${remoteUrl}:`, err.message);
        }
      }
    }
  }

  // 5. Static file serving (e.g. preview.html, assets/*)
  let cleanPathname = pathname;
  try { cleanPathname = decodeURIComponent(pathname); } catch {}
  const relStatic = (cleanPathname === '/' ? 'preview.html' : cleanPathname.replace(/^\/+/, ''));
  let staticPath = resolve(ROOT_DIR, relStatic);
  if (!staticPath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }
  if (!fs.existsSync(staticPath)) {
    staticPath = resolve(ROOT_DIR, 'sfx', relStatic);
  }
  if (!fs.existsSync(staticPath)) {
    staticPath = resolve(process.cwd(), relStatic);
  }

  if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
    const ext = extname(staticPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(staticPath).pipe(res);
    return;
  }

  if (pathname === '/favicon.ico') {
    res.writeHead(204);
    return res.end();
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

let listenAttempts = 0;
server.on('error', err => {
  if (err.code === 'EADDRINUSE' && listenAttempts < 8) {
    listenAttempts++;
    setTimeout(() => {
      server.listen(PORT, HOST);
    }, 300);
    return;
  }
  console.error('[Studio Bridge Listen Error]:', err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  probeEncoders(findFfmpegPath());
  console.log(`\n======================================================`);
  console.log(`🚀 KinetRig Studio Local Bridge v${BRIDGE_VERSION} Running on http://${HOST}:${PORT}`);
  console.log(`   - Preview Showroom: http://${HOST}:${PORT}/preview.html`);
  console.log(`   - Native 240 FPS Render Endpoint: http://${HOST}:${PORT}/api/render`);
  console.log(`   - Status: Ready to receive in-browser Export clicks`);
  console.log(`======================================================\n`);
});
