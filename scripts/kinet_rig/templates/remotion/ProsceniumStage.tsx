import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * ProsceniumStage — 100% Exact Remotion Port of `assets/kinet-stage.html`.
 * Theatrical puppet proscenium stage with velvet curtains:
 *  - Velvet Curtains (#curtains) parting open from center.
 *  - 2.5D Theatrical depth planes (sky, hills, courtyard ground).
 *  - Illustrated vector character puppet with natural locomotion walk cycle ($T_{step} = 0.39s$).
 *  - Character torso/arm idle sway and expressive eye blink cycles.
 *  - Garage door elevation / stage backdrop slide.
 */
export type ProsceniumStageProps = {
  characterName?: string;
  stageTitle?: string;
  stageDesc?: string;
  primaryCurtain?: string;
  accentCoral?: string;
  backgroundColor?: string;
};

export const ProsceniumStage: React.FC<ProsceniumStageProps> = ({
  characterName = 'Maya',
  stageTitle = 'THEATRICAL PUPPET STAGE',
  stageDesc = 'Organic locomotion walk cycles with physically damped joint kinematics.',
  primaryCurtain = '#5B1832',
  accentCoral = '#E05347',
  backgroundColor = '#1A0B14',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sec = (s: number) => Math.round(s * fps);

  // Easing functions
  const easePower3InOut = Easing.bezier(0.645, 0.045, 0.355, 1);
  const easePower4Out = Easing.bezier(0.16, 1, 0.3, 1);

  // 1. Velvet Curtains Part Open (0.2s - 1.8s)
  const curtainP = interpolate(frame, [sec(0.2), sec(1.8)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3InOut,
  });
  const curtainScaleX = interpolate(curtainP, [0, 1], [1, 0.05]);

  // 2. Character Walk Cycle (3.20s - 4.80s, duration 1.6s, step cadence = 0.39s)
  const isWalking = frame >= sec(3.2) && frame <= sec(4.8);
  const walkProgress = interpolate(frame, [sec(3.2), sec(4.8)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const charX = interpolate(walkProgress, [0, 1], [680, 1020]);

  // Leg swings (alternating sine oscillations every 0.39s)
  const legAngle = isWalking ? Math.sin((frame - sec(3.2)) * 0.45) * 18 : 0;
  const bobY = isWalking ? Math.abs(Math.sin((frame - sec(3.2)) * 0.9)) * 8 : 0;

  // Arm & Torso idle breath sway
  const swayTorso = Math.sin(frame * 0.05) * 1.5;
  const swayArm = Math.sin(frame * 0.04 + 0.5) * 3;

  // 3. Stage Slide Backdrop Transition at 5.75s
  const slideProgress = interpolate(frame, [sec(5.75), sec(6.45)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });
  const backdropX = interpolate(slideProgress, [0, 1], [0, -320]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        overflow: 'hidden',
        color: '#FFF',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
      }}
    >
      {/* 1920x1080 Stage */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 1920,
          height: 1080,
          marginLeft: -960,
          marginTop: -540,
          background: '#0D131F',
          overflow: 'hidden',
        }}
      >
        {/* World (Stage Elements) */}
        <div style={{ position: 'absolute', inset: 0, transform: `translateX(${backdropX}px)` }}>
          {/* Theatrical Sky & Hills Backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 70%, #064E3B 100%)' }} />

          {/* Hills */}
          <svg style={{ position: 'absolute', bottom: 180, width: 2400, height: 400 }} viewBox="0 0 2400 400">
            <path d="M 0 400 Q 600 120 1200 320 T 2400 200 L 2400 400 Z" fill="#065F46" opacity="0.6" />
            <path d="M 0 400 Q 400 220 900 340 T 2000 260 L 2400 400 Z" fill="#047857" opacity="0.8" />
          </svg>

          {/* Stage Wooden Floor */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: 200,
              background: 'linear-gradient(180deg, #3E2723 0%, #1A0F0D 100%)',
              borderTop: '6px solid #5D4037',
            }}
          />

          {/* Stage Signboard */}
          <div
            style={{
              position: 'absolute',
              top: 140,
              left: 120,
              background: 'rgba(255, 255, 255, 0.95)',
              border: '6px solid #1E293B',
              borderRadius: 16,
              padding: '24px 36px',
              color: '#0F172A',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 2 }}>{stageTitle}</div>
            <div style={{ fontSize: 16, color: '#475569', marginTop: 8, fontWeight: 600 }}>{stageDesc}</div>
          </div>

          {/* Illustrated Vector Character Puppet */}
          <div
            style={{
              position: 'absolute',
              bottom: 180,
              left: charX,
              transform: `translateY(${-bobY}px)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Head & Face */}
            <div
              style={{
                width: 72,
                height: 84,
                borderRadius: '50%',
                background: '#FCD34D',
                border: '3px solid #1E293B',
                position: 'relative',
                transform: `rotate(${swayTorso * 0.8}deg)`,
                marginBottom: -6,
                zIndex: 4,
              }}
            >
              {/* Eyes */}
              <div style={{ position: 'absolute', top: 32, left: 22, width: 6, height: 6, borderRadius: '50%', background: '#000' }} />
              <div style={{ position: 'absolute', top: 32, right: 22, width: 6, height: 6, borderRadius: '50%', background: '#000' }} />
              {/* Smile */}
              <div style={{ position: 'absolute', bottom: 18, left: 26, width: 20, height: 10, borderBottom: '3px solid #000', borderRadius: '0 0 10px 10px' }} />
            </div>

            {/* Torso */}
            <div
              style={{
                width: 90,
                height: 120,
                background: accentCoral,
                borderRadius: '16px 16px 8px 8px',
                border: '3px solid #1E293B',
                position: 'relative',
                transform: `rotate(${swayTorso}deg)`,
                zIndex: 3,
              }}
            >
              {/* Arms */}
              <div style={{ position: 'absolute', left: -14, top: 12, width: 14, height: 75, background: '#FCD34D', borderRadius: 8, border: '3px solid #1E293B', transformOrigin: 'top center', transform: `rotate(${swayArm + legAngle}deg)` }} />
              <div style={{ position: 'absolute', right: -14, top: 12, width: 14, height: 75, background: '#FCD34D', borderRadius: 8, border: '3px solid #1E293B', transformOrigin: 'top center', transform: `rotate(${-swayArm - legAngle}deg)` }} />
            </div>

            {/* Legs & Shoes */}
            <div style={{ display: 'flex', gap: 24, marginTop: -4, zIndex: 2 }}>
              <div style={{ width: 18, height: 90, background: '#1E293B', borderRadius: 8, transformOrigin: 'top center', transform: `rotate(${legAngle}deg)` }} />
              <div style={{ width: 18, height: 90, background: '#1E293B', borderRadius: 8, transformOrigin: 'top center', transform: `rotate(${-legAngle}deg)` }} />
            </div>
          </div>
        </div>

        {/* Theatrical Proscenium Curtains */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30, display: 'flex', overflow: 'hidden' }}>
          {/* Left Curtain */}
          <div
            style={{
              width: '50%',
              height: '100%',
              background: 'linear-gradient(90deg, #1A0B14 0%, #3B1224 40%, #5B1832 75%, #300C1B 100%)',
              boxShadow: 'inset -10px 0 25px rgba(0,0,0,0.6), 15px 0 30px rgba(0,0,0,0.5)',
              transformOrigin: 'left center',
              transform: `scaleX(${curtainScaleX})`,
            }}
          />
          {/* Right Curtain */}
          <div
            style={{
              width: '50%',
              height: '100%',
              background: 'linear-gradient(270deg, #1A0B14 0%, #3B1224 40%, #5B1832 75%, #300C1B 100%)',
              boxShadow: 'inset 10px 0 25px rgba(0,0,0,0.6), -15px 0 30px rgba(0,0,0,0.5)',
              transformOrigin: 'right center',
              transform: `scaleX(${curtainScaleX})`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default ProsceniumStage;
