import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * StudioCatalog — 100% Exact Remotion Port of `assets/kinet-catalog.html`.
 * Matches Swiss minimalist architectural catalog aesthetics:
 *  - High-key clean studio white paper background (#ffffff) with 120px architectural grid.
 *  - Camera rig tracking across desk:
 *      0.00s: Initial closeup looking at Cutout A (C.x: 530, C.y: 490, C.z: 1.8).
 *      2.20s - 3.60s: Camera glides to Cutout B (C.x: 1380, C.y: 520, C.z: 1.6).
 *      4.20s - 5.40s: Camera glides home to wide stage (C.x: 960, C.y: 540, C.z: 1.0).
 *  - 0.15s: Architectural drafting hairlines (#swissGrid) stroke draw in (0.65s).
 *  - 0.20s: Ghost date '1972' subtle whisper entrance from y: 40.
 *  - 0.30s: 3D Specimen Card A lands, then fans out into isometric stack at 0.78s (#cardSub1: rot -4deg, #cardSub2: rot +5deg).
 *  - 2.50s: Cutout B slides in from right (x: 400).
 *  - 5.50s: Hero statement kinetic word reveals with yellow felt highlighter stroke.
 *  - 6.80s: Pencil sketch annotation ring draws around Card A.
 *  - 8.20s: Archive specification document (#docA) drops in from y: 400.
 *  - 9.10s: Red rubber stamp 'VERIFIED' slams down on document at 9.36s with desk shake.
 */
export type StudioCatalogProps = {
  ghostYear?: string;
  headlinePart1?: string;
  headlineHighlight?: string;
  specLabel?: string;
  handNote?: string;
  docSubtitle?: string;
  stampText?: string;
  primaryColor?: string;
  yellowHighlight?: string;
  inkColor?: string;
};

export const StudioCatalog: React.FC<StudioCatalogProps> = ({
  ghostYear = '1972',
  headlinePart1 = 'Studio precision, ',
  headlineHighlight = 'two words.',
  specLabel = 'SPEC · MINIMALIST CATALOG',
  handNote = 'verified 64 px',
  docSubtitle = '1972 · flagship release',
  stampText = 'VERIFIED',
  primaryColor = '#FF3C2B',
  yellowHighlight = '#FFE500',
  inkColor = '#141414',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sec = (s: number) => Math.round(s * fps);

  // Easing functions
  const easePower2InOut = Easing.bezier(0.45, 0, 0.55, 1);
  const easeSineInOut = Easing.bezier(0.37, 0, 0.63, 1);
  const easePower3Out = Easing.bezier(0.215, 0.61, 0.355, 1);
  const easePower4Out = Easing.bezier(0.16, 1, 0.3, 1);
  const easeBackOut2 = Easing.bezier(0.175, 0.885, 0.32, 1.4);
  const easePower4In = Easing.bezier(0.7, 0, 0.84, 0);

  // 1. Camera Rig Pan & Zoom:
  // 0.0s - 2.2s: x: 530, y: 490, z: 1.8
  // 2.2s - 3.6s: pan to Cutout B (x: 1380, y: 520, z: 1.6)
  // 4.2s - 5.4s: pan home to wide (x: 960, y: 540, z: 1.0)
  let camX = 530;
  let camY = 490;
  let camZ = 1.8;

  if (frame < sec(2.2)) {
    camX = 530;
    camY = 490;
    camZ = 1.8;
  } else if (frame >= sec(2.2) && frame < sec(4.2)) {
    const p = interpolate(frame, [sec(2.2), sec(3.6)], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easeSineInOut,
    });
    camX = interpolate(p, [0, 1], [530, 1380]);
    camY = interpolate(p, [0, 1], [490, 520]);
    camZ = interpolate(p, [0, 1], [1.8, 1.6]);
  } else {
    const p = interpolate(frame, [sec(4.2), sec(5.4)], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easePower2InOut,
    });
    camX = interpolate(p, [0, 1], [1380, 960]);
    camY = interpolate(p, [0, 1], [520, 540]);
    camZ = interpolate(p, [0, 1], [1.6, 1.0]);
  }

  // 2. Swiss Drafting Grid stroke draw-in (0.15s - 0.80s)
  const gridLineH = interpolate(frame, [sec(0.15), sec(0.80)], [1700, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower2InOut,
  });
  const gridLineV = interpolate(frame, [sec(0.15), sec(0.80)], [1000, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower2InOut,
  });
  const gridCrossP = interpolate(frame, [sec(0.20), sec(0.55)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeBackOut2,
  });

  // 3. Ghost Date 1972 (0.20s - 1.40s)
  const ghostP = interpolate(frame, [sec(0.20), sec(1.40)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const ghostY = interpolate(ghostP, [0, 1], [40, 0]);

  // 4. Specimen Cutout A fan-out stack (0.30s - 1.20s)
  const flyAP = interpolate(frame, [sec(0.30), sec(1.20)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });
  const cutAY = interpolate(flyAP, [0, 1], [500, 0]);

  // Fan out subcards (0.78s & 0.82s)
  const sub1Rot = interpolate(frame, [sec(0.78), sec(1.28)], [0, -4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeBackOut2 });
  const sub1X = interpolate(frame, [sec(0.78), sec(1.28)], [0, -24], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeBackOut2 });
  const sub1Y = interpolate(frame, [sec(0.78), sec(1.28)], [0, 12], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeBackOut2 });

  const sub2Rot = interpolate(frame, [sec(0.82), sec(1.37)], [0, 5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeBackOut2 });
  const sub2X = interpolate(frame, [sec(0.82), sec(1.37)], [0, 28], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeBackOut2 });
  const sub2Y = interpolate(frame, [sec(0.82), sec(1.37)], [0, 18], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeBackOut2 });

  // 5. Cutout B enters from right (2.50s - 3.40s)
  const flyBP = interpolate(frame, [sec(2.50), sec(3.40)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });
  const cutBX = interpolate(flyBP, [0, 1], [400, 0]);

  // 6. Hero Statement Line 1 reveal & highlighter (5.50s - 6.20s)
  const line1P = interpolate(frame, [sec(5.50), sec(6.05)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeBackOut2,
  });
  const hlP = interpolate(frame, [sec(5.90), sec(6.30)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });

  // 7. Pencil Sketch Annotation Ring (6.80s - 7.60s)
  const ringP = interpolate(frame, [sec(6.80), sec(7.60)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower2InOut,
  });

  // 8. Labels
  const label1P = interpolate(frame, [sec(7.20), sec(7.60)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower3Out });
  const label2P = interpolate(frame, [sec(7.80), sec(8.20)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower3Out });

  // 9. Document A drop (8.20s - 9.00s)
  const docP = interpolate(frame, [sec(8.20), sec(9.00)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });
  const docY = interpolate(docP, [0, 1], [400, 0]);

  // 10. Rubber Stamp Slam (9.10s - 9.36s)
  const stampP = interpolate(frame, [sec(9.10), sec(9.36)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4In,
  });
  const stampScale = interpolate(stampP, [0, 1], [2.2, 1]);
  const stampOpacity = frame >= sec(9.10) ? 0.92 : 0;

  // Desk vibration on stamp slam (9.36s)
  const deskShake = frame >= sec(9.36) && frame <= sec(9.58)
    ? (frame % 2 === 0 ? 4 : -4)
    : 0;

  // 11. Date block (9.50s)
  const blockClip = interpolate(frame, [sec(9.50), sec(10.00)], [100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        overflow: 'hidden',
        color: inkColor,
        fontFamily: '"Archivo", system-ui, sans-serif',
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
          background: '#FFFFFF',
          overflow: 'hidden',
        }}
      >
        {/* World Camera Rig Container */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: '0 0',
            transform: `translate(${960 - camX * camZ}px, ${540 - camY * camZ + deskShake}px) scale(${camZ})`,
            willChange: 'transform',
          }}
        >
          {/* Architectural Paper Background with 120px grid */}
          <div
            style={{
              position: 'absolute',
              inset: -1400,
              background: '#FFFFFF',
              backgroundImage: 'linear-gradient(rgba(20,20,20,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(20,20,20,0.06) 1px, transparent 1px)',
              backgroundSize: '120px 120px',
            }}
          />

          {/* Ghost Year 1972 */}
          <div
            style={{
              position: 'absolute',
              left: 520,
              top: 120,
              fontFamily: '"Archivo", sans-serif',
              fontSize: 160,
              fontWeight: 900,
              color: 'rgba(20, 20, 20, 0.04)',
              opacity: ghostP,
              transform: `translateY(${ghostY}px)`,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            {ghostYear}
          </div>

          {/* Swiss Architectural Drafting Grid Hairlines */}
          <svg style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, pointerEvents: 'none', zIndex: 0 }} viewBox="0 0 1920 1080">
            <line x1="120" y1="490" x2="1800" y2="490" stroke="rgba(20,20,20,0.12)" strokeWidth="1.5" strokeDasharray="6 4" strokeDashoffset={gridLineH} />
            <line x1="540" y1="80" x2="540" y2="1000" stroke="rgba(20,20,20,0.12)" strokeWidth="1.5" strokeDasharray="6 4" strokeDashoffset={gridLineV} />
            <circle cx="540" cy="490" r="14" stroke="rgba(255,60,43,0.5)" strokeWidth="2" fill="none" style={{ transform: `scale(${gridCrossP})`, transformOrigin: '540px 490px' }} />
          </svg>

          {/* 3D Specimen Card Fan-Out Stack */}
          {/* Card Sub 2 */}
          <div
            style={{
              position: 'absolute',
              left: 240,
              top: 160,
              width: 600,
              height: 660,
              background: '#E2E8F0',
              border: '1px solid #CBD5E1',
              borderRadius: 20,
              zIndex: 2,
              opacity: flyAP,
              transform: `translate3d(${sub2X}px, ${cutAY + sub2Y}px, 0px) rotate(${sub2Rot}deg)`,
              filter: 'drop-shadow(0 24px 30px rgba(20,20,20,.18))',
            }}
          />

          {/* Card Sub 1 */}
          <div
            style={{
              position: 'absolute',
              left: 240,
              top: 160,
              width: 600,
              height: 660,
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: 20,
              zIndex: 3,
              opacity: flyAP,
              transform: `translate3d(${sub1X}px, ${cutAY + sub1Y}px, 0px) rotate(${sub1Rot}deg)`,
              filter: 'drop-shadow(0 24px 30px rgba(20,20,20,.18))',
            }}
          />

          {/* Cutout A Main Card */}
          <div
            style={{
              position: 'absolute',
              left: 240,
              top: 160,
              width: 600,
              height: 660,
              zIndex: 4,
              opacity: flyAP,
              transform: `translateY(${cutAY}px)`,
              filter: 'drop-shadow(0 24px 30px rgba(20,20,20,.18))',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 20,
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"Inter", sans-serif',
                fontSize: 26,
                letterSpacing: '.08em',
                textAlign: 'center',
                color: '#64748B',
                lineHeight: 1.6,
              }}
            >
              SPECIMEN A<br />
              ARCHITECTURAL HARDWARE
            </div>
          </div>

          {/* Cutout B */}
          <div
            style={{
              position: 'absolute',
              left: 1080,
              top: 300,
              width: 620,
              height: 460,
              zIndex: 5,
              opacity: flyBP,
              transform: `translateX(${cutBX}px)`,
              filter: 'drop-shadow(0 24px 30px rgba(20,20,20,.18))',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 20,
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: '#64748B',
                fontFamily: '"Inter", sans-serif',
              }}
            >
              MACRO SHOT // B
            </div>
          </div>

          {/* Pencil Annotation Ring Drawing */}
          <svg style={{ position: 'absolute', left: 180, top: 140, width: 720, height: 720, overflow: 'visible', pointerEvents: 'none', zIndex: 6 }} viewBox="0 0 720 720">
            <path
              d="M60 380 C40 200 200 60 380 60 C560 60 680 200 660 380 C640 560 500 660 340 660 C180 660 80 540 60 380 Z"
              fill="none"
              stroke="rgba(255,60,43,0.6)"
              strokeWidth="2.5"
              strokeDasharray={2200}
              strokeDashoffset={interpolate(ringP, [0, 1], [2200, 0])}
            />
          </svg>

          {/* Hero Statement Line 1 with Yellow Highlighter */}
          <div
            style={{
              position: 'absolute',
              left: 120,
              top: 860,
              fontSize: 92,
              fontWeight: 900,
              letterSpacing: '-.02em',
              color: inkColor,
              opacity: line1P,
              transform: `scale(${interpolate(line1P, [0, 1], [0.7, 1])})`,
              transformOrigin: 'left bottom',
            }}
          >
            {headlinePart1}&nbsp;
            <span style={{ position: 'relative', display: 'inline-block', padding: '0 .1em' }}>
              <i
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '.55em',
                  bottom: '.02em',
                  background: yellowHighlight,
                  transform: `scaleX(${hlP})`,
                  transformOrigin: '0 50%',
                  zIndex: -1,
                }}
              />
              {headlineHighlight}
            </span>
          </div>

          {/* Technical Labels */}
          <div style={{ position: 'absolute', left: 250, top: 820, fontSize: 14, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: '#64748B', opacity: label1P }}>
            {specLabel}
          </div>
          <div style={{ position: 'absolute', left: 1100, top: 820, fontSize: 14, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: '#64748B', opacity: label2P }}>
            {handNote}
          </div>

          {/* Archive Document Drop (#docA) */}
          <div
            style={{
              position: 'absolute',
              left: 1240,
              top: 560,
              width: 380,
              padding: 24,
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              boxShadow: '0 30px 40px rgba(0,0,0,0.14)',
              zIndex: 10,
              opacity: docP,
              transform: `translateY(${docY}px) rotate(-2deg)`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 12 }}>
              ORIGIN · ARCHIVE · SPEC
            </div>
            <pre style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13, color: '#1E293B', margin: 0, lineHeight: 1.6 }}>
              SPECIFICATION v1.0{'\n'}VERIFIED LOSSLESS
            </pre>

            {/* Stamp Slam */}
            <span
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                border: `3px solid ${primaryColor}`,
                color: primaryColor,
                fontFamily: '"Archivo", sans-serif',
                fontSize: 24,
                fontWeight: 900,
                padding: '4px 12px',
                transform: `scale(${stampScale}) rotate(-8deg)`,
                opacity: stampOpacity,
              }}
            >
              {stampText}
            </span>
          </div>

          {/* Date Stamp Block (#sbA) */}
          <div
            style={{
              position: 'absolute',
              left: 1240,
              top: 800,
              zIndex: 12,
              background: '#0F172A',
              color: '#FFF',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 14,
              fontWeight: 700,
              padding: '8px 18px',
              borderRadius: 6,
              clipPath: `inset(0 ${blockClip}% 0 0)`,
            }}
          >
            {docSubtitle}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default StudioCatalog;
