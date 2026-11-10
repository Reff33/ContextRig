import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, '../assets');
const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.html'));

function createMockEnvironment() {
  const listeners = new Map();
  const elements = new Map();
  const rafQueue = [];
  const tickerQueue = [];

  function createMockElement(selector = '') {
    const el = {
      style: {},
      childNodes: [],
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => false,
        contains: () => false
      },
      querySelector: (s) => createMockElement(s),
      querySelectorAll: (s) => [createMockElement(s)],
      setAttribute: () => {},
      getAttribute: () => '',
      setAttributeNS: () => {},
      appendChild: (child) => child,
      cloneNode: () => createMockElement(selector),
      getTotalLength: () => 100,
      getPointAtLength: () => ({ x: 0, y: 0 }),
      addEventListener: (evt, fn) => {
        if (!listeners.has(evt)) listeners.set(evt, []);
        listeners.get(evt).push(fn);
      },
      removeEventListener: () => {},
      dataset: { h: '100' },
      textContent: '',
      innerHTML: '',
      value: '0'
    };
    return el;
  }

  const mockDoc = {
    querySelector: (s) => {
      if (!elements.has(s)) elements.set(s, createMockElement(s));
      return elements.get(s);
    },
    querySelectorAll: (s) => [createMockElement(s)],
    createElement: (tag) => createMockElement(tag),
    createElementNS: (ns, tag) => createMockElement(tag),
    body: createMockElement('body'),
    fonts: {
      ready: Promise.resolve()
    },
    addEventListener: (evt, fn) => {
      if (!listeners.has(evt)) listeners.set(evt, []);
      listeners.get(evt).push(fn);
    },
    removeEventListener: () => {}
  };

  const mockWindow = {
    location: {
      search: '',
      href: 'http://localhost:3000/',
      protocol: 'http:'
    },
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    addEventListener: (evt, fn) => {
      if (!listeners.has(evt)) listeners.set(evt, []);
      listeners.get(evt).push(fn);
    },
    removeEventListener: () => {},
    requestAnimationFrame: (cb) => {
      rafQueue.push(cb);
      return rafQueue.length;
    },
    cancelAnimationFrame: () => {},
    AudioContext: function() {
      return {
        state: 'running',
        currentTime: 0,
        destination: {},
        createGain: () => ({
          gain: {
            value: 1,
            setValueAtTime: () => {},
            linearRampToValueAtTime: () => {},
            exponentialRampToValueAtTime: () => {}
          },
          connect: () => {}
        }),
        createOscillator: () => ({
          type: 'sine',
          frequency: {
            setValueAtTime: () => {},
            exponentialRampToValueAtTime: () => {}
          },
          connect: () => {},
          start: () => {},
          stop: () => {}
        }),
        createBufferSource: () => ({
          buffer: null,
          connect: () => {},
          start: () => {}
        }),
        createMediaStreamDestination: () => ({
          stream: {
            getAudioTracks: () => [{ stop: () => {} }]
          }
        }),
        resume: async () => {}
      };
    },
    MediaRecorder: function() {
      return {
        start: () => {},
        stop: () => {},
        state: 'inactive'
      };
    },
    MediaStream: function() {
      return {
        getVideoTracks: () => [{ stop: () => {} }],
        getAudioTracks: () => [{ stop: () => {} }],
        getTracks: () => [{ stop: () => {} }],
        removeTrack: () => {}
      };
    },
    navigator: {
      mediaDevices: {
        getDisplayMedia: async () => ({
          getVideoTracks: () => [{ stop: () => {} }],
          getAudioTracks: () => [{ stop: () => {} }],
          getTracks: () => [{ stop: () => {} }]
        })
      }
    },
    URLSearchParams: globalThis.URLSearchParams
  };

  mockWindow.MediaRecorder.isTypeSupported = () => true;

  // Mock GSAP with controllable time
  let mockTimelineTime = 0;
  let mockDuration = 10;
  const mockTimeline = {
    fromTo: function() { return this; },
    to: function() { return this; },
    set: function() { return this; },
    call: function() { return this; },
    time: (t) => {
      if (typeof t === 'number') mockTimelineTime = t;
      return mockTimelineTime;
    },
    duration: () => mockDuration,
    progress: () => mockTimelineTime / mockDuration,
    paused: () => false,
    play: (from) => {
      if (typeof from === 'number') mockTimelineTime = from;
      return mockTimeline;
    },
    pause: (at) => {
      if (typeof at === 'number') mockTimelineTime = at;
      return mockTimeline;
    },
    eventCallback: () => mockTimeline
  };

  const mockGsap = {
    timeline: () => mockTimeline,
    ticker: {
      add: (cb) => { tickerQueue.push(cb); },
      tick: () => { tickerQueue.forEach(cb => cb()); }
    },
    to: () => mockTimeline,
    set: () => mockTimeline
  };

  // Mock THREE
  const mockThree = {
    WebGLRenderer: function() {
      return {
        setSize: () => {},
        setPixelRatio: () => {},
        render: () => {}
      };
    },
    Scene: function() {
      return { add: () => {} };
    },
    PerspectiveCamera: function() {
      return { position: { z: 14, set: () => {} }, aspect: 1, updateProjectionMatrix: () => {} };
    },
    BufferGeometry: function() {
      return { setAttribute: () => {} };
    },
    BufferAttribute: function() {},
    PointsMaterial: function() {},
    Points: function() {
      return { rotation: { y: 0 } };
    },
    AmbientLight: function() {},
    DirectionalLight: function() {
      return { position: { set: () => {} } };
    },
    Group: function() {
      return { add: () => {}, rotation: { x: 0, y: 0, z: 0 }, position: { set: () => {} } };
    },
    BoxGeometry: function() {},
    IcosahedronGeometry: function() {
      const dummyAttr = {
        count: 0,
        getX: () => 0,
        getY: () => 0,
        getZ: () => 0,
        setXYZ: () => {},
        clone: function() { return this; }
      };
      return {
        attributes: {
          position: dummyAttr
        },
        computeVertexNormals: () => {}
      };
    },
    SphereGeometry: function() {},
    TorusGeometry: function() {},
    RingGeometry: function() {
      return { attributes: {} };
    },
    PointLight: function() { return { position: { set: () => {} } }; },
    MeshStandardMaterial: function() {},
    MeshPhysicalMaterial: function() {},
    MeshBasicMaterial: function() {},
    Color: function() {},
    Mesh: function() {
      return { rotation: { x: 0, y: 0, z: 0 }, scale: { set: () => {} } };
    }
  };

  return { mockDoc, mockWindow, mockGsap, mockThree, mockTimeline, rafQueue, tickerQueue };
}

let failedCount = 0;
console.log('🧪 Starting KinetRig Headless VM Runtime & Auto-Loop Smoke Test...\n');

for (const file of files) {
  const fullPath = path.join(assetsDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  const scripts = [...content.matchAll(/<script(?:\s+type="([^"]*)")?[^>]*>([\s\S]*?)<\/script>/gi)];

  let templatePassed = true;

  for (let idx = 0; idx < scripts.length; idx++) {
    const type = scripts[idx][1] || 'text/javascript';
    let code = scripts[idx][2];
    if (type === 'importmap' || !code.trim()) continue;

    // Check for deadly RAF loop cancellation: returning before scheduling requestAnimationFrame
    if (/function\s+frame\s*\(\)\s*\{[\s\S]*?return\s*;[\s\S]*?requestAnimationFrame/m.test(code)) {
      console.error(`❌ [FAILED] ${file}: Fatal bug! Bare return; before requestAnimationFrame(frame) terminates RAF recursion permanently! Always place requestAnimationFrame(frame) at top of frame() or omit early return.`);
      templatePassed = false;
      failedCount++;
      continue;
    }

    // Check for relative accumulator drift bug on character root/persistent nodes in looping timelines
    if (/tl\.(?:to|from)\(\s*[^,]+root\s*,\s*\{[^}]*?[xy]\s*:\s*['"][+-]=/m.test(code)) {
      console.error(`❌ [FAILED] ${file}: Fatal bug! Relative accumulators ('+=' or '-=') on root position cause unbounded coordinate drift on every loop cycle! Use bounded tl.fromTo(node, { x: 0 }, { x: dx }) instead.`);
      templatePassed = false;
      failedCount++;
      continue;
    }

    // Check for Law 15 violation: Hollow wireframe mouth without oral cavity in animated lip-sync rigs
    if (/ref\.mouth\s*=\s*LN\([^)]+\)/.test(code) && /viseme|lipSync/.test(code) && !/cavity/.test(code)) {
      console.error(`❌ [FAILED] ${file}: Law 15 violation! Hollow wireframe mouth detected! Talking character mouths must NEVER be single-stroke lines (LN) morphing into hollow shapes. Must use multi-layer mouth rig with dark cavity, teeth, and tongue.`);
      templatePassed = false;
      failedCount++;
      continue;
    }

    // Check for Law 15 violation: Unclipped tongue or teeth protruding outside mouth cavity
    if (/viseme|lipSync/.test(code) && /tongue/i.test(code) && !/clipPath|clip-path/i.test(code)) {
      console.error(`❌ [FAILED] ${file}: Law 15 violation! Unclipped tongue/teeth detected in character mouth rig! Talking character mouths MUST encapsulate teeth and tongue inside an SVG <clipPath> matching oral cavity geometry, otherwise tongue circles protrude through the chin/jaw during speech or surprised expressions.`);
      templatePassed = false;
      failedCount++;
      continue;
    }

    // Remove import statements for VM execution
    code = code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');

    const env = createMockEnvironment();
    const { mockDoc, mockWindow, mockGsap, mockThree, mockTimeline, rafQueue, tickerQueue } = env;

    const sandbox = {
      document: mockDoc,
      window: mockWindow,
      navigator: mockWindow.navigator,
      location: mockWindow.location,
      innerWidth: mockWindow.innerWidth,
      innerHeight: mockWindow.innerHeight,
      devicePixelRatio: mockWindow.devicePixelRatio,
      addEventListener: mockWindow.addEventListener,
      removeEventListener: mockWindow.removeEventListener,
      requestAnimationFrame: mockWindow.requestAnimationFrame,
      AudioContext: mockWindow.AudioContext,
      webkitAudioContext: mockWindow.AudioContext,
      MediaRecorder: mockWindow.MediaRecorder,
      MediaStream: mockWindow.MediaStream,
      URLSearchParams: globalThis.URLSearchParams,
      Blob: globalThis.Blob,
      URL: globalThis.URL,
      setInterval: () => 1,
      clearInterval: () => {},
      setTimeout: () => 1,
      clearTimeout: () => {},
      gsap: mockGsap,
      THREE: mockThree,
      console: {
        log: () => {},
        warn: () => {},
        error: (...args) => console.error(`[${file}]`, ...args)
      }
    };

    sandbox.globalThis = sandbox;
    sandbox.self = sandbox;
    sandbox.top = sandbox;
    sandbox.parent = sandbox;

    const ctx = vm.createContext(sandbox);

    try {
      const script = new vm.Script(code, { filename: `${file}#script${idx}` });
      script.runInContext(ctx);

      // Verify RAF Loop Continuity when timeline completes
      if (rafQueue.length > 0) {
        const frameCb = rafQueue[rafQueue.length - 1];

        // 1. Advance timeline to max DURATION
        mockTimeline.time(999);
        rafQueue.length = 0; // Clear queue before tick

        // 2. Fire the frame callback at max duration
        frameCb();

        // 3. Verify next frame is scheduled
        if (rafQueue.length === 0) {
          throw new Error('RAF frame() loop terminated on completion (t >= DURATION)! HUD and Scrubber will freeze at max duration.');
        }
      }
    } catch (err) {
      console.error(`❌ [FAILED] ${file}: ${err.name} - ${err.message}`);
      if (err.stack) {
        const stackLines = err.stack.split('\n').slice(0, 3).join('\n');
        console.error(`   ${stackLines}`);
      }
      templatePassed = false;
      failedCount++;
    }
  }

  if (templatePassed) {
    console.log(`✅ [PASSED] ${file}`);
  }
}

console.log('\n----------------------------------------');
if (failedCount > 0) {
  console.error(`💥 Runtime smoke test failed with ${failedCount} error(s)!`);
  process.exit(1);
} else {
  console.log(`🎉 All ${files.length} KinetRig templates passed headless runtime & auto-loop verification with 0 errors!`);
  process.exit(0);
}
