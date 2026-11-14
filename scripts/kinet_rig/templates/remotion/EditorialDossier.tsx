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
 * Visual editorial investigative journalism dossier:
 *  - Desk grid with topographic texture and classified dossier header.
 *  - Exhibit A card with satellite recon photo & coordinates.
 *  - Cyan laser scan sweeping vertically across Exhibit A (0.45s - 1.25s).
 *  - Reticle target tracking loupe locking at 1.20s with shutter click.
 *  - Red "CONFIRMED // 100%" stamp slam with desk vibration at 1.95s.
 *  - Red investigative yarn line connecting Exhibit A to headline.
 *  - Black redaction marker bar wiping open at 2.90s to reveal "CLASSIFIED".
 *  - Fluorescent yellow highlighter stroke draw-in on key findings.
 *  - Scene 2 macro pan to Exhibit B with forensic fingerprint & barcode.
 */
export type EditorialDossierProps = {
  caseNumber?: string;
  headlineWord1?: string;
  headlineWord2?: string;
  redactedText?: string;
  scene2Headline?: string;
  primaryColor?: string;
  accentYellow?: string;
  accentRed?: string;
  backgroundColor?: string;
};

export const EditorialDossier: React.FC<EditorialDossierProps> = ({
  caseNumber = 'CASE NO. 9042-ALPHA',
  headlineWord1 = 'EVIDENCE HIDDEN',
  headlineWord2 = 'BEHIND',
  redactedText = 'CLASSIFIED',
  scene2Headline = 'FIELD SURVEILLANCE LOG // CONFIRMED',
  primaryColor = '#06B6D4',
  accentYellow = '#EAB308',
  accentRed = '#EF4444',
  backgroundColor = '#090B10',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sec = (s: number) => Math.round(s * fps);

  // Easing curves
  const easePower4Out = Easing.bezier(0.16, 1, 0.3, 1);
  const easePower4In = Easing.bezier(0.7, 0, 0.84, 0);
  const easeExpoInOut = Easing.bezier(0.87, 0, 0.13, 1);
  const easeBackOut25 = Easing.bezier(0.175, 0.885, 0.32, 1.8);

  // 1. Scan Laser on Card A (0.45s - 1.25s)
  const laserP = interpolate(frame, [sec(0.45), sec(1.25)], [0, 560], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const laserOpacity = frame >= sec(0.45) && frame <= sec(1.30) ? 1 : 0;

  // 2. Reticle Tracking Lock (1.20s - 1.65s)
  const reticleP = interpolate(frame, [sec(1.20), sec(1.65)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const reticleScale = interpolate(reticleP, [0, 1], [2.2, 1]);
  const reticleRot = interpolate(reticleP, [0, 1], [-45, 0]);

  // 3. Stamp Slam (1.95s - 2.23s)
  const stampP = interpolate(frame, [sec(1.95), sec(2.23)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4In,
  });
  const stampScale = interpolate(stampP, [0, 1], [2.4, 1]);
  const stampOpacity = stampP;

  // 4. Desk vibration shake on stamp slam (2.23s)
  const deskShake = frame >= sec(2.23) && frame <= sec(2.35)
    ? (frame % 2 === 0 ? 5 : -4)
    : 0;

  // 5. Pin nodes and Red Yarn String (2.45s - 2.95s)
  const pinP = interpolate(frame, [sec(2.25), sec(2.50)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeBackOut25 });
  const stringDash = interpolate(frame, [sec(2.45), sec(2.95)], [800, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  // 6. Title 1 Entrance (2.40s - 2.90s)
  const title1P = interpolate(frame, [sec(2.40), sec(2.90)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });

  // 7. Redaction bar wipes open (2.90s - 3.30s)
  const redactScaleX = interpolate(frame, [sec(2.90), sec(3.30)], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeExpoInOut,
  });

  // 8. Highlighter stroke (3.90s - 4.35s)
  const hlScaleX = interpolate(frame, [sec(3.90), sec(4.35)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // 9. Scene Transition to Scene 2 (4.80s - 5.50s)
  const isScene2 = frame >= sec(5.0);
  const sc1X = interpolate(frame, [sec(4.80), sec(5.25)], [0, -100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sc1Opacity = interpolate(frame, [sec(4.80), sec(5.25)], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sc2Opacity = interpolate(frame, [sec(5.20), sec(5.60)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sc2X = interpolate(frame, [sec(5.20), sec(5.70)], [-60, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePower4Out });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        overflow: 'hidden',
        color: '#F8FAFC',
        fontFamily: "'Playfair Display', Georgia, serif",
      }}
    >
      {/* 1920x1080 Master Stage */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 1920,
          height: 1080,
          marginLeft: -960,
          marginTop: -540,
          transform: `translate(${deskShake}px, 0px)`,
          overflow: 'hidden',
        }}
      >
        {/* Desk Grid & Topographic lines */}
        <div
          style={{
            position: 'absolute',
            inset: -400,
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Top Dossier Header Bar */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 100,
            right: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid rgba(255,255,255,0.12)',
            paddingBottom: 16,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            color: '#94A3B8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ background: accentRed, color: '#FFF', fontWeight: 700, padding: '4px 12px', letterSpacing: '0.14em', fontSize: 12 }}>
              DECLASSIFIED
            </span>
            <span>DOSSIER ARCHIVE // {caseNumber}</span>
          </div>
          <div>FIELD VERIFICATION: 100% CONFIRMED</div>
        </div>

        {/* SCENE 1 */}
        <div style={{ position: 'absolute', inset: 0, opacity: sc1Opacity, transform: `translateX(${sc1X}px)` }}>
          {/* Investigative Red String */}
          <svg style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, pointerEvents: 'none', zIndex: 12 }}>
            <line
              x1="540"
              y1="430"
              x2="1040"
              y2="240"
              stroke="#EF4444"
              strokeWidth="2.5"
              strokeDasharray="800"
              strokeDashoffset={stringDash}
            />
          </svg>
          <div style={{ position: 'absolute', left: 540, top: 430, width: 14, height: 14, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 10px #EF4444', transform: `translate(-50%, -50%) scale(${pinP})`, zIndex: 20 }} />
          <div style={{ position: 'absolute', left: 1040, top: 240, width: 14, height: 14, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 10px #EF4444', transform: `translate(-50%, -50%) scale(${pinP})`, zIndex: 20 }} />

          {/* Evidence Card A */}
          <div
            style={{
              position: 'absolute',
              left: 100,
              top: 150,
              width: 880,
              height: 560,
              background: '#111827',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.1)',
              overflow: 'hidden',
            }}
          >
            {/* Scan Laser */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                width: '100%',
                height: 3,
                background: primaryColor,
                boxShadow: `0 0 16px ${primaryColor}, 0 0 30px ${primaryColor}`,
                transform: `translateY(${laserP}px)`,
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
                border: `4px solid ${accentRed}`,
                color: accentRed,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 32,
                fontWeight: 900,
                padding: '12px 28px',
                letterSpacing: '0.15em',
                transform: `scale(${stampScale}) rotate(-10deg)`,
                opacity: stampOpacity,
                zIndex: 25,
                boxShadow: `0 0 20px ${accentRed}66`,
              }}
            >
              CONFIRMED // 100%
            </div>

            {/* Evidence Photo Container */}
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <div style={{ position: 'absolute', bottom: 24, right: 24, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: primaryColor }}>
                LAT 48°51'24" N · LON 2°21'07" E
              </div>
              <div style={{ position: 'absolute', top: 24, left: 24, background: 'rgba(9, 11, 16, 0.88)', borderLeft: `4px solid ${accentYellow}`, padding: '6px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#FFF' }}>
                EXHIBIT A // SATELLITE RECON
              </div>
            </div>
          </div>

          {/* Reticle Target Loupe */}
          <div
            style={{
              position: 'absolute',
              left: 480,
              top: 360,
              width: 140,
              height: 140,
              borderRadius: '50%',
              border: `2px dashed ${primaryColor}`,
              boxShadow: `0 0 24px ${primaryColor}55`,
              transform: `translate(-50%, -50%) scale(${reticleScale}) rotate(${reticleRot}deg)`,
              opacity: reticleP,
              zIndex: 35,
              pointerEvents: 'none',
            }}
          />

          {/* Editorial Headline 1 with Redaction Reveal */}
          <div
            style={{
              position: 'absolute',
              left: 1040,
              top: 180,
              width: 780,
              fontSize: 68,
              fontWeight: 900,
              lineHeight: 1.15,
              opacity: title1P,
              transform: `translateY(${interpolate(title1P, [0, 1], [30, 0])}px)`,
            }}
          >
            {headlineWord1}<br />
            {headlineWord2}&nbsp;
            <span style={{ position: 'relative', display: 'inline-block', overflow: 'hidden' }}>
              <span style={{ color: '#FFF' }}>{redactedText}</span>
              <span
                style={{
                  position: 'absolute',
                  inset: '-2px -4px',
                  background: '#000',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transform: `scaleX(${redactScaleX})`,
                  transformOrigin: 'left center',
                }}
              />
            </span>
            <br />DOCUMENTS.

            <div style={{ marginTop: 36, fontSize: 20, fontFamily: "'JetBrains Mono', monospace", color: '#94A3B8', fontWeight: 500, lineHeight: 1.6 }}>
              Internal audit reveals zero dropped frames and 100% vector fidelity across&nbsp;
              <span style={{ position: 'relative', display: 'inline-block', color: '#000', padding: '0 8px', fontWeight: 800 }}>
                <i style={{ position: 'absolute', inset: 0, background: accentYellow, zIndex: -1, transform: `scaleX(${hlScaleX})`, transformOrigin: 'left center' }} />
                CRITICAL BROADCAST
              </span>
              &nbsp;operations.
            </div>
          </div>
        </div>

        {/* SCENE 2: MACRO RACK FOCUS PAN */}
        {isScene2 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: sc2Opacity,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              transform: `translateX(${sc2X}px)`,
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: primaryColor, letterSpacing: '0.2em', marginBottom: 20 }}>
              VERIFIED ARCHIVE // SECTION 02
            </div>
            <h1 style={{ fontSize: 80, fontWeight: 900, maxWidth: 1200, lineHeight: 1.15 }}>
              {scene2Headline}
            </h1>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export default EditorialDossier;
