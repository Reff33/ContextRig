# Project Architecture & Rationale (KinetRig Engine)

Every architectural decision documented here was refined through trial and error. The technical "why" is more important than the code itself.

---

## 1. Project Directory Anatomy

```
project/
├── index.html            Markup for all scenes + SVG motion blur filters
├── css/app.css           Design tokens, layout, initial hidden state
├── js/three-scene.js     Stateful WebGL background (particles, bloom, lighting)
├── js/timeline.js        THE SINGLE SOURCE OF TRUTH FOR TIME (GSAP master timeline)
├── js/util.js            splitChars + blurTween (directional motion blur)
├── js/main.js            Glues stage: responsive fitting, render loop, scrub HUD
└── tools/
    ├── serve.py          Local development server with Cache-Control: no-store
    └── export-frames.mjs Frame-by-frame offline Puppeteer renderer
```

For quick deliverables, the entire engine can be packed into a single self-contained `index.html` (see `assets/kinet-opener.html`). Split into the modular architecture above when scene count exceeds 4.

---

## 2. Fixed 1920x1080 Stage with Responsive CSS Fit

The canvas is strictly fixed at 1920x1080 to guarantee pixel-exact typographic proportions, then scaled dynamically to fit any viewport:

```css
#stage {
  position: fixed;
  left: 50%;
  top: 50%;
  width: 1920px;
  height: 1080px;
  transform: translate(-50%, -50%) scale(var(--fit));
  overflow: hidden;
}
```

```javascript
const fitStage = () => {
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  document.documentElement.style.setProperty('--fit', scale);
};
window.addEventListener('resize', fitStage);
fitStage();
```

---

## 3. Strict Decoupling of Time from Rendering

Wall-clock APIs (`Date.now()`, `performance.now()`, un-stepped physics) are banned in timeline animations.
The entire visual world must evaluate as a pure mathematical function of time:

$$ \text{Scene}(t) = f(t) $$

This guarantees that seeking to `window.OPENER.seek(4.25)` produces the identical pixel buffer whether playing at 60 FPS, 144 FPS, or rendering offline at 240 FPS.
