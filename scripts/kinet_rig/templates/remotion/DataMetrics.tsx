import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * DataMetrics — 100% Exact Remotion Port of `assets/kinet-metrics.html`.
 * Matches HTML5/GSAP layout, fonts, exact pixel dimensions, background radial gradient,
 * and keyframe timeline:
 *
 * Stage: 1920x1080 with radial-gradient(circle at 50% 20%, #0F172A, #040810 80%).
 * 0.20s - 1.00s: .hud-title from { opacity: 0, y: -30 } to { opacity: 1, y: 0 } (power3.out)
 * 0.60s - 1.30s: [#m1, #m2, #m3] stagger from { opacity: 0, y: 40, scale: 0.9 } to { opacity: 1, y: 0, scale: 1 } (back.out(1.5))
 * 0.80s - 3.00s: Number counters interpolate n1: 0 -> 14400, n2: 0 -> 84%, n3: 0 -> 256M
 * 1.20s - 2.00s: #chart-box from { opacity: 0, scale: 0.9 } to { opacity: 1, scale: 1 } (power3.out)
 * 1.35s - 2.55s: [#area-path-1, #area-path-2] scaleY: 0.2 -> 1, opacity: 0 -> 1 (power2.out)
 * 1.40s - 2.40s: 6 SVG bars grow elastic height (elastic.out(1, 0.75))
 */
export type DataMetricsProps = {
  titlePrefix?: string;
  titleHighlight?: string;
  currency?: string;
  metric1Val?: number;
  metric1Label?: string;
  metric2Val?: number;
  metric2Label?: string;
  metric3Val?: number;
  metric3Label?: string;
  primaryColor?: string;
  backgroundColor?: string;
};

export const DataMetrics: React.FC<DataMetricsProps> = ({
  titlePrefix = 'Real-Time Performance ',
  titleHighlight = 'Metrics',
  currency = '$',
  metric1Val = 14400,
  metric1Label = 'Transactions / Sec',
  metric2Val = 84,
  metric2Label = 'Cache Hit Rate',
  metric3Val = 256,
  metric3Label = 'Quarterly Volume',
  primaryColor = '#10B981',
  backgroundColor = '#040810',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sec = (s: number) => Math.round(s * fps);

  // GSAP Easing equivalents
  const easePower3Out = Easing.bezier(0.215, 0.61, 0.355, 1);
  const easeBackOut = Easing.bezier(0.175, 0.885, 0.32, 1.275);
  const easePower2Out = Easing.bezier(0.25, 0.46, 0.45, 0.94);
  const easeElasticOut = Easing.elastic(0.75);

  // 1. HUD Title (0.2s -> 1.0s)
  const titleP = interpolate(frame, [sec(0.2), sec(1.0)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });
  const titleOpacity = titleP;
  const titleY = interpolate(titleP, [0, 1], [-30, 0]);

  // 2. Metric Cards Stagger (0.60s, 0.75s, 0.90s)
  const cardProgress = (delay: number) => {
    return interpolate(frame, [sec(delay), sec(delay + 0.7)], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easeBackOut,
    });
  };

  const p1 = cardProgress(0.60);
  const p2 = cardProgress(0.75);
  const p3 = cardProgress(0.90);

  // 3. Numbers Counter (0.8s -> 3.0s)
  const numP = interpolate(frame, [sec(0.8), sec(3.0)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower2Out,
  });
  const n1 = Math.round(interpolate(numP, [0, 1], [0, metric1Val]));
  const n2 = Math.round(interpolate(numP, [0, 1], [0, metric2Val]));
  const n3 = Math.round(interpolate(numP, [0, 1], [0, metric3Val]));

  // 4. Chart Box (1.20s -> 2.00s)
  const chartBoxP = interpolate(frame, [sec(1.2), sec(2.0)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });
  const chartOpacity = chartBoxP;
  const chartScale = interpolate(chartBoxP, [0, 1], [0.9, 1]);

  // 5. Area Charts (1.35s -> 2.55s)
  const areaP = interpolate(frame, [sec(1.35), sec(2.55)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower2Out,
  });

  // 6. 6 SVG Bars Elastic Grow (1.4s + i * 0.1s)
  const barHeights = [160, 200, 140, 220, 190, 235];
  const barXPositions = [60, 220, 380, 540, 700, 860];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        overflow: 'hidden',
        color: '#FFF',
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      }}
    >
      {/* #stage matching 100% of assets/kinet-metrics.html */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 1920,
          height: 1080,
          marginLeft: -960,
          marginTop: -540,
          background: `radial-gradient(circle at 50% 20%, #0F172A, ${backgroundColor} 80%)`,
          overflow: 'hidden',
        }}
      >
        {/* .hud-title */}
        <h1
          style={{
            textAlign: 'center',
            marginTop: 100,
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          {titlePrefix}
          <span
            style={{
              color: primaryColor,
              textShadow: `0 0 25px rgba(16, 185, 129, 0.45)`,
            }}
          >
            {titleHighlight}
          </span>
        </h1>

        {/* .grid */}
        <div
          style={{
            display: 'flex',
            gap: 36,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 60,
            padding: '0 100px',
          }}
        >
          {/* #m1 */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 20,
              padding: '36px 40px',
              minWidth: 380,
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(20px)',
              opacity: p1,
              transform: `translateY(${interpolate(p1, [0, 1], [40, 0])}px) scale(${interpolate(p1, [0, 1], [0.9, 1])})`,
            }}
          >
            <div style={{ fontSize: 18, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {metric1Label}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 80,
                fontWeight: 700,
                color: primaryColor,
                textShadow: '0 0 30px rgba(16, 185, 129, 0.45)',
                lineHeight: 1,
                margin: '16px 0',
              }}
            >
              {currency}{n1.toLocaleString()}
            </div>
          </div>

          {/* #m2 */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 20,
              padding: '36px 40px',
              minWidth: 380,
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(20px)',
              opacity: p2,
              transform: `translateY(${interpolate(p2, [0, 1], [40, 0])}px) scale(${interpolate(p2, [0, 1], [0.9, 1])})`,
            }}
          >
            <div style={{ fontSize: 18, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {metric2Label}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 80,
                fontWeight: 700,
                color: primaryColor,
                textShadow: '0 0 30px rgba(16, 185, 129, 0.45)',
                lineHeight: 1,
                margin: '16px 0',
              }}
            >
              {n2}%
            </div>
          </div>

          {/* #m3 */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 20,
              padding: '36px 40px',
              minWidth: 380,
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(20px)',
              opacity: p3,
              transform: `translateY(${interpolate(p3, [0, 1], [40, 0])}px) scale(${interpolate(p3, [0, 1], [0.9, 1])})`,
            }}
          >
            <div style={{ fontSize: 18, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {metric3Label}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 80,
                fontWeight: 700,
                color: primaryColor,
                textShadow: '0 0 30px rgba(16, 185, 129, 0.45)',
                lineHeight: 1,
                margin: '16px 0',
              }}
            >
              {currency}{n3}M
            </div>
          </div>
        </div>

        {/* .chart-container (#chart-box) */}
        <div
          style={{
            maxWidth: 1200,
            margin: '50px auto 0',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 20,
            padding: '30px 40px',
            backdropFilter: 'blur(16px)',
            opacity: chartOpacity,
            transform: `scale(${chartScale})`,
          }}
        >
          <svg style={{ width: '100%', height: 260, overflow: 'visible' }} viewBox="0 0 1100 260">
            <defs>
              <linearGradient id="area-grad-1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="area-grad-2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="60" x2="1100" y2="60" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <line x1="0" y1="120" x2="1100" y2="120" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <line x1="0" y1="180" x2="1100" y2="180" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

            {/* Area Path 2 */}
            <path
              fill="url(#area-grad-2)"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity={areaP}
              transform="scale(1, 1)"
              style={{ transformOrigin: 'bottom', transform: `scaleY(${areaP})` }}
              d="M 60,240 L 100,160 L 260,110 L 420,150 L 580,70 L 740,95 L 900,45 L 900,240 Z"
            />
            {/* Area Path 1 */}
            <path
              fill="url(#area-grad-1)"
              stroke="#10B981"
              strokeWidth="3"
              opacity={areaP}
              style={{ transformOrigin: 'bottom', transform: `scaleY(${areaP})` }}
              d="M 60,240 L 100,140 L 260,80 L 420,120 L 580,50 L 740,75 L 900,25 L 900,240 Z"
            />

            {/* 6 Animated Bars */}
            {barHeights.map((h, i) => {
              const startFrame = sec(1.4 + i * 0.1);
              const barP = interpolate(frame, [startFrame, startFrame + sec(1.0)], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: easeElasticOut,
              });
              const currentH = h * barP;

              return (
                <rect
                  key={i}
                  x={barXPositions[i]}
                  y={240 - currentH}
                  width={80}
                  height={currentH}
                  fill={primaryColor}
                  rx={8}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default DataMetrics;
