/**
 * Simple REST API Tester Utility
 * Usage: node tools/api_tester.js <METHOD> <URL> [JSON_BODY]
 */
import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';

async function request(method, targetUrl, payload = null) {
  const parsedUrl = new URL(targetUrl);
  const client = parsedUrl.protocol === 'https:' ? https : http;

  const options = {
    method: method.toUpperCase(),
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    headers: {
      'User-Agent': 'ContextRig-APITester/1.0',
      'Accept': 'application/json, text/plain, */*'
    }
  };

  if (payload) {
    options.headers['Content-Type'] = 'application/json';
    options.headers['Content-Length'] = Buffer.byteLength(payload);
  }

  return new Promise((resolve, reject) => {
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: body
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out.'));
    });

    req.setTimeout(10000);

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

const [,, method, url, body] = process.argv;

if (!method || !url) {
  console.log('Usage: node tools/api_tester.js <METHOD> <URL> [JSON_DATA]');
  console.log('Example: node tools/api_tester.js GET https://jsonplaceholder.typicode.com/todos/1');
  process.exit(1);
}

try {
  const res = await request(method, url, body);
  console.log(`\nHTTP Status: ${res.statusCode}`);
  try {
    const parsed = JSON.parse(res.data);
    console.log(JSON.stringify(parsed, null, 2));
  } catch {
    console.log(res.data);
  }
} catch (err) {
  console.error(`Request failed: ${err.message}`);
  process.exit(1);
}

