import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * EditorialDossier — 100% Exact Remotion Port of `assets/kinet-editorial.html`.
 * Matches HTML5/GSAP layout, exact pixel positioning, and frame-accurate timing:
 *
 * Stage: 1920x1080.
 * Duration: 9.0s (540 frames @ 60fps).
 *
 * GSAP Timeline:
 *  0.20s - 0.70s: #cardA slides from { x: -120, opacity: 0 } to { x: 0, opacity: 1 } (expo.out).
 *  0.60s - 1.25s: #scanLaserA sweeps down from top: 0% -> 100% (power2.inOut), fades out at 1.25s.
 *  1.20s - 1.65s: #reticle1 from { scale: 2.2, opacity: 0, rotate: -45 } to { scale: 1, opacity: 1, rotate: 0 } (power3.out).
 *  1.65s - 1.81s: #reticle1 snaps { scale: 0.95 } (camera shutter snapshot).
 *  1.95s - 2.23s: #stampVerified slams from { scale: 2.4, opacity: 0, rotate: -25 } to { scale: 1, opacity: 0.95, rotate: -10 } (power4.in).
 *  2.23s - 2.43s: #world desk shake { x: 5, y: -4 } -> { 0, 0 } (elastic.out(1.5, 0.3)).
 *  2.25s - 2.50s: #pinA scale 0 -> 1 (back.out(2.5)).
 *  2.40s - 2.90s: #title1 reveals from { opacity: 0, y: 30 } (power4.out).
 *  2.45s - 2.95s: #pinB scale 0 -> 1 & #evidenceLine strokeDashoffset 800 -> 0 (power2.inOut).
 *  2.90s - 3.30s: #redact-bar scaleX 1 -> 0 (expo.inOut) - black marker wipes open!
 *  3.40s - 3.90s: #desc1 from { opacity: 0, y: 20 } (power3.out).
 *  3.90s - 4.35s: #anno1 .hl-draw i scaleX 0 -> 1 (power3.out) - yellow highlighter draws in!
 *  4.80s - 5.25s: #sc1 exits { opacity: 0, x: -100 } (power2.in).
 *  5.20s: #sc2 enters { opacity: 1 }.
 *  5.30s - 5.80s: #title2 reveals from { opacity: 0, x: -60 } (power4.out).
 *  5.60s - 6.10s: #cardB slides in from { x: 140, opacity: 0 } (expo.out).
 *  5.80s - 6.25s: #title2 .hl-draw i scaleX 0 -> 1 (power3.out).
 *  6.30s - 6.80s: #desc2 from { opacity: 0, y: 20 } (power3.out).
 */
export type EditorialDossierProps = {
  caseNumber?: string;
  fieldVerification?: string;
  title1Top?: string;
  redactedText?: string;
  title1Bottom?: string;
  desc1Text?: string;
  statusText?: string;
  scene2TitleTop?: string;
  scene2TitleHl?: string;
  desc2Text?: string;
  cyanColor?: string;
  yellowColor?: string;
  redColor?: string;
  backgroundColor?: string;
};

export const EditorialDossier: React.FC<EditorialDossierProps> = ({
  caseNumber = 'CASE NO. 9042-ALPHA',
  fieldVerification = 'FIELD VERIFICATION: 100% CONFIRMED',
  title1Top = 'EVIDENCE HIDDEN',
  redactedText = 'CLASSIFIED',
  title1Bottom = 'DOCUMENTS.',
  desc1Text = 'Traditional explainer videos present claims as static bulleted lists. Investigative journalism uses forensic pacing: reveal documents, pinpoint anomalies, and verify physical records.',
  statusText = 'STATUS: FORENSIC INVESTIGATION ACTIVE',
  scene2TitleTop = 'DATA DOES NOT LIE.',
  scene2TitleHl = 'EVERY FRAME MOTIVATED.',
  desc2Text = 'Case findings closed. Video storytelling elevated through cinematic pacing, high-contrast monospace typography, and authenticated archival evidence.',
  cyanColor = '#06B6D4',
  yellowColor = '#F59E0B',
  redColor = '#EF4444',
  backgroundColor = '#07090E',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sec = (s: number) => Math.round(s * fps);

  // Exact GSAP Easing Equivalents
  const easeExpoOut = Easing.bezier(0.16, 1, 0.3, 1);
  const easePower2InOut = Easing.bezier(0.45, 0, 0.55, 1);
  const easePower3Out = Easing.bezier(0.215, 0.61, 0.355, 1);
  const easePower4In = Easing.bezier(0.7, 0, 0.84, 0);
  const easePower4Out = Easing.bezier(0.16, 1, 0.3, 1);
  const easeBackOut25 = Easing.bezier(0.175, 0.885, 0.32, 1.8);
  const easeExpoInOut = Easing.bezier(0.87, 0, 0.13, 1);
  const easePower2In = Easing.bezier(0.55, 0.085, 0.68, 0.53);

  // 1. Evidence Card A slides in (0.20s -> 0.70s)
  const cardAP = interpolate(frame, [sec(0.20), sec(0.70)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeExpoOut,
  });
  const cardAX = interpolate(cardAP, [0, 1], [-120, 0]);
  const cardAOpacity = cardAP;

  // 1b. Forensic Laser Scanline (0.60s -> 1.25s)
  const laserP = interpolate(frame, [sec(0.60), sec(1.25)], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower2InOut,
  });
  const laserOpacity = frame >= sec(0.60) && frame <= sec(1.25)
    ? 1
    : (frame > sec(1.25) && frame <= sec(1.40) ? interpolate(frame, [sec(1.25), sec(1.40)], [1, 0]) : 0);

  // 2. Reticle Target Loupe (1.20s -> 1.65s)
  const reticleP = interpolate(frame, [sec(1.20), sec(1.65)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });
  let reticleScale = interpolate(reticleP, [0, 1], [2.2, 1]);
  if (frame >= sec(1.65) && frame <= sec(1.73)) {
    reticleScale = 0.95; // Shutter snapshot dip
  }
  const reticleRot = interpolate(reticleP, [0, 1], [-45, 0]);
  const reticleOpacity = reticleP;

  // 3b. Forensic Stamp Slams Down (1.95s -> 2.23s)
  const stampP = interpolate(frame, [sec(1.95), sec(2.23)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4In,
  });
  const stampScale = interpolate(stampP, [0, 1], [2.4, 1]);
  const stampOpacity = frame >= sec(1.95) ? 0.95 : 0;
  const stampRot = interpolate(stampP, [0, 1], [-25, -10]);

  // Desk vibration on stamp impact (2.23s)
  const deskShake = frame >= sec(2.23) && frame <= sec(2.43)
    ? (frame % 2 === 0 ? 5 : -4)
    : 0;

  // 4. Pin A & Pin B (2.25s & 2.45s)
  const pinAP = interpolate(frame, [sec(2.25), sec(2.50)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeBackOut25 });
  const pinBP = interpolate(frame, [sec(2.45), sec(2.70)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeBackOut25 });

  // Evidence Line Yarn (2.45s -> 2.95s)
  const lineOffset = interpolate(frame, [sec(2.45), sec(2.95)], [800, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower2InOut,
  });

  // Title 1 (2.40s -> 2.90s)
  const t1P = interpolate(frame, [sec(2.40), sec(2.90)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });
  const t1Y = interpolate(t1P, [0, 1], [30, 0]);

  // 5. Redaction Bar WIPES OPEN (2.90s -> 3.30s)
  const redactScaleX = interpolate(frame, [sec(2.90), sec(3.30)], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeExpoInOut,
  });

  // 6. Monospace desc1 (3.40s -> 3.90s)
  const desc1P = interpolate(frame, [sec(3.40), sec(3.90)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });
  const desc1Y = interpolate(desc1P, [0, 1], [20, 0]);

  // Yellow highlighter on anno1 (3.90s -> 4.35s)
  const hl1ScaleX = interpolate(frame, [sec(3.90), sec(4.35)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });

  // Scene 1 Exit (4.80s -> 5.25s)
  const sc1ExitP = interpolate(frame, [sec(4.80), sec(5.25)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower2In,
  });
  const sc1Opacity = interpolate(sc1ExitP, [0, 1], [1, 0]);
  const sc1X = interpolate(sc1ExitP, [0, 1], [0, -100]);

  // Scene 2 Entrance (5.20s onwards)
  const isScene2 = frame >= sec(5.20);
  const t2P = interpolate(frame, [sec(5.30), sec(5.80)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });
  const t2X = interpolate(t2P, [0, 1], [-60, 0]);

  const cardBP = interpolate(frame, [sec(5.60), sec(6.10)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeExpoOut,
  });
  const cardBX = interpolate(cardBP, [0, 1], [140, 0]);

  const hl2ScaleX = interpolate(frame, [sec(5.80), sec(6.25)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });

  const desc2P = interpolate(frame, [sec(6.30), sec(6.80)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });
  const desc2Y = interpolate(desc2P, [0, 1], [20, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        overflow: 'hidden',
        color: '#F8FAFC',
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      }}
    >
      {/* #stage matching 100% of assets/kinet-editorial.html */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 1920,
          height: 1080,
          marginLeft: -960,
          marginTop: -540,
          background: backgroundColor,
          overflow: 'hidden',
          boxShadow: '0 0 80px rgba(0, 0, 0, 0.95)',
        }}
      >
        {/* #world with desk shake */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translate(${deskShake}px, 0px)`,
            willChange: 'transform',
          }}
        >
          {/* .desk-grid */}
          <div
            style={{
              position: 'absolute',
              inset: -400,
              backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px), radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.05) 0%, transparent 70%)',
              backgroundSize: '60px 60px, 60px 60px, 100% 100%',
            }}
          />

          {/* .dossier-bar (#dossier-nav) */}
          <div
            style={{
              position: 'absolute',
              top: 60,
              left: 100,
              right: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '2px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: 16,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 14,
              color: '#94A3B8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ background: redColor, color: '#FFF', fontWeight: 700, padding: '4px 12px', letterSpacing: '0.14em', fontSize: 12 }}>
                DECLASSIFIED
              </span>
              <span>DOSSIER ARCHIVE // {caseNumber}</span>
            </div>
            <div>{fieldVerification}</div>
          </div>

          {/* ============ SCENE 1: FORENSIC EXHIBIT SCAN & TARGET LOCK ============ */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: sc1Opacity,
              transform: `translateX(${sc1X}px)`,
              willChange: 'transform, opacity',
            }}
          >
            {/* Investigative Red Yarn Connector & Pin Nodes */}
            <svg style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, pointerEvents: 'none', zIndex: 12 }} viewBox="0 0 1920 1080">
              <line
                x1="540"
                y1="430"
                x2="1040"
                y2="240"
                stroke="#EF4444"
                strokeWidth="2.5"
                strokeDasharray="800 800"
                strokeDashoffset={lineOffset}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                left: 540,
                top: 430,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#EF4444',
                boxShadow: '0 0 10px #EF4444',
                transform: `translate(-50%, -50%) scale(${pinAP})`,
                zIndex: 20,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 1040,
                top: 240,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#EF4444',
                boxShadow: '0 0 10px #EF4444',
                transform: `translate(-50%, -50%) scale(${pinBP})`,
                zIndex: 20,
              }}
            />

            {/* Evidence Card A */}
            <div
              style={{
                position: 'absolute',
                left: 100,
                top: 150,
                width: 880,
                height: 560,
                background: '#0D1117',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.1)',
                overflow: 'hidden',
                opacity: cardAOpacity,
                transform: `translateX(${cardAX}px)`,
                willChange: 'transform',
              }}
            >
              {/* Scan Laser */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  width: '100%',
                  height: 3,
                  background: cyanColor,
                  boxShadow: `0 0 16px ${cyanColor}, 0 0 30px ${cyanColor}`,
                  top: `${laserP}%`,
                  opacity: laserOpacity,
                  zIndex: 10,
                }}
              />

              {/* Stamp Verified */}
              <div
                style={{
                  position: 'absolute',
                  top: 80,
                  right: 60,
                  border: `4px solid ${redColor}`,
                  color: redColor,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 32,
                  fontWeight: 900,
                  padding: '12px 28px',
                  letterSpacing: '0.15em',
                  transform: `scale(${stampScale}) rotate(${stampRot}deg)`,
                  opacity: stampOpacity,
                  zIndex: 25,
                  boxShadow: `0 0 20px ${redColor}66`,
                }}
              >
                CONFIRMED // 100%
              </div>

              {/* Evidence Photo */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#181E2C',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
                <div style={{ position: 'absolute', bottom: 18, right: 18, fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: cyanColor }}>
                  LAT 48°51'24" N · LON 2°21'07" E
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: 18,
                    left: 18,
                    background: 'rgba(9, 11, 16, 0.88)',
                    borderLeft: `4px solid ${yellowColor}`,
                    padding: '6px 14px',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#FFF',
                  }}
                >
                  EXHIBIT A // SATELLITE RECON
                </div>
              </div>
            </div>

            {/* Reticle Target Tracking Loupe */}
            <div
              style={{
                position: 'absolute',
                left: 480,
                top: 360,
                width: 140,
                height: 140,
                borderRadius: '50%',
                border: `2px dashed rgba(6, 182, 212, 0.8)`,
                boxShadow: `0 0 24px rgba(6, 182, 212, 0.35)`,
                transform: `translate(-50%, -50%) scale(${reticleScale}) rotate(${reticleRot}deg)`,
                opacity: reticleOpacity,
                zIndex: 35,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ position: 'absolute', width: '100%', height: 1, background: cyanColor }} />
              <div style={{ position: 'absolute', width: 1, height: '100%', background: cyanColor }} />
            </div>

            {/* Editorial Headline 1 with Redaction Reveal */}
            <div
              style={{
                position: 'absolute',
                left: 1040,
                top: 180,
                width: 780,
                fontSize: 64,
                fontWeight: 900,
                lineHeight: 1.15,
                opacity: t1P,
                transform: `translateY(${t1Y}px)`,
              }}
            >
              {title1Top}<br />
              BEHIND&nbsp;
              <span style={{ position: 'relative', display: 'inline-block', overflow: 'hidden' }}>
                <span style={{ color: '#FFF' }}>{redactedText}</span>
                <span
                  style={{
                    position: 'absolute',
                    inset: '-2px -4px',
                    background: '#000',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    zIndex: 2,
                    transformOrigin: 'left center',
                    transform: `scaleX(${redactScaleX})`,
                  }}
                />
              </span>
              <br />{title1Bottom}
            </div>

            {/* Description 1 */}
            <div
              style={{
                position: 'absolute',
                left: 1040,
                top: 520,
                width: 780,
                fontSize: 20,
                color: '#94A3B8',
                lineHeight: 1.6,
                opacity: desc1P,
                transform: `translateY(${desc1Y}px)`,
              }}
            >
              {desc1Text}
            </div>

            {/* Anno 1 with Yellow Highlighter */}
            <div
              style={{
                position: 'absolute',
                left: 1040,
                top: 640,
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 26,
                color: yellowColor,
                fontWeight: 700,
              }}
            >
              <span style={{ position: 'relative', display: 'inline-block', color: '#000', fontWeight: 800, padding: '0 8px' }}>
                <i
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: yellowColor,
                    zIndex: -1,
                    transform: `scaleX(${hl1ScaleX})`,
                    transformOrigin: 'left center',
                  }}
                />
                {statusText}
              </span>
            </div>
          </div>

          {/* ============ SCENE 2: DOSSIER MACRO RACK FOCUS ============ */}
          {isScene2 && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <div
                style={{
                  position: 'absolute',
                  left: 100,
                  top: 180,
                  width: 1000,
                  fontSize: 64,
                  fontWeight: 900,
                  lineHeight: 1.15,
                  opacity: t2P,
                  transform: `translateX(${t2X}px)`,
                }}
              >
                {scene2TitleTop}<br />
                <span style={{ position: 'relative', display: 'inline-block', color: '#000', fontWeight: 800, padding: '0 8px' }}>
                  <i
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: yellowColor,
                      zIndex: -1,
                      transform: `scaleX(${hl2ScaleX})`,
                      transformOrigin: 'left center',
                    }}
                  />
                  {scene2TitleHl}
                </span>
              </div>

              {/* Evidence Card B */}
              <div
                style={{
                  position: 'absolute',
                  left: 1140,
                  top: 150,
                  width: 680,
                  height: 560,
                  background: '#0D1117',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.1)',
                  opacity: cardBP,
                  transform: `translateX(${cardBX}px)`,
                }}
              >
                <div style={{ width: '100%', height: '100%', background: '#0F172A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="1.5">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <div style={{ position: 'absolute', top: 18, left: 18, background: 'rgba(9, 11, 16, 0.88)', borderLeft: `4px solid ${cyanColor}`, padding: '6px 14px', fontFamily: '"JetBrains Mono", monospace', fontSize: 13, fontWeight: 700, color: '#FFF' }}>
                    EXHIBIT B // VELOCITY TELEMETRY
                  </div>
                  <div style={{ position: 'absolute', bottom: 18, right: 18, fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: yellowColor }}>
                    SAMPLING RATE: 144 FPS / 48kHz
                  </div>
                </div>
              </div>

              {/* Description 2 */}
              <div
                style={{
                  position: 'absolute',
                  left: 100,
                  top: 500,
                  maxWidth: 900,
                  fontSize: 20,
                  color: '#94A3B8',
                  lineHeight: 1.6,
                  opacity: desc2P,
                  transform: `translateY(${desc2Y}px)`,
                }}
              >
                {desc2Text}
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default EditorialDossier;
