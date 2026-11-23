import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * BentoGrid — 100% Exact Remotion Port of `assets/kinet-bento-grid.html`.
 *
 * Exact specifications from original:
 *  - Master Stage: 1920x1080 with radial-gradient(circle at 50% 30%, #1E1233 0%, #09090E 80%).
 *  - Grid: 1360px x 800px, 3 columns x 2 rows, gap 24px.
 *  - Layout:
 *      Card 1 (#c1): col-span-2 (Distributed Neural Rendering, 99.98%, dynamic progress bar fill)
 *      Card 2 (#c2): col 3, row 1 (Zero Trust Core, AES-256-GCM)
 *      Card 3 (#c3): col 1, row 2 (Peak Bandwidth, 40 Gbps)
 *      Card 4 (#c4): col-span-2 (Deterministic 240 FPS Pipeline, 100% LOSSLESS & CRF 14 tags)
 *  - Animation Timeline (6.5s = 390 frames @ 60fps):
 *      0.25s: Cards stagger entrance from { opacity: 0, scale: 0.88, y: 35 } to { opacity: 1, scale: 1, y: 0 }
 *             duration: 0.7s, stagger: 0.15s, ease: back.out(1.5).
 *      0.85s - 2.25s: Progress bar fills from 0% to 99.98% (power2.out, duration: 1.4s).
 *      Micro-glow radial gradient in top-left of each card.
 */
export type BentoGridProps = {
  card1Title?: string;
  card1Desc?: string;
  card1Metric?: string;
  card2Title?: string;
  card2Desc?: string;
  card2Badge?: string;
  card3Title?: string;
  card3Desc?: string;
  card3Metric?: string;
  card4Title?: string;
  card4Desc?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
};

export const BentoGrid: React.FC<BentoGridProps> = ({
  card1Title = 'Distributed Neural Rendering',
  card1Desc = 'Sub-millisecond frame synthesis executed on unified GPU compute clusters.',
  card1Metric = '99.98%',
  card2Title = 'Zero Trust Core',
  card2Desc = 'Hardware-isolated enclave cryptographic guarantees.',
  card2Badge = 'AES-256-GCM',
  card3Title = 'Peak Bandwidth',
  card3Desc = 'Ultra-low latency pipe.',
  card3Metric = '40 Gbps',
  card4Title = 'Deterministic 240 FPS Pipeline',
  card4Desc = 'Guaranteed zero jitter frame generation for production motion broadcast.',
  primaryColor = '#A855F7',
  accentColor = '#06B6D4',
  backgroundColor = '#09090E',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sec = (s: number) => Math.round(s * fps);

  // GSAP back.out(1.5) bezier equivalent: [0.175, 0.885, 0.32, 1.275]
  const easeBackOut = Easing.bezier(0.175, 0.885, 0.32, 1.275);
  // GSAP power2.out: [0.25, 0.46, 0.45, 0.94]
  const easePower2Out = Easing.bezier(0.25, 0.46, 0.45, 0.94);

  // Stagger entry: Card 1 (0.25s), Card 2 (0.40s), Card 3 (0.55s), Card 4 (0.70s)
  const getCardAnim = (delaySec: number) => {
    const start = sec(delaySec);
    const end = start + sec(0.7);
    const p = interpolate(frame, [start, end], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easeBackOut,
    });
    return {
      opacity: p,
      transform: `translateY(${interpolate(p, [0, 1], [35, 0])}px) scale(${interpolate(p, [0, 1], [0.88, 1])})`,
    };
  };

  const animCard1 = getCardAnim(0.25);
  const animCard2 = getCardAnim(0.40);
  const animCard3 = getCardAnim(0.55);
  const animCard4 = getCardAnim(0.70);

  // Progress bar fill (0.85s -> 2.25s)
  const progressFill = interpolate(frame, [sec(0.85), sec(2.25)], [0, 99.98], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower2Out,
  });

  const cardStyle: React.CSSProperties = {
    background: 'rgba(23, 23, 33, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.09)',
    borderRadius: 28,
    padding: 36,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    position: 'relative',
    overflow: 'hidden',
  };

  const glowStyle: React.CSSProperties = {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    background: 'radial-gradient(circle at top left, rgba(168, 85, 247, 0.4), transparent 60%)',
    opacity: 0.15,
    pointerEvents: 'none',
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        overflow: 'hidden',
        color: '#FFF',
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      }}
    >
      {/* #stage matching 100% of assets/kinet-bento-grid.html */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 1920,
          height: 1080,
          marginLeft: -960,
          marginTop: -540,
          background: `radial-gradient(circle at 50% 30%, #1E1233 0%, ${backgroundColor} 80%)`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* .bento-container */}
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
          {/* Card 1: #c1 (col-span-2) */}
          <div
            style={{
              ...cardStyle,
              gridColumn: 'span 2',
              ...animCard1,
            }}
          >
            <div style={glowStyle} />
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
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>{card1Title}</div>
              <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.5 }}>{card1Desc}</div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 64,
                  fontWeight: 800,
                  color: '#FFF',
                  marginTop: 14,
                  lineHeight: 1,
                }}
              >
                {card1Metric}
              </div>
              <div
                style={{
                  width: '100%',
                  height: 8,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 4,
                  marginTop: 20,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progressFill}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
                    borderRadius: 4,
                    boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: #c2 (col 3, row 1) */}
          <div
            style={{
              ...cardStyle,
              ...animCard2,
            }}
          >
            <div style={glowStyle} />
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
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>{card2Title}</div>
              <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.5 }}>{card2Desc}</div>
            </div>
            <div
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 24,
                color: accentColor,
                fontWeight: 700,
              }}
            >
              {card2Badge}
            </div>
          </div>

          {/* Card 3: #c3 (col 1, row 2) */}
          <div
            style={{
              ...cardStyle,
              ...animCard3,
            }}
          >
            <div style={glowStyle} />
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
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>{card3Title}</div>
              <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.5 }}>{card3Desc}</div>
            </div>
            <div
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 64,
                fontWeight: 800,
                color: accentColor,
                lineHeight: 1,
              }}
            >
              {card3Metric}
            </div>
          </div>

          {/* Card 4: #c4 (col-span-2, row 2) */}
          <div
            style={{
              ...cardStyle,
              gridColumn: 'span 2',
              ...animCard4,
            }}
          >
            <div style={glowStyle} />
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
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 14 14" />
                </svg>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>{card4Title}</div>
              <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.5 }}>{card4Desc}</div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <span
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  padding: '8px 16px',
                  borderRadius: 12,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                100% LOSSLESS
              </span>
              <span
                style={{
                  background: 'rgba(168,85,247,0.2)',
                  color: primaryColor,
                  padding: '8px 16px',
                  borderRadius: 12,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                CRF 14
              </span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default BentoGrid;
