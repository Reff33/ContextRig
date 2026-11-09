# 09 — Editing & Post-Production (KinetRig Engine)

Penyuntingan video dalam kod (Code-Driven NLE). Struktur masa, pacing sinematik, speed ramping, dan pengoptimuman eksport 144 FPS tanpa kehilangan kualiti.

---

## 1. Speed Ramping (Manipulasi Kelajuan Masa)

Speed ramping ialah teknik mempercepatkan pergerakan di tengah shot dan memperlahankannya tepat pada detik klimaks:

```javascript
// Menggunakan CustomEase atau cubic-bezier dalam GSAP
// Cepat semasa transisi (0.2s), perlahan semasa membaca teks (1.5s)
tl.to('#metric-reveal', {
  scale: 1,
  duration: 1.8,
  ease: 'expo.out' // Pecutan segera lalu meluncur perlahan
});
```

---

## 2. Kinetic Subtitle & Caption Stacker

Sari kata (subtitles) moden yang menyala mengikut perkataan yang disebut (Karaoke Glow / Word Highlighting):

```html
<div class="caption-container" style="display: flex; gap: 8px; justify-content: center; font-size: 36px; font-weight: 700;">
  <span class="cap-word" id="w1">Build</span>
  <span class="cap-word" id="w2">Faster</span>
  <span class="cap-word" id="w3">Than</span>
  <span class="cap-word" id="w4">Ever.</span>
</div>
```

```javascript
// Sinkronkan penyerlah perkataan mengikut masa sebutan
function highlightWords(tl, wordTimings) {
  wordTimings.forEach(({ id, start, dur }) => {
    tl.to(id, { color: '#00f0ff', scale: 1.15, textShadow: '0 0 20px #00f0ff', duration: 0.15 }, start)
      .to(id, { color: '#ffffff', scale: 1.0, textShadow: 'none', duration: 0.2 }, start + dur);
  });
}
```

---

## 3. 144 FPS Export Pipeline & FFmpeg Optimization

### Studio Master MP4 Render Command:
```bash
# Langkah 1: Ekstrak frame 144 FPS tanpa hilang bingkai
node rigtools/kinet_rig/scripts/export-frames.mjs

# Langkah 2: Gabung frame PNG ke MP4 H.264 kualiti tinggi (CRF 14)
ffmpeg -framerate 144 -i frames/f%05d.png -c:v libx264 -pix_fmt yuv420p -crf 14 -preset slow output_144fps.mp4
```

### Parameter Eksport Utama:
- **Framerate:** 144 FPS (memberikan kelicinan maksimum pada monitor gaming & ProMotion skrin Apple).
- **Pixel Format:** `yuv420p` (keserasian 100% dengan Twitter/X, YouTube, TikTok, dan QuickTime).
- **CRF (Constant Rate Factor):** `14` (hampir tanpa kehilangan / visually lossless).
