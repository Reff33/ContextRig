# 02 — Advanced Motion Graphics (KinetRig Engine)

Grafik bergerak berkualiti tinggi yang memberikan ilusi berat, dinamisme, dan interaksi perkakasan berteknologi tinggi.

---

## 1. Kinetic Typography (Teks Hidup & Bertenaga)

### A. Word Split & Stagger Slam
Pecahkan teks kepada `span` perkataan atau huruf untuk kesan impak sinematik:

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
Garis aksen nipis (hairline) membesar sambil teks menembusi mask:
```javascript
tl.fromTo('#accent-line', { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'expo.inOut' })
  .from('#hero-title', { y: 60, opacity: 0, duration: 0.7, ease: 'power3.out' }, '-=0.2');
```

---

## 2. Logo & Brand Reveal Formulas

1. **Light Sweep / Shimmer:** SVG linearGradient melintasi bentuk logo.
2. **Path Stroke Draw:** SVG `stroke-dasharray` & `stroke-dashoffset` mendedahkan garis luar logo sebelum warna pepejal mengisi (fill fade).
```javascript
const path = document.querySelector('#logo-path');
const length = path.getTotalLength();
gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

tl.to(path, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' })
  .to('#logo-fill', { opacity: 1, duration: 0.5, ease: 'power1.out' }, '-=0.4');
```

---

## 3. UI & Dashboard Simulation Animation

Animasi antaramuka perisian sebenar:
- **Cursor Pointer Click:** SVG penunjuk tetikus bergerak ke butang, skala 0.9 (tekan), kemudian mencetuskan riak (ripple effect).
- **Tabular Data Counter:** Metrik nombor yang berpusing secara deterministik:
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

## 4. SVG Morphing & Shape Morph

Transformasi bentuk geometri (contoh: Butang bulat mengembang menjadi kad modal):
```javascript
// Menggunakan CSS clip-path atau morphSVG
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

Apabila menampilkan pelbagai kad fitur atau ikon ekosistem:
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
