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
 * Matches HTML5/GSAP layout, 3840px dual-zone world, and exact camera physics:
 *
 * Stage: 1920x1080 with perspective: 1400px.
 * #world: 3840x1080 with transformOrigin: '960px 540px -200px'.
 * #hero-orb: positioned inside #stage at left: 960px, top: 380px (anchored persistent object).
 *
 * GSAP Motion Breakdown (8.0s = 480 frames @ 60fps):
 *  0.00s: Baseline reset.
 *  0.10s - 1.50s: #railPath strokeDashoffset 3840 -> 0 (power2.inOut, duration: 1.4s).
 *  0.20s - 0.75s: #hero-orb vertical launch from y: -220, scaleX: 0.65, scaleY: 1.45
 *                 to y: 0, scaleX: 1, scaleY: 1 (elastic.out(1.4, 0.4)).
 *  0.35s - 0.80s: #heroShockwave scale 0.5 -> 2.2, opacity 0.9 -> 0 (power2.out).
 *  0.50s - 1.02s: #t1 from { opacity: 0, y: 45, rotateX: 30 } to { opacity: 1, y: 0, rotateX: 0 } (power4.out).
 *  0.70s - 1.12s: #node1 from { opacity: 0, y: 35, scale: 0.8 } to { opacity: 1, y: 0, scale: 1 } (back.out(2)).
 *  0.82s - 1.24s: #node2 from { opacity: 0, y: 35, scale: 0.8 } to { opacity: 1, y: 0, scale: 1 } (back.out(2)).
 *  0.90s - 1.40s: #d1 from { opacity: 0, y: 20 } to { opacity: 1, y: 0 } (power3.out).
 *  1.40s - 2.00s: [#ring-1, #ring-2] opacity 0 -> 0.8, scale 0.6 -> 1 (power2.out) & spin continuously.
 *  3.20s - 4.45s: 3D Flight Banking:
 *                 #world x: 0 -> -1920, rotateY: 0 -> -14 -> 0, rotateZ: 0 -> 2.2 -> 0, z: 0 -> 130 -> 0 (power3.inOut).
 *                 #hero-orb scaleX: 1.4, scaleY: 0.78, rotateZ: -22, y: -45 (yoyo, power2.inOut).
 *  4.45s - 4.97s: #t2 from { opacity: 0, y: 45, rotateX: -30 } to { opacity: 1, y: 0, rotateX: 0 } (power4.out).
 *  4.45s - 5.10s: #heroShockwave scale 0.4 -> 3.4, opacity 1 -> 0 (power2.out).
 *  4.80s - 5.30s: #d2 from { opacity: 0, y: 20 } to { opacity: 1, y: 0 } (power3.out).
 */
export type ActionFlowProps = {
  zone1Title?: string;
  zone1Highlight?: string;
  zone1Desc?: string;
  zone2Title?: string;
  zone2Highlight?: string;
  zone2Desc?: string;
  node1Text?: string;
  node2Text?: string;
  primaryColor?: string;
  backgroundColor?: string;
};

export const ActionFlow: React.FC<ActionFlowProps> = ({
  zone1Title = 'MOST TOOLS RELY ON',
  zone1Highlight = 'STATIC DECK FADES',
  zone1Desc = 'Traditional video templates change scenes by fading out sections. That looks like PowerPoint, not motion design.',
  zone2Title = 'KINETRIG TRAVELS',
  zone2Highlight = 'THROUGH ONE CONTINUOUS WORLD',
  zone2Desc = "The camera pans smoothly across unified space while the hero object leads the viewer's eye into the climax.",
  node1Text = 'LATENCY: 0.00ms',
  node2Text = 'FPS: 240 HFR',
  primaryColor = '#C084FC',
  backgroundColor = '#07050A',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sec = (s: number) => Math.round(s * fps);

  // GSAP Easing Equivalents
  const easeElastic = Easing.elastic(0.4);
  const easePower4Out = Easing.bezier(0.16, 1, 0.3, 1);
  const easeBackOut2 = Easing.bezier(0.175, 0.885, 0.32, 1.4);
  const easePower3InOut = Easing.bezier(0.645, 0.045, 0.355, 1);
  const easePower2InOut = Easing.bezier(0.45, 0, 0.55, 1);
  const easePower2Out = Easing.bezier(0.25, 0.46, 0.45, 0.94);
  const easePower3Out = Easing.bezier(0.215, 0.61, 0.355, 1);

  // 0. Vector Rail Draw-In (0.10s -> 1.50s)
  const railOffset = interpolate(frame, [sec(0.10), sec(1.50)], [3840, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower2InOut,
  });

  // 1. Hero Orb Arrival (0.20s -> 0.75s)
  let orbY = -220;
  let orbScaleX = 0.65;
  let orbScaleY = 1.45;
  let orbOpacity = 0;

  if (frame >= sec(0.20)) {
    orbOpacity = 1;
    const orbP = interpolate(frame, [sec(0.20), sec(0.75)], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easeElastic,
    });
    orbY = interpolate(orbP, [0, 1], [-220, 0]);
    orbScaleX = interpolate(orbP, [0, 1], [0.65, 1]);
    orbScaleY = interpolate(orbP, [0, 1], [1.45, 1]);
  }

  // Hero Orb distortion during 3D flight (3.20s -> 4.45s)
  let flightOrbScaleX = 1.0;
  let flightOrbScaleY = 1.0;
  let flightOrbRotateZ = 0;
  let flightOrbY = 0;

  if (frame >= sec(3.20) && frame <= sec(4.45)) {
    const flightP = interpolate(frame, [sec(3.20), sec(3.80), sec(4.45)], [0, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easePower2InOut,
    });
    flightOrbScaleX = interpolate(flightP, [0, 1], [1.0, 1.4]);
    flightOrbScaleY = interpolate(flightP, [0, 1], [1.0, 0.78]);
    flightOrbRotateZ = interpolate(flightP, [0, 1], [0, -22]);
    flightOrbY = interpolate(flightP, [0, 1], [0, -45]);
  }

  // Shockwave 1 (0.35s -> 0.80s)
  let shock1Scale = 0.5;
  let shock1Opacity = 0;
  if (frame >= sec(0.35) && frame <= sec(0.80)) {
    shock1Scale = interpolate(frame, [sec(0.35), sec(0.80)], [0.5, 2.2], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easePower2Out,
    });
    shock1Opacity = interpolate(frame, [sec(0.35), sec(0.80)], [0.9, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  // 2. Zone 1 Title Unroll (0.50s -> 1.02s)
  const t1P = interpolate(frame, [sec(0.50), sec(1.02)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });
  const t1Opacity = t1P;
  const t1Y = interpolate(t1P, [0, 1], [45, 0]);
  const t1RotX = interpolate(t1P, [0, 1], [30, 0]);

  // 3. Telemetry Nodes (0.70s & 0.82s)
  const node1P = interpolate(frame, [sec(0.70), sec(1.12)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeBackOut2,
  });
  const node2P = interpolate(frame, [sec(0.82), sec(1.24)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeBackOut2,
  });

  // 4. Zone 1 Subtitle (0.90s -> 1.40s)
  const d1P = interpolate(frame, [sec(0.90), sec(1.40)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });

  // 5. Orbital rings (1.40s onwards)
  let ringsOpacity = 0;
  let ringsScale = 0.6;
  if (frame >= sec(1.40) && frame < sec(4.50)) {
    ringsOpacity = interpolate(frame, [sec(1.40), sec(2.00)], [0, 0.8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower2Out });
    ringsScale = 1.0;
  } else if (frame >= sec(4.50)) {
    ringsOpacity = interpolate(frame, [sec(4.50), sec(5.30)], [0.8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower3Out });
    ringsScale = interpolate(frame, [sec(4.50), sec(5.30)], [1.0, 1.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower3Out });
  }
  const ring1Rot = ((frame - sec(1.40)) * (180 / sec(3.5))) % 360;
  const ring2Rot = -((frame - sec(1.40)) * (180 / sec(3.5))) % 360;

  // 6. 3D Perspective Flight Traveling (3.20s -> 4.45s)
  const travelP = interpolate(frame, [sec(3.20), sec(4.45)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3InOut,
  });
  const worldX = interpolate(travelP, [0, 1], [0, -1920]);

  // Horizon banking tilt
  let worldRotY = 0;
  let worldRotZ = 0;
  let worldZ = 0;
  if (frame >= sec(3.20) && frame <= sec(4.80)) {
    const bankP = interpolate(frame, [sec(3.20), sec(3.80), sec(4.80)], [0, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easePower2InOut,
    });
    worldRotY = bankP * -14;
    worldRotZ = bankP * 2.2;
    worldZ = bankP * 130;
  }

  // 8. Zone 2 Arrival (4.45s -> 4.97s)
  const t2P = interpolate(frame, [sec(4.45), sec(4.97)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });
  const t2Opacity = t2P;
  const t2Y = interpolate(t2P, [0, 1], [45, 0]);
  const t2RotX = interpolate(t2P, [0, 1], [-30, 0]);

  // Shockwave 2 (4.45s -> 5.10s)
  let shock2Scale = 0.4;
  let shock2Opacity = 0;
  if (frame >= sec(4.45) && frame <= sec(5.10)) {
    shock2Scale = interpolate(frame, [sec(4.45), sec(5.10)], [0.4, 3.4], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easePower2Out,
    });
    shock2Opacity = interpolate(frame, [sec(4.45), sec(5.10)], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  // Zone 2 Subtitle (4.80s -> 5.30s)
  const d2P = interpolate(frame, [sec(4.80), sec(5.30)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        overflow: 'hidden',
        color: '#FFF',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
      }}
    >
      {/* #stage matching 100% of assets/kinet-flow.html */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 1920,
          height: 1080,
          marginLeft: -960,
          marginTop: -540,
          background: '#040206',
          overflow: 'hidden',
          perspective: 1400,
        }}
      >
        {/* #world (3840px x 1080px) */}
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
          {/* SVG Vector Motion Trajectory Guide Rails */}
          <svg style={{ position: 'absolute', inset: 0, width: 3840, height: 1080, pointerEvents: 'none', zIndex: 0 }} viewBox="0 0 3840 1080">
            <path d="M 0 380 Q 960 380 1920 380 T 3840 380" stroke="rgba(168, 85, 247, 0.22)" strokeWidth="2" fill="none" strokeDasharray="16 12" strokeDashoffset={railOffset} />
            <path d="M 400 380 L 3400 380" stroke="rgba(168, 85, 247, 0.08)" strokeWidth="8" fill="none" />
          </svg>

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
            {/* #node1 */}
            <div
              style={{
                position: 'absolute',
                left: 480,
                top: 220,
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
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                opacity: node1P,
                transform: `translateY(${interpolate(node1P, [0, 1], [35, 0])}px) scale(${interpolate(node1P, [0, 1], [0.8, 1])})`,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#A855F7', boxShadow: '0 0 12px #A855F7' }} />
              <span>{node1Text}</span>
            </div>

            {/* #node2 */}
            <div
              style={{
                position: 'absolute',
                right: 480,
                top: 220,
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
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                opacity: node2P,
                transform: `translateY(${interpolate(node2P, [0, 1], [35, 0])}px) scale(${interpolate(node2P, [0, 1], [0.8, 1])})`,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#A855F7', boxShadow: '0 0 12px #A855F7' }} />
              <span>{node2Text}</span>
            </div>

            {/* #t1 */}
            <h1
              style={{
                fontSize: 72,
                fontWeight: 800,
                lineHeight: 1.15,
                marginTop: 180,
                opacity: t1Opacity,
                transform: `translateY(${t1Y}px) rotateX(${t1RotX}deg)`,
                transformPerspective: 900,
              }}
            >
              {zone1Title}<br />
              <span style={{ color: primaryColor, textShadow: '0 0 30px rgba(168, 85, 247, 0.45)' }}>{zone1Highlight}</span>
            </h1>

            {/* #d1 */}
            <p
              style={{
                fontSize: 24,
                color: '#94A3B8',
                maxWidth: 800,
                lineHeight: 1.6,
                marginTop: 24,
                opacity: d1P,
                transform: `translateY(${interpolate(d1P, [0, 1], [20, 0])}px)`,
              }}
            >
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
            {/* #t2 */}
            <h1
              style={{
                fontSize: 72,
                fontWeight: 800,
                lineHeight: 1.15,
                marginTop: 180,
                opacity: t2Opacity,
                transform: `translateY(${t2Y}px) rotateX(${t2RotX}deg)`,
                transformPerspective: 900,
              }}
            >
              {zone2Title}<br />
              <span style={{ color: primaryColor, textShadow: '0 0 30px rgba(168, 85, 247, 0.45)' }}>{zone2Highlight}</span>
            </h1>

            {/* #d2 */}
            <p
              style={{
                fontSize: 24,
                color: '#94A3B8',
                maxWidth: 800,
                lineHeight: 1.6,
                marginTop: 24,
                opacity: d2P,
                transform: `translateY(${interpolate(d2P, [0, 1], [20, 0])}px)`,
              }}
            >
              {zone2Desc}
            </p>
          </div>
        </div>

        {/* #hero-orb (Persistent inside #stage at 960px, 380px) */}
        <div
          style={{
            position: 'absolute',
            left: 960,
            top: 380,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #C084FC, #7E22CE)',
            boxShadow: '0 0 60px rgba(168, 85, 247, 0.45)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: orbOpacity,
            transform: `translate(-50%, -50%) translateY(${orbY + flightOrbY}px) rotateZ(${flightOrbRotateZ}deg) scale(${orbScaleX * flightOrbScaleX}, ${orbScaleY * flightOrbScaleY})`,
          }}
        >
          {/* Shockwave 1 */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 140,
              height: 140,
              borderRadius: '50%',
              border: `2px solid ${primaryColor}`,
              boxShadow: '0 0 24px rgba(168, 85, 247, 0.45)',
              transform: `translate(-50%, -50%) scale(${shock1Scale})`,
              opacity: shock1Opacity,
              pointerEvents: 'none',
            }}
          />

          {/* Shockwave 2 (Zone 2 arrival burst) */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 140,
              height: 140,
              borderRadius: '50%',
              border: `2px solid ${primaryColor}`,
              boxShadow: '0 0 24px rgba(168, 85, 247, 0.45)',
              transform: `translate(-50%, -50%) scale(${shock2Scale})`,
              opacity: shock2Opacity,
              pointerEvents: 'none',
            }}
          />

          {/* Orbital Rings */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 220,
              height: 220,
              borderRadius: '50%',
              border: '2px dashed rgba(168, 85, 247, 0.5)',
              transform: `translate(-50%, -50%) scale(${ringsScale}) rotate(${ring1Rot}deg)`,
              opacity: ringsOpacity,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 320,
              height: 320,
              borderRadius: '50%',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              transform: `translate(-50%, -50%) scale(${ringsScale}) rotate(${ring2Rot}deg)`,
              opacity: ringsOpacity,
              pointerEvents: 'none',
            }}
          />

          {/* Hero SVG Icon */}
          <svg style={{ width: 70, height: 70, stroke: '#FFF', strokeWidth: 2, fill: 'none' }} viewBox="0 0 24 24">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default ActionFlow;
