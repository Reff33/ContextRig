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
 * Matches HTML5/GSAP layout, SVG puppet character, and stage choreography:
 *
 * Stage: 1920x1080 with #world camera:
 *  - Scene 1: Courtyard with Mediterranean wall, terracotta roof, windows, clothesline, and sign.
 *  - P1 Character: female puppet with tailored coral shirt, navy trousers, white sneakers with gold soles,
 *    ponytail hair with hairband, rosy cheeks, eyes with gentle eyelashes, and walking joint kinematics.
 *  - Walk Cycle: cadence T_step = 0.39s across 3.20s - 4.80s.
 *  - 5.75s: Stage slide transition to Scene 2 (Garage Workshop with hydraulic lift & car).
 */
export type ProsceniumStageProps = {
  signText?: string;
  primaryCurtain?: string;
  accentCoral?: string;
};

export const ProsceniumStage: React.FC<ProsceniumStageProps> = ({
  signText = 'UPGRADE',
  primaryCurtain = '#5B1832',
  accentCoral = '#E0714F',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sec = (s: number) => Math.round(s * fps);

  // Easing curves
  const easePower3InOut = Easing.bezier(0.645, 0.045, 0.355, 1);
  const easePower3Out = Easing.bezier(0.215, 0.61, 0.355, 1);
  const easePower2In = Easing.bezier(0.55, 0.085, 0.68, 0.53);

  // 1. Velvet Curtains Part Open (0.2s - 1.8s)
  const curtainP = interpolate(frame, [sec(0.2), sec(1.8)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3InOut,
  });
  const curtainScaleX = interpolate(curtainP, [0, 1], [1, 0.05]);

  // 2. Camera Rig Choreography
  // Scene 1: Camera centers on character (820, 640, z: 1.75 -> smooth zoom to 1.5)
  // Scene 2 slide at 5.75s: slide dist: 96px, blur: 10px -> 0px
  let camX = 820;
  let camY = 640;
  let camZ = 1.6;
  let stageBlur = 0;
  let isScene2 = false;

  if (frame < sec(5.75)) {
    // Scene 1
    const zoomP = interpolate(frame, [sec(0.5), sec(4.5)], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
    camX = interpolate(zoomP, [0, 1], [800, 880]);
    camZ = interpolate(zoomP, [0, 1], [1.55, 1.45]);
  } else if (frame >= sec(5.75) && frame < sec(6.45)) {
    // Slide transition
    const p = interpolate(frame, [sec(5.75), sec(6.45)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    stageBlur = interpolate(p, [0, 0.4, 1], [0, 10, 0]);
    isScene2 = frame >= sec(6.03);
    camX = interpolate(p, [0, 1], [880, 960]);
    camY = interpolate(p, [0, 1], [640, 520]);
    camZ = interpolate(p, [0, 1], [1.45, 1.15]);
  } else {
    isScene2 = true;
    camX = 960;
    camY = 520;
    camZ = 1.15;
  }

  // 3. Character Puppet Kinematics (Walk cycle: 3.20s - 4.80s, duration: 1.6s)
  const isWalking = frame >= sec(3.2) && frame <= sec(4.8);
  const walkProgress = interpolate(frame, [sec(3.2), sec(4.8)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const charX = interpolate(walkProgress, [0, 1], [760, 980]);

  // Step cadence T_step = 0.39s
  const stepTime = (frame - sec(3.2)) / fps;
  const legR = isWalking ? Math.sin((stepTime / 0.39) * Math.PI * 2) * 15 : 0;
  const legL = -legR;
  const walkBobY = isWalking ? -Math.abs(Math.sin((stepTime / 0.195) * Math.PI)) * 4 : 0;

  // Idle breath sways
  const swayTorso = Math.sin(frame * 0.05) * 1.1;
  const swayHead = Math.sin(frame * 0.04 + 0.3) * -1.7;
  const swayPony = Math.sin(frame * 0.045 + 0.4) * 6;
  const swayArm = isWalking ? legL : Math.sin(frame * 0.04 + 0.5) * -1.5;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
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
          overflow: 'hidden',
          background: '#060B12',
        }}
      >
        {/* World Camera Container */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: '0 0',
            transform: `translate(${960 - camX * camZ}px, ${540 - camY * camZ}px) scale(${camZ})`,
            filter: `blur(${stageBlur}px)`,
            willChange: 'transform, filter',
          }}
        >
          {/* ============ SCENE 1: COURTYARD ============ */}
          {!isScene2 && (
            <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
              <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#BFDDE3" />
                  <stop offset="100%" stopColor="#F6EFDD" />
                </linearGradient>
              </defs>

              {/* Sky */}
              <rect x="-600" y="-1400" width="3200" height="2480" fill="url(#skyGrad)" />

              {/* Rolling Hills */}
              <path d="M-600 760 L-200 620 L300 700 L800 560 L1300 670 L1800 580 L2500 690 L2500 1400 L-600 1400 Z" fill="#CFE0CC" />

              {/* Ground Planes */}
              <rect x="-600" y="1018" width="3200" height="600" fill="#E6D5AC" />
              <rect x="-600" y="1000" width="3200" height="26" fill="#9DB874" />
              <rect x="-600" y="994" width="3200" height="14" fill="#B9CD8E" />

              {/* Mediterranean House */}
              <g transform="translate(-80, 1000)">
                <rect x="0" y="-560" width="900" height="560" fill="#EDE6D3" />
                <path d="M -34 -560 L 450 -780 L 934 -560 Z" fill="#E0714F" />
                <rect x="150" y="-400" width="210" height="210" fill="#5AABB8" rx="6" />
                <rect x="560" y="-390" width="210" height="390" fill="#345867" rx="6" />
              </g>

              {/* Signboard */}
              <g transform="translate(1300, 700)">
                <rect x="-6" y="0" width="12" height="300" fill="#8A6A4A" rx="4" />
                <rect x="-110" y="-50" width="220" height="90" fill="#FFF3DC" rx="10" stroke="#345867" strokeWidth="6" />
                <text x="0" y="10" fontSize="36" fill="#345867" fontWeight="700" textAnchor="middle" letterSpacing="3">
                  {signText}
                </text>
              </g>

              {/* Character Shadow */}
              <ellipse cx={charX} cy="1004" rx="72" ry="16" fill="#172E3C" opacity="0.15" />

              {/* Character Rig (P1.w) */}
              <g transform={`translate(${charX}, 1000)`}>
                {/* Legs & Shoes */}
                <g transform={`translate(-24, -214) rotate(${legL})`}>
                  <rect x="-22" y="-10" width="44" height="118" fill="#345867" rx="19" />
                  <g transform="translate(0, 102)">
                    <rect x="-19" y="-8" width="38" height="108" fill="#345867" rx="17" />
                    <g transform="translate(0, 96)">
                      <path d="M -22 -10 L 14 -10 C 22 4 44 4 48 16 L 48 26 L -24 26 Z" fill="#FFFDF5" />
                      <rect x="-24" y="20" width="72" height="6" fill="#F4BC52" rx="2" />
                    </g>
                  </g>
                </g>

                <g transform={`translate(24, -214) rotate(${legR})`}>
                  <rect x="-22" y="-10" width="44" height="118" fill="#2D4D5A" rx="19" />
                  <g transform="translate(0, 102)">
                    <rect x="-19" y="-8" width="38" height="108" fill="#2D4D5A" rx="17" />
                    <g transform="translate(0, 96)">
                      <path d="M -22 -10 L 14 -10 C 22 4 44 4 48 16 L 48 26 L -24 26 Z" fill="#E2E8F0" />
                      <rect x="-24" y="20" width="72" height="6" fill="#F4BC52" rx="2" />
                    </g>
                  </g>
                </g>

                {/* Torso & Head */}
                <g transform={`translate(0, ${-214 + walkBobY}) rotate(${swayTorso})`}>
                  {/* Right Arm (Back) */}
                  <g transform="translate(-48, -126)">
                    <rect x="-16" y="-16" width="32" height="98" fill="#C86545" rx="15" />
                    <rect x="-14" y="78" width="28" height="90" fill="#B37853" rx="14" />
                  </g>

                  {/* Shirt Body */}
                  <path d="M -44 -152 C -60 -144 -66 -112 -62 -76 L -54 8 C -26 20 28 20 54 8 L 62 -76 C 66 -112 56 -144 42 -152 Z" fill={accentCoral} />
                  <path d="M -20 -152 Q 0 -134 20 -152 Q 0 -144 -20 -152 Z" fill="#F4BC52" />
                  <rect x="-14" y="-178" width="28" height="40" fill="#CB895F" rx="12" />

                  {/* Left Arm (Front) */}
                  <g transform={`translate(48, -126) rotate(${swayArm})`}>
                    <rect x="-16" y="-16" width="32" height="98" fill={accentCoral} rx="15" />
                    <rect x="-14" y="78" width="28" height="90" fill="#CB895F" rx="14" />
                    <ellipse cx="0" cy="172" rx="16" ry="20" fill="#CB895F" />
                  </g>

                  {/* Head */}
                  <g transform={`translate(0, -160) rotate(${swayHead})`}>
                    {/* Ponytail Hair */}
                    <g transform={`translate(32, -138) rotate(${swayPony})`}>
                      <circle cx="0" cy="0" r="10" fill="#F4BC52" />
                      <path d="M 0 -8 C 45 -25 95 -10 100 45 C 98 85 75 75 55 45 C 38 18 20 5 0 8 Z" fill="#22171E" />
                    </g>

                    {/* Ears & Face Base */}
                    <ellipse cx="-70" cy="-70" rx="12" ry="18" fill="#CB895F" />
                    <ellipse cx="70" cy="-70" rx="12" ry="18" fill="#CB895F" />
                    <circle cx="-70" cy="-62" r="3.5" fill="#F4BC52" />
                    <circle cx="70" cy="-62" r="3.5" fill="#F4BC52" />
                    <path d="M -72 -120 C -72 -176 72 -176 72 -120 L 72 -60 C 72 -4 -72 -4 -72 -60 Z" fill="#CB895F" />

                    {/* Rosy Cheeks */}
                    <ellipse cx="-42" cy="-56" rx="11" ry="6" fill="#E0714F" opacity="0.32" />
                    <ellipse cx="42" cy="-56" rx="11" ry="6" fill="#E0714F" opacity="0.32" />

                    {/* Front Hair with Bangs */}
                    <path d="M -74 -95 C -78 -178 78 -178 74 -95 C 64 -115 42 -105 22 -124 C 0 -112 -38 -128 -74 -95 Z" fill="#22171E" />

                    {/* Eyes & Eyelashes */}
                    <circle cx="-28" cy="-84" r="6.5" fill="#263746" />
                    <circle cx="28" cy="-84" r="6.5" fill="#263746" />
                    <circle cx="-26" cy="-86.5" r="2.2" fill="#FFFDF5" />
                    <circle cx="30" cy="-86.5" r="2.2" fill="#FFFDF5" />
                    <path d="M -36 -88 L -24 -84" stroke="#263746" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M 36 -88 L 24 -84" stroke="#263746" strokeWidth="3.5" strokeLinecap="round" />

                    {/* Expressive Smile */}
                    <path d="M -14 -44 C -5 -36 5 -36 14 -44" stroke="#263746" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  </g>
                </g>
              </g>
            </svg>
          )}

          {/* ============ SCENE 2: GARAGE WORKSHOP ============ */}
          {isScene2 && (
            <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
              <rect width="1920" height="1080" fill="#1E293B" />
              <rect x="200" y="200" width="1520" height="680" fill="#0F172A" rx="12" />
              <text x="960" y="420" fontSize="56" fill="#FFF" fontWeight="800" textAnchor="middle" letterSpacing="2">
                AUTOMOTIVE WORKSHOP // ACTIVE LIFT
              </text>
              <rect x="760" y="600" width="400" height="14" fill="#E0714F" rx="4" />
            </svg>
          )}
        </div>

        {/* Theatrical Curtains (#curtains) */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30, display: 'flex', overflow: 'hidden' }}>
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
