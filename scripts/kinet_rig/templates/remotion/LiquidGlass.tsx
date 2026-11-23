import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { ThreeLiquidOrb } from './ThreeLiquidOrb';
import { GlassCapture } from './GlassCapture';
import { GlassBackdrop } from './GlassBackdrop';

// Cards are vertically centred and size to their own content; no fixed height.


/**
 * LiquidGlass — 100% Exact Faithful Remotion Port of `assets/kinet-ios-liquid-glass.html`.
 * Matches HTML5/Three.js/GSAP physical transmission glass, exact colors, and spatial UI layout.
 */
export type LiquidGlassProps = {
  primaryColor?: string;
  accentPurple?: string;
  backgroundColor?: string;
  showCards?: boolean;
  // Per-layer toggles (Modular Layer Decoupling Law).
  showOrb?: boolean;
  showFaceId?: boolean;
  showText?: boolean;
  showIsland?: boolean;
  // Content offsets so text/cards can be repositioned without touching the animation.
  textOffset?: { x?: number; y?: number };
  islandOffset?: { x?: number; y?: number };
};

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  primaryColor = '#0A84FF',
  accentPurple = '#BF5AF2',
  backgroundColor = '#020305',
  showCards = true,
  showOrb = true,
  showFaceId: showFaceIdLayer = true,
  showText = true,
  showIsland = true,
  textOffset,
  islandOffset,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Snapshot canvas produced by <GlassCapture>; cards sample their glass from it.
  const glassRef = React.useRef<HTMLCanvasElement | null>(null);
  const [glassVersion, setGlassVersion] = React.useState(0);
  const setGlassSource = React.useCallback((c: HTMLCanvasElement) => {
    glassRef.current = c;
    setGlassVersion((v) => v + 1);
  }, []);
  const getGlass = React.useCallback(() => glassRef.current, []);

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
    // orb + rings scale
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

  // Camera Z: Exactly 7.5 throughout Scene 1 & 2, gentle push to 6.2 in Scene 3 (6.6s -> 10.2s)
  let camZ = 7.5;
  if (frame >= sec(6.60) && frame < sec(10.20)) {
    camZ = interpolate(frame, [sec(6.60), sec(8.40)], [7.5, 6.2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower2InOut });
  } else if (frame >= sec(11.50) && frame < sec(12.90)) {
    camZ = interpolate(frame, [sec(11.50), sec(12.90)], [6.2, 7.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower2InOut });
  } else if (frame >= sec(10.20) && frame < sec(11.50)) {
    camZ = 6.2;
  }

  // 3. Left & Right Cards
  let cardLeftP = 0;
  let cardRightP = 0;
  if (frame >= sec(3.30) && frame < sec(13.50)) {
    cardLeftP = interpolate(frame, [sec(3.30), sec(4.45)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower2InOut });
    cardRightP = interpolate(frame, [sec(3.40), sec(4.55)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower2InOut });
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
  const faceIdP = interpolate(frame, [sec(10.30), sec(10.80)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeBackOut,
  });

  // Dynamic Typography Text Switching — static during Scene 1 (matches original),
  // then fade-in + slide-up only when the text actually switches (7.00s / 10.50s)
  const textSwitches = [sec(7.00), sec(10.50)];
  const switchStart = textSwitches.filter((f) => frame >= f).pop();
  const textP = switchStart === undefined ? 1 : interpolate(frame, [switchStart, switchStart + Math.round(0.62 * fps)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });
  const textOpacity = textP;
  const textShift = interpolate(textP, [0, 1], [26, 0]);

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
      {/* 1920x1080 Stage. Uses inset:0 rather than centering with negative margins —
          transforms/offsets on the ancestor kill backdrop-filter sampling in Chrome. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: 1920,
          height: 1080,
          background: 'radial-gradient(circle at 50% 38%, #141B2D 0%, #07090E 75%, #020305 100%)',
          overflow: 'hidden',
        }}
      >
        {/* Layer 1 — Aura & Liquid Orb (background composite) */}
        {showOrb && <Sequence name="1 · Aura & Orb" from={0} durationInFrames={Infinity} layout="none">
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
            transform: `translate(-50%, -50%) scale(${siriScale}) rotate(${(frame * 1.5) % 360}deg)`,
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
          camZ={camZ}
        />

        {/* Siri aura sits behind the orb here; the card glass samples the finished composite
            (aura + orb) via <GlassBackdrop>, because backdrop-filter is inert in this renderer. */}
        {showCards && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }}>
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 720,
                height: 720,
                transform: `translate(-50%, -50%) scale(${siriScale}) rotate(${(frame * 1.5) % 360}deg)`,
                borderRadius: '50%',
                background: 'conic-gradient(from 0deg, #FF375F, #BF5AF2, #0A84FF, #64D2FF, #30D158, #FF9F0A, #FF375F)',
                filter: 'blur(75px)',
                opacity: siriOpacity,
              }}
            />
          </div>
        )}

        </Sequence>
        }

        {/* Layer 2 — Face ID Biometric Ring */}
        {showFaceIdLayer && <Sequence name="2 · Face ID" from={0} durationInFrames={Infinity} layout="none">
        {/* Face ID Biometric Spatial Glyph (Scene 4) — matches .face-id-ring in the HTML */}
        {frame >= sec(10.30) && frame < sec(13.50) && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 260,
              height: 260,
              marginLeft: -130,
              marginTop: -130,
              borderRadius: 48,
              border: '2px dashed rgba(100, 210, 255, 0.5)',
              boxShadow: '0 0 40px rgba(100, 210, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: faceIdP,
              transform: `scale(${0.6 + faceIdP * 0.4})`,
              zIndex: 30,
              pointerEvents: 'none',
            }}
          >
            <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#64D2FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M9 9h.01M15 9h.01M10 14a3.5 3.5 0 0 0 4 0" />
            </svg>
          </div>
        )}
        </Sequence>
        }

        {/* Layer 3 — Glass Cards */}
        {showCards && <Sequence name="3 · Glass Cards" from={0} durationInFrames={Infinity} layout="none">
        <GlassCapture
          frame={frame}
          onReady={setGlassSource}
          siri={{ opacity: siriOpacity, scale: siriScale, rotation: ((frame * 1.5) % 360) * (Math.PI / 180) }}
        />

        {/* Left Card — Spatial Audio Depth */}
        <div
          style={{
            position: 'absolute',
            left: 80,
            top: '50%',
            translate: '0 -50%',
            width: 380,
            borderRadius: 28,
            background: 'rgba(12, 16, 26, 0.34)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxSizing: 'border-box',
            padding: 26,
            overflow: 'hidden',
            opacity: cardLeftP,
            transform: `translateX(${(1 - cardLeftP) * -60}px)`,
            zIndex: 6,
          }}
        >
          <GlassBackdrop key={`left-${frame}-${glassVersion}`} rect={{ x: 80, y: 0, w: 380, h: 0 }} blur={26} sourceCanvas={getGlass} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(10, 132, 255, 0.16)',
                border: '1px solid rgba(10, 132, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            </div>

            <div style={{ marginTop: 18, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Spatial Audio Depth</div>
            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 500, color: '#8E8E93' }}>Head-tracking acoustic wave field</div>

            <div style={{ marginTop: 26, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#8E8E93' }}>
              <span>Resonance Level</span>
              <span style={{ color: '#FFF' }}>{Math.round(resonanceP)}%</span>
            </div>
            <div style={{ marginTop: 8, height: 6, borderRadius: 9999, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${resonanceP}%`,
                  height: '100%',
                  borderRadius: 9999,
                  background: `linear-gradient(90deg, ${primaryColor}, ${accentPurple})`,
                }}
              />
            </div>

            <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, color: '#64D2FF' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#64D2FF', boxShadow: '0 0 8px #64D2FF' }} />
              Dynamic Island Link: Active
            </div>
          </div>
        </div>

        {/* Right Card — Apple Intelligence */}
        <div
          style={{
            position: 'absolute',
            left: 1920 - 80 - 380,
            top: '50%',
            translate: '0 -50%',
            width: 380,
            borderRadius: 28,
            background: 'rgba(12, 16, 26, 0.34)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxSizing: 'border-box',
            padding: 26,
            overflow: 'hidden',
            opacity: cardRightP,
            transform: `translateX(${(1 - cardRightP) * 60}px)`,
            zIndex: 6,
          }}
        >
          <GlassBackdrop key={`right-${frame}-${glassVersion}`} rect={{ x: 1920 - 80 - 380, y: 0, w: 380, h: 0 }} blur={26} sourceCanvas={getGlass} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Apple Intelligence</div>
            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 500, color: '#8E8E93' }}>On-Device Neural Engine v18</div>

            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                ['Refractive Transmission', transVal, '#FFF'],
                ['Chromatic Dispersion', dispVal, '#FFF'],
                ['Spatial Gyro Tensor', gyroVal, '#FFF'],
                ['Haptic Core Clock', hapticVal, '#30D158'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500 }}>
                  <span style={{ color: '#8E8E93' }}>{label}</span>
                  <span style={{ color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </Sequence>
        }

        {/* Layer 4 — Typography */}
        {showText && <Sequence name="4 · Typography" from={0} durationInFrames={Infinity} layout="none">
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 180,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            opacity: textOpacity,
            translate: `${textOffset?.x ?? 0}px ${(textOffset?.y ?? 0) + textShift}px`,
            zIndex: 7,
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.24em', color: primaryColor }}>{heroEyebrow}</div>
          <div style={{ marginTop: 14, fontSize: 64, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}>{heroTitle}</div>
          <div style={{ marginTop: 14, fontSize: 18, fontWeight: 500, color: '#8E8E93' }}>{heroDesc}</div>
        </div>
        </Sequence>
        }

        {/* Layer 5 — Dynamic Island */}
        {showIsland && <Sequence name="5 · Dynamic Island" from={0} durationInFrames={Infinity} layout="none">
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 60,
            width: islandW,
            height: islandH,
            marginLeft: -islandW / 2,
            borderRadius: islandRadius,
            background: '#000',
            border: '1px solid rgba(255,255,255,0.08)',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: showExpandedIsland ? 14 : '0 20px',
            translate: `${islandOffset?.x ?? 0}px ${islandOffset?.y ?? 0}px`,
            zIndex: 10,
          }}
        >
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Compact Spatial Fluid View */}
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
                  <span style={{ color: '#FFF', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>Spatial Fluid</span>
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
        </Sequence>
        }
      </div>
    </AbsoluteFill>
  );
};

export default LiquidGlass;
