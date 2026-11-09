# 03 — Animation Principles & Physics (KinetRig Engine)

Pergerakan objek tanpa fizik terasa murah dan kaku. Modul ini mengkodifikasikan 12 prinsip animasi Disney dan fizik mekanikal ke dalam parameter matematik GSAP 144 FPS.

---

## 1. Master Easing Hierarchy (Bila Guna Easing Mana)

| Nama Easing | Watak Fizik | Penggunaan Ideal |
|---|---|---|
| `power3.out` | Geseran tinggi (High friction glide) | Kemasukan UI biasa, kad slide-in, kamera henti |
| `expo.out` | Brek magnetik (Sudden snap then float) | Pergerakan data kritikal, perkataan impak tinggi |
| `back.out(1.4 - 2.0)` | Spring elastik (Overshoot & settle) | Butang timbul, lencana notifikasi, ikon melompat |
| `power2.inOut` | Mesin hidraulik (Symmetric mechanical) | Pergerakan kamera berterusan dari zon A ke zon B |
| `power4.in` | Graviti jatuh bebas (Freefall acceleration) | Objek keluar pentas, kejatuhan objek berat |

---

## 2. Anticipation & Follow-Through (Persediaan & Susulan)

Objek fizikal tidak memulakan pecutan serta-merta tanpa persiapan:

### Anticipation Formula:
```javascript
// Sebelum melompat ke kanan, tarik sedikit ke kiri (-30px) selama 0.15s
tl.to('#box', { x: -30, scaleX: 0.95, duration: 0.15, ease: 'power1.in' })
  .to('#box', { x: 600, scaleX: 1.1, duration: 0.45, ease: 'power4.out' });
```

### Follow-Through & Settle:
```javascript
// Objek berhenti tetapi elemen dalaman (label/ikon) berayun sedikit
tl.to('#container', { x: 500, duration: 0.5, ease: 'power3.out' })
  .to('#inner-icon', { x: 15, duration: 0.2, ease: 'power1.out' }, '-=0.15')
  .to('#inner-icon', { x: 0, duration: 0.3, ease: 'bounce.out' });
```

---

## 3. Squash & Stretch (Kelenturan Objek)

Apabila objek jatuh atau menghentam permukaan, volum kekal tetapi dimensi berubah:
- Menghentam lantai: `scaleX: 1.25, scaleY: 0.75` (Squash)
- Semasa pecutan udara: `scaleX: 0.85, scaleY: 1.2` (Stretch)
- Kembali normal: `scaleX: 1.0, scaleY: 1.0`

```javascript
tl.to('#badge', { y: 400, scaleX: 0.9, scaleY: 1.15, duration: 0.4, ease: 'power3.in' })
  .to('#badge', { scaleX: 1.3, scaleY: 0.7, duration: 0.1, ease: 'power1.out' }) // hentaman
  .to('#badge', { y: 360, scaleX: 0.98, scaleY: 1.02, duration: 0.2, ease: 'power1.out' }) // lantunan kecil
  .to('#badge', { y: 400, scaleX: 1.0, scaleY: 1.0, duration: 0.15, ease: 'power2.in' });
```

---

## 4. Directional Motion Blur via SVG Filters

Elakkan objek bergerak kelihatan pecah pada mata manusia. Gunakan filter SVG `feGaussianBlur`:

```html
<svg style="position: absolute; width: 0; height: 0;">
  <filter id="motion-blur-x">
    <feGaussianBlur id="blur-kernel" in="SourceGraphic" stdDeviation="0, 0" />
  </filter>
</svg>
```

```javascript
// Semasa pecutan pantas, naikkan stdDeviation X:
tl.to('#blur-kernel', { attr: { stdDeviation: '18, 0' }, duration: 0.15 })
  .to('#subject', { x: 1200, duration: 0.35, ease: 'power3.inOut' }, 0)
  .to('#blur-kernel', { attr: { stdDeviation: '0, 0' }, duration: 0.15 }, '-=0.15');
```

---

## 5. Secondary Motion (Pergerakan Sekunder Pasif)

Sentiasa ada elemen mikro yang bertindak balas terhadap pergerakan utama:
1. Bayang (drop-shadow) mengecut dan kabur apabila objek naik tinggi.
2. Zarah habuk (dust particles) terpelanting sedikit dari titik hentaman.
3. Cahaya pantulan (reflection highlight) bergeser bertentangan dengan arah pergerakan objek.
