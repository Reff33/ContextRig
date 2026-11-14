import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { ThreeLiquidOrb } from './ThreeLiquidOrb';

/**
 * LiquidGlass — 100% Exact Faithful Remotion Port of `assets/kinet-ios-liquid-glass.html`.
 * Matches HTML5/Three.js/GSAP physical transmission glass, exact colors, and spatial UI layout.
 */
export type LiquidGlassProps = {
  primaryColor?: string;
  accentPurple?: string;
  backgroundColor?: string;
  showCards?: boolean;
};

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  primaryColor = '#0A84FF',
  accentPurple = '#BF5AF2',
  backgroundColor = '#020305',
  showCards = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sec = (s: number) => Math.round(s * fps);

  // Easing curves matching GSAP
  const easePower3Out = Easing.bezier(0.215, 0.61, 0.355, 1);
  const easePower2InOut = Easing.bezier(0.45, 0, 0.55, 1);
  const easeElastic = Easing.elastic(0.55);
  const easeBackOut = Easing.bezier(0.175, 0.885, 0.32, 1.4);

  // 1. Dynamic Island Morph (220px x 50px -> 560px x 86px -> 220px)
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

  // 2. Liquid Orb Mesh Scale (Exact timing from kinet-ios-liquid-glass.html)
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

  // Orb Material Roughness (0.08 -> 0.02 at 8.5s)
  const roughness = frame >= sec(8.50) ? 0.02 : 0.08;

  // 3. Left & Right Cards
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

  // 4. Siri Iridescent Fluid Aura Glow (Starts at 6.70s -> 10.20s)
  let siriOpacity = 0;
  let siriScale = 1.0;
  if (frame >= sec(6.70) && frame < sec(10.20)) {
    siriOpacity = interpolate(frame, [sec(6.70), sec(8.30)], [0, 0.85], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower3Out });
    siriScale = interpolate(frame, [sec(6.70), sec(8.30)], [1.0, 1.25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower3Out });
  } else if (frame >= sec(10.20) && frame < sec(13.50)) {
    siriOpacity = interpolate(frame, [sec(10.20), sec(10.80)], [0.85, 0.15], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    siriScale = 0.9;
  }

  // 5. Face ID Biometric Spatial Lock (Scene 4: 10.30s - 13.50s)
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
  let hapticVal = '240 Hz SYNC';

  if (frame >= sec(7.00) && frame < sec(10.50)) {
    heroEyebrow = 'ON-DEVICE NEURAL RUNTIME';
    heroTitle = 'Apple Intelligence Aura';
    heroDesc = 'Dynamic iridescent surface distortion with real-time neural inference';
    transVal = '99.2%';
    dispVal = '0.145';
    gyroVal = '+3.18 G';
    hapticVal = '240 Hz SYNC';
  } else if (frame >= sec(10.50)) {
    heroEyebrow = 'BIOMETRIC SPATIAL SECURITY';
    heroTitle = 'Face ID Authenticated';
    heroDesc = 'Secure Enclave verified across quantum spatial coordinates';
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        overflow: 'hidden',
        color: '#FFF',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* 1920x1080 Stage with Exact Radial Background */}
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

        {/* Siri Multi-color Fluid Glow Aura (Behind the liquid orb) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 720,
            height: 720,
            transform: `translate(-50%, -50%) scale(${siriScale})`,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #FF375F, #BF5AF2, #0A84FF, #64D2FF, #30D158, #FF9F0A, #FF375F)',
            filter: 'blur(75px)',
            opacity: siriOpacity,
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />

        {/* REAL THREE.JS PHYSICAL GLASS LIQUID ORB (Exact match to kinet-ios-liquid-glass.html) */}
        <ThreeLiquidOrb
          frame={frame}
          fps={fps}
          orbScale={orbScale}
          ringsScale={ringsScale}
          roughness={roughness}
        />

        {/* Face ID Biometric Spatial Ring (Scene 4) */}
        {showFaceId && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 260,
              height: 260,
              borderRadius: 48,
              border: '2px dashed rgba(100, 210, 255, 0.5)',
              boxShadow: '0 0 40px rgba(100, 210, 255, 0.25)',
              transform: `translate(-50%, -50%) scale(${faceIdP})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#64D2FF" strokeWidth="1.5">
              <path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2" />
              <circle cx="9" cy="9" r="1.5" fill="#64D2FF" />
              <circle cx="15" cy="9" r="1.5" fill="#64D2FF" />
              <path d="M9 15c1 1 3 1 4 0" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {/* Left Spatial Glass Card */}
        {showCards && (
          <div
            style={{
              position: 'absolute',
              left: 80,
              top: '50%',
              width: 380,
              padding: 28,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 28,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
              zIndex: 20,
              opacity: cardLeftP,
              transform: `translateY(-50%) translateX(${interpolate(cardLeftP, [0, 1], [-60, 0])}px)`,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(10, 132, 255, 0.18)',
                border: '1px solid rgba(10, 132, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0A84FF',
                marginBottom: 16,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Spatial Audio Depth</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#8E8E93', marginBottom: 22 }}>Head-tracking acoustic wave field</div>

            <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 9999, overflow: 'hidden', marginBottom: 10 }}>
              <div
                style={{
                  width: `${resonanceP}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0A84FF, #64D2FF)',
                  borderRadius: 9999,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#8E8E93', marginBottom: 12 }}>
              <span>Resonance Level</span>
              <span style={{ color: '#FFF', fontWeight: 700 }}>{Math.round(resonanceP)}%</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#0A84FF', fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0A84FF' }} />
              Dynamic Island Link: Active
            </div>
          </div>
        )}

        {/* Right Spatial Glass Card */}
        {showCards && (
          <div
            style={{
              position: 'absolute',
              right: 80,
              top: '50%',
              width: 380,
              padding: 28,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 28,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
              zIndex: 20,
              opacity: cardRightP,
              transform: `translateY(-50%) translateX(${interpolate(cardRightP, [0, 1], [60, 0])}px)`,
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Apple Intelligence</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#8E8E93', marginBottom: 20 }}>On-Device Neural Engine v18</div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93' }}>Refractive Transmission</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{transVal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93' }}>Chromatic Dispersion</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{dispVal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93' }}>Spatial Gyro Tensor</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{gyroVal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93' }}>Haptic Core Clock</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#30D158', fontFamily: "'JetBrains Mono', monospace" }}>{hapticVal}</span>
              </div>
            </div>
          </div>
        )}

        {/* Center Stage Typography */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 100,
            transform: 'translateX(-50%)',
            textAlign: 'center',
            zIndex: 25,
            width: 1200,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.28em', color: primaryColor, textTransform: 'uppercase', marginBottom: 14 }}>
            {heroEyebrow}
          </div>
          <h1 style={{ fontSize: 64, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff', textShadow: '0 4px 30px rgba(0,0,0,0.5)', minHeight: 80, margin: '0 0 10px 0' }}>
            {heroTitle}
          </h1>
          <p style={{ fontSize: 17, fontWeight: 500, color: '#8E8E93', margin: 0 }}>
            {heroDesc}
          </p>
        </div>

        {/* Top Dynamic Island */}
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
              boxSizing: 'border-box',
            }}
          >
            {/* Compact View: Single Row Text & Waveform */}
            {!showExpandedIsland && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#30D158', boxShadow: '0 0 8px #30D158' }} />
                  <span style={{ color: '#FFF', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>SPATIAL INTELLIGENCE</span>
                </div>
                <div style={{ display: 'flex', gap: 2.5, alignItems: 'center', height: 14 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 2.5,
                        height: 5 + Math.sin(frame * 0.4 + i) * 4,
                        background: '#30D158',
                        borderRadius: 1.5,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Expanded Spatial Music Widget View */}
            {showExpandedIsland && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 58, height: 58, borderRadius: 14, background: 'linear-gradient(135deg, #FF375F, #BF5AF2)', boxShadow: '0 4px 16px rgba(255, 55, 95, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="#FFF"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>Apple Spatial Audio</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#8E8E93' }}>Dolby Atmos • Liquid Transmission</div>
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
