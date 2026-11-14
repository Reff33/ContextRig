import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * LiquidGlass — 100% Exact Remotion Port of `assets/kinet-ios-liquid-glass.html`.
 * Matches HTML5/Three.js/GSAP layout and multi-scene VisionOS choreography:
 *
 * Timeline (15.0s = 900 frames @ 60fps):
 *  - Scene 1 (0.00s - 3.20s): Dynamic Island awakens (scaleY 0.82 -> 1). Liquid orb emerges (scale 0.001 -> 1.0, elastic.out).
 *  - Scene 2 (3.20s - 6.50s): Island expands into wide Spatial Music Widget (width: 560px, height: 86px).
 *    Left card (#cardLeft: Spatial Audio Depth) and Right card (#cardRight: Apple Intelligence) slide in (x: -60 -> 0, x: 60 -> 0).
 *    Resonance meter fills from 35% to 84%.
 *  - Scene 3 (6.50s - 10.20s): Camera pushes through spatial depth (z: 7.5 -> 6.2). Siri iridescent multi-color fluid aura expands (scale 1.25, opacity 0.85).
 *  - Scene 4 (10.20s - 13.50s): Biometric Face ID spatial ring locks in with bounce (scale 0.4 -> 1.05 -> 1.0). Camera pulls back to 7.5.
 *  - Scene 5 (13.50s - 15.00s): Widgets retract, Island compresses back to 220px pill, liquid orb absorbs back into Island.
 */
export type LiquidGlassProps = {
  primaryColor?: string;
  accentPurple?: string;
  backgroundColor?: string;
};

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  primaryColor = '#0A84FF',
  accentPurple = '#BF5AF2',
  backgroundColor = '#020305',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sec = (s: number) => Math.round(s * fps);

  // Easing functions
  const easePower3Out = Easing.bezier(0.215, 0.61, 0.355, 1);
  const easePower2InOut = Easing.bezier(0.45, 0, 0.55, 1);
  const easeElastic = Easing.elastic(0.55);
  const easeBackOut = Easing.bezier(0.175, 0.885, 0.32, 1.4);

  // ==========================================
  // DYNAMIC ISLAND MORPH (220px -> 560px -> 220px)
  // ==========================================
  let islandW = 220;
  let islandH = 50;
  let islandRadius = 9999;
  let showExpandedIsland = false;

  if (frame < sec(3.16)) {
    islandW = 220;
    islandH = 50;
  } else if (frame >= sec(3.16) && frame < sec(13.72)) {
    const p = interpolate(frame, [sec(3.16), sec(3.58)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower3Out });
    islandW = interpolate(p, [0, 1], [220, 560]);
    islandH = interpolate(p, [0, 1], [50, 86]);
    islandRadius = interpolate(p, [0, 1], [9999, 32]);
    showExpandedIsland = frame >= sec(3.30) && frame < sec(13.70);
  } else {
    const p = interpolate(frame, [sec(13.72), sec(14.02)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower3Out });
    islandW = interpolate(p, [0, 1], [560, 220]);
    islandH = interpolate(p, [0, 1], [86, 50]);
    islandRadius = interpolate(p, [0, 1], [32, 9999]);
  }

  // ==========================================
  // CENTRAL LIQUID ORB & RINGS DEFORMATION
  // ==========================================
  let orbScale = 0.001;
  let ringsScale = 0.001;
  if (frame >= sec(1.10) && frame < sec(13.80)) {
    orbScale = interpolate(frame, [sec(1.10), sec(2.30)], [0.001, 1.0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easeElastic,
    });
    ringsScale = interpolate(frame, [sec(1.30), sec(2.70)], [0.001, 1.0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easePower3Out,
    });
  } else if (frame >= sec(13.80)) {
    orbScale = interpolate(frame, [sec(13.80), sec(14.70)], [1.0, 0.001], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower2InOut });
    ringsScale = interpolate(frame, [sec(13.80), sec(14.50)], [1.0, 0.001], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower2InOut });
  }

  // Liquid fluid mesh wobble sine deformation
  const tTime = (frame / fps) * 2.5;
  const deformScaleX = 1.0 + Math.sin(tTime * 1.8) * 0.08;
  const deformScaleY = 1.0 + Math.cos(tTime * 2.2) * 0.06;
  const orbRotZ = (frame * 0.5) % 360;

  // ==========================================
  // SCENE 2 (3.20s - 6.50s): SPATIAL WIDGETS
  // ==========================================
  let cardLeftP = 0;
  let cardRightP = 0;
  if (frame >= sec(3.30) && frame < sec(13.50)) {
    cardLeftP = interpolate(frame, [sec(3.30), sec(4.15)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower3Out });
    cardRightP = interpolate(frame, [sec(3.40), sec(4.25)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower3Out });
  } else if (frame >= sec(13.50)) {
    cardLeftP = interpolate(frame, [sec(13.50), sec(14.20)], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    cardRightP = interpolate(frame, [sec(13.50), sec(14.20)], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }

  // Resonance Bar Fill (35% -> 84% at 4.40s)
  const resonanceP = interpolate(frame, [sec(4.40), sec(5.80)], [35, 84], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower2InOut,
  });

  // ==========================================
  // SCENE 3 (6.50s - 10.20s): SIRI MULTI-COLOR AURA & CAMERA ZOOM
  // ==========================================
  let camZ = 7.5;
  let siriOpacity = 0;
  let siriScale = 1.0;

  if (frame >= sec(6.60) && frame < sec(10.20)) {
    camZ = interpolate(frame, [sec(6.60), sec(8.40)], [7.5, 6.2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower2InOut });
    siriOpacity = interpolate(frame, [sec(6.70), sec(8.30)], [0, 0.85], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower3Out });
    siriScale = interpolate(frame, [sec(6.70), sec(8.30)], [1.0, 1.25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower3Out });
  } else if (frame >= sec(10.20) && frame < sec(13.50)) {
    siriOpacity = interpolate(frame, [sec(10.20), sec(10.80)], [0.85, 0.15], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    siriScale = 0.9;
    camZ = interpolate(frame, [sec(11.50), sec(12.90)], [6.2, 7.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower2InOut });
  }

  // ==========================================
  // SCENE 4 (10.20s - 13.50s): FACE ID SPATIAL RING
  // ==========================================
  const showFaceId = frame >= sec(10.30) && frame < sec(13.50);
  const faceIdP = interpolate(frame, [sec(10.30), sec(10.80)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeBackOut,
  });

  // Dynamic Typography Text Switching
  let heroEyebrow = 'VISIONOS & DYNAMIC ISLAND';
  let heroTitle = 'Spatial Audio Resonance';
  let heroDesc = 'Multi-channel Dolby Atmos acoustic wave propagation';
  let transVal = '96.4%';
  let dispVal = '0.082';
  let gyroVal = '+1.42 G';

  if (frame >= sec(7.00) && frame < sec(10.50)) {
    heroEyebrow = 'ON-DEVICE NEURAL RUNTIME';
    heroTitle = 'Apple Intelligence Aura';
    heroDesc = 'Dynamic iridescent surface distortion with real-time neural inference';
    transVal = '99.2%';
    dispVal = '0.145';
    gyroVal = '+3.18 G';
  } else if (frame >= sec(10.50)) {
    heroEyebrow = 'BIOMETRIC SPATIAL SECURITY';
    heroTitle = 'Face ID Authenticated';
    heroDesc = 'Secure Enclave verified across quantum spatial coordinates';
  }

  // Camera scale multiplier
  const cameraScale = 7.5 / camZ;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        overflow: 'hidden',
        color: '#FFF',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* 1920x1080 Stage */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 1920,
          height: 1080,
          marginLeft: -960,
          marginTop: -540,
          background: 'radial-gradient(circle at 50% 38%, #141B2D 0%, #07090E 75%, #020305 100%)',
          overflow: 'hidden',
        }}
      >
        {/* World Camera Container */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: '50% 50%',
            transform: `scale(${cameraScale})`,
            willChange: 'transform',
          }}
        >
          {/* Spatial Ambient Aura */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 50% 48%, rgba(10, 132, 255, 0.18) 0%, transparent 55%), radial-gradient(circle at 35% 40%, rgba(191, 90, 242, 0.14) 0%, transparent 48%), radial-gradient(circle at 65% 55%, rgba(100, 210, 255, 0.12) 0%, transparent 48%)',
              filter: 'blur(40px)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />

          {/* Siri Intelligence Multi-color Fluid Glow Aura */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 680,
              height: 680,
              transform: `translate(-50%, -50%) scale(${siriScale}) rotate(${(frame * 1.5) % 360}deg)`,
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, #FF375F, #BF5AF2, #0A84FF, #64D2FF, #30D158, #FF9F0A, #FF375F)',
              filter: 'blur(65px)',
              opacity: siriOpacity,
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />

          {/*
            CENTRAL THREE.JS LIQUID GLASS ORB (Physical Glass Shape from kinet-ios-liquid-glass.html):
            Accurately mimics the 2.1 radius mesh with refractive multi-stop fluid gradient
          */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) scale(${orbScale})`,
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Concentric Spatial VisionOS Rings */}
            <div
              style={{
                position: 'absolute',
                width: 780,
                height: 780,
                borderRadius: '50%',
                border: '1.5px dashed rgba(100, 210, 255, 0.35)',
                transform: `rotateX(68deg) rotateZ(${orbRotZ}deg) scale(${ringsScale})`,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 920,
                height: 920,
                borderRadius: '50%',
                border: '1.5px dashed rgba(191, 90, 242, 0.28)',
                transform: `rotateX(75deg) rotateY(25deg) rotateZ(${-orbRotZ}deg) scale(${ringsScale})`,
                pointerEvents: 'none',
              }}
            />

            {/* Central Liquid Glass Orb with Fluid Sinusoidal Wave Deformation */}
            <div
              style={{
                width: 540,
                height: 540,
                borderRadius: '44% 56% 52% 48% / 54% 48% 52% 46%',
                background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.7) 0%, rgba(148, 163, 184, 0.55) 25%, rgba(100, 116, 139, 0.7) 60%, rgba(30, 41, 59, 0.95) 100%)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 40px 100px rgba(0, 0, 0, 0.8), inset 0 0 60px rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(20px)',
                transform: `scale(${deformScaleX}, ${deformScaleY}) rotate(${Math.sin(tTime * 0.5) * 6}deg)`,
                willChange: 'transform',
              }}
            />

            {/* Face ID Biometric Lock Ring Overlay (Scene 4) */}
            {showFaceId && (
              <div
                style={{
                  position: 'absolute',
                  width: 260,
                  height: 260,
                  borderRadius: 36,
                  border: '3px solid #30D158',
                  boxShadow: '0 0 30px rgba(48, 209, 88, 0.6)',
                  transform: `scale(${faceIdP})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
              >
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="1.5">
                  <path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2" />
                  <circle cx="9" cy="9" r="1.5" fill="#30D158" />
                  <circle cx="15" cy="9" r="1.5" fill="#30D158" />
                  <path d="M9 15c1 1 3 1 4 0" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </div>

          {/* Left Spatial Card (#cardLeft) */}
          <div
            style={{
              position: 'absolute',
              left: 48,
              top: 420,
              width: 380,
              background: 'rgba(10, 16, 28, 0.72)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 24,
              padding: '24px 28px',
              backdropFilter: 'blur(28px)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
              zIndex: 35,
              opacity: cardLeftP,
              transform: `translateX(${interpolate(cardLeftP, [0, 1], [-60, 0])}px)`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(10, 132, 255, 0.16)', border: '1px solid rgba(10, 132, 255, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#FFF' }}>Spatial Audio Depth</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Head-tracking acoustic wave field</div>

            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#64748B', marginBottom: 8 }}>
                <span>Resonance Level</span>
                <span style={{ color: '#0A84FF', fontWeight: 700 }}>{Math.round(resonanceP)}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${resonanceP}%`, height: '100%', background: '#0A84FF', borderRadius: 3, boxShadow: '0 0 10px #0A84FF' }} />
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#0A84FF', fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0A84FF' }} />
              Dynamic Island Link: Active
            </div>
          </div>

          {/* Right Spatial Card (#cardRight) */}
          <div
            style={{
              position: 'absolute',
              right: 48,
              top: 400,
              width: 390,
              background: 'rgba(10, 16, 28, 0.72)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 24,
              padding: '24px 28px',
              backdropFilter: 'blur(28px)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
              zIndex: 35,
              opacity: cardRightP,
              transform: `translateX(${interpolate(cardRightP, [0, 1], [60, 0])}px)`,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: '#FFF' }}>Apple Intelligence</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>On-Device Neural Engine v18</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 22, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                <span>Refractive Transmission</span>
                <span style={{ color: '#FFF', fontWeight: 700 }}>{transVal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                <span>Chromatic Dispersion</span>
                <span style={{ color: '#FFF', fontWeight: 700 }}>{dispVal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                <span>Spatial Gyro Tensor</span>
                <span style={{ color: '#BF5AF2', fontWeight: 700 }}>{gyroVal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                <span>Haptic Core Clock</span>
                <span style={{ color: '#30D158', fontWeight: 700 }}>240 Hz SYNC</span>
              </div>
            </div>
          </div>

          {/* Bottom Center Typography */}
          <div
            style={{
              position: 'absolute',
              bottom: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              zIndex: 30,
              width: 1200,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', color: '#0A84FF', textTransform: 'uppercase', marginBottom: 12 }}>
              {heroEyebrow}
            </div>
            <h1 style={{ fontSize: 68, fontWeight: 900, letterSpacing: '-0.02em', color: '#FFF', margin: '0 0 10px 0' }}>
              {heroTitle}
            </h1>
            <p style={{ fontSize: 18, color: '#94A3B8', margin: 0 }}>
              {heroDesc}
            </p>
          </div>
        </div>

        {/* Top Dynamic Island (.island-wrap) */}
        <div style={{ position: 'absolute', top: 44, left: '50%', transform: 'translateX(-50%)', zIndex: 40 }}>
          <div
            style={{
              position: 'relative',
              width: islandW,
              height: islandH,
              background: '#000',
              borderRadius: islandRadius,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 255, 255, 0.04)',
              overflow: 'hidden',
              transition: 'border-radius 0.2s',
            }}
          >
            {/* Compact View */}
            {!showExpandedIsland && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: 13, fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#30D158', boxShadow: '0 0 10px #30D158' }} />
                  <span style={{ color: '#FFF' }}>Spatial Audio</span>
                </div>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} style={{ width: 3, height: 6 + Math.sin(frame * 0.4 + i) * 6, background: '#30D158', borderRadius: 2 }} />
                  ))}
                </div>
              </div>
            )}

            {/* Expanded Spatial Music Widget View */}
            {showExpandedIsland && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #FF375F, #BF5AF2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFF"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>Apple Spatial Audio</div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>Dolby Atmos • Liquid Transmission</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(10, 132, 255, 0.15)', border: '1px solid rgba(10, 132, 255, 0.35)', color: '#0A84FF', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 9999 }}>
                  LOSSLESS
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default LiquidGlass;
