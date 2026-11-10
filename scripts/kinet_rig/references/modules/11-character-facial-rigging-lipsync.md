# Module 11: Character Facial Rigging & Lip-Sync Anatomy Law

> **KinetRig Motion Graphics Skills Library · Module 11**  
> Focus: 2D Vector Character Facial Rigging, Anatomical Oral Cavity, Teeth/Tongue Layering, SVG Viseme Topology Invariance, and Anti-Spike Jaw Smoothing.

---

## 1. Anatomy of the Defect: Why Naive SVG Lip-Sync Deforms into "AI Slop"

In automated SVG character animation, developers frequently make three catastrophic mistakes when implementing talking mouths:

1. **The Hollow Wireframe Disaster (`fill: none`):**
   Defining open mouth shapes as single-stroke paths (`fill: none; stroke: #1C242C`). When the character opens their mouth, background face/skin color shows through the outline. The character appears to have an empty geometric hole or wire loop drawn on their skin rather than an actual mouth.
2. **Numeric Token Mismatch (Spike Deformity):**
   GSAP's native string interpolation parses numeric values sequentially. If a resting mouth has 8 numbers (`M -16 -44 C -6 -34 6 -34 16 -44`) and the talking viseme has 14 numbers (`M -16 -46 C -16 -26 16 -26 ... Z`), the mismatched numbers compress toward 0 or remain fixed, causing the bottom curve to snap into an acute triangular beak or spike extending down onto the chin or neck.
3. **Acute Vertex Convergence (The Inverted Cone / "V" Mouth):**
   Defining the lower jaw curve with control points that share an acute center point (`C -16 -26 16 -26 ...`). This forms a sharp funnel/arrowhead pointing at the chin instead of a natural rounded human jaw bowl.
4. **The Unclipped Tongue/Teeth Spill (Protruding Ball Glitch):**
   Placing teeth and tongue elements directly inside `<g data-name="mouth">` without an SVG `<clipPath>`. Whenever the mouth opening is small (such as phoneme `O`), or during interpolation between open and closed shapes, the bottom curve of the tongue ellipse extends downward past the mouth cavity floor. This causes a pink ball to visibly stick out and overlap the chin, looking like a clown nose or bubblegum stuck to the jawline.

---

## 2. The 4-Layer Vector Mouth Architectural Standard (with SVG ClipPath)

Every production-grade character mouth in KinetRig MUST be constructed from four layered vector entities, with internal oral elements encapsulated inside an SVG `<clipPath>`:

```
┌────────────────────────────────────────────────────────┐
│  1. Oral Cavity Fill (#38131B, stroke: #1C242C, 2.5px) │
│  2. Nested Group <g clip-path="url(#mouth-clip-N)">   │
│     ├─ Upper Teeth Strip (#FFFFFF, rx: 3px)            │
│     └─ Warm Pink Tongue Ellipse (#DE6476)              │
│  3. Outer Resting Smile Stroke (fill: none, 3.5px)     │
└────────────────────────────────────────────────────────┘
```

### Layer Specs:
1. **Oral Cavity (`cavity`):**
   - Fill: Deep maroon/wine `#38131B` (or `#3D1219`). Never use pure `#000000` (too stark) and never leave transparent.
   - Stroke: Boundary ink `#1C242C`, width: `2.5px`, `stroke-linejoin: round`, `stroke-linecap: round`.
   - Behavior: Active (`opacity: 1`) during speaking vowels (`A`, `E`, `O`, `L`). Faded to `opacity: 0` when closed (`rest`, `MBP`).
2. **SVG ClipPath (`clipPath`):**
   - Resides in `<defs>` with `<path d="...">` identical to the cavity geometry.
   - Both `mCavity` and `mClipPath` morph in lockstep during viseme transitions: `tl.to([mCavity, mClipPath], { attr: { d: def.cavity } })`.
   - Result: Physically impossible for tongue or teeth to poke through the lips or chin boundary.
3. **Upper Teeth (`teeth`):**
   - Fill: Clean white `#FFFFFF`, pill-rounded (`rx: 3px`).
   - Position: Anchored at top lip border (`y = -48` to `-46`).
   - Dynamics: Scales laterally and vertically according to phoneme width (`scaleX: 1.15` on `E`, `0.65` on `O`).
4. **Tongue (`tongue`):**
   - Fill: Warm rose/pink `#DE6476` (or `#E26D7C`).
   - Position: Resting along the lower curvature of the cavity (`y = -36` to `-32`).
   - Dynamic Elevation: On consonant `L`, tongue elevates to `y = -40` to contact upper teeth.
5. **Resting Lip Stroke (`line`):**
   - Fill: `none`. Stroke: `#1C242C`, width: `3.5px`, `stroke-linecap: round`.
   - Behavior: Expressive resting curve (`M -14 -44 C -5 -36 5 -36 14 -44`). Displays at `opacity: 1` during silence.

---

## 3. Strict SVG Path Topology Invariance Contract

To achieve 100% deterministic, glitch-free GSAP morphing without external plugins (`MorphSVGPlugin`), all open cavity paths MUST adhere to the exact same cubic command signature:

$$\text{Signature} = \text{M } x_1\ y_1\ \text{C } cx_1\ cy_1\ cx_2\ cy_2\ x_2\ y_2\ \text{C } cx_3\ cy_3\ cx_4\ cy_4\ x_1\ y_1\ \text{Z}$$

**Exactly 14 numeric tokens in identical sequence:**
- 2 tokens: Initial move-to point $(x_1, y_1)$
- 6 tokens: Upper lip bezier curve $(cx_1, cy_1, cx_2, cy_2, x_2, y_2)$
- 6 tokens: Lower jaw bezier curve $(cx_3, cy_3, cx_4, cy_4, x_1, y_1)$
- 0 tokens: Close path `Z`

### Official Phoneme Coordinate Matrix:

| Phoneme | Visual Purpose | Cavity Path `d` (14 Tokens) | Teeth $(y, \text{scale})$ | Tongue $(y, \text{scale})$ |
| :--- | :--- | :--- | :--- | :--- |
| **`rest`** | Silent baseline smile | `M -14 -44 C -5 -40 5 -40 14 -44 C 5 -40 -5 -40 -14 -44 Z` | hidden | hidden |
| **`MBP`** | Pressed lips (m, b, p) | `M -14 -43 C -5 -43 5 -43 14 -43 C 5 -43 -5 -43 -14 -43 Z` | hidden | hidden |
| **`A`** | Wide open jaw (ah) | `M -15 -46 C -6 -47 6 -47 15 -46 C 14 -28 -14 -28 -15 -46 Z` | $y = -46, s = 1.0$ | $y = -32, s = 1.0$ |
| **`E`** | Wide grin vowel (ee, eh)| `M -16 -45 C -6 -46 6 -46 16 -45 C 15 -35 -15 -35 -16 -45 Z` | $y = -45, s = 1.15$ | $y = -34, s = 0.8$ |
| **`O`** | Rounded vocalic (oh, oo)| `M -9 -48 C -3 -50 3 -50 9 -48 C 10 -32 -10 -32 -9 -48 Z` | $y = -48, s = 0.65$ | $y = -36, s = 0.7$ |
| **`L`** | Elevated tongue (l, th) | `M -14 -46 C -5 -47 5 -47 14 -46 C 13 -32 -13 -32 -14 -46 Z` | $y = -46, s = 0.9$ | $y = -40, s = 0.85$ |

---

## 4. Jaw Clearance & Proportional Restraint

- **The 24px Chin Buffer Law:**
  In a standard character head where the chin/jaw base sits at $y = -4$, the maximum lowest dip of any talking cavity ($y_{\text{bottom}}$) MUST NOT exceed $y = -28$.
  $$\Delta y_{\text{chin}} = y_{\text{chin}} - y_{\text{jaw\_bottom}} = (-4) - (-28) = 24\text{px}$$
  Exceeding this boundary causes the mouth to intersect or obliterate the chin outline and collar.
- **Horizontal Control Point Spacing (Anti-V):**
  In viseme `A`, control points along the lower curve are set at $(14, -28)$ and $(-14, -28)$. The horizontal separation of $28\text{px}$ guarantees a smooth, rounded parabolic smile bowl. Never set both control points to $(0, -y)$ or $(\pm 2, -y)$ as this produces an ugly acute triangular wedge.
- **The SVG `<clipPath>` Oral Containment Law:**
  Teeth rectangles and tongue ellipses must never be allowed to render unclipped directly in the root mouth container. They must always be wrapped inside an SVG `<g clip-path="url(#mouth-clip)">` where the clip path mirrors the active cavity. As a result, even when the tongue is positioned at the lowest rim of the cavity, any portion protruding beyond the perimeter is automatically clipped out, preventing any bleed onto the chin or neck.

---

## 5. Reusable Production Implementation

```javascript
/* ============ CHARACTER ANATOMICAL MOUTH RIG ============ */
const VISEME_DEFS = {
  rest: { isOpen: false, line: 'M -14 -44 C -5 -36 5 -36 14 -44', cavity: 'M -14 -44 C -5 -40 5 -40 14 -44 C 5 -40 -5 -40 -14 -44 Z' },
  MBP:  { isOpen: false, line: 'M -14 -43 C -5 -43 5 -43 14 -43', cavity: 'M -14 -43 C -5 -43 5 -43 14 -43 C 5 -43 -5 -43 -14 -43 Z' },
  A:    { isOpen: true,  cavity: 'M -15 -46 C -6 -47 6 -47 15 -46 C 14 -28 -14 -28 -15 -46 Z', teethY: -46, teethScale: 1.0,  teethOpacity: 1.0, tongueY: -32, tongueScale: 1.0,  tongueOpacity: 1.0 },
  E:    { isOpen: true,  cavity: 'M -16 -45 C -6 -46 6 -46 16 -45 C 15 -35 -15 -35 -16 -45 Z', teethY: -45, teethScale: 1.15, teethOpacity: 1.0, tongueY: -34, tongueScale: 0.8,  tongueOpacity: 0.7 },
  O:    { isOpen: true,  cavity: 'M -9 -48 C -3 -50 3 -50 9 -48 C 10 -32 -10 -32 -9 -48 Z', teethY: -48, teethScale: 0.65, teethOpacity: 0.8, tongueY: -36, tongueScale: 0.7,  tongueOpacity: 0.9 },
  L:    { isOpen: true,  cavity: 'M -14 -46 C -5 -47 5 -47 14 -46 C 13 -32 -13 -32 -14 -46 Z', teethY: -46, teethScale: 0.9,  teethOpacity: 1.0, tongueY: -40, tongueScale: 0.85, tongueOpacity: 1.0 }
};

export function createMouthRig(parentGroup, defsElement, colors) {
  let charMouthCount = (window._charMouthCount = (window._charMouthCount || 0) + 1);
  const clipId = `mouth-clip-${charMouthCount}`;

  // Dedicated SVG ClipPath in <defs>
  const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
  clipPath.setAttribute('id', clipId);
  const clipPathShape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  clipPathShape.setAttribute('d', VISEME_DEFS.rest.cavity);
  clipPath.appendChild(clipPathShape);
  defsElement.appendChild(clipPath);

  const mg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  mg.setAttribute('data-name', 'mouth-rig');
  parentGroup.appendChild(mg);

  // 1. Oral Cavity
  const cavity = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  cavity.setAttribute('d', VISEME_DEFS.rest.cavity);
  cavity.setAttribute('fill', '#38131B');
  cavity.setAttribute('stroke', colors.ink || '#1C242C');
  cavity.setAttribute('stroke-width', '2.5');
  cavity.setAttribute('stroke-linecap', 'round');
  cavity.setAttribute('stroke-linejoin', 'round');
  cavity.setAttribute('opacity', '0');
  mg.appendChild(cavity);

  // 2. Clipped Interior Container
  const innerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  innerGroup.setAttribute('clip-path', `url(#${clipId})`);
  mg.appendChild(innerGroup);

  // 3. Teeth
  const teeth = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  teeth.setAttribute('x', '-10'); teeth.setAttribute('y', '-48');
  teeth.setAttribute('width', '20'); teeth.setAttribute('height', '6');
  teeth.setAttribute('rx', '3'); teeth.setAttribute('fill', '#FFFFFF');
  teeth.setAttribute('opacity', '0');
  innerGroup.appendChild(teeth);

  // 4. Tongue
  const tongue = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  tongue.setAttribute('cx', '0'); tongue.setAttribute('cy', '-32');
  tongue.setAttribute('rx', '10'); tongue.setAttribute('ry', '6.5');
  tongue.setAttribute('fill', '#DE6476');
  tongue.setAttribute('opacity', '0');
  innerGroup.appendChild(tongue);

  // 5. Resting Lip Stroke
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('d', VISEME_DEFS.rest.line);
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', colors.ink || '#1C242C');
  line.setAttribute('stroke-width', '3.5');
  line.setAttribute('stroke-linecap', 'round');
  mg.appendChild(line);

  return { group: mg, cavity, clipPath: clipPathShape, teeth, tongue, line };
}

export function viseme(tl, ch, phoneme, at, dur = 0.12) {
  if (!ch || !ch.mouth) return;
  const def = VISEME_DEFS[phoneme] || VISEME_DEFS.rest;
  const m = ch.mouth;
  const cavTargets = m.clipPath ? [m.cavity, m.clipPath] : m.cavity;

  if (!def.isOpen) {
    tl.to(m.line, { attr: { d: def.line }, opacity: 1, duration: dur, ease: 'power2.out' }, at);
    tl.to(cavTargets, { attr: { d: def.cavity }, opacity: 0, duration: dur, ease: 'power2.out' }, at);
    tl.to(m.teeth, { opacity: 0, duration: dur * 0.7, ease: 'power1.out' }, at);
    tl.to(m.tongue, { opacity: 0, duration: dur * 0.7, ease: 'power1.out' }, at);
  } else {
    tl.to(m.line, { opacity: 0, duration: dur * 0.4, ease: 'power1.in' }, at);
    tl.to(cavTargets, { attr: { d: def.cavity }, opacity: 1, duration: dur, ease: 'power2.out' }, at);
    tl.to(m.teeth, { y: def.teethY + 48, scaleX: def.teethScale || 1, opacity: def.teethOpacity, duration: dur, ease: 'power2.out' }, at);
    tl.to(m.tongue, { y: def.tongueY + 32, scaleX: def.tongueScale || 1, opacity: def.tongueOpacity, duration: dur, ease: 'power2.out' }, at);
  }
}
```
