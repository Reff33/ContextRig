# Dynamic Mockup Components (`references/mockups.md`)

Zero-dependency CSS 3D hardware and viewport frames engineered for KinetRig. Drop live vector UI, screenshots, or code directly inside realistic device chassis without external 3D model assets.

---

## 1. Laptop Chassis Mockup (Aluminum Unibody)

```html
<div class="laptop-container" style="
  width: 960px;
  height: 600px;
  perspective: 1200px;
  margin: 0 auto;
">
  <!-- Laptop Lid / Screen -->
  <div class="laptop-chassis" style="
    width: 100%;
    height: 100%;
    background: #14151a;
    border-radius: 20px 20px 4px 4px;
    border: 3px solid #2e303d;
    box-shadow: 0 35px 80px rgba(0, 0, 0, 0.85);
    overflow: hidden;
    position: relative;
    transform-style: preserve-3d;
  ">
    <!-- Camera Notch / Bezel -->
    <div style="position: absolute; top: 8px; left: 50%; transform: translateX(-50%); width: 80px; height: 14px; background: #0c0d12; border-radius: 0 0 8px 8px; z-index: 10; display: flex; align-items: center; justify-content: center;">
      <div style="width: 6px; height: 6px; border-radius: 50%; background: #1c202d; box-shadow: 0 0 2px #00f0ff;"></div>
    </div>

    <!-- Live Screen Viewport -->
    <div class="laptop-screen" style="
      width: 100%;
      height: 100%;
      background: #090a0f;
      padding: 30px;
      overflow: hidden;
      box-sizing: border-box;
    ">
      <!-- Insert UI, charts, or app demos here -->
    </div>
  </div>

  <!-- Laptop Base Lip -->
  <div style="
    width: 108%;
    height: 16px;
    margin-left: -4%;
    background: linear-gradient(180deg, #3a3c48 0%, #1e2029 100%);
    border-radius: 0 0 16px 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.9);
  "></div>
</div>
```

---

## 2. Smartphone Mockup (Dynamic Island & Glass Bezel)

```html
<div class="phone-chassis" style="
  width: 360px;
  height: 740px;
  background: #101116;
  border-radius: 48px;
  border: 4px solid #303342;
  box-shadow: 
    0 30px 70px rgba(0, 0, 0, 0.9),
    inset 0 0 0 2px rgba(255, 255, 255, 0.1);
  overflow: hidden;
  position: relative;
  transform-style: preserve-3d;
">
  <!-- Dynamic Island -->
  <div style="
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    width: 110px;
    height: 28px;
    background: #000000;
    border-radius: 20px;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    box-sizing: border-box;
  ">
    <div style="width: 10px; height: 10px; border-radius: 50%; background: #161b26;"></div>
    <div style="width: 8px; height: 8px; border-radius: 50%; background: #00f0ff; opacity: 0.6;"></div>
  </div>

  <!-- Screen Content Viewport -->
  <div class="phone-screen" style="
    width: 100%;
    height: 100%;
    background: #06070a;
    padding: 55px 20px 20px 20px;
    box-sizing: border-box;
    overflow: hidden;
  ">
    <!-- Insert mobile app UI here -->
  </div>
</div>
```

---

## 3. Desktop Browser Chrome Window

```html
<div class="browser-window" style="
  width: 1020px;
  height: 620px;
  background: #12131a;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85);
  overflow: hidden;
  display: flex;
  flex-direction: column;
">
  <!-- Top Bar / Traffic Lights -->
  <div style="
    height: 42px;
    background: #181922;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 8px;
  ">
    <div style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f56;"></div>
    <div style="width: 12px; height: 12px; border-radius: 50%; background: #ffbd2e;"></div>
    <div style="width: 12px; height: 12px; border-radius: 50%; background: #27c93f;"></div>
    
    <!-- Address Bar -->
    <div style="
      margin-left: 20px;
      flex: 1;
      max-width: 440px;
      height: 26px;
      background: #0f1016;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      align-items: center;
      padding: 0 12px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
      font-family: monospace;
    ">
      https://kinetrig.dev/analytics
    </div>
  </div>

  <!-- Browser Viewport -->
  <div class="browser-content" style="
    flex: 1;
    background: #090a0e;
    overflow: hidden;
    position: relative;
  ">
    <!-- Insert web app dashboard here -->
  </div>
</div>
```
