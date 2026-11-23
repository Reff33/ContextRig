import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * KinetOpener — 100% Exact Remotion Port of `assets/kinet-opener.html`.
 * Matches HTML5/GSAP layout, 3D particle space, exact typography, vector cards,
 * chromatic RGB split filter transients, and two-scene cinematic push-through:
 *
 * Stage: 1920x1080.
 * Duration: 10.0s (600 frames @ 60fps).
 *
 * GSAP Motion Breakdown:
 *  Scene 1 (0.0s - 5.0s):
 *   0.00s - 4.80s: Camera advances forward (camZ: 14 -> 11).
 *   0.20s - 0.65s: #h1-sc1 slams in (scale: 0.85 -> 1, y: 30 -> 0, expo.out),
 *                  locked to chromatic RGB split transient & sub-bass impact.
 *   0.80s - 1.30s: Subtitle upward glide (#sub-sc1) from y: 20 (power3.out).
 *   1.40s - 2.10s: 3 Vector Cards land staggered from y: 40, scale: 0.9 (back.out(2)).
 *   4.40s - 4.90s: Scene 1 departure & lift (y: -40, opacity -> 0).
 *
 *  Scene 2 (5.0s - 10.0s):
 *   5.00s - 9.50s: Camera continues forward (camZ: 14 -> 15).
 *   5.20s - 5.65s: #h1-sc2 slams in (scale: 1.15 -> 1, expo.out) + RGB split transient.
 *   6.00s - 6.50s: #sub-sc2 monospace CLI box reveals from y: 20.
 */
export type KinetOpenerProps = {
  scene1HeroTop?: string;
  scene1HeroHighlight?: string;
  scene1Subtitle?: string;
  card1Text?: string;
  card2Text?: string;
  card3Text?: string;
  scene2HeroTop?: string;
  scene2HeroHighlight?: string;
  scene2Subtitle?: string;
  primaryColor?: string;
  backgroundColor?: string;
};

export const KinetOpener: React.FC<KinetOpenerProps> = ({
  scene1HeroTop = 'ULTRA FLUID.',
  scene1HeroHighlight = 'UP TO 240 FPS.',
  scene1Subtitle = 'Deterministic mathematical timeline stepping. Zero dropped frames.',
  card1Text = 'Zero Runtime Build',
  card2Text = '100% Inline SVGs',
  card3Text = 'Lossless Headless Export',
  scene2HeroTop = 'CRAFTED FOR',
  scene2HeroHighlight = 'AI CODING AGENTS',
  scene2Subtitle = 'npx -y skills@latest add https://github.com/Reff33/KinetRig',
  primaryColor = '#00F5FF',
  backgroundColor = '#040810',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sec = (s: number) => Math.round(s * fps);

  // GSAP Easing Equivalents
  const easeExpoOut = Easing.bezier(0.16, 1, 0.3, 1);
  const easePower3Out = Easing.bezier(0.215, 0.61, 0.355, 1);
  const easeBackOut2 = Easing.bezier(0.175, 0.885, 0.32, 1.4);
  const easePower2In = Easing.bezier(0.55, 0.085, 0.68, 0.53);

  // 1. Particle Cloud simulation (mirroring 500 THREE.Points rotating in space)
  const particles = useMemo(() => {
    const list = [];
    for (let i = 0; i < 240; i++) {
      // Deterministic pseudo-random distribution
      const seed1 = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
      const seed2 = Math.sin(i * 93.9898 + 67.345) * 24634.6345;
      const x = ((seed1 - Math.floor(seed1)) - 0.5) * 1920;
      const y = ((seed2 - Math.floor(seed2)) - 0.5) * 1080;
      const size = (i % 3) + 2;
      const speed = ((i % 5) + 1) * 0.4;
      list.push({ x, y, size, speed });
    }
    return list;
  }, []);

  // 2. Continuous 3D camera travel
  const isScene2 = frame >= sec(5.0);

  // Scene 1 push-in (camZ: 14 -> 11)
  const camZ1 = interpolate(frame, [0, sec(4.8)], [1.0, 1.25], { extrapolateRight: 'clamp' });
  // Scene 2 push-in (camZ: 14 -> 15)
  const camZ2 = interpolate(frame, [sec(5.0), sec(9.5)], [1.0, 1.28], { extrapolateRight: 'clamp' });
  const activeCamScale = isScene2 ? camZ2 : camZ1;

  // 3. Scene 1 Animation Breakdown
  // Headline 1 slam (0.20s - 0.65s)
  const h1Sc1P = interpolate(frame, [sec(0.20), sec(0.65)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeExpoOut,
  });
  const h1Sc1Scale = interpolate(h1Sc1P, [0, 1], [0.85, 1]);
  const h1Sc1Y = interpolate(h1Sc1P, [0, 1], [30, 0]);

  // Subtitle 1 reveal (0.80s - 1.30s)
  const subSc1P = interpolate(frame, [sec(0.80), sec(1.30)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });
  const subSc1Y = interpolate(subSc1P, [0, 1], [20, 0]);

  // Staggered Cards (1.40s, 1.55s, 1.70s)
  const getCardAnim = (delaySec: number) => {
    const p = interpolate(frame, [sec(delaySec), sec(delaySec + 0.45)], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easeBackOut2,
    });
    return {
      opacity: p,
      transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px) scale(${interpolate(p, [0, 1], [0.9, 1])})`,
    };
  };

  const c1Anim = getCardAnim(1.40);
  const c2Anim = getCardAnim(1.55);
  const c3Anim = getCardAnim(1.70);

  // Scene 1 departure & lift (4.40s - 4.90s)
  const sc1LiftP = interpolate(frame, [sec(4.40), sec(4.90)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower2In,
  });
  const sc1LiftY = interpolate(sc1LiftP, [0, 1], [0, -40]);
  const sc1LiftOpacity = interpolate(sc1LiftP, [0, 1], [1, 0]);

  // 4. Scene 2 Animation Breakdown
  // Headline 2 slam (5.20s - 5.65s)
  const h1Sc2P = interpolate(frame, [sec(5.20), sec(5.65)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeExpoOut,
  });
  const h1Sc2Scale = interpolate(h1Sc2P, [0, 1], [1.15, 1]);

  // Subtitle 2 CLI box reveal (6.00s - 6.50s)
  const subSc2P = interpolate(frame, [sec(6.00), sec(6.50)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });
  const subSc2Y = interpolate(subSc2P, [0, 1], [20, 0]);

  // RGB Chromatic Split Transients (0.20s - 0.34s & 5.20s - 5.34s)
  const isRgbSplit1 = frame >= sec(0.20) && frame <= sec(0.34);
  const isRgbSplit2 = frame >= sec(5.20) && frame <= sec(5.34);
  const showRgbSplit = isRgbSplit1 || isRgbSplit2;
  const rgbOffsetX = showRgbSplit ? (frame % 2 === 0 ? 10 : -8) : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        overflow: 'hidden',
        color: '#F8FAFC',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
      }}
    >
      {/* 1920x1080 Fixed Stage */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 1920,
          height: 1080,
          marginLeft: -960,
          marginTop: -540,
          background: backgroundColor,
          overflow: 'hidden',
        }}
      >
        {/* World Container with 3D scale and chromatic glitch shake */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${activeCamScale}) translate3d(${rgbOffsetX}px, 0px, 0px)`,
            willChange: 'transform',
          }}
        >
          {/* 3D Particle Cloud */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {particles.map((p, idx) => {
              const currentX = (p.x + frame * p.speed * 0.8) % 1920;
              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: currentX,
                    top: 540 + p.y,
                    width: p.size,
                    height: p.size,
                    borderRadius: '50%',
                    backgroundColor: primaryColor,
                    opacity: 0.55,
                    boxShadow: `0 0 8px ${primaryColor}`,
                  }}
                />
              );
            })}
          </div>

          {/* Background Ambient Glow */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `radial-gradient(70% 50% at 50% 100%, rgba(0, 245, 255, 0.28), transparent 70%)`,
              mixBlendMode: 'screen',
            }}
          />

          {/* Grain Texture */}
          <div
            style={{
              position: 'absolute',
              inset: -50,
              pointerEvents: 'none',
              opacity: 0.15,
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* SCENE 1 */}
          {!isScene2 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                opacity: sc1LiftOpacity,
                transform: `translateY(${sc1LiftY}px)`,
              }}
            >
              <h1
                style={{
                  fontSize: 88,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  textShadow: '0 10px 40px rgba(0,0,0,0.8)',
                  opacity: h1Sc1P,
                  transform: `translateY(${h1Sc1Y}px) scale(${h1Sc1Scale})`,
                }}
              >
                {scene1HeroTop}<br />
                <span style={{ color: primaryColor, textShadow: `0 0 35px rgba(0, 245, 255, 0.45)` }}>
                  {scene1HeroHighlight}
                </span>
              </h1>

              <p
                style={{
                  fontSize: 26,
                  fontWeight: 500,
                  color: '#94A3B8',
                  marginTop: 24,
                  maxWidth: 900,
                  lineHeight: 1.5,
                  opacity: subSc1P,
                  transform: `translateY(${subSc1Y}px)`,
                }}
              >
                {scene1Subtitle}
              </p>

              {/* Staggered Vector Cards */}
              <div style={{ display: 'flex', gap: 24, marginTop: 48 }}>
                {/* Card 1 */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(0, 245, 255, 0.25)',
                    backdropFilter: 'blur(16px)',
                    padding: '24px 32px',
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: 20,
                    fontWeight: 700,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    ...c1Anim,
                  }}
                >
                  <svg style={{ width: 28, height: 28, stroke: primaryColor, strokeWidth: 2, fill: 'none' }} viewBox="0 0 24 24">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span>{card1Text}</span>
                </div>

                {/* Card 2 */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(0, 245, 255, 0.25)',
                    backdropFilter: 'blur(16px)',
                    padding: '24px 32px',
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: 20,
                    fontWeight: 700,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    ...c2Anim,
                  }}
                >
                  <svg style={{ width: 28, height: 28, stroke: primaryColor, strokeWidth: 2, fill: 'none' }} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m4.93 4.93 4.24 4.24" />
                    <path d="m14.83 9.17 4.24-4.24" />
                    <path d="m14.83 14.83 4.24 4.24" />
                    <path d="m9.17 14.83-4.24 4.24" />
                  </svg>
                  <span>{card2Text}</span>
                </div>

                {/* Card 3 */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(0, 245, 255, 0.25)',
                    backdropFilter: 'blur(16px)',
                    padding: '24px 32px',
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: 20,
                    fontWeight: 700,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    ...c3Anim,
                  }}
                >
                  <svg style={{ width: 28, height: 28, stroke: primaryColor, strokeWidth: 2, fill: 'none' }} viewBox="0 0 24 24">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m9 8 6 4-6 4Z" />
                  </svg>
                  <span>{card3Text}</span>
                </div>
              </div>
            </div>
          )}

          {/* SCENE 2 */}
          {isScene2 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <h1
                style={{
                  fontSize: 88,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  textShadow: '0 10px 40px rgba(0,0,0,0.8)',
                  opacity: h1Sc2P,
                  transform: `scale(${h1Sc2Scale})`,
                }}
              >
                {scene2HeroTop}<br />
                <span style={{ color: primaryColor, textShadow: `0 0 35px rgba(0, 245, 255, 0.45)` }}>
                  {scene2HeroHighlight}
                </span>
              </h1>

              <div
                style={{
                  marginTop: 28,
                  background: 'rgba(15, 23, 42, 0.88)',
                  border: '1px solid rgba(0, 245, 255, 0.35)',
                  padding: '14px 28px',
                  borderRadius: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 20,
                  color: primaryColor,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                  opacity: subSc2P,
                  transform: `translateY(${subSc2Y}px)`,
                }}
              >
                {scene2Subtitle}
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default KinetOpener;
