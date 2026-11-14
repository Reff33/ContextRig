import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * BentoGrid — Remotion Port of `assets/kinet-bento-grid.html`.
 * Modern glassmorphic 3x2 Bento Grid with animated staggered entrance,
 * live telemetry metrics, animated progress fill bar, and neon glow accents.
 */
export type BentoGridProps = {
  headline?: string;
  metricBig?: string;
  metricLabel?: string;
  featureTitle1?: string;
  featureTitle2?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
};

export const BentoGrid: React.FC<BentoGridProps> = ({
  headline = 'Modular Motion Intelligence',
  metricBig = '99.98%',
  metricLabel = 'DETERMINISTIC FRAME SYNCHRONIZATION',
  featureTitle1 = 'Sub-Pixel Kinematics',
  featureTitle2 = '3D Camera Trajectories',
  primaryColor = '#A855F7',
  accentColor = '#06B6D4',
  backgroundColor = '#0B0814',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const t = (sec: number) => Math.round(sec * fps);

  // Staggered pop entry for 4 bento cards
  const cardEntry = (delaySec: number) => {
    const start = t(delaySec);
    const progress = interpolate(frame, [start, start + t(0.4)], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.bezier(0.16, 1, 0.3, 1)),
    });
    return {
      opacity: progress,
      transform: `translateY(${interpolate(progress, [0, 1], [30, 0])}px) scale(${interpolate(progress, [0, 1], [0.92, 1])})`,
    };
  };

  // Progress Bar Fill (0.85s - 2.25s)
  const barProgress = interpolate(frame, [t(0.85), t(2.25)], [0, 99.98], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 30%, #1E1233 0%, ${backgroundColor} 80%)`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#F8FAFC',
      }}
    >
      {/* 3x2 Bento Grid Container */}
      <div
        style={{
          width: 1360,
          height: 800,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: 24,
        }}
      >
        {/* Card 1: Col-Span-2 Hero Metric Card */}
        <div
          style={{
            gridColumn: 'span 2',
            background: 'rgba(23, 16, 38, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 28,
            padding: 36,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden',
            ...cardEntry(0.1),
          }}
        >
          <div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <svg style={{ width: 26, height: 26, stroke: primaryColor, strokeWidth: 2, fill: 'none' }} viewBox="0 0 24 24">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>
              {headline}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em' }}>
              {metricLabel}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 64, fontWeight: 800, color: '#FFF', lineHeight: 1 }}>
              {metricBig}
            </div>
            <div style={{ width: '100%', height: 8, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, marginTop: 20, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${barProgress}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
                  borderRadius: 4,
                  boxShadow: `0 0 12px ${primaryColor}`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Row-Span-2 Feature Card */}
        <div
          style={{
            gridRow: 'span 2',
            background: 'rgba(23, 16, 38, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 28,
            padding: 36,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            ...cardEntry(0.25),
          }}
        >
          <div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <svg style={{ width: 26, height: 26, stroke: accentColor, strokeWidth: 2, fill: 'none' }} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>
              {featureTitle2}
            </div>
            <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.5 }}>
              Continuous vertigo dolly-zoom orbits and responsive spatial depth.
            </div>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              color: accentColor,
            }}
          >
            // 3D ORBIT PASS: 60 FPS
          </div>
        </div>

        {/* Card 3: Standard Card Left */}
        <div
          style={{
            background: 'rgba(23, 16, 38, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 28,
            padding: 36,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            ...cardEntry(0.4),
          }}
        >
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>
              {featureTitle1}
            </div>
            <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.5 }}>
              Precision velocity curves without slide-deck fades.
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: primaryColor, letterSpacing: '0.1em' }}>
            ANTI-SLOP LAW CERTIFIED
          </span>
        </div>

        {/* Card 4: Standard Card Right */}
        <div
          style={{
            background: 'rgba(23, 16, 38, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 28,
            padding: 36,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            ...cardEntry(0.55),
          }}
        >
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>
              Inline SVG Vectors
            </div>
            <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.5 }}>
              Zero OS emoji pixelation on 1080p and 4K displays.
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: accentColor, letterSpacing: '0.1em' }}>
            100% STUDIO RESOLUTION
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default BentoGrid;
