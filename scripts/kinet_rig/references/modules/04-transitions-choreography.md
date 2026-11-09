# 04 — Transitions & Scene Choreography (KinetRig Engine)

Peraturan Utama KinetRig: **Diharamkan Fade Biasa (No Opacity Fades between slides).** Setiap transisi mesti bermotif fizikal atau geometri.

---

## 1. The 7 Cinematic Transition Archetypes

### A. Whip-Pan Motivated Transition
Kamera berpusing 90° ke arah objek baru dengan kelajuan tinggi:
```javascript
function whipPanTransition(tl, fromScene, toScene) {
  tl.to(fromScene, { x: -1920, duration: 0.4, ease: 'power3.in' })
    .fromTo(toScene, { x: 1920 }, { x: 0, duration: 0.45, ease: 'power3.out' }, '-=0.15');
}
```

### B. Match Cut (Bentuk Serupa)
Objek bulat Scene A bertukar terus kepada objek bulat Scene B:
- Scene A: Ikon syiling atau roda pemasa berpusing pantas lalu mengecut.
- Scene B: Avatar pengguna atau lencana kejayaan muncul dari saiz dan koordinat yang sama persis.

### C. Push-Through / Tunnel Zoom
Kamera menembusi lubang huruf (contoh: huruf `O` dalam teks) atau pintu portal:
```javascript
tl.to('#letter-o', { scale: 45, transformOrigin: 'center center', opacity: 0, duration: 0.9, ease: 'power4.in' })
  .fromTo('#next-scene', { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'power2.out' }, '-=0.3');
```

### D. Geometric Mask Wipe (Clip-Path Wipe)
Satu satah serong melintasi skrin:
```javascript
// CSS: clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
tl.fromTo('#incoming-scene', 
  { clipPath: 'polygon(0% 0%, 0% 0%, -20% 100%, 0% 100%)' },
  { clipPath: 'polygon(0% 0%, 120% 0%, 100% 100%, 0% 100%)', duration: 0.65, ease: 'power3.inOut' }
);
```

### E. Digital Glitch Split Wipe
Bagi produk developer / CLI / AI, jalur visual terbelah secara mendatar dengan herotan RGB:
```javascript
tl.to('#scene-a', { skewX: 20, filter: 'drop-shadow(-8px 0px 0px #ff0055) drop-shadow(8px 0px 0px #00ffff)', duration: 0.1 })
  .set('#scene-a', { display: 'none' })
  .set('#scene-b', { display: 'block', skewX: -15 })
  .to('#scene-b', { skewX: 0, filter: 'none', duration: 0.15, ease: 'power1.out' });
```

---

## 2. Shared World & Persistent Subject

Konsep **Persistent Subject**:
Jangan musnahkan seluruh skrin untuk pergi ke bab seterusnya. Kekalkan satu elemen penambat:
- Butang CTA kekal di tengah, tetapi latar belakang di belakangnya berputar ke dunia berbeza.
- Telefon pintar 3D kekal di skrin, hanya isi skrin kaca telefon tersebut yang bertukar aplikasi.

---

## 3. Rhythm & Scene Timing Formula
1. **Scene Hook (0.0s - 2.5s):** Transisi pantas, teks impak tinggi (≤ 4 perkataan).
2. **Feature Core (2.5s - 15.0s):** Tempo sederhana (2.0s - 3.5s setiap penemuan fitur).
3. **Climax / Resolution (15.0s - 22.0s):** Pergerakan kamera meluas, penunjuk hasil metrik.
4. **Brand Landing (22.0s - 26.0s):** Logo lockup, domain URL, butang mula.
