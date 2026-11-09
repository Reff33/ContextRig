# 10 — AI Production Intelligence (KinetRig Engine)

Lapisan orkestrasi kecerdasan buatan (AI Intelligence) yang memastikan model AI (Claude Code, Cursor, Copilot) tidak mereka-reka slaid kaku atau kod rapuh.

---

## 1. Visual QA Scorecard (Pemeriksaan Kualiti Sebelum Eksport)

Setiap ejen AI **wajib** memeriksa 6 metrik ini sebelum mengisytiharkan kod siap:

| Kriteria | Standard Kelulusan | Kesilapan Kerap AI |
|---|---|---|
| **Zero Emojis** | 100% Inline SVG Vector (`<svg>`) | Masih copy-paste 🤖, ⚡, 🐙, 🚀 |
| **Typography Scale** | Judul ≥ 48px, Penjelasan ≥ 30px | Teks terlalu halus (< 20px pada 1080p) |
| **Hierarchy Law** | Maksimum 2 peringkat teks per adegan | Meletakkan perenggan artikel panjang |
| **Continuous Travel** | Tiada slide deck opacity fade | Menghilangkan elemen A sebelum elemen B muncul |
| **Deterministic Seek** | `window.OPENER.seek(t)` berfungsi tepat | Animasi bergantung pada `Date.now()` |
| **Safe Margins** | Semua teks berada dalam lingkungan 120px dari bingkai | Teks terpotong di tepi bezel telefon pintar |

---

## 2. Dynamic Storyboard Generator Protocol

Sebelum menulis kod HTML/CSS, ejen AI mesti menghasilkan **Rancangan Adegan (Scene Flow)** berstruktur:

```markdown
[0.0s - 3.0s] Shot 1: The Problem Slam
- Camera: Low-angle, canted Dutch 8 deg, push forward z: 400.
- Visual: Giant typography "SLOW DEPLOYMENTS", glowing hairline slice.
- Audio: Sub-bass drop + high-frequency vinyl noise.

[3.0s - 8.5s] Shot 2: The UI Revolution (Persistent Subject)
- Camera: Level orbit to the right ry: -25 deg.
- Visual: "SLOW DEPLOYMENTS" hancur berkecai, mendedahkan dashboard metrik 144 FPS.
- Motion: Counter nombor berpusing dari 0 ke 99.8%.
- Audio: Riser elektronik menyala ke Beat drop.
```

---

## 3. Headless Keyframe Verification (AI Self-Inspection)

Untuk memastikan tiada pertindihan teks (text collision), ejen AI menjalankan:

```bash
node rigtools/kinet_rig/scripts/snap.mjs shots 1.0 4.5 9.0 16.0
```

AI memeriksa imej tangkapan skrin yang dihasilkan dalam folder `shots/` untuk mengesahkan kontras warna, penjajaran teks, dan pencahayaan sebelum membentangkan kepada pengguna.
