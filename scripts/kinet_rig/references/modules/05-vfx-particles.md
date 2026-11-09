# 05 — Visual Effects & Particle Systems (KinetRig Engine)

Kesan visual sinematik tanpa berat enjin Remotion atau plugin After Effects berbayar. Dibina atas HTML5 Canvas deterministik, SVG filter matrix, dan CSS backdrop-filter.

---

## 1. Deterministic Particle Field (Zero Math.random())

Semasa rendering 144 FPS offline, zarah (dust, sparks, grid stars) **wajib deterministik** supaya `tl.time(t)` menghasilkan bingkai yang sama persis setiap kali di-scrub.

### Formula Zarah Deterministik:
Gunakan formula Pseudo-Random (PRNG) atau trigonometri berkala berasaskan indeks:

```javascript
class ParticleSystem {
  constructor(canvas, count = 80) {
    this.ctx = canvas.getContext('2d');
    this.count = count;
    this.particles = Array.from({ length: count }, (_, i) => ({
      x: (i * 137.5) % 1920,
      y: (i * 293.7) % 1080,
      size: (i % 3) + 1.2,
      baseAlpha: ((i % 5) + 3) / 10,
      speedX: ((i % 7) - 3) * 0.4,
      speedY: ((i % 11) - 5) * 0.4
    }));
  }

  // Dipanggil terus oleh timeline GSAP melalui tl.eventCallback('onUpdate')
  renderAtTime(time) {
    this.ctx.clearRect(0, 0, 1920, 1080);
    this.ctx.fillStyle = '#ffffff';
    for (const p of this.particles) {
      const cx = (p.x + p.speedX * time * 60) % 1920;
      const cy = (p.y + p.speedY * time * 60) % 1080;
      const alpha = p.baseAlpha * (0.6 + 0.4 * Math.sin(time * 3 + p.x));
      this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}
```

---

## 2. Neon Rim Light & Volumetric Bloom

Cahaya tepi sinematik (Rim Lighting) tanpa rendering WebGL berat:
```css
.neon-glow {
  box-shadow: 
    0 0 20px rgba(0, 240, 255, 0.35),
    0 0 60px rgba(0, 240, 255, 0.15),
    inset 0 0 15px rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 240, 255, 0.8);
}
```

Semasa hentaman beat muzik, cerahkan pendaran (bloom pulse):
```javascript
tl.fromTo('.neon-glow', 
  { filter: 'brightness(2.2) drop-shadow(0 0 35px #00f0ff)' },
  { filter: 'brightness(1.0) drop-shadow(0 0 10px #00f0ff)', duration: 0.5, ease: 'power2.out' }
);
```

---

## 3. High-Tech Glassmorphism & Caustic Reflection

Untuk kad perisian premium (SaaS, FinTech, AI Core):
```css
.glass-panel {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-top: 1px solid rgba(255, 255, 255, 0.35); /* Cahaya pantulan atas */
  border-radius: 20px;
}
```

---

## 4. Digital RGB Chromatic Aberration & Glitch

Gunakan SVG `<feColorMatrix>` atau satah berasingan bergeser (offset layers):
```javascript
function triggerGlitch(tl, target, at = '>') {
  tl.to(target, {
    textShadow: '-4px 0 #ff0055, 4px 0 #00ffff',
    skewX: 12,
    duration: 0.08
  }, at)
  .to(target, {
    textShadow: '3px 0 #ff0055, -3px 0 #00ffff',
    skewX: -8,
    duration: 0.06
  })
  .to(target, {
    textShadow: 'none',
    skewX: 0,
    duration: 0.08,
    ease: 'power1.out'
  });
}
```
