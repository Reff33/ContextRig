#!/usr/bin/env node

/**
 * ContextRig Web Fetch Tool
 * Fetches a URL and prints clean readable text. Zero npm/pip dependencies —
 * uses Node's built-in fetch (Node 18+) so it works in any agent environment.
 *
 * Usage: node rigtools/web_fetch.mjs <url> [--max <chars>] [--json]
 */
import { setTimeout as sleep } from 'node:timers/promises';

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--'));
const maxIdx = args.indexOf('--max');
const maxChars = maxIdx >= 0 ? Number(args[maxIdx + 1]) || 8000 : 8000;
const asJson = args.includes('--json');

if (!url) {
  console.error('Usage: node rigtools/web_fetch.mjs <url> [--max <chars>] [--json]');
  process.exit(1);
}

const SKIP_TAGS = /<(script|style|noscript|svg|iframe|template)[^>]*>[\s\S]*?<\/\1>/gi;
const BLOCK_TAGS = /<\/?(p|div|br|li|tr|h[1-6]|section|article|header|footer|blockquote|pre)[^>]*>/gi;

function decodeEntities(text) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => named[name.toLowerCase()] ?? m);
}

/** Strips markup into paragraphs of plain text. */
function htmlToText(html) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
  const body = html
    .replace(SKIP_TAGS, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  const blocks = body
    .replace(BLOCK_TAGS, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split('\n');

  const lines = blocks
    .map((line) => decodeEntities(line).replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0);

  return {
    title: decodeEntities(title.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim(),
    text: lines.join('\n')
  };
}

async function fetchOnce(target) {
  // Explicit controller instead of AbortSignal.timeout: the timeout signal keeps a
  // timer alive after the response settles, which crashes libuv on Windows exit.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(target, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'ContextRig-WebFetch/1.0 (+https://github.com/Reff33/ContextRig)',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });

    const type = res.headers.get('content-type') || '';
    const body = await res.text();
    return { status: res.status, ok: res.ok, type, url: res.url || target, body };
  } finally {
    clearTimeout(timer);
  }
}

const target = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

let result;
try {
  result = await fetchOnce(target);
  // One retry for transient gateway errors, which are common on shared networks.
  if (!result.ok && [429, 502, 503, 504].includes(result.status)) {
    await sleep(1200);
    result = await fetchOnce(target);
  }
} catch (err) {
  console.error(`Fetch failed: ${err.message}`);
  console.error('If the host blocks automated clients, try --json and inspect the raw body, or use a different source.');
  process.exit(1);
}

const isText = /text\/|json|xml|javascript/i.test(result.type);
const isHtml = /html/i.test(result.type) || (!isText && result.body.trimStart().startsWith('<'));

const payload = {
  url: result.url,
  status: result.status,
  ok: result.ok,
  contentType: result.type,
  title: '',
  text: '',
  truncated: false
};

if (isHtml) {
  const parsed = htmlToText(result.body);
  payload.title = parsed.title;
  payload.text = parsed.text;
} else if (isText) {
  payload.text = result.body.trim();
} else {
  payload.text = `[binary content: ${result.type || 'unknown type'}]`;
}

if (payload.text.length > maxChars) {
  payload.text = payload.text.slice(0, maxChars).trimEnd() + '\n… [truncated]';
  payload.truncated = true;
}

if (asJson) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  console.log(`# ${payload.title || payload.url}`);
  console.log(`URL    : ${payload.url}`);
  console.log(`Status : ${payload.status}${payload.ok ? '' : ' (NOT OK)'}`);
  console.log(`Type   : ${payload.contentType || 'unknown'}`);
  console.log('');
  console.log(payload.text);
}

process.exitCode = result.ok ? 0 : 2;
