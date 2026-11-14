import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * ActionFlow — 100% Exact Remotion Port of `assets/kinet-flow.html`.
 * Continuous action vector flow across a unified 3840px wide world:
 *  - Zone 1 (0.0s - 3.2s): Hero orb landing with elastic squash & stretch, shockwave, Zone 1 title unroll, floating chips, orbital dashed rings.
 *  - Continuous 3D Flight (3.2s - 4.45s): World travels X: 0 -> -1920px with 3D horizon banking (rotateY -14deg, rotateZ 2.2deg, z: 130px), orb leans forward.
 *  - Zone 2 Climax Arrival (4.45s - 6.0s): 3D settling, massive 3.4x shockwave burst, Zone 2 title unroll.
 */
export type ActionFlowProps = {
  zone1Title?: string;
  zone1Highlight?: string;
  zone1Desc?: string;
  zone2Title?: string;
  zone2Highlight?: string;
  zone2Desc?: string;
  chip1Text?: string;
  chip2Text?: string;
  primaryColor?: string;
  backgroundColor?: string;
};

export const ActionFlow: React.FC<ActionFlowProps> = ({
  zone1Title = 'From Static Code to ',
  zone1Highlight = 'Fluid Cinema',
  zone1Desc = 'Motion graphics that breathe in real 3D space with continuous physics.',
  zone2Title = 'Zero PowerPoint Fades. ',
  zone2Highlight = 'Infinite Momentum.',
  zone2Desc = 'Persistent hero objects traversing across unified worlds without jump cuts.',
  chip1Text = 'FPS: 60 BROADCAST',
  chip2Text = 'VELOCITY: 3840PX/S',
  primaryColor = '#A855F7',
  backgroundColor = '#07050A',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sec = (s: number) => Math.round(s * fps);

  // GSAP Equivalents
  const easeElastic = Easing.elastic(0.4);
  const easePower4Out = Easing.bezier(0.16, 1, 0.3, 1);
  const easeBackOut2 = Easing.bezier(0.175, 0.885, 0.32, 1.4);
  const easePower3InOut = Easing.bezier(0.645, 0.045, 0.355, 1);
  const easePower2Out = Easing.bezier(0.25, 0.46, 0.45, 0.94);

  // 1. Hero Orb Arrival (0.2s - 0.75s)
  const orbArrivalP = interpolate(frame, [sec(0.2), sec(0.75)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeElastic,
  });
  const orbY = interpolate(orbArrivalP, [0, 1], [-220, 0]);
  const orbScaleX = interpolate(orbArrivalP, [0, 1], [0.65, 1]);
  const orbScaleY = interpolate(orbArrivalP, [0, 1], [1.45, 1]);
  const orbOpacity = interpolate(frame, [sec(0.2), sec(0.35)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Shockwave 1 (0.35s - 0.8s)
  const shock1Scale = interpolate(frame, [sec(0.35), sec(0.8)], [0.5, 2.2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower2Out });
  const shock1Opacity = interpolate(frame, [sec(0.35), sec(0.8)], [0.9, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // 2. Zone 1 Title Unroll (0.50s - 1.02s)
  const t1P = interpolate(frame, [sec(0.50), sec(1.02)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });
  const t1Opacity = t1P;
  const t1Y = interpolate(t1P, [0, 1], [45, 0]);
  const t1RotX = interpolate(t1P, [0, 1], [30, 0]);

  // 3. Telemetry Chips Pop (0.70s and 0.82s)
  const chip1P = interpolate(frame, [sec(0.70), sec(1.12)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeBackOut2 });
  const chip2P = interpolate(frame, [sec(0.82), sec(1.24)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeBackOut2 });

  // 4. Orbital Rings Spin (1.4s onwards)
  const ringsOpacity = interpolate(frame, [sec(1.4), sec(2.0)], [0, 0.8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ring1Rot = (frame * 1.5) % 360;
  const ring2Rot = -(frame * 1.5) % 360;

  // 5. 3D Flight Traveling Across Unified World (3.20s - 4.45s)
  const travelP = interpolate(frame, [sec(3.20), sec(4.45)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3InOut,
  });
  const worldX = interpolate(travelP, [0, 1], [0, -1920]);

  // Horizon banking tilt (banks during transit, restores at 4.35s - 4.80s)
  const bankP = interpolate(frame, [sec(3.20), sec(3.80), sec(4.45)], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const worldRotY = bankP * -14;
  const worldRotZ = bankP * 2.2;
  const worldZ = bankP * 130;

  // Hero Orb distortion during flight (leans forward)
  const orbFlightLean = interpolate(frame, [sec(3.20), sec(3.80), sec(4.45)], [0, -22, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 6. Zone 2 Arrival Climax (4.45s - 5.00s)
  const t2P = interpolate(frame, [sec(4.45), sec(4.97)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });
  const t2Opacity = t2P;
  const t2Y = interpolate(t2P, [0, 1], [45, 0]);
  const t2RotX = interpolate(t2P, [0, 1], [-30, 0]);

  // Shockwave 2 (4.45s - 5.10s)
  const shock2Scale = interpolate(frame, [sec(4.45), sec(5.10)], [0.4, 3.4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower2Out });
  const shock2Opacity = interpolate(frame, [sec(4.45), sec(5.10)], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        overflow: 'hidden',
        color: '#FFF',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
      }}
    >
      {/* Perspective Stage */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 1920,
          height: 1080,
          marginLeft: -960,
          marginTop: -540,
          overflow: 'hidden',
          perspective: 1400,
        }}
      >
        {/* World Container (3840px wide, 2 continuous zones) */}
        <div
          style={{
            position: 'absolute',
            width: 3840,
            height: 1080,
            left: 0,
            top: 0,
            display: 'flex',
            transformStyle: 'preserve-3d',
            transformOrigin: '960px 540px -200px',
            transform: `translate3d(${worldX}px, 0px, ${worldZ}px) rotateY(${worldRotY}deg) rotateZ(${worldRotZ}deg)`,
            willChange: 'transform',
          }}
        >
          {/* ZONE 1 */}
          <div
            style={{
              width: 1920,
              height: 1080,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 100px',
            }}
          >
            {/* Floating Chip 1 */}
            <div
              style={{
                position: 'absolute',
                top: 240,
                left: 320,
                background: 'rgba(24, 24, 27, 0.85)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: 12,
                padding: '10px 18px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                opacity: chip1P,
                transform: `translateY(${interpolate(chip1P, [0, 1], [35, 0])}px) scale(${interpolate(chip1P, [0, 1], [0.8, 1])})`,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: primaryColor, boxShadow: `0 0 12px ${primaryColor}` }} />
              <span>{chip1Text}</span>
            </div>

            {/* Floating Chip 2 */}
            <div
              style={{
                position: 'absolute',
                top: 280,
                right: 320,
                background: 'rgba(24, 24, 27, 0.85)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: 12,
                padding: '10px 18px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                opacity: chip2P,
                transform: `translateY(${interpolate(chip2P, [0, 1], [35, 0])}px) scale(${interpolate(chip2P, [0, 1], [0.8, 1])})`,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: primaryColor, boxShadow: `0 0 12px ${primaryColor}` }} />
              <span>{chip2Text}</span>
            </div>

            {/* Title 1 */}
            <h1
              style={{
                fontSize: 72,
                fontWeight: 800,
                lineHeight: 1.15,
                marginTop: 180,
                opacity: t1Opacity,
                transform: `translateY(${t1Y}px) rotateX(${t1RotX}deg)`,
              }}
            >
              {zone1Title}
              <span style={{ color: primaryColor, textShadow: '0 0 30px rgba(168, 85, 247, 0.4)' }}>{zone1Highlight}</span>
            </h1>

            <p style={{ fontSize: 24, color: '#94A3B8', maxWidth: 800, lineHeight: 1.6, marginTop: 24, opacity: t1Opacity }}>
              {zone1Desc}
            </p>
          </div>

          {/* ZONE 2 */}
          <div
            style={{
              width: 1920,
              height: 1080,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 100px',
            }}
          >
            {/* Title 2 */}
            <h1
              style={{
                fontSize: 72,
                fontWeight: 800,
                lineHeight: 1.15,
                marginTop: 180,
                opacity: t2Opacity,
                transform: `translateY(${t2Y}px) rotateX(${t2RotX}deg)`,
              }}
            >
              {zone2Title}
              <span style={{ color: primaryColor, textShadow: '0 0 30px rgba(168, 85, 247, 0.4)' }}>{zone2Highlight}</span>
            </h1>

            <p style={{ fontSize: 24, color: '#94A3B8', maxWidth: 800, lineHeight: 1.6, marginTop: 24, opacity: t2Opacity }}>
              {zone2Desc}
            </p>
          </div>
        </div>

        {/* Persistent Traveling Hero Orb (Stays centered, anchors visual continuity) */}
        <div
          style={{
            position: 'absolute',
            left: 960,
            top: 380,
            transform: `translate(-50%, -50%) translateY(${orbY}px) rotateZ(${orbFlightLean}deg) scale(${orbScaleX}, ${orbScaleY})`,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #C084FC, #7E22CE)',
            boxShadow: '0 0 60px rgba(168, 85, 247, 0.55)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: orbOpacity,
          }}
        >
          {/* Orbital Dashed Rings */}
          <div
            style={{
              position: 'absolute',
              width: 220,
              height: 220,
              borderRadius: '50%',
              border: '2px dashed rgba(168, 85, 247, 0.5)',
              transform: `rotate(${ring1Rot}deg)`,
              opacity: ringsOpacity,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 320,
              height: 320,
              borderRadius: '50%',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              transform: `rotate(${ring2Rot}deg)`,
              opacity: ringsOpacity,
              pointerEvents: 'none',
            }}
          />

          <svg style={{ width: 70, height: 70, stroke: '#FFF', strokeWidth: 2, fill: 'none' }} viewBox="0 0 24 24">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>

        {/* Shockwave Burst 1 */}
        <div
          style={{
            position: 'absolute',
            left: 960,
            top: 380,
            width: 140,
            height: 140,
            borderRadius: '50%',
            border: `2px solid ${primaryColor}`,
            boxShadow: '0 0 24px rgba(168, 85, 247, 0.4)',
            transform: `translate(-50%, -50%) scale(${shock1Scale})`,
            opacity: shock1Opacity,
            pointerEvents: 'none',
          }}
        />

        {/* Shockwave Burst 2 (Zone 2 Arrival) */}
        <div
          style={{
            position: 'absolute',
            left: 960,
            top: 380,
            width: 140,
            height: 140,
            borderRadius: '50%',
            border: `2px solid ${primaryColor}`,
            boxShadow: '0 0 24px rgba(168, 85, 247, 0.4)',
            transform: `translate(-50%, -50%) scale(${shock2Scale})`,
            opacity: shock2Opacity,
            pointerEvents: 'none',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default ActionFlow;
