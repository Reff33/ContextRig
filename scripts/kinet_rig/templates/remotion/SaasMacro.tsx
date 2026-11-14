import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * SaasMacro — 100% Exact Remotion Port of `assets/kinet-saas-macro.html`.
 * Matches HTML5/GSAP layout, fonts, exact pixel dimensions, background gradients,
 * and 3D camera timeline verbatim:
 *
 * Stage: 1920x1080 with perspective: 1600px.
 * #world: absolute 1920x1080, preserve-3d.
 * .browser-mockup: 1280x760, centered via margin, background: rgba(17, 24, 39, 0.75),
 *  box-shadow: 0 40px 100px rgba(0,0,0,0.8), 0 0 50px rgba(56, 189, 248, 0.15).
 *
 * GSAP Motion Breakdown (7.0s = 420 frames @ 60fps):
 *  0.20s - 1.40s: #browser from { opacity: 0, scale: 0.75, rotateX: 18, rotateY: -14, z: -350 }
 *                  to { opacity: 1, scale: 1, rotateX: 0, rotateY: 0, z: 0 } (power3.out)
 *  0.85s - 2.25s: #sparkline strokeDashoffset len -> 0 (power2.out, duration: 1.4s)
 *  2.00s - 4.20s: #world to { z: 680, x: -280, y: -60, rotateX: 10, rotateY: -8 } (power2.inOut, duration: 2.2s)
 *  2.30s - 3.50s: #side-panel filter: blur(0px) -> blur(8px) (power2.out, duration: 1.2s)
 *  4.50s - 4.80s: #banner scale 0.94 -> 1.04 -> 0.94 -> 1.0 (power1.inOut, yoyo)
 *  4.80s - 6.40s: #world to { z: 0, x: 0, y: 0, rotateX: 0, rotateY: 0 } (power3.inOut, duration: 1.6s)
 *  4.80s - 6.00s: #side-panel filter: blur(8px) -> blur(0px) (power2.inOut, duration: 1.2s)
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
  backgroundColor = '#030712',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Convert second markers to exact frame count
  const sec = (s: number) => Math.round(s * fps);

  // --- GSAP Bezier Equivalents ---
  // power3.out: [0.215, 0.61, 0.355, 1]
  const easePower3Out = Easing.bezier(0.215, 0.61, 0.355, 1);
  // power2.inOut: [0.45, 0, 0.55, 1]
  const easePower2InOut = Easing.bezier(0.45, 0, 0.55, 1);
  // power3.inOut: [0.645, 0.045, 0.355, 1]
  const easePower3InOut = Easing.bezier(0.645, 0.045, 0.355, 1);
  // power2.out: [0.25, 0.46, 0.45, 0.94]
  const easePower2Out = Easing.bezier(0.25, 0.46, 0.45, 0.94);

  // 1. Initial #browser Entrance (0.20s -> 1.40s)
  const introP = interpolate(frame, [sec(0.2), sec(1.4)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });

  const browserOpacity = introP;
  const browserScale = interpolate(introP, [0, 1], [0.75, 1]);
  const browserRotX = interpolate(introP, [0, 1], [18, 0]);
  const browserRotY = interpolate(introP, [0, 1], [-14, 0]);
  const browserZ = interpolate(introP, [0, 1], [-350, 0]);

  // 2. Camera Macro Dive on #world (2.0s -> 4.2s dive, 4.8s -> 6.4s restore)
  let worldX = 0;
  let worldY = 0;
  let worldZ = 0;
  let worldRotX = 0;
  let worldRotY = 0;

  if (frame < sec(4.5)) {
    // Dive forward
    const diveP = interpolate(frame, [sec(2.0), sec(4.2)], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easePower2InOut,
    });
    worldX = interpolate(diveP, [0, 1], [0, -280]);
    worldY = interpolate(diveP, [0, 1], [0, -60]);
    worldZ = interpolate(diveP, [0, 1], [0, 680]);
    worldRotX = interpolate(diveP, [0, 1], [0, 10]);
    worldRotY = interpolate(diveP, [0, 1], [0, -8]);
  } else {
    // Restore back
    const restoreP = interpolate(frame, [sec(4.8), sec(6.4)], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easePower3InOut,
    });
    worldX = interpolate(restoreP, [0, 1], [-280, 0]);
    worldY = interpolate(restoreP, [0, 1], [-60, 0]);
    worldZ = interpolate(restoreP, [0, 1], [680, 0]);
    worldRotX = interpolate(restoreP, [0, 1], [10, 0]);
    worldRotY = interpolate(restoreP, [0, 1], [-8, 0]);
  }

  // 3. Sparkline Draw-in (0.85s -> 2.25s)
  const sparklineLen = 850;
  const sparklineOffset = interpolate(frame, [sec(0.85), sec(2.25)], [sparklineLen, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower2Out,
  });

  // 4. Rack focus blur on #side-panel (2.3s -> 3.5s blur 0->8px, 4.8s -> 6.0s blur 8->0px)
  let sideBlur = 0;
  if (frame < sec(4.5)) {
    sideBlur = interpolate(frame, [sec(2.3), sec(3.5)], [0, 8], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easePower2Out,
    });
  } else {
    sideBlur = interpolate(frame, [sec(4.8), sec(6.0)], [8, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easePower2InOut,
    });
  }

  // 5. Banner confirmation pulse (4.5s -> 4.8s: scale 0.94 -> 1.04 -> 1.0)
  const bannerScale = interpolate(
    frame,
    [sec(4.5), sec(4.65), sec(4.8)],
    [0.94, 1.04, 1.0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        overflow: 'hidden',
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        color: '#FFF',
      }}
    >
      {/* #stage matching 100% of assets/kinet-saas-macro.html */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 1920,
          height: 1080,
          marginLeft: -960,
          marginTop: -540,
          background: `radial-gradient(circle at 60% 40%, #0F172A 0%, ${backgroundColor} 75%)`,
          overflow: 'hidden',
          perspective: 1600,
        }}
      >
        {/* #world matching original container */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transform: `translate3d(${worldX}px, ${worldY}px, ${worldZ}px) rotateX(${worldRotX}deg) rotateY(${worldRotY}deg)`,
            willChange: 'transform',
          }}
        >
          {/* .browser-mockup */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 1280,
              height: 760,
              marginLeft: -640,
              marginTop: -380,
              background: 'rgba(17, 24, 39, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 24,
              boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 50px rgba(56, 189, 248, 0.15)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              transformStyle: 'preserve-3d',
              willChange: 'transform, filter',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              opacity: browserOpacity,
              transform: `scale(${browserScale}) rotateX(${browserRotX}deg) rotateY(${browserRotY}deg) translateZ(${browserZ}px)`,
            }}
          >
            {/* .browser-header */}
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
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 13,
                  color: '#94A3B8',
                }}
              >
                {urlBarText}
              </div>
            </div>

            {/* .browser-body */}
            <div
              style={{
                flex: 1,
                padding: 36,
                display: 'grid',
                gridTemplateColumns: '340px 1fr',
                gap: 30,
              }}
            >
              {/* .sidebar-panel (#side-panel) */}
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
                  willChange: 'filter',
                }}
              >
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 600,
                    color: primaryColor,
                    background: 'rgba(56, 189, 248, 0.16)',
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

              {/* .macro-chart-panel (#chart-panel) */}
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
                  transformStyle: 'preserve-3d',
                }}
              >
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>
                    {headline}
                  </h2>
                  <p style={{ fontSize: 15, color: '#94A3B8', marginBottom: 24 }}>
                    {subHeadline}
                  </p>
                  <svg style={{ width: '100%', height: 240, overflow: 'visible' }} viewBox="0 0 800 240">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 220 L 0 160 Q 180 80 340 140 T 640 40 L 800 70 L 800 220 Z"
                      fill="url(#chartGrad)"
                      opacity={sparklineOffset < sparklineLen ? 1 : 0}
                    />
                    <path
                      d="M 0 160 Q 180 80 340 140 T 640 40 L 800 70"
                      fill="none"
                      stroke={primaryColor}
                      strokeWidth={4}
                      strokeLinecap="round"
                      strokeDasharray={sparklineLen}
                      strokeDashoffset={sparklineOffset}
                      style={{ filter: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.4))' }}
                    />
                  </svg>
                </div>

                {/* .toggle-banner (#banner) */}
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
                      fontFamily: '"JetBrains Mono", monospace',
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
      </div>
    </AbsoluteFill>
  );
};

export default SaasMacro;
