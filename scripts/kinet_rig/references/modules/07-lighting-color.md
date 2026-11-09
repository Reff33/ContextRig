# 07 — Cinematic Lighting & Color Grading (KinetRig Engine)

Lighting separates flat, amateur web animations from high-production studio visuals.

---

## 1. 3-Point Studio Lighting in Web / CSS

For UI cards and 3D device geometry:

1. **Key Light (Primary Focus):** Positioned 45 degrees top-left, clean white `rgba(255, 255, 255, 0.95)` defining surface contours.
2. **Fill Light (Shadow Softener):** Positioned 45 degrees bottom-right, gentle complementary blue `rgba(80, 120, 255, 0.3)` eliminating harsh black cutoffs.
3. **Rim / Backlight (Edge Separator):** Positioned directly behind the subject, bright neon brand accent (cyan/gold) establishing depth separation from dark canvas backgrounds.

```css
.studio-lit-card {
  background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.15) 0%, rgba(10, 10, 18, 0.9) 80%);
  box-shadow: 
    -12px -12px 30px rgba(255, 255, 255, 0.05), /* Key light bounce */
    16px 20px 40px rgba(0, 0, 0, 0.8),          /* Ambient occlusion shadow */
    0 0 0 1px rgba(0, 240, 255, 0.4);           /* Neon rim line */
}
```

---

## 2. Volumetric Light Rays (God Rays)

Atmospheric light cones sweeping behind hero typography:

```html
<div class="light-cone" style="
  position: absolute;
  top: -200px;
  left: 50%;
  width: 600px;
  height: 1200px;
  transform: translateX(-50%) rotate(25deg);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0) 100%);
  filter: blur(40px);
  pointer-events: none;
"></div>
```

```javascript
tl.to('.light-cone', {
  rotation: -25,
  opacity: 0.18,
  duration: 4.0,
  ease: 'sine.inOut',
  yoyo: true,
  repeat: -1
});
```

---

## 3. Color Grading & Film Grain Emulation

### A. Dark Tone Film Vignette

```css
#vignette-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at center, transparent 40%, rgba(3, 4, 10, 0.75) 100%);
  mix-blend-mode: multiply;
}
```

### B. High-Frequency Micro-Grain (Zero External Images)

Generate tactile analog grain using an inline SVG `feTurbulence` filter:

```html
<svg style="position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0.04; mix-blend-mode: overlay;">
  <filter id="noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
  </filter>
  <rect width="100%" height="100%" filter="url(#noise)" />
</svg>
```
