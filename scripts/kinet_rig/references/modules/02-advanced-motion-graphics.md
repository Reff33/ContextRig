# 02 — Advanced Motion Graphics (KinetRig Engine)

High-end kinetic graphics providing an illusion of physical weight, high velocity, and responsive tech hardware interaction.

---

## 1. Kinetic Typography (Live, High-Energy Text)

### A. Word Split & Stagger Slam

Split copy into isolated `span` tokens for tactile impact:

```javascript
// HTML: <h1 class="split-text">REVOLUTIONIZE YOUR WORKFLOW</h1>
const words = el.innerText.split(' ').map(w => `<span class="word" style="display:inline-block; overflow:hidden;"><span class="inner" style="display:inline-block;">${w}</span></span>`).join('&nbsp;');
el.innerHTML = words;

tl.from('.word .inner', {
  yPercent: 120,
  rotateX: -40,
  opacity: 0,
  stagger: 0.04,
  duration: 0.6,
  ease: 'back.out(1.7)'
});
```

### B. Masked Hairline Reveal

Accent hairlines slice across the frame while title text unmasks:

```javascript
tl.fromTo('#accent-line', { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'expo.inOut' })
  .from('#hero-title', { y: 60, opacity: 0, duration: 0.7, ease: 'power3.out' }, '-=0.2');
```

---

## 2. Logo & Brand Reveal Formulas

1. **Light Sweep / Shimmer:** SVG linearGradient sweeps across logo vectors.
2. **Path Stroke Draw:** SVG `stroke-dasharray` and `stroke-dashoffset` outline the mark before solid color fill fades in:

```javascript
const path = document.querySelector('#logo-path');
const length = path.getTotalLength();
gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

tl.to(path, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' })
  .to('#logo-fill', { opacity: 1, duration: 0.5, ease: 'power1.out' }, '-=0.4');
```

---

## 3. UI & Dashboard Simulation Animation

Simulating authentic application workflows:

- **Cursor Pointer Click:** An SVG mouse pointer glides to target, compresses to `scale: 0.9` (press), and triggers a radial pulse.
- **Tabular Data Counter:** Numbers rolling with deterministic frame precision:

```javascript
const counter = { val: 0 };
tl.to(counter, {
  val: 98450,
  duration: 1.5,
  ease: 'power3.out',
  onUpdate: () => {
    document.querySelector('#metric-num').innerText = Math.floor(counter.val).toLocaleString();
  }
});
```

---

## 4. Geometric & SVG Morphing

Shape transformation without layout breakage:

```javascript
tl.to('#morph-card', {
  borderRadius: '24px',
  width: '800px',
  height: '450px',
  duration: 0.8,
  ease: 'expo.inOut'
});
```

---

## 5. Staggered Grid & Multi-Element Cascade

Showcasing feature ecosystems or bento grids:

```javascript
tl.from('.feature-card', {
  scale: 0.8,
  opacity: 0,
  y: 40,
  stagger: {
    amount: 0.4,
    grid: [2, 3],
    from: 'center'
  },
  duration: 0.6,
  ease: 'power2.out'
});
```
