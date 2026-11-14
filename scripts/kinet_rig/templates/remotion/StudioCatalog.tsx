import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * StudioCatalog — Swiss Minimalist Architectural Catalog & 3D Cinema Camera.
 *
 * Pindaan Mengikut Arahan Tepat Anda:
 *  1. MEMBUANG BULATAN LAKARAN:
 *     - Tiada lagi bulatan pensel merah/hitam di sekeliling kad.
 *  2. MEMBUANG BULATAN KECIL MERAH:
 *     - Grid cross bulatan merah (#gridCross) telah dibuang sepenuhnya.
 *  3. MEMBUANG TULISAN KECIL DI BAWAH KAD:
 *     - Tulisan "SPEC · MINIMALIST CATALOG" di bawah kad A telah dibuang supaya ruang bawah bersih.
 *  4. ALUR KAMERA SEMPURNA (NATURAL & BERSAHAJA):
 *     - 0.0s - 2.5s: Kad A mendarat di paparan stabil.
 *     - 2.5s - 5.0s: Apabila Kad B masuk di sebelah kanan, kamera meluncur lancar ke kanan menjejak pergerakan Kad B.
 *     - 5.0s - 7.5s: Kamera zoom out perlahan-lahan ke paparan seimbang penuh (Wide) dan KEKAL seimbang di situ tanpa zoom-in yang mengejut.
 */
export type StudioCatalogProps = {
  ghostYear?: string;
  headlinePart1?: string;
  headlineHighlight?: string;
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

  // Easing curves
  const easeNatural = Easing.bezier(0.25, 0.1, 0.25, 1);
  const easePower4Out = Easing.bezier(0.16, 1, 0.3, 1);
  const easeBackOut2 = Easing.bezier(0.175, 0.885, 0.32, 1.3);
  const easePower3Out = Easing.bezier(0.215, 0.61, 0.355, 1);
  const easePower4In = Easing.bezier(0.7, 0, 0.84, 0);

  // ==========================================
  // ALUR KAMERA: Mendarat -> Kad B Masuk Terus Gerak Kanan -> Zoom Out Balik Kekal
  // (Tiada lagi zoom mengejut atau mula terlalu dekat)
  // ==========================================
  let camX = 960;
  let camY = 540;
  let camZ = 1.0;

  if (frame < sec(2.5)) {
    // 0.0s - 2.5s: Paparan natural di tengah, kad A masuk & fan out
    camX = 960;
    camY = 540;
    camZ = 1.0;
  } else if (frame >= sec(2.5) && frame < sec(5.0)) {
    // 2.5s - 5.0s: Kad B muncul di kanan -> Kamera terus bergerak menatap ke sebelah kanan
    const p = interpolate(frame, [sec(2.5), sec(4.2)], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easeNatural,
    });
    camX = interpolate(p, [0, 1], [960, 1260]);
    camY = interpolate(p, [0, 1], [540, 500]);
    camZ = interpolate(p, [0, 1], [1.0, 1.15]); // Zum sedikit sahaja secara sinematik
  } else {
    // 5.0s+: Kamera zoom out balik ke paparan wide penuh dan KEKAL di situ tanpa zoom lain
    const p = interpolate(frame, [sec(5.0), sec(6.8)], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easeNatural,
    });
    camX = interpolate(p, [0, 1], [1260, 960]);
    camY = interpolate(p, [0, 1], [500, 540]);
    camZ = interpolate(p, [0, 1], [1.15, 1.0]);
  }

  // 1. Swiss Drafting Grid Line Hairlines (0.15s - 0.80s)
  const gridLineH = interpolate(frame, [sec(0.15), sec(0.80)], [1700, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeNatural,
  });
  const gridLineV = interpolate(frame, [sec(0.15), sec(0.80)], [1000, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeNatural,
  });

  // 2. Ghost Year 1972
  const ghostP = interpolate(frame, [sec(0.20), sec(1.40)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const ghostY = interpolate(ghostP, [0, 1], [40, 0]);

  // 3. Kad A meluncur masuk (0.30s - 1.20s)
  const flyAP = interpolate(frame, [sec(0.30), sec(1.20)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });
  const cutAY = interpolate(flyAP, [0, 1], [500, 0]);

  // Kesan apungan lembut bernafas (Organic Breathing Float)
  const floatBobA = frame >= sec(1.2) ? Math.sin((frame - sec(1.2)) * 0.04) * 8 : 0;

  // Fan out subcards (0.78s & 0.82s)
  const sub1Rot = interpolate(frame, [sec(0.78), sec(1.28)], [0, -4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeBackOut2 });
  const sub1X = interpolate(frame, [sec(0.78), sec(1.28)], [0, -24], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeBackOut2 });
  const sub1Y = interpolate(frame, [sec(0.78), sec(1.28)], [0, 12], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeBackOut2 });

  const sub2Rot = interpolate(frame, [sec(0.82), sec(1.37)], [0, 5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeBackOut2 });
  const sub2X = interpolate(frame, [sec(0.82), sec(1.37)], [0, 28], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeBackOut2 });
  const sub2Y = interpolate(frame, [sec(0.82), sec(1.37)], [0, 18], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeBackOut2 });

  // 4. Kad B masuk dari kanan (2.50s - 3.40s)
  const flyBP = interpolate(frame, [sec(2.50), sec(3.40)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });
  const cutBX = interpolate(flyBP, [0, 1], [400, 0]);

  // 5. Tajuk Utama & Highlighter (5.50s - 6.30s)
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

  // 6. Label Tulisan Tangan Merah (7.80s)
  const label2P = interpolate(frame, [sec(7.80), sec(8.20)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });

  // 7. Dokumen Arkib Drop (8.20s - 9.00s)
  const docP = interpolate(frame, [sec(8.20), sec(9.00)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4Out,
  });
  const docY = interpolate(docP, [0, 1], [400, 0]);

  // 8. Cap Getah Merah VERIFIED Menghempas (9.10s - 9.36s)
  const stampP = interpolate(frame, [sec(9.10), sec(9.36)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower4In,
  });
  const stampScale = interpolate(stampP, [0, 1], [2.2, 1]);
  const stampOpacity = frame >= sec(9.10) ? 0.95 : 0;

  // Gegaran meja semasa cap jatuh (9.36s)
  const deskShake = frame >= sec(9.36) && frame <= sec(9.58)
    ? (frame % 2 === 0 ? 4 : -4)
    : 0;

  // 9. Date block reveal (9.50s)
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
              fontSize: 380,
              fontWeight: 900,
              lineHeight: 0.85,
              letterSpacing: '-.04em',
              color: 'rgba(20, 20, 20, 0.05)',
              opacity: ghostP,
              transform: `translateY(${ghostY}px)`,
              userSelect: 'none',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {ghostYear}
          </div>

          {/* Swiss Architectural Drafting Grid Hairlines (Bulatan merah tengah dibuang) */}
          <svg style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, pointerEvents: 'none', zIndex: 0 }} viewBox="0 0 1920 1080">
            <line x1="120" y1="490" x2="1800" y2="490" stroke="rgba(20,20,20,0.12)" strokeWidth="1.5" strokeDasharray="6 4" strokeDashoffset={gridLineH} />
            <line x1="540" y1="80" x2="540" y2="1000" stroke="rgba(20,20,20,0.12)" strokeWidth="1.5" strokeDasharray="6 4" strokeDashoffset={gridLineV} />
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
              transform: `translate3d(${sub2X}px, ${cutAY + floatBobA + sub2Y}px, 0px) rotate(${sub2Rot}deg)`,
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
              transform: `translate3d(${sub1X}px, ${cutAY + floatBobA + sub1Y}px, 0px) rotate(${sub1Rot}deg)`,
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
              transform: `translateY(${cutAY + floatBobA}px)`,
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
              REPLACE: Photo Cutout<br />Product / Subject / Hardware
            </div>
          </div>

          {/* Cutout B (Kad Sebelah Kanan) */}
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
              REPLACE: Secondary Macro Shot
            </div>
          </div>

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
              transform: `scale(${interpolate(line1P, [0, 1], [0.8, 1])})`,
              transformOrigin: 'left bottom',
              zIndex: 8,
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

          {/* Tulisan Tangan Merah Asal */}
          <div style={{ position: 'absolute', left: 1100, top: 820, fontFamily: '"Caveat", cursive, sans-serif', fontSize: 64, fontWeight: 600, color: primaryColor, opacity: label2P, zIndex: 8 }}>
            {handNote}
          </div>

          {/* Archive Document Drop (#docA) */}
          <div
            style={{
              position: 'absolute',
              left: 1240,
              top: 560,
              width: 470,
              padding: '24px 28px 26px',
              background: '#FFFFFF',
              border: '2px solid rgba(20,20,20,.3)',
              boxShadow: '0 30px 34px rgba(20,20,20,.16), 0 6px 8px rgba(20,20,20,.14)',
              zIndex: 10,
              opacity: docP,
              transform: `translateY(${docY}px) rotate(-1deg)`,
            }}
          >
            <h6 style={{ margin: '0 0 10px', font: '600 18px/1.3 "Inter", sans-serif', letterSpacing: '.18em', color: '#64748B', textTransform: 'uppercase' }}>
              ORIGIN · ARCHIVE · SPEC
            </h6>
            <pre style={{ margin: 0, font: '500 28px/1.4 ui-monospace, monospace', letterSpacing: '.1em', color: inkColor }}>
              SPECIFICATION v1.0{'\n'}VERIFIED LOSSLESS
            </pre>

            {/* Red Rubber Stamp VERIFIED */}
            <span
              style={{
                position: 'absolute',
                right: 16,
                top: -22,
                padding: '4px 14px',
                border: `5px solid ${primaryColor}`,
                borderRadius: 6,
                color: primaryColor,
                font: '900 32px/1.2 "Archivo", sans-serif',
                letterSpacing: '.08em',
                transform: `scale(${stampScale}) rotate(-8deg)`,
                opacity: stampOpacity,
                background: 'rgba(255,255,255,.9)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
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
              background: inkColor,
              color: '#FFF',
              font: '500 36px/1.2 ui-monospace, monospace',
              letterSpacing: '.08em',
              padding: '10px 22px',
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
