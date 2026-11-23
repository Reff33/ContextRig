# 10 — AI Production Intelligence (KinetRig Engine)

The orchestration layer ensuring AI models (Claude Code, Cursor, Copilot, ChatGPT) consistently produce cinema-grade motion code instead of rigid PowerPoint slides.

---

## 1. Visual QA Scorecard (Pre-Export Quality Gate)

Every AI coding agent **must** verify these 6 quality gates before delivering code:

| Metric | Approval Standard | Common AI Anti-Pattern |
|---|---|---|
| **Zero Emojis** | 100% Inline SVG Vectors (`<svg>`) | Pasting OS emojis (🤖, ⚡, 🐙, 🚀) |
| **Typography Scale** | Title ≥ 48px, Subtitle ≥ 30px | Tiny illegible fonts (< 20px on 1080p) |
| **Hierarchy Law** | Maximum 2 text levels per scene | Crowding the frame with article paragraphs |
| **Continuous Travel** | Zero static slide deck fades | Cross-fading scene containers on spot |
| **Deterministic Seek** | `window.OPENER.seek(t)` frame-exact | Animating with `Date.now()` or random ticks |
| **Safe Margins** | All core copy within 120px perimeter | Text cropped against phone screen edges |

---

## 2. Dynamic Storyboard Generator Protocol

Before writing HTML or CSS, the AI agent must outline a structured **Scene Flow Plan**:

```markdown
[0.0s - 3.0s] Shot 1: The Problem Slam
- Camera: Low-angle, canted Dutch 8 deg, push forward z: 400.
- Visual: Giant typography "SLOW DEPLOYMENTS", glowing hairline slice.
- Audio: Sub-bass drop + high-frequency vinyl noise.

[3.0s - 8.5s] Shot 2: The UI Revolution (Persistent Subject)
- Camera: Level orbit to the right ry: -25 deg.
- Visual: "SLOW DEPLOYMENTS" shatters outward, revealing 144 FPS metric dashboard.
- Motion: Numeric counter rolling from 0 to 99.8%.
- Audio: Electronic riser building to beat drop.
```

---

## 3. Headless Keyframe Verification (Agent Self-Inspection)

To ensure zero text collisions or overlapping layers:

```bash
node rigtools/kinet_rig/scripts/snap.mjs shots 1.0 4.5 9.0 16.0
```

The AI inspects generated PNG keyframes in `shots/` to verify color contrast, text alignment, and lighting before delivering the final video.
