# 03 — Animation Principles & Physics (KinetRig Engine)

Motion without underlying physics feels sterile and rigid. This module codifies core Disney animation principles and mechanical physics into mathematical GSAP 144 FPS parameters.

---

## 1. Master Easing Hierarchy (When to Use Which Easing)

| Easing Name | Physical Character | Best Usage |
|---|---|---|
| `power3.out` | High-friction glide | Standard UI slide-ins, card arrivals, camera settling |
| `expo.out` | Magnetic brake (instant snap then drift) | High-priority data counters, punchy keyword slams |
| `back.out(1.4 - 2.0)` | Elastic spring (overshoot & settle) | Button reveals, badge pops, jumping notification icons |
| `power2.inOut` | Hydraulic actuator (symmetric smooth) | Continuous linear camera motion between coordinates |
| `power4.in` | Freefall gravity acceleration | Exiting offscreen elements, heavy falling objects |

---

## 2. Anticipation & Follow-Through

Physical objects require weight buildup before sudden velocity:

### Anticipation Formula

```javascript
// Pull back slightly (-30px) for 0.15s before launching across the frame
tl.to('#box', { x: -30, scaleX: 0.95, duration: 0.15, ease: 'power1.in' })
  .to('#box', { x: 600, scaleX: 1.1, duration: 0.45, ease: 'power4.out' });
```

### Follow-Through & Settle

```javascript
// Main chassis halts while internal icons or labels wobble into rest
tl.to('#container', { x: 500, duration: 0.5, ease: 'power3.out' })
  .to('#inner-icon', { x: 15, duration: 0.2, ease: 'power1.out' }, '-=0.15')
  .to('#inner-icon', { x: 0, duration: 0.3, ease: 'bounce.out' });
```

---

## 3. Squash & Stretch (Structural Elasticity)

Preserving volume while modifying mass distribution:

- **Impact Surface:** `scaleX: 1.25, scaleY: 0.75` (Squash)
- **Airborne Velocity:** `scaleX: 0.85, scaleY: 1.2` (Stretch)
- **Rest State:** `scaleX: 1.0, scaleY: 1.0`

```javascript
tl.to('#badge', { y: 400, scaleX: 0.9, scaleY: 1.15, duration: 0.4, ease: 'power3.in' })
  .to('#badge', { scaleX: 1.3, scaleY: 0.7, duration: 0.1, ease: 'power1.out' }) // impact
  .to('#badge', { y: 360, scaleX: 0.98, scaleY: 1.02, duration: 0.2, ease: 'power1.out' }) // micro-rebound
  .to('#badge', { y: 400, scaleX: 1.0, scaleY: 1.0, duration: 0.15, ease: 'power2.in' });
```

---

## 4. Directional Motion Blur via SVG Filters

Prevent rapid lateral movement from strobing at 144 FPS with an inline SVG `feGaussianBlur`:

```html
<svg style="position: absolute; width: 0; height: 0;">
  <filter id="motion-blur-x">
    <feGaussianBlur id="blur-kernel" in="SourceGraphic" stdDeviation="0, 0" />
  </filter>
</svg>
```

```javascript
// During high-velocity frames, dial up stdDeviation X
tl.to('#blur-kernel', { attr: { stdDeviation: '18, 0' }, duration: 0.15 })
  .to('#subject', { x: 1200, duration: 0.35, ease: 'power3.inOut' }, 0)
  .to('#blur-kernel', { attr: { stdDeviation: '0, 0' }, duration: 0.15 }, '-=0.15');
```

---

## 5. Secondary Motion (Micro-Environmental Feedback)

Always include subtle secondary elements reacting to primary velocity:

1. Drop shadows shrink and blur as elevation increases.
2. Ambient micro-sparks or debris kick back from point of impact.
3. Specular reflection shifts inversely against object movement direction.
