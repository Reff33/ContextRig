# Production Techniques — Battle-Tested Motion Recipes

All recipes are generic and adaptable. Specific numbers represent proven starting baselines. Brand colors, typography, and visual assets belong to the user's design system.

---

## 1. Kinetic Typography Recipes

### The Stiff vs. Dynamic Typographic Formula

- **Anti-Pattern (Stiff):** Every headline is ALL-CAPS bold 800 weight, centered, staggered identically, with no rhythmic variation.
- **Cinematic Pattern (Dynamic):** Sentence case, intentional weight contrast (500 body vs. 800 hero keywords), alternating entry vectors, and rhythmic pauses.

```javascript
// Letter split with alternating entry coordinates
function animateTitle(tl, selector, at = '>') {
  tl.from(`${selector} .char`, {
    opacity: 0,
    y: (i) => (i % 2 === 0 ? 30 : -30),
    rotationZ: (i) => (i % 2 === 0 ? 8 : -8),
    stagger: 0.03,
    duration: 0.65,
    ease: 'back.out(1.8)'
  }, at);
}
```

---

## 2. Directional Motion Blur via SVG Filters

SVG directional Gaussian blur prevents rapid 144 FPS camera movements from strobing:

```html
<svg style="position: absolute; width: 0; height: 0;">
  <filter id="motion-blur-dir">
    <feGaussianBlur id="blur-filter" in="SourceGraphic" stdDeviation="0, 0" />
  </filter>
</svg>
```

```javascript
function applyMotionBlur(tl, filterSelector = '#blur-filter', blurX = 20, at = '>') {
  tl.to(filterSelector, { attr: { stdDeviation: `${blurX}, 0` }, duration: 0.15 }, at)
    .to(filterSelector, { attr: { stdDeviation: '0, 0' }, duration: 0.18, ease: 'power2.out' }, '-=0.05');
}
```

---

## 3. 3D Camera Pan & Word Tracking

The camera tracks along a kinetic statement, rotating in 3D yaw as words arrive:

```javascript
tl.to('#camera', {
  x: -600,
  rotationY: -12,
  duration: 1.8,
  ease: 'power2.inOut'
});
```

---

## 4. Specular Light Leaks & Shimmer Wipes

A warm light flash across cut boundaries without requiring heavy stock footage overlays:

```css
.light-leak {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 70% 30%, rgba(255, 230, 180, 0.45) 0%, transparent 60%);
  mix-blend-mode: screen;
  pointer-events: none;
}
```

```javascript
tl.fromTo('.light-leak', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1.2, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' });
```

---

## 5. Three.js Background Systems

For AI, tech, and spatial data presentations, inject a lightweight Three.js canvas:

```javascript
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1920 / 1080, 0.1, 100);
camera.position.z = 10;

const pCount = 400;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(pCount * 3);
for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 20;
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

const pMat = new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.06, transparent: true, opacity: 0.7 });
const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

function renderThree(time) {
  particles.rotation.y = time * 0.15;
  renderer.render(scene, camera);
}
```

---

## 6. Deterministic Number Tickers

Tickers must be driven mathematically by the GSAP timeline clock, never `setInterval` or `requestAnimationFrame` deltas:

```javascript
const counter = { val: 0 };
tl.to(counter, {
  val: 5000000,
  duration: 2.0,
  ease: 'power3.out',
  onUpdate: () => {
    document.querySelector('#metric').innerText = Math.floor(counter.val).toLocaleString();
  }
});
```

---

## 7. Known Production Gotchas (Avoid These Pitfalls)

1. **`Math.random()` in Render Loops:** Destroys offline timeline seeking. Use fixed seeds or deterministic formulas based on array index.
2. **Missing `document.fonts.ready`:** Firing animations before custom Google Fonts load causes erratic text layout jumps. Always wait on `document.fonts.ready`.
3. **Overusing Push-Throughs:** A push-through is exciting when entering a portal, but tedious when used across every consecutive cut. Alternate with whip-pans, match-cuts, and masked wipes.
