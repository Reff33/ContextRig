import fs from 'fs';
import path from 'path';
import vm from 'vm';

const files = fs.readdirSync('assets').filter(f => f.endsWith('.html'));

function createMockEnvironment() {
  const listeners = new Map();
  const elements = new Map();

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
    }
  };

  const mockWindow = {
    location: {
      search: '',
      href: 'http://localhost:3000/'
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
      return 1;
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

  // Mock GSAP
  const mockTimeline = {
    fromTo: function() { return this; },
    to: function() { return this; },
    set: function() { return this; },
    call: function() { return this; },
    time: () => 0,
    duration: () => 10,
    progress: () => 0,
    paused: () => false,
    play: () => mockTimeline,
    pause: () => mockTimeline,
    eventCallback: () => mockTimeline
  };

  const mockGsap = {
    timeline: () => mockTimeline,
    ticker: {
      add: (cb) => {},
      tick: () => {}
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
      return { position: { z: 14, set: () => {} } };
    },
    BufferGeometry: function() {
      return { setAttribute: () => {} };
    },
    BufferAttribute: function() {},
    PointsMaterial: function() {},
    Points: function() {
      return { rotation: { y: 0 } };
    }
  };

  return { mockDoc, mockWindow, mockGsap, mockThree };
}

let failedCount = 0;
console.log('🧪 Starting KinetRig Headless VM Runtime Smoke Test...\n');

for (const file of files) {
  const fullPath = path.join('assets', file);
  const content = fs.readFileSync(fullPath, 'utf8');
  const scripts = [...content.matchAll(/<script(?:\s+type="([^"]*)")?[^>]*>([\s\S]*?)<\/script>/gi)];

  let templatePassed = true;

  for (let idx = 0; idx < scripts.length; idx++) {
    const type = scripts[idx][1] || 'text/javascript';
    let code = scripts[idx][2];
    if (type === 'importmap' || !code.trim()) continue;

    // Remove import statements for VM execution
    code = code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');

    const { mockDoc, mockWindow, mockGsap, mockThree } = createMockEnvironment();

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
  console.log('🎉 All 10 KinetRig templates passed headless runtime smoke testing with 0 errors!');
  process.exit(0);
}
