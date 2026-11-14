import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * SaasMacro — Remotion port of `assets/kinet-saas-macro.html`.
 * Realistic SaaS browser viewport with dynamic charts, telemetry pills, and 3D camera pan.
 */
export type SaasMacroProps = {
  headline?: string;
  metricLabel?: string;
  metricValue?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
};

export const SaasMacro: React.FC<SaasMacroProps> = ({
  headline = 'AUTONOMOUS REVENUE ORCHESTRATION',
  metricLabel = 'ACTIVE MRR PIPELINE',
  metricValue = '$148,200',
  primaryColor = '#38BDF8',
  accentColor = '#10B981',
  backgroundColor = '#0B0F19',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Subtle 3D camera rotation and zoom into the chart
  const scale = interpolate(frame, [0, durationInFrames], [0.95, 1.05], { extrapolateRight: 'clamp' });
  const rotateX = interpolate(frame, [0, durationInFrames], [4, 1], { extrapolateRight: 'clamp' });

  // Chart drawing animation
  const chartProgress = interpolate(frame, [15, 75], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 1200,
        overflow: 'hidden',
      }}
    >
      {/* 3D Browser Chassis */}
      <div
        style={{
          width: 1320,
          height: 780,
          backgroundColor: '#0F172A',
          borderRadius: 24,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 50px rgba(56, 189, 248, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transform: `scale(${scale}) rotateX(${rotateX}deg)`,
        }}
      >
        {/* Browser Top Bar */}
        <div
          style={{
            height: 52,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F59E0B' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }} />
          <div
            style={{
              marginLeft: 24,
              flex: 1,
              maxWidth: 480,
              height: 32,
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              fontSize: 12,
              color: '#94A3B8',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            https://app.kinetrig.io/analytics
          </div>
        </div>

        {/* Browser Content */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr', padding: 36, gap: 32 }}>
          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '14px 20px', borderRadius: 12, background: 'rgba(56, 189, 248, 0.12)', color: primaryColor, fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.25)' }}>
              Analytics Overview
            </div>
            <div style={{ padding: '14px 20px', borderRadius: 12, color: '#64748B', fontWeight: 600 }}>
              Live Pipelines
            </div>
            <div style={{ padding: '14px 20px', borderRadius: 12, color: '#64748B', fontWeight: 600 }}>
              Agent Automations
            </div>
          </div>

          {/* Main Chart Panel */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              borderRadius: 20,
              border: '1px solid rgba(56, 189, 248, 0.2)',
              padding: 36,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', marginBottom: 8 }}>
                {metricLabel}
              </div>
              <div style={{ fontSize: 44, fontWeight: 900, color: '#FFF', marginBottom: 12 }}>
                {metricValue}
              </div>
              <div style={{ fontSize: 16, color: primaryColor, fontWeight: 600 }}>
                {headline}
              </div>
            </div>

            {/* Simulated Dynamic Metric Waveform/Line */}
            <svg style={{ width: '100%', height: 220, overflow: 'visible' }}>
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primaryColor} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 160 Q 200 40 400 120 T 800 50"
                fill="none"
                stroke={primaryColor}
                strokeWidth={5}
                strokeDasharray={1000}
                strokeDashoffset={interpolate(chartProgress, [0, 1], [1000, 0])}
                style={{ filter: `drop-shadow(0 0 16px ${primaryColor})` }}
              />
            </svg>

            {/* Bottom Status Ribbon */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 16,
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span style={{ fontSize: 13, color: '#94A3B8' }}>REALTIME AGENT TELEMETRY</span>
              <span style={{ fontSize: 13, color: accentColor, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                LIVE FEED • 60 FPS
              </span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default SaasMacro;
