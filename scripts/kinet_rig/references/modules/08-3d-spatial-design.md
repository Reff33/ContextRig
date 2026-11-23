# 08 — 3D Motion & Spatial Design (KinetRig Engine)

KinetRig pairs lightweight Three.js (for genuine 3D lighting and geometry) with CSS 3D Transforms (for razor-sharp vector typography without WebGL texture overhead).

---

## 1. Zero-Dependency CSS 3D Device Mockups (Laptop & Mobile)

Construct authentic device viewports without downloading heavy GLTF or OBJ models:

```html
<div class="laptop-chassis" style="
  width: 900px;
  height: 540px;
  background: #18191f;
  border-radius: 20px;
  border: 4px solid #2e303d;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.9);
  transform-style: preserve-3d;
  overflow: hidden;
  position: relative;
">
  <!-- Actual software screen content -->
  <div class="screen-content" style="width: 100%; height: 100%; background: #0c0d14;">
    <!-- Render live vector UI here -->
  </div>
</div>
```

### 3D Card Tumble Reveal

```javascript
tl.fromTo('.laptop-chassis',
  {
    rotationX: 35,
    rotationY: -40,
    rotationZ: 10,
    z: -400,
    opacity: 0
  },
  {
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    z: 0,
    opacity: 1,
    duration: 1.4,
    ease: 'power3.out'
  }
);
```

---

## 2. Three.js Lightweight Particle Helix / Grid

For AI, infrastructure, and data themes, inject a background Three.js canvas:

```javascript
// Deterministic Three.js canvas setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1920 / 1080, 0.1, 1000);
camera.position.z = 5;

const geo = new THREE.BufferGeometry();
const count = 500;
const pos = new Float32Array(count * 3);
for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 12;
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

const mat = new THREE.PointsMaterial({ size: 0.04, color: 0x00f0ff, transparent: true, opacity: 0.8 });
const points = new THREE.Points(geo, mat);
scene.add(points);

// Linked directly to KinetRig timeline clock:
window.seekThreeJs = (time) => {
  points.rotation.y = time * 0.2;
  points.rotation.x = time * 0.1;
  renderer.render(scene, camera);
};
```

---

## 3. 3D Floating Typography with Layered Shadows

Layer text with staggered `translateZ` offsets to create physical separation from the background:

```css
.title-3d {
  transform: translateZ(120px);
  filter: drop-shadow(0 25px 35px rgba(0, 0, 0, 0.85));
}
.subtitle-3d {
  transform: translateZ(60px);
  filter: drop-shadow(0 15px 20px rgba(0, 0, 0, 0.6));
}
```
