# 01 — Cinematography & Camera Direction (KinetRig Engine)

Camera motion in KinetRig is never a static pan or PowerPoint zoom. The camera is a physical 3D rig navigating a unified spatial world continuously (Anti-PowerPoint Motion Law).

---

## 1. Camera Rig Architecture (#world & #camera)

In HTML5/CSS, cinematic camera simulation is built with nested perspective containers:

```html
<div id="viewport" style="width: 1920px; height: 1080px; overflow: hidden; perspective: 1200px;">
  <div id="camera" style="width: 100%; height: 100%; transform-style: preserve-3d;">
    <div id="world" style="width: 100%; height: 100%; transform-style: preserve-3d;">
      <!-- All scenes and 3D layers exist in unified spatial coordinates -->
    </div>
  </div>
</div>
```

### GSAP Camera Controller
```javascript
// Drive cinematic camera coordinates (X, Y, Z) and rotations (Pitch, Yaw, Roll)
function moveCamera(tl, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, duration = 1.2, ease = 'power3.inOut' }, at = '>') {
  tl.to('#camera', {
    x: -x,
    y: -y,
    z: z,
    rotationX: rx,
    rotationY: ry,
    rotationZ: rz,
    duration,
    ease,
    transformPerspective: 1200
  }, at);
}
```

---

## 2. Camera Angles & Psychological Impact

| Angle | Camera Coordinates | Emotional / Editorial Purpose |
|---|---|---|
| **Eye-Level** | `rx: 0, ry: 0, y: 0` | Objective, documentary, neutral presentation |
| **Low-Angle (Hero)** | `rx: 15, y: 150` | Authority, scale, dominance, monumental product launch |
| **High-Angle (Overview)** | `rx: -25, y: -200` | Analytical overview, bird-eye UI dashboard inspection |
| **Dutch Angle (Canted)** | `rz: 7 to 12` | Tension, raw speed, market disruption, electric cadence |

---

## 3. Signature Camera Movements

### A. 2.5D Orbit / Push-Through
Camera penetrates foreground geometry directly into background layers without cross-fading:
```javascript
tl.to('#camera', {
  z: 800,
  rotationY: 15,
  duration: 1.4,
  ease: 'power4.inOut'
});
```

### B. Motivated Whip-Pan (Whip Cut)
A high-velocity 90-degree lateral snap accompanied by directional motion blur:
```javascript
tl.to('#camera', {
  x: '-=1200',
  rotationY: -45,
  duration: 0.35,
  ease: 'power3.in'
})
.set('#camera', { x: 1200, rotationY: 45 })
.to('#camera', {
  x: 0,
  rotationY: 0,
  duration: 0.45,
  ease: 'power3.out'
});
```

### C. Crane / Pedestal (Vertical Travel)
```javascript
tl.to('#camera', { y: -600, duration: 1.5, ease: 'expo.out' });
```

---

## 4. Lens Depth & Optical Simulation (Rack Focus & Parallax)

### Rack Focus Simulation (Blur Swap)
Shifts optical sharpness from foreground subject to background element:
```javascript
tl.to('#foreground-card', { filter: 'blur(12px)', opacity: 0.4, scale: 0.95, duration: 0.8, ease: 'power2.inOut' }, 'focusSwap')
  .to('#background-subject', { filter: 'blur(0px)', opacity: 1, scale: 1, duration: 0.8, ease: 'power2.inOut' }, 'focusSwap');
```

### Multi-Plane Z-Parallax Layers
Separate spatial depth planes along the Z-axis:
- **Foreground (HUD / Sparks / Floating Tokens):** `z: 300px` (moves fastest)
- **Midground (Primary Subject / Typography):** `z: 0px` (sharp focal anchor)
- **Background (3D Grids / Distant Stars):** `z: -600px` (gentle slow drift)

---

## 5. Composition & Framing Laws
1. **Rule of Thirds:** Position focal points (hero metrics or key statements) along the 33% or 66% grid intersections.
2. **Leading Lines:** Utilize glowing accent hairlines or SVG pathways directing the eye directly toward the CTA or brand lockup.
3. **Safe Margins:** Maintain a minimum 120px perimeter padding at 1920x1080 to prevent bezel clipping across varied consumer displays.
