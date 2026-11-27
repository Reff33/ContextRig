#!/usr/bin/env node
/**
 * FigCraft Script Builder — turns a compact spec into a figcraft-cli command
 * script, so an agent plans once and the app executes in one undoable batch.
 *
 * Usage:
 *   node build.mjs spec.json [--out script.json] [--run --file doc.figcraft] [--cli figcraft-cli]
 *   node build.mjs --self-test
 */
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const specPath = args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'));

function die(message, code = 2) {
  console.error('build: ' + message);
  process.exit(code);
}

/**
 * Spec shape:
 * { "name"?, "template"?, "frames": [ { "name", "preset"?|"width"/"height", "x"?, "y"?,
 *     "children": [ {"type":"text","text","x","y","props"?}, {"type":"rect","x","y","width","height","props"?} ] } ] }
 * Emits: [{command, params, as?}] — `as` names a step, children point at it with {"$ref": name}.
 */
function buildScript(spec) {
  if (!spec || typeof spec !== 'object') die('spec must be a JSON object');
  const frames = Array.isArray(spec.frames) ? spec.frames : [];
  if (!frames.length) die('spec.frames must contain at least one frame');

  const commands = [];
  if (spec.template) {
    commands.push({ command: 'file.newFromTemplate', params: { template: String(spec.template) } });
  }

  frames.forEach((frame, fi) => {
    const name = String(frame.name || 'Frame ' + (fi + 1));
    const as = 'frame' + fi;
    const params = { name };
    if (frame.preset) params.preset = String(frame.preset);
    if (Number.isFinite(frame.x)) params.x = frame.x;
    if (Number.isFinite(frame.y)) params.y = frame.y;
    if (Number.isFinite(frame.width)) params.width = frame.width;
    if (Number.isFinite(frame.height)) params.height = frame.height;
    commands.push({ command: 'frame.create', params, as });

    (Array.isArray(frame.children) ? frame.children : []).forEach((child, ci) => {
      const params2 = { type: String(child.type || 'rect'), parent: { $ref: as } };
      for (const k of ['x', 'y', 'width', 'height', 'text', 'path', 'index']) {
        if (child[k] !== undefined) params2[k] = child[k];
      }
      if (child.props && typeof child.props === 'object') params2.props = child.props;
      commands.push({ command: 'node.create', params: params2, as: 'frame' + fi + '_' + ci });
    });
  });

  return { name: spec.name || 'Untitled', commands };
}

function selfTest() {
  const { commands } = buildScript({
    template: 'mobile-app',
    frames: [{ name: 'Home', preset: 'iPhone 16', children: [{ type: 'text', text: 'Welcome', x: 24, y: 64, props: { fontSize: 32 } }] }]
  });
  const assert = (cond, label) => {
    if (!cond) { console.error('SELFTEST FAIL: ' + label); process.exit(1); }
  };
  assert(commands.length === 3, 'three commands expected, got ' + commands.length);
  assert(commands[0].command === 'file.newFromTemplate', 'template step first');
  assert(commands[1].as === 'frame0', 'frame step named');
  assert(commands[2].params.parent.$ref === 'frame0', 'child references the frame');
  // Empty-frames rejection exits the process, so it is checked by running the CLI
  // with a bad spec rather than asserting in-process.
  console.log('SELFTEST PASS (' + commands.length + ' commands)');
}

if (args.includes('--self-test')) { selfTest(); process.exit(0); }
if (!specPath) die('usage: node build.mjs spec.json [--out script.json] [--run --file doc.figcraft]');

let spec;
try {
  spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
} catch (err) {
  die('cannot read ' + specPath + ': ' + err.message);
}

const script = buildScript(spec);
const outPath = flag('--out') || 'figcraft-script.json';
fs.writeFileSync(outPath, JSON.stringify(script.commands, null, 2) + '\n', 'utf8');
console.log('wrote ' + script.commands.length + ' command(s) to ' + outPath);

if (args.includes('--run')) {
  const cli = flag('--cli') || 'figcraft-cli';
  const file = flag('--file') || 'out.figcraft';
  const probe = spawnSync(cli, ['--version'], { encoding: 'utf8' });
  if (probe.error || probe.status !== 0) {
    die('`' + cli + '` not found or not runnable. Install it, or pass --cli <path>.', 3);
  }
  console.log('running: ' + cli + ' run ' + outPath + ' --out ' + file);
  const run = spawnSync(cli, ['run', outPath, '--out', file], { stdio: 'inherit' });
  if (run.status !== 0) die('run failed (exit ' + run.status + ') — nothing was written (all-or-nothing).', 4);
  console.log('wrote ' + file + '. Verify with: ' + cli + ' info ' + file + ' --json');
}
