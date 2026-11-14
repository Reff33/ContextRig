import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * PaperCollage — 100% Exact Remotion Port of `assets/kinet-collage.html`.
 * Matches HTML5/GSAP paper rip sheet geometry and timing:
 *
 * .rip-wipe specs from kinet-collage.html:
 *  - width: 1920px (full-width tear cover sheet, NOT a narrow strip!)
 *  - background: var(--paper-dark, #EAE0D0)
 *  - box-shadow: -30px 0 60px rgba(0,0,0,0.35)
 *  - clip-path: polygon(0% 0%, 100% 0%, 97% 12%, 100% 25%, 96% 40%, 100% 55%, 97% 70%, 100% 85%, 96% 100%, 0% 100%)
 *  - Timeline (9.0s = 540 frames @ 60fps):
 *      0.20s - 0.65s: Polaroid photo slaps down from y: -650 with rotate: -4deg (back.out(2))
 *      0.50s: Scotch tape 1 snaps on top corner
 *      0.90s: Torn newspaper scrap slides in from x: 500 (power3.out)
 *      1.15s: Scotch tape 2 snaps corner
 *      1.40s: Air mail postage stamp drops in with bounce
 *      2.10s - 2.32s: Rubber ink stamp SLAMS down "★ VERIFIED PRINT ★" with double border
 *      2.60s: Handwritten note reveals with drift
 *      3.00s: Kinetic headline reveals
 *      3.60s: 12fps stop-motion micro-jitter
 *      4.40s - 5.30s: Physical paper rip sheet sweeps from X: 1920 -> -1920 (power3.inOut, duration: 0.9s)
 *      4.85s: Midpoint cut (Scene 1 unmounts, Scene 2 mounts cleanly under tear cover!)
 *      4.90s+: Scene 2 torn scrap, polaroid 2, and tape snap in
 */
export type PaperCollageProps = {
  polaroidCaption1?: string;
  scrapText1?: string;
  stampText1?: string;
  headlinePart1?: string;
  headlineSticker?: string;
  scrapText2?: string;
  polaroidCaption2?: string;
  primaryPaper?: string;
  paperDark?: string;
  accentOrange?: string;
  accentYellow?: string;
  accentRed?: string;
};

export const PaperCollage: React.FC<PaperCollageProps> = ({
  polaroidCaption1 = "analog print session '74",
  scrapText1 = 'STOP-MOTION\nCOLLAGE',
  stampText1 = '★ VERIFIED PRINT ★',
  headlinePart1 = 'PAPER TEXTURE WITH ',
  headlineSticker = 'STOP-MOTION RHYTHM',
  scrapText2 = 'AUTHENTIC CRAFT\nNOT DIGITAL PPT',
  polaroidCaption2 = 'press master copy #14',
  primaryPaper = '#F5F0E6',
  paperDark = '#EAE0D0',
  accentOrange = '#EA580C',
  accentYellow = '#FDE047',
  accentRed = '#DC2626',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sec = (s: number) => Math.round(s * fps);

  // Easing curves matching GSAP
  const easeBackOut2 = Easing.bezier(0.175, 0.885, 0.32, 1.4);
  const easeBackOut25 = Easing.bezier(0.175, 0.885, 0.32, 1.6);
  const easePower4Out = Easing.bezier(0.16, 1, 0.3, 1);
  const easePower4In = Easing.bezier(0.7, 0, 0.84, 0);
  const easePower3InOut = Easing.bezier(0.645, 0.045, 0.355, 1);

  // 1. Polaroid Photo 1 (0.20s - 0.65s)
  const p1Prog = interpolate(frame, [sec(0.20), sec(0.65)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeBackOut2,
  });
  const p1Y = interpolate(p1Prog, [0, 1], [-650, 0]);
  const p1Rot = interpolate(p1Prog, [0, 1], [-18, -4]);

  // 2. Scotch Tape 1 (0.50s - 0.65s)
  const tape1Prog = interpolate(frame, [sec(0.50), sec(0.65)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });

  // 3. Torn Scrap 1 (0.90s - 1.32s)
  const scrap1Prog = interpolate(frame, [sec(0.90), sec(1.32)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const scrap1X = interpolate(scrap1Prog, [0, 1], [500, 0]);
  const scrap1Rot = interpolate(scrap1Prog, [0, 1], [12, 3]);

  // Tape 2 (1.15s)
  const tape2Prog = interpolate(frame, [sec(1.15), sec(1.30)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });

  // 4. Postage Stamp (1.40s - 1.75s)
  const postStampProg = interpolate(frame, [sec(1.40), sec(1.75)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeBackOut25,
  });

  // 5. Rubber Ink Stamp Slam (2.10s - 2.32s)
  const stampSlamProg = interpolate(frame, [sec(2.10), sec(2.32)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4In,
  });
  const stampScale = interpolate(stampSlamProg, [0, 1], [2.4, 1]);
  const stampOpacity = frame >= sec(2.10) ? 0.92 : 0;

  // 6. Hand Note (2.60s - 3.00s)
  const note1Prog = interpolate(frame, [sec(2.60), sec(3.00)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 7. Headline 1 (3.00s - 3.45s)
  const title1Prog = interpolate(frame, [sec(3.00), sec(3.45)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });

  // Stop-motion 12fps micro-jitter at 3.60s
  const isJitter = frame >= sec(3.60) && frame <= sec(3.72);
  const jitterRot = isJitter ? 1.5 : 0;

  // Exact Physical Paper Rip Wipe (4.40s - 5.30s, duration: 0.9s)
  const ripX = interpolate(frame, [sec(4.40), sec(5.30)], [1920, -1920], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3InOut,
  });
  // Clean midpoint cut: Scene 1 unmounts at 4.85s when full tear sheet is completely covering the view!
  const isScene2 = frame >= sec(4.85);

  // Scene 2 Elements
  const scrap2Prog = interpolate(frame, [sec(4.90), sec(5.35)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeBackOut2,
  });
  const p2Prog = interpolate(frame, [sec(5.10), sec(5.55)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeBackOut2,
  });
  const tape3Prog = interpolate(frame, [sec(5.40), sec(5.55)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        overflow: 'hidden',
        color: '#1C1917',
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
          background: primaryPaper,
          overflow: 'hidden',
          boxShadow: '0 0 80px rgba(0, 0, 0, 0.9)',
        }}
      >
        {/* Paper Texture with 40px grid & crease */}
        <div
          style={{
            position: 'absolute',
            inset: -400,
            backgroundColor: primaryPaper,
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 80%), linear-gradient(rgba(28,25,23,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(28,25,23,0.03) 1px, transparent 1px)',
            backgroundSize: '100% 100%, 40px 40px, 40px 40px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.18,
            mixBlendMode: 'multiply',
            background: 'linear-gradient(135deg, transparent 48%, rgba(0,0,0,0.3) 50%, transparent 52%)',
          }}
        />

        {/* ============ SCENE 1 (Strictly disappears at 4.85s under the full tear sheet) ============ */}
        {!isScene2 && (
          <div style={{ position: 'absolute', inset: 0 }}>
            {/* Polaroid 1 */}
            <div
              style={{
                position: 'absolute',
                left: 180,
                top: 160,
                width: 440,
                height: 520,
                background: '#FFFDF9',
                padding: '18px 18px 48px 18px',
                boxShadow: '0 20px 40px rgba(28, 25, 23, 0.28), 0 2px 8px rgba(0,0,0,0.15)',
                border: '1px solid rgba(0,0,0,0.06)',
                opacity: p1Prog,
                transform: `translateY(${p1Y}px) rotate(${p1Rot + jitterRot}deg)`,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#D6C7AD',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: '#78716C', marginTop: 12, fontWeight: 600 }}>
                  FIGURE A · ORIGINAL CUTOUT
                </span>
              </div>
              <div style={{ position: 'absolute', bottom: 12, left: 18, right: 18, fontFamily: "'Caveat', cursive, sans-serif", fontSize: 32, fontWeight: 700, color: '#44403C', textAlign: 'center' }}>
                {polaroidCaption1}
              </div>
            </div>

            {/* Scotch Tape 1 */}
            <div
              style={{
                position: 'absolute',
                left: 310,
                top: 140,
                width: 140,
                height: 38,
                background: 'rgba(254, 243, 199, 0.65)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12), inset 0 0 4px rgba(255,255,255,0.4)',
                backdropFilter: 'blur(2px)',
                zIndex: 25,
                borderLeft: '2px dashed rgba(0,0,0,0.1)',
                borderRight: '2px dashed rgba(0,0,0,0.1)',
                transform: 'rotate(-5deg)',
                opacity: tape1Prog,
              }}
            />

            {/* Torn Newspaper Scrap */}
            <div
              style={{
                position: 'absolute',
                left: 680,
                top: 220,
                width: 560,
                background: accentOrange,
                color: '#FFF',
                padding: '32px 40px',
                boxShadow: '0 16px 36px rgba(28, 25, 23, 0.3)',
                fontWeight: 800,
                fontSize: 64,
                lineHeight: 1.05,
                clipPath: 'polygon(0% 4%, 3% 0%, 97% 2%, 100% 6%, 98% 95%, 95% 100%, 2% 98%, 0% 92%)',
                opacity: scrap1Prog,
                transform: `translateX(${scrap1X}px) rotate(${scrap1Rot + jitterRot}deg)`,
                whiteSpace: 'pre-line',
              }}
            >
              {scrapText1}
            </div>

            {/* Scotch Tape 2 */}
            <div
              style={{
                position: 'absolute',
                left: 1120,
                top: 200,
                width: 130,
                height: 36,
                background: 'rgba(254, 243, 199, 0.65)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                transform: 'rotate(45deg)',
                opacity: tape2Prog,
                zIndex: 25,
              }}
            />

            {/* Postage Stamp */}
            <div
              style={{
                position: 'absolute',
                left: 1280,
                top: 160,
                width: 140,
                height: 170,
                background: '#FFFDF9',
                border: '4px dashed #991B1B',
                padding: 10,
                boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 15,
                opacity: postStampProg,
                transform: `scale(${interpolate(postStampProg, [0, 1], [0.2, 1])}) rotate(8deg)`,
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#991B1B' }}>AIR MAIL</span>
              <svg width="50" height="50" viewBox="0 0 24 24" fill="#991B1B">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 800, color: '#991B1B' }}>$2.50</span>
            </div>

            {/* Rubber Stamp Slam */}
            <div
              style={{
                position: 'absolute',
                left: 780,
                top: 480,
                border: `5px double ${accentRed}`,
                color: accentRed,
                padding: '8px 24px',
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 42,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                mixBlendMode: 'multiply',
                zIndex: 30,
                opacity: stampOpacity,
                transform: `scale(${stampScale}) rotate(-12deg)`,
              }}
            >
              {stampText1}
            </div>

            {/* Handwritten Note */}
            <div
              style={{
                position: 'absolute',
                left: 240,
                top: 720,
                fontFamily: "'Caveat', cursive, sans-serif",
                fontSize: 36,
                fontWeight: 700,
                color: '#44403C',
                transform: 'rotate(-3deg)',
                opacity: note1Prog,
              }}
            >
              handcrafted tactile layering →
            </div>

            {/* Scene 1 Headline */}
            <div
              style={{
                position: 'absolute',
                left: 180,
                top: 820,
                fontWeight: 900,
                fontSize: 88,
                lineHeight: 1.0,
                letterSpacing: '-0.03em',
                color: '#1C1917',
                textTransform: 'uppercase',
                opacity: title1Prog,
                transform: `translateY(${interpolate(title1Prog, [0, 1], [35, 0])}px)`,
              }}
            >
              {headlinePart1}
              <span
                style={{
                  display: 'inline-block',
                  background: accentYellow,
                  color: '#000',
                  padding: '0 16px',
                  transform: 'rotate(-1.5deg)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                }}
              >
                {headlineSticker}
              </span>
            </div>
          </div>
        )}

        {/* ============ SCENE 2: Clean reveal on the wake of the tear ============ */}
        {isScene2 && (
          <div style={{ position: 'absolute', inset: 0 }}>
            {/* Torn Scrap 2 */}
            <div
              style={{
                position: 'absolute',
                left: 200,
                top: 240,
                width: 680,
                background: '#0D9488',
                color: '#FFF',
                padding: '32px 40px',
                boxShadow: '0 16px 36px rgba(28, 25, 23, 0.3)',
                fontWeight: 800,
                fontSize: 64,
                lineHeight: 1.05,
                clipPath: 'polygon(0% 4%, 3% 0%, 97% 2%, 100% 6%, 98% 95%, 95% 100%, 2% 98%, 0% 92%)',
                opacity: scrap2Prog,
                transform: `translateX(${interpolate(scrap2Prog, [0, 1], [-400, 0])}px) rotate(-3deg)`,
                whiteSpace: 'pre-line',
              }}
            >
              {scrapText2}
            </div>

            {/* Polaroid 2 */}
            <div
              style={{
                position: 'absolute',
                left: 980,
                top: 180,
                width: 520,
                height: 560,
                background: '#FFFDF9',
                padding: '18px 18px 48px 18px',
                boxShadow: '0 20px 40px rgba(28, 25, 23, 0.28)',
                opacity: p2Prog,
                transform: `translateY(${interpolate(p2Prog, [0, 1], [-500, 0])}px) rotate(4deg)`,
              }}
            >
              <div style={{ width: '100%', height: '100%', background: '#E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="12 8 8 12 12 16 12 8" />
                  <polygon points="12 8 16 12 12 16 12 8" />
                </svg>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, color: '#475569', marginTop: 14, fontWeight: 700 }}>
                  EXHIBIT 02 · PHYSICAL ARTIFACTS
                </span>
              </div>
              <div style={{ position: 'absolute', bottom: 12, left: 18, right: 18, fontFamily: "'Caveat', cursive, sans-serif", fontSize: 32, fontWeight: 700, color: '#44403C', textAlign: 'center' }}>
                {polaroidCaption2}
              </div>
            </div>

            {/* Scotch Tape 3 */}
            <div
              style={{
                position: 'absolute',
                left: 1360,
                top: 160,
                width: 140,
                height: 38,
                background: 'rgba(254, 243, 199, 0.65)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                transform: 'rotate(-30deg)',
                opacity: tape3Prog,
                zIndex: 25,
              }}
            />

            {/* Headline 2 */}
            <div
              style={{
                position: 'absolute',
                left: 200,
                top: 840,
                fontWeight: 900,
                fontSize: 78,
                color: '#1C1917',
                letterSpacing: '-0.02em',
              }}
            >
              ZERO BORING FADES.{' '}
              <span
                style={{
                  display: 'inline-block',
                  background: accentOrange,
                  color: '#fff',
                  padding: '4px 18px',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                }}
              >
                100% TACTILE.
              </span>
            </div>
          </div>
        )}

        {/*
          100% Exact .rip-wipe Paper Rip Sheet from kinet-collage.html:
          Full 1920px wide cover with jagged serrated polygon tear edge and drop shadow
        */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 1920,
            background: paperDark,
            boxShadow: '-30px 0 60px rgba(0,0,0,0.35)',
            clipPath: 'polygon(0% 0%, 100% 0%, 97% 12%, 100% 25%, 96% 40%, 100% 55%, 97% 70%, 100% 85%, 96% 100%, 0% 100%)',
            transform: `translateX(${ripX}px)`,
            pointerEvents: 'none',
            zIndex: 40,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default PaperCollage;
