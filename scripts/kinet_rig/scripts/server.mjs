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
import { resolve, join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderTimeline } from './render.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || 4004;

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

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const pathname = reqUrl.pathname;

  // 1. Healthcheck API
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'ok',
      engine: 'KinetRig Studio Bridge',
      version: '1.0.0',
      port: PORT,
      supportedFps: [60, 120, 144, 240]
    }));
  }

  // 2. Real-time Progress SSE Stream
  if (pathname === '/api/progress') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    sseClients.add(res);
    res.write(`data: ${JSON.stringify(currentProgress)}\n\n`);
    req.on('close', () => sseClients.delete(res));
    return;
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
    const templateParam = reqUrl.searchParams.get('template') || 'assets/kinet-opener.html';
    const fpsParam = Number(reqUrl.searchParams.get('fps')) || 240;

    let targetFilePath = resolve(ROOT_DIR, templateParam.replace(/^\/+/, ''));
    if (!fs.existsSync(targetFilePath)) {
      targetFilePath = resolve(ROOT_DIR, 'assets', basename(templateParam));
    }
    if (!fs.existsSync(targetFilePath)) {
      targetFilePath = resolve(process.cwd(), templateParam.replace(/^\/+/, ''));
    }
    if (!fs.existsSync(targetFilePath)) {
      targetFilePath = resolve(process.cwd(), 'assets', basename(templateParam));
    }

    if (!fs.existsSync(targetFilePath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: `Template not found: ${templateParam}` }));
    }

    const templateBase = basename(targetFilePath, '.html');
    const tempOutput = resolve(ROOT_DIR, `temp_render_${Date.now()}_${fpsParam}fps.mp4`);

    console.log(`\n[Studio Bridge] Incoming Render Request:`);
    console.log(`   Template: ${targetFilePath}`);
    console.log(`   Target FPS: ${fpsParam}`);

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
      await renderTimeline({
        input: targetFilePath,
        output: tempOutput,
        fps: fpsParam,
        jobControl,
        onProgress: ({ current, total, percent, time }) => {
          broadcastProgress({ status: jobControl.paused ? 'paused' : 'rendering', percent, current, total, time });
        }
      });

      renderFinished = true;
      activeJob = null;
      broadcastProgress({ status: 'complete', percent: 100 });

      const stat = fs.statSync(tempOutput);
      const downloadFilename = `${templateBase}_${fpsParam}fps.mp4`;

      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${downloadFilename}"`
      });

      const readStream = fs.createReadStream(tempOutput);
      readStream.pipe(res);
      readStream.on('end', () => {
        try { fs.unlinkSync(tempOutput); } catch {}
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
  let staticPath = resolve(ROOT_DIR, pathname === '/' ? 'preview.html' : pathname.replace(/^\/+/, ''));
  if (!fs.existsSync(staticPath)) {
    staticPath = resolve(ROOT_DIR, 'sfx', pathname.replace(/^\/+/, ''));
  }
  if (!fs.existsSync(staticPath)) {
    staticPath = resolve(process.cwd(), pathname.replace(/^\/+/, ''));
  }

  if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
    const ext = extname(staticPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(staticPath).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 KinetRig Studio Local Bridge Running on http://127.0.0.1:${PORT}`);
  console.log(`   - Preview Showroom: http://127.0.0.1:${PORT}/preview.html`);
  console.log(`   - Native 240 FPS Render Endpoint: http://127.0.0.1:${PORT}/api/render`);
  console.log(`   - Status: Ready to receive in-browser Export clicks`);
  console.log(`======================================================\n`);
});