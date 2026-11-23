import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * ReelHook — 100% Exact Remotion Port of `assets/kinet-reel-hook.html`.
 * High-retention social hook with urgent alert slam, chromatic mood shift (Red -> Violet),
 * radial bloom pulse wave, kinetic word slams, stat card drop-in, and sticker tags.
 */
export type ReelHookProps = {
  badgeText?: string;
  word1?: string;
  word2?: string;
  word3?: string;
  word4?: string;
  word5?: string;
  statValue?: number;
  statLabel?: string;
  sticker1?: string;
  sticker2?: string;
  urgentColor?: string;
  accentColor?: string;
  primaryColor?: string;
};

export const ReelHook: React.FC<ReelHookProps> = ({
  badgeText = 'HIGH RETENTION HOOK',
  word1 = 'Stop',
  word2 = 'Scrolling.',
  word3 = 'Watch',
  word4 = 'This',
  word5 = 'Move.',
  statValue = 18.5,
  statLabel = 'Organic Video Impressions',
  sticker1 = '100% RETENTION',
  sticker2 = '60 FPS',
  urgentColor = '#FF1E40',
  accentColor = '#FFE600',
  primaryColor = '#FF2E93',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sec = (s: number) => Math.round(s * fps);

  // Easing functions matching GSAP
  const easeBackOut2 = Easing.bezier(0.175, 0.885, 0.32, 1.4);
  const easeBackOut22 = Easing.bezier(0.175, 0.885, 0.32, 1.6);
  const easePower2InOut = Easing.bezier(0.45, 0, 0.55, 1);
  const easePower3Out = Easing.bezier(0.215, 0.61, 0.355, 1);

  // 1. Badge Slam (0.15s - 0.60s)
  const badgeP = interpolate(frame, [sec(0.15), sec(0.60)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeBackOut2,
  });

  // 2. Kinetic Words (0.35s + i * 0.08s)
  const words = [word1, word2, word3, word4, word5];
  const wordAnims = words.map((_, i) => {
    const start = sec(0.35 + i * 0.08);
    const p = interpolate(frame, [start, start + sec(0.38)], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easeBackOut2,
    });
    return {
      opacity: p,
      transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px) scale(${interpolate(p, [0, 1], [0.8, 1])})`,
    };
  });

  // 3. Chromatic Shift (0.75s - 1.40s) Red -> White/Violet
  const colorShiftP = interpolate(frame, [sec(0.75), sec(1.40)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower2InOut,
  });
  const hookTextColor = interpolate(colorShiftP, [0, 1], [0, 1]) > 0.5 ? '#FFFFFF' : urgentColor;

  // 4. Bloom Wave Expansion (0.72s - 1.60s)
  const bloomScale = interpolate(frame, [sec(0.72), sec(1.22), sec(1.60)], [0.4, 1.4, 1.9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bloomOpacity = interpolate(frame, [sec(0.72), sec(1.22), sec(1.60)], [0, 0.8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 5. Stat Card drop-in (0.95s - 1.60s)
  const cardP = interpolate(frame, [sec(0.95), sec(1.60)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });

  // 6. Animated Counter (1.05s - 2.85s)
  const countP = interpolate(frame, [sec(1.05), sec(2.85)], [0, statValue], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  // 7. Stickers pop (1.45s and 1.59s)
  const sticker1P = interpolate(frame, [sec(1.45), sec(1.90)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeBackOut22,
  });
  const sticker2P = interpolate(frame, [sec(1.59), sec(2.04)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeBackOut22,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#060408',
        overflow: 'hidden',
        color: '#FFF',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
      }}
    >
      {/* Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: colorShiftP > 0.5
            ? 'radial-gradient(circle at 50% 45%, #1F0D2E 0%, #0D0A16 65%, #06050A 100%)'
            : 'radial-gradient(circle at 50% 45%, #250810 0%, #0A0407 65%, #050204 100%)',
          transition: 'background 0.8s ease',
        }}
      />

      {/* Radial Bloom Wave */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '45%',
          transform: `translate(-50%, -50%) scale(${bloomScale})`,
          width: 1200,
          height: 1200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 46, 147, 0.35) 0%, rgba(255, 230, 0, 0.15) 40%, transparent 70%)',
          pointerEvents: 'none',
          opacity: bloomOpacity,
        }}
      />

      {/* Main Container */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 1540,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 2,
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: colorShiftP > 0.5 ? 'rgba(255, 46, 147, 0.16)' : 'rgba(255, 30, 64, 0.16)',
            border: `1.5px solid ${colorShiftP > 0.5 ? primaryColor : urgentColor}`,
            color: colorShiftP > 0.5 ? '#FFF' : urgentColor,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 18,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            padding: '10px 26px',
            borderRadius: 9999,
            marginBottom: 28,
            opacity: badgeP,
            transform: `translateY(${interpolate(badgeP, [0, 1], [-20, 0])}px) scale(${interpolate(badgeP, [0, 1], [0.6, 1])})`,
          }}
        >
          <svg style={{ width: 20, height: 20, stroke: colorShiftP > 0.5 ? accentColor : urgentColor, strokeWidth: 2.5, fill: 'none' }} viewBox="0 0 24 24">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span>{badgeText}</span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 96,
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: 38,
            textTransform: 'uppercase',
          }}
        >
          <span style={{ display: 'inline-block', ...wordAnims[0], color: hookTextColor }}>{word1}&nbsp;</span>
          <span style={{ display: 'inline-block', ...wordAnims[1], color: hookTextColor }}>{word2}</span>
          <br />
          <span style={{ display: 'inline-block', ...wordAnims[2], color: hookTextColor }}>{word3}&nbsp;</span>
          <span style={{ display: 'inline-block', ...wordAnims[3], color: accentColor, textShadow: '0 0 35px rgba(255, 230, 0, 0.45)' }}>{word4}&nbsp;</span>
          <span style={{ display: 'inline-block', ...wordAnims[4], color: '#FFF' }}>{word5}</span>
        </h1>

        {/* Lower Deck: Stat Card + Stickers */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, width: '100%' }}>
          <div
            style={{
              width: 580,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 28,
              padding: '32px 36px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              opacity: cardP,
              transform: `translateY(${interpolate(cardP, [0, 1], [50, 0])}px) scale(${interpolate(cardP, [0, 1], [0.9, 1])})`,
              textAlign: 'left',
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 84, fontWeight: 800, color: '#FFF', lineHeight: 1, marginBottom: 8 }}>
              {countP.toFixed(1)}M+
            </div>
            <div style={{ fontSize: 20, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {statLabel}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                background: primaryColor,
                color: '#FFF',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 18,
                fontWeight: 800,
                padding: '14px 24px',
                borderRadius: 18,
                boxShadow: '0 10px 30px rgba(255, 46, 147, 0.4)',
                opacity: sticker1P,
                transform: `scale(${sticker1P}) rotate(-4deg)`,
              }}
            >
              {sticker1}
            </div>
            <div
              style={{
                background: accentColor,
                color: '#000',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 18,
                fontWeight: 800,
                padding: '14px 24px',
                borderRadius: 18,
                opacity: sticker2P,
                transform: `scale(${sticker2P}) rotate(5deg)`,
              }}
            >
              {sticker2}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default ReelHook;
