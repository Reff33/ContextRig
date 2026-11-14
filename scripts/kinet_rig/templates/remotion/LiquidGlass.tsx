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
 * Apple iOS Spatial Liquid Glass & Dynamic Island:
 *  - Radial ambient auras & Siri intelligence multi-color fluid aura glow.
 *  - Top Dynamic Island pill expanding on beat (220px -> 420px).
 *  - Central Refractive Glass Orb with specular reflections & VisionOS concentric rings.
 *  - Floating glass telemetry cards with real-time blur and border refraction.
 */
export type LiquidGlassProps = {
  islandText?: string;
  heroHeadline?: string;
  heroSub?: string;
  primaryCyan?: string;
  accentPurple?: string;
  backgroundColor?: string;
};

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  islandText = 'SPATIAL INTELLIGENCE',
  heroHeadline = 'Fluid Spatial Vision',
  heroSub = 'Refractive liquid glass physics with VisionOS concentric orbital rings.',
  primaryCyan = '#64D2FF',
  accentPurple = '#BF5AF2',
  backgroundColor = '#07090E',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sec = (s: number) => Math.round(s * fps);

  // Easing curves
  const easeExpoOut = Easing.bezier(0.16, 1, 0.3, 1);
  const easeSmooth = Easing.bezier(0.45, 0, 0.25, 1);

  // 1. Dynamic Island Expansion (0.3s - 1.2s: width 220px -> 440px)
  const islandP = interpolate(frame, [sec(0.3), sec(1.2)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeExpoOut,
  });
  const islandWidth = interpolate(islandP, [0, 1], [220, 440]);

  // 2. Siri Glow Conic Aura Fade In (0.5s - 1.8s)
  const siriOpacity = interpolate(frame, [sec(0.5), sec(1.8)], [0, 0.75], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeSmooth,
  });
  const siriRot = (frame * 1.2) % 360;

  // 3. Central Glass Orb Breathing & Rotation
  const orbScale = 1.0 + Math.sin(frame * 0.05) * 0.04;
  const orbRot = (frame * 0.6) % 360;

  // 4. Floating Glass Cards Entrance (1.4s & 1.8s)
  const card1P = interpolate(frame, [sec(1.4), sec(2.2)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeExpoOut,
  });
  const card2P = interpolate(frame, [sec(1.8), sec(2.6)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeExpoOut,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        overflow: 'hidden',
        color: '#FFF',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      {/* 1920x1080 Stage with Radial Gradient */}
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
        {/* Spatial Ambient Auras */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 48%, rgba(10, 132, 255, 0.18) 0%, transparent 55%), radial-gradient(circle at 35% 40%, rgba(191, 90, 242, 0.14) 0%, transparent 48%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />

        {/* Top Dynamic Island */}
        <div style={{ position: 'absolute', top: 44, left: '50%', transform: 'translateX(-50%)', zIndex: 40 }}>
          <div
            style={{
              width: islandWidth,
              height: 52,
              background: '#000',
              borderRadius: 9999,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#30D158', boxShadow: '0 0 10px #30D158' }} />
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: '#FFF' }}>{islandText}</span>
            </div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height: 8 + Math.sin(frame * 0.4 + i) * 6,
                    background: '#30D158',
                    borderRadius: 2,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Siri Multi-color Fluid Glow Aura */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 720,
            height: 720,
            transform: `translate(-50%, -50%) rotate(${siriRot}deg)`,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #FF375F, #BF5AF2, #0A84FF, #64D2FF, #30D158, #FF9F0A, #FF375F)',
            filter: 'blur(75px)',
            opacity: siriOpacity,
            pointerEvents: 'none',
          }}
        />

        {/* Central VisionOS Glass Orb with Concentric Rings */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) scale(${orbScale})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Orbital Ring 1 */}
          <div
            style={{
              position: 'absolute',
              width: 520,
              height: 520,
              borderRadius: '50%',
              border: `1.5px dashed ${primaryCyan}`,
              opacity: 0.35,
              transform: `rotateX(68deg) rotateZ(${orbRot}deg)`,
            }}
          />
          {/* Orbital Ring 2 */}
          <div
            style={{
              position: 'absolute',
              width: 620,
              height: 620,
              borderRadius: '50%',
              border: `1px solid ${accentPurple}`,
              opacity: 0.25,
              transform: `rotateX(75deg) rotateY(25deg) rotateZ(${-orbRot}deg)`,
            }}
          />

          {/* Central Refractive Glass Orb */}
          <div
            style={{
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4) 0%, rgba(100, 210, 255, 0.2) 30%, rgba(191, 90, 242, 0.15) 60%, rgba(10, 15, 30, 0.8) 100%)',
              border: '2px solid rgba(255, 255, 255, 0.35)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.8), inset 0 0 40px rgba(255,255,255,0.2)',
              backdropFilter: 'blur(16px)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 24,
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF' }}>{heroHeadline}</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 8, lineHeight: 1.4 }}>{heroSub}</div>
          </div>
        </div>

        {/* Floating Glass Telemetry Cards */}
        {/* Card Left */}
        <div
          style={{
            position: 'absolute',
            left: 120,
            top: 420,
            width: 340,
            padding: 24,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 20,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            opacity: card1P,
            transform: `translateY(${interpolate(card1P, [0, 1], [40, 0])}px)`,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em' }}>OPTICAL TRANSMISSION</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: primaryCyan, marginTop: 6 }}>98.4%</div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>IOR: 1.48 · Physical Dispersion</div>
        </div>

        {/* Card Right */}
        <div
          style={{
            position: 'absolute',
            right: 120,
            top: 420,
            width: 340,
            padding: 24,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 20,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            opacity: card2P,
            transform: `translateY(${interpolate(card2P, [0, 1], [40, 0])}px)`,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em' }}>VISIONOS SPATIAL DEPTH</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: accentPurple, marginTop: 6 }}>60 FPS</div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Dynamic Island Event Muxing</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default LiquidGlass;
