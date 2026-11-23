# 09 — Editing & Post-Production (KinetRig Engine)

Code-driven Non-Linear Editing (Code-Driven NLE). Rhythm structures, cinematic speed ramping, and 144 FPS lossless export optimization.

---

## 1. Speed Ramping (Temporal Velocity Manipulation)

Speed ramping accelerates through transitional movements and brakes precisely on climax frames:

```javascript
// Using custom bezier easing in GSAP
// Fast during camera shift (0.2s), slow and deliberate during copy reading (1.5s)
tl.to('#metric-reveal', {
  scale: 1,
  duration: 1.8,
  ease: 'expo.out' // Immediate velocity snap followed by sustained glide
});
```

---

## 2. Kinetic Subtitle & Caption Stacker

Modern dynamic subtitles with real-time word highlighting (Karaoke Glow / Kinetic Word Stacker):

```html
<div class="caption-container" style="display: flex; gap: 8px; justify-content: center; font-size: 36px; font-weight: 700;">
  <span class="cap-word" id="w1">Build</span>
  <span class="cap-word" id="w2">Faster</span>
  <span class="cap-word" id="w3">Than</span>
  <span class="cap-word" id="w4">Ever.</span>
</div>
```

```javascript
// Synchronize highlight state with narration timestamps
function highlightWords(tl, wordTimings) {
  wordTimings.forEach(({ id, start, dur }) => {
    tl.to(id, { color: '#00f0ff', scale: 1.15, textShadow: '0 0 20px #00f0ff', duration: 0.15 }, start)
      .to(id, { color: '#ffffff', scale: 1.0, textShadow: 'none', duration: 0.2 }, start + dur);
  });
}
```

---

## 3. 144 FPS Export Pipeline & FFmpeg Optimization

### Studio Master MP4 Render Pipeline

```bash
# Step 1: Headless extraction of every 144 FPS frame with zero frame loss
node rigtools/kinet_rig/scripts/export-frames.mjs

# Step 2: Assemble PNG frames into high-profile H.264 MP4 (CRF 14)
ffmpeg -framerate 144 -i frames/f%05d.png -c:v libx264 -pix_fmt yuv420p -crf 14 -preset slow output_144fps.mp4
```

### Essential Export Parameters

- **Framerate:** 144 FPS (smoothness on ProMotion Apple displays and gaming panels).
- **Pixel Format:** `yuv420p` (100% universal compatibility across Twitter/X, YouTube, TikTok, and QuickTime).
- **CRF (Constant Rate Factor):** `14` (visually lossless delivery).
