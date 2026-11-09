# 01 — Cinematography & Camera Direction (KinetRig Engine)

Kamera dalam KinetRig bukan sekadar pan/zoom statik. Kamera ialah rig 3D fizikal yang mengemudi dunia visual secara berterusan (Anti-PowerPoint).

---

## 1. Camera Rig Architecture (#world & #camera)

Dalam HTML5/CSS, simulasi kamera sinematik dibina menggunakan struktur container bersarang dengan `perspective`:

```html
<div id="viewport" style="width: 1920px; height: 1080px; overflow: hidden; perspective: 1200px;">
  <div id="camera" style="width: 100%; height: 100%; transform-style: preserve-3d;">
    <div id="world" style="width: 100%; height: 100%; transform-style: preserve-3d;">
      <!-- Semua scene diletakkan dalam koordinat ruang 3D -->
    </div>
  </div>
</div>
```

### GSAP Camera Controller
```javascript
// Gerakkan kamera sinematik dengan koordinat X, Y, Z dan rotasi Pitch/Yaw/Roll
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

## 2. Camera Angles & Emosi Visual

| Sudut | Koordinat Kamera | Emosi / Kegunaan |
|---|---|---|
| **Eye-Level** | `rx: 0, ry: 0, y: 0` | Neutral, objektif, dokumentari |
| **Low-Angle (Hero)** | `rx: 15, y: 150` | Kuasa, dominan, skala besar, produk hebat |
| **High-Angle (Overview)** | `rx: -25, y: -200` | Terbuka, analitik, UI dashboard bird-eye |
| **Dutch Angle (Canted)** | `rz: 7 to 12` | Ketegangan, tenaga pantas, disrupsi pasaran |

---

## 3. Camera Movements (Resep Pergerakan Kamera)

### A. 2.5D Orbit / Push-Through
Kamera menembusi objek depan ke objek belakang tanpa fade:
```javascript
tl.to('#camera', {
  z: 800,
  rotationY: 15,
  duration: 1.4,
  ease: 'power4.inOut'
});
```

### B. Whip-Pan (Whip Cut)
Pusingan pantas 90 darjah dengan motion blur sementara:
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

## 4. Lens & Depth (Rack Focus & Parallax)

### Rack Focus Simulation (Blur Swap)
Alih fokus dari subjek hadapan (foreground) ke subjek belakang (background):
```javascript
tl.to('#foreground-card', { filter: 'blur(12px)', opacity: 0.4, scale: 0.95, duration: 0.8, ease: 'power2.inOut' }, 'focusSwap')
  .to('#background-subject', { filter: 'blur(0px)', opacity: 1, scale: 1, duration: 0.8, ease: 'power2.inOut' }, 'focusSwap');
```

### Parallax Depth Layers (Multi-Plane)
Asingkan kedalaman paksi Z untuk setiap lapisan:
- **Foreground (HUD/Sparks):** `z: 300px` (bergerak pantas)
- **Midground (Subject/Text):** `z: 0px` (fokus utama)
- **Background (Grids/Stars):** `z: -600px` (bergerak perlahan)

---

## 5. Composition & Framing Laws
1. **Rule of Thirds:** Letak titik vokal (teks penting atau metrik) pada persimpangan 33% atau 66% stage.
2. **Leading Lines:** Gunakan garisan neon atau kabel SVG yang menunjuk terus ke arah butang/logo.
3. **Safe Margin:** Minimum 120px padding dari bingkai 1920x1080 supaya tidak terpotong pada pelbagai skrin.
