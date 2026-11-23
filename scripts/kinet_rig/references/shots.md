# Shot Recipe Library (`references/shots.md`)

A modular catalog of ready-to-use cinematic camera maneuvers, lighting effects, and UI animations engineered for zero-dependency GSAP at 144 FPS.

---

## 1. Camera Movement Recipes

### Recipe 1.1: FPV Push-In (Hyper-Speed Dive)

Accelerates into an interface aperture before landing smoothly:

```javascript
function fpvPushIn(tl, target = '#camera', at = '>') {
  tl.fromTo(target, 
    { z: -1600, rotationX: 12, opacity: 0 },
    { z: 0, rotationX: 0, opacity: 1, duration: 1.1, ease: 'expo.out' },
    at
  );
}
```

### Recipe 1.2: 2.5D Horizon Orbit (Gentle Yaw Sweep)

Slowly sweeps the camera across spatial depth:

```javascript
function horizonOrbit(tl, target = '#camera', duration = 3.0, at = '>') {
  tl.to(target, {
    rotationY: 18,
    x: -80,
    z: 120,
    duration,
    ease: 'sine.inOut'
  }, at);
}
```

### Recipe 1.3: Dutch Tilt Whip Pan

Dramatic tilted camera whip cut into the subsequent scene:

```javascript
function dutchWhip(tl, fromScene, toScene, at = '>') {
  tl.to(fromScene, { x: -1600, rotationZ: -14, duration: 0.35, ease: 'power3.in' }, at)
    .fromTo(toScene, 
      { x: 1600, rotationZ: 14 },
      { x: 0, rotationZ: 0, duration: 0.45, ease: 'power3.out' },
      '-=0.12'
    );
}
```

### Recipe 1.4: Rack Focus Depth Swap

Swaps optical sharpness between foreground and background cards:

```javascript
function rackFocus(tl, foreground, background, at = '>') {
  tl.to(foreground, { filter: 'blur(16px)', opacity: 0.35, scale: 0.94, duration: 0.75, ease: 'power2.inOut' }, at)
    .to(background, { filter: 'blur(0px)', opacity: 1.0, scale: 1.0, duration: 0.75, ease: 'power2.inOut' }, at);
}
```

---

## 2. Kinetic Typography & UI Recipes

### Recipe 2.1: Kinetic Word Slam

Staggers words bursting forward with physical momentum:

```javascript
function kineticSlam(tl, wordElements, at = '>') {
  tl.from(wordElements, {
    scale: 2.2,
    z: 400,
    opacity: 0,
    stagger: 0.08,
    duration: 0.5,
    ease: 'back.out(2.0)'
  }, at);
}
```

### Recipe 2.2: Live Tabular Counter Roll

Spins metrics deterministically based on timeline clock:

```javascript
function rollMetric(tl, element, targetVal, prefix = '', suffix = '', duration = 1.4, at = '>') {
  const obj = { val: 0 };
  tl.to(obj, {
    val: targetVal,
    duration,
    ease: 'power3.out',
    onUpdate: () => {
      element.innerText = `${prefix}${Math.floor(obj.val).toLocaleString()}${suffix}`;
    }
  }, at);
}
```

### Recipe 2.3: Bento Box Grid Cascade

Staggers feature cards expanding from center:

```javascript
function bentoCascade(tl, cards = '.bento-card', at = '>') {
  tl.from(cards, {
    scale: 0.82,
    y: 60,
    opacity: 0,
    stagger: {
      amount: 0.35,
      from: 'center'
    },
    duration: 0.65,
    ease: 'back.out(1.5)'
  }, at);
}
```

---

## 3. Lighting & VFX Recipes

### Recipe 3.1: Specular Light Sweep

Sweeps an angled gradient across the surface of a card or logo:

```html
<div class="shimmer-card" style="position: relative; overflow: hidden;">
  <div class="shimmer-bar" style="position: absolute; top: -50%; left: -60%; width: 40%; height: 200%; transform: rotate(25deg); background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); pointer-events: none;"></div>
</div>
```

```javascript
function triggerShimmer(tl, bar = '.shimmer-bar', duration = 0.9, at = '>') {
  tl.fromTo(bar, { left: '-60%' }, { left: '140%', duration, ease: 'power2.inOut' }, at);
}
```

### Recipe 3.2: Neon Overdrive Flash

Momentary bloom flare celebrating milestone achievement:

```javascript
function neonFlash(tl, target = '.neon-target', at = '>') {
  tl.to(target, { filter: 'brightness(2.5) drop-shadow(0 0 45px #00f0ff)', duration: 0.08 }, at)
    .to(target, { filter: 'brightness(1.0) drop-shadow(0 0 12px #00f0ff)', duration: 0.45, ease: 'power2.out' });
}
```
