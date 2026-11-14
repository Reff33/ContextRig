import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * SaasMacro — Exact Remotion Port of `assets/kinet-saas-macro.html`.
 *
 * Recreates the exact cinematic motion:
 *  1. (0.2s - 1.4s): 3D Browser Entrance (scale 0.75 -> 1, rotateX 18 -> 0, rotateY -14 -> 0, z -350 -> 0)
 *  2. (0.85s - 2.25s): Sparkline Chart Draw-In
 *  3. (2.0s - 4.2s): Macro Dive into the Chart Panel (z 0 -> 680, x 0 -> -280, y 0 -> -60, rotateX 10, rotateY -8)
 *  4. (2.3s - 3.5s): Rack Focus Blur Swap (side-panel blurs from 0px -> 8px)
 *  5. (4.5s - 4.8s): Production Status Banner confirmation pulse (scale 0.94 -> 1.04)
 *  6. (4.8s - 6.4s): Camera Restore (z 680 -> 0, x -280 -> 0, y -60 -> 0, rotateX 0, rotateY 0, blur -> 0px)
 */
export type SaasMacroProps = {
  headline?: string;
  subHeadline?: string;
  urlBarText?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
};

export const SaasMacro: React.FC<SaasMacroProps> = ({
  headline = 'Sub-Millisecond Execution',
  subHeadline = 'Real-time throughput metrics running on native threadpool',
  urlBarText = 'https://app.kinetrig.ai/telemetry/live',
  primaryColor = '#38BDF8',
  accentColor = '#10B981',
  backgroundColor = '#020617',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Convert second marks from original kinet-saas-macro.html into frame indices
  const t = (sec: number) => Math.round(sec * fps);

  // Ease curves mirroring GSAP
  const easePower3Out = Easing.out(Easing.cubic);
  const easePower2InOut = Easing.inOut(Easing.quad);
  const easePower3InOut = Easing.inOut(Easing.cubic);

  // 1. Initial Browser Entrance (0.20s - 1.40s)
  const introProgress = interpolate(frame, [t(0.2), t(1.4)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });

  const browserOpacity = introProgress;
  const initScale = interpolate(introProgress, [0, 1], [0.75, 1]);
  const initRotateX = interpolate(introProgress, [0, 1], [18, 0]);
  const initRotateY = interpolate(introProgress, [0, 1], [-14, 0]);
  const initZ = interpolate(introProgress, [0, 1], [-350, 0]);

  // 2. Macro Dive (2.0s - 4.2s) & Camera Restore (4.8s - 6.4s)
  let camX = 0;
  let camY = 0;
  let camZ = 0;
  let camRotX = 0;
  let camRotY = 0;

  if (frame < t(4.5)) {
    // Zooming In
    const diveProgress = interpolate(frame, [t(2.0), t(4.2)], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easePower2InOut,
    });
    camX = interpolate(diveProgress, [0, 1], [0, -280]);
    camY = interpolate(diveProgress, [0, 1], [0, -60]);
    camZ = interpolate(diveProgress, [0, 1], [0, 680]);
    camRotX = interpolate(diveProgress, [0, 1], [0, 10]);
    camRotY = interpolate(diveProgress, [0, 1], [0, -8]);
  } else {
    // Zooming Back Out
    const restoreProgress = interpolate(frame, [t(4.8), t(6.4)], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easePower3InOut,
    });
    camX = interpolate(restoreProgress, [0, 1], [-280, 0]);
    camY = interpolate(restoreProgress, [0, 1], [-60, 0]);
    camZ = interpolate(restoreProgress, [0, 1], [680, 0]);
    camRotX = interpolate(restoreProgress, [0, 1], [10, 0]);
    camRotY = interpolate(restoreProgress, [0, 1], [-8, 0]);
  }

  // 3. Sparkline Draw-in (0.85s - 2.25s)
  const sparklineProgress = interpolate(frame, [t(0.85), t(2.25)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  // 4. Rack Focus blur swap on side-panel (2.3s -> 3.5s blur up, 4.8s -> 6.0s blur down)
  let sideBlur = 0;
  if (frame < t(4.5)) {
    sideBlur = interpolate(frame, [t(2.3), t(3.5)], [0, 8], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.quad),
    });
  } else {
    sideBlur = interpolate(frame, [t(4.8), t(6.0)], [8, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easePower2InOut,
    });
  }

  // 5. Banner scale pulse (4.5s - 4.8s)
  const bannerScale = interpolate(
    frame,
    [t(4.5), t(4.65), t(4.8)],
    [1, 1.05, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 60% 40%, #0F172A 0%, ${backgroundColor} 75%)`,
        overflow: 'hidden',
        perspective: 1600,
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 3D World Container matching #world in original */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transformStyle: 'preserve-3d',
          transform: `translate3d(${camX}px, ${camY}px, ${camZ}px) rotateX(${camRotX}deg) rotateY(${camRotY}deg)`,
        }}
      >
        {/* Browser Mockup (.browser-mockup) */}
        <div
          style={{
            width: 1280,
            height: 760,
            background: 'rgba(11, 15, 25, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 24,
            boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 50px rgba(56, 189, 248, 0.15)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transformStyle: 'preserve-3d',
            opacity: browserOpacity,
            transform: `scale(${initScale}) rotateX(${initRotateX}deg) rotateY(${initRotateY}deg) translateZ(${initZ}px)`,
          }}
        >
          {/* Header */}
          <div
            style={{
              height: 52,
              background: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 20px',
              gap: 10,
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F59E0B' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }} />
            <div
              style={{
                marginLeft: 20,
                flex: 1,
                maxWidth: 520,
                height: 32,
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13,
                color: '#94A3B8',
              }}
            >
              {urlBarText}
            </div>
          </div>

          {/* Browser Body */}
          <div
            style={{
              flex: 1,
              padding: 36,
              display: 'grid',
              gridTemplateColumns: '340px 1fr',
              gap: 30,
            }}
          >
            {/* Sidebar with Rack Focus blur */}
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                filter: `blur(${sideBlur}px)`,
                transition: 'filter 0.1s',
              }}
            >
              <div
                style={{
                  padding: '12px 18px',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  background: 'rgba(56, 189, 248, 0.16)',
                  color: primaryColor,
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <svg style={{ width: 18, height: 18, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }} viewBox="0 0 24 24">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
                <span>Overview</span>
              </div>
              <div
                style={{
                  padding: '12px 18px',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <svg style={{ width: 18, height: 18, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }} viewBox="0 0 24 24">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <span>Latency (0.4ms)</span>
              </div>
              <div
                style={{
                  padding: '12px 18px',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <svg style={{ width: 18, height: 18, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 14 14" />
                </svg>
                <span>Event Pipeline</span>
              </div>
            </div>

            {/* Macro Chart Panel */}
            <div
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: 20,
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 0 30px rgba(56, 189, 248, 0.12)',
              }}
            >
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#FFF', margin: '0 0 8px 0' }}>
                  {headline}
                </h2>
                <p style={{ fontSize: 15, color: '#94A3B8', margin: '0 0 24px 0' }}>
                  {subHeadline}
                </p>

                {/* Exact Sparkline SVG */}
                <svg style={{ width: '100%', height: 240, overflow: 'visible' }} viewBox="0 0 800 240">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={primaryColor} stopOpacity="0.35" />
                      <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 220 L 0 160 Q 180 80 340 140 T 640 40 L 800 70 L 800 220 Z"
                    fill="url(#chartGrad)"
                    opacity={sparklineProgress}
                  />
                  <path
                    d="M 0 160 Q 180 80 340 140 T 640 40 L 800 70"
                    fill="none"
                    stroke={primaryColor}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray={1000}
                    strokeDashoffset={interpolate(sparklineProgress, [0, 1], [1000, 0])}
                    style={{ filter: `drop-shadow(0 0 12px ${primaryColor})` }}
                  />
                </svg>
              </div>

              {/* Toggle Banner with Confirmation Pulse */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: 14,
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transform: `scale(${bannerScale})`,
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>Production Status</div>
                  <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>All 12 microservices healthy</div>
                </div>
                <div
                  style={{
                    background: accentColor,
                    color: '#000',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 13,
                    fontWeight: 800,
                    padding: '6px 14px',
                    borderRadius: 9999,
                    boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  ONLINE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default SaasMacro;
