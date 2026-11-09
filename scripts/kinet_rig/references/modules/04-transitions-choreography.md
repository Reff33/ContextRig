# 04 — Transitions & Scene Choreography (KinetRig Engine)

KinetRig Golden Rule: **No Generic Opacity Fades.** Every scene transition must be physically motivated through 3D camera travel, spatial momentum, or geometric wipes.

---

## 1. The 7 Cinematic Transition Archetypes

### A. Motivated Whip-Pan Transition

The camera accelerates 90 degrees toward the next scene:

```javascript
function whipPanTransition(tl, fromScene, toScene) {
  tl.to(fromScene, { x: -1920, duration: 0.4, ease: 'power3.in' })
    .fromTo(toScene, { x: 1920 }, { x: 0, duration: 0.45, ease: 'power3.out' }, '-=0.15');
}
```

### B. Match Cut (Geometric Affinity)

An object in Scene A transforms directly into a visually similar element in Scene B:
- Scene A: A circular countdown clock rapidly spins and contracts.
- Scene B: An avatar icon expands out from the identical coordinate and diameter.

### C. Push-Through / Tunnel Zoom

The camera travels directly through the aperture of a letter (e.g. letter `O`) or window frame:

```javascript
tl.to('#letter-o', { scale: 45, transformOrigin: 'center center', opacity: 0, duration: 0.9, ease: 'power4.in' })
  .fromTo('#next-scene', { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'power2.out' }, '-=0.3');
```

### D. Geometric Mask Wipe (Clip-Path Wipe)

An angled plane slices across the frame:

```javascript
// CSS: clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
tl.fromTo('#incoming-scene', 
  { clipPath: 'polygon(0% 0%, 0% 0%, -20% 100%, 0% 100%)' },
  { clipPath: 'polygon(0% 0%, 120% 0%, 100% 100%, 0% 100%)', duration: 0.65, ease: 'power3.inOut' }
);
```

### E. Digital Glitch Split Wipe

For developer, infrastructure, and CLI products, scanlines fracture horizontally with RGB displacement:

```javascript
tl.to('#scene-a', { skewX: 20, filter: 'drop-shadow(-8px 0px 0px #ff0055) drop-shadow(8px 0px 0px #00ffff)', duration: 0.1 })
  .set('#scene-a', { display: 'none' })
  .set('#scene-b', { display: 'block', skewX: -15 })
  .to('#scene-b', { skewX: 0, filter: 'none', duration: 0.15, ease: 'power1.out' });
```

---

## 2. Shared World & Persistent Subject

The **Persistent Subject** concept:
Never wipe the entire screen when transitioning to the next narrative beat. Retain an anchor:
- A CTA button remains centered while the world behind it shifts into another dimension.
- A 3D smartphone chassis stays anchored while the interface inside changes apps.

---

## 3. Rhythm & Scene Timing Formula

1. **Scene Hook (0.0s - 2.5s):** Fast transition, high visual momentum, concise hook (≤ 4 words).
2. **Feature Core (2.5s - 15.0s):** Steady cadence (2.0s - 3.5s per feature showcase).
3. **Climax / Resolution (15.0s - 22.0s):** Wide camera angle, cumulative metric reveal.
4. **Brand Landing (22.0s - 26.0s):** Clean logo lockup, domain URL, CTA button.
