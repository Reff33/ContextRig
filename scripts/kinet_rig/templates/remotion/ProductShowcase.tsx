import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * ProductShowcase — 100% Exact Remotion Port of `assets/kinet-showcase.html`.
 * Matches HTML5/GSAP layout, 3D card perspective tilt, specular card shine,
 * staggered specification items, and bouncing CTA button:
 *
 * Stage: 1920x1080 with radial-gradient(circle at 65% 50%, #1E293B, #000 75%).
 * 0.20s - 1.40s: #card-vis from { opacity: 0, scale: 0.8, rotateY: -28, rotateX: 18 } to { opacity: 1, scale: 1, rotateY: 0, rotateX: 0 } (back.out(1.4))
 * 0.35s - 1.45s: #card-shine specular shimmer sweep (xPercent: -130 -> 130, opacity: 0.95 -> 0)
 * 0.40s - 0.90s: Badge drop-in (#b1)
 * 0.60s - 1.40s: Title slide-in (#t1) from x: 30
 * 0.90s - 1.60s: Description fade-in (#d1)
 * 1.30s - 2.00s: Spec items stagger from y: 25 (back.out(1.5))
 * 1.80s - 2.40s: Buy CTA button bounce-in (back.out(2))
 * 2.00s - 6.40s: Gentle floating sine bob on card (y: 0 -> -12 -> 0)
 */
export type ProductShowcaseProps = {
  categoryBadge?: string;
  productName?: string;
  productDesc?: string;
  price?: string;
  spec1Val?: string;
  spec1Lbl?: string;
  spec2Val?: string;
  spec2Lbl?: string;
  spec3Val?: string;
  spec3Lbl?: string;
  ctaText?: string;
  primaryColor?: string;
  backgroundColor?: string;
};

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({
  categoryBadge = 'FLAGSHIP AUDIO RIG',
  productName = 'KinetPro Spatial Headset',
  productDesc = 'Planar magnetic acoustic drivers with zero-latency spatial head tracking and aerospace titanium headband.',
  price = '$349',
  spec1Val = '0.4ms',
  spec1Lbl = 'Ultra Latency',
  spec2Val = '10-48k',
  spec2Lbl = 'Frequency',
  spec3Val = '42h',
  spec3Lbl = 'Battery Life',
  ctaText = 'Order Now — Free Worldwide Shipping',
  primaryColor = '#F59E0B',
  backgroundColor = '#000000',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sec = (s: number) => Math.round(s * fps);

  // GSAP Easing Equivalents
  const easeBackOut14 = Easing.bezier(0.175, 0.885, 0.32, 1.25);
  const easeBackOut15 = Easing.bezier(0.175, 0.885, 0.32, 1.275);
  const easeBackOut20 = Easing.bezier(0.175, 0.885, 0.32, 1.45);
  const easePower3Out = Easing.bezier(0.215, 0.61, 0.355, 1);
  const easePower2Out = Easing.bezier(0.25, 0.46, 0.45, 0.94);

  // 1. 3D Card Entrance (0.2s -> 1.4s)
  const cardP = interpolate(frame, [sec(0.2), sec(1.4)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeBackOut14,
  });
  const cardOpacity = cardP;
  const cardScale = interpolate(cardP, [0, 1], [0.8, 1]);
  const cardRotX = interpolate(cardP, [0, 1], [18, 0]);
  const cardRotY = interpolate(cardP, [0, 1], [-28, 0]);

  // Card gentle floating sine bob (2.0s onwards)
  const floatBobY = frame >= sec(2.0)
    ? Math.sin((frame - sec(2.0)) * 0.05) * 6 - 6
    : 0;

  // 2. Specular Card Shine Sweep (0.35s -> 1.45s)
  const shineP = interpolate(frame, [sec(0.35), sec(1.45)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower2Out,
  });
  const shineX = interpolate(shineP, [0, 1], [-130, 130]);
  const shineOpacity = interpolate(shineP, [0, 0.3, 1], [0, 0.95, 0]);

  // 3. Info Elements
  const badgeP = interpolate(frame, [sec(0.4), sec(0.9)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleP = interpolate(frame, [sec(0.6), sec(1.4)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easePower3Out,
  });
  const descP = interpolate(frame, [sec(0.9), sec(1.6)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // 4. Spec Items Stagger (1.30s, 1.42s, 1.54s)
  const getSpecP = (delay: number) => {
    return interpolate(frame, [sec(delay), sec(delay + 0.6)], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easeBackOut15,
    });
  };
  const sp1 = getSpecP(1.30);
  const sp2 = getSpecP(1.42);
  const sp3 = getSpecP(1.54);

  // 5. CTA Button Bounce (1.80s -> 2.40s)
  const ctaP = interpolate(frame, [sec(1.8), sec(2.4)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeBackOut20,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        overflow: 'hidden',
        color: '#FFF',
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      }}
    >
      {/* Master Stage (1920x1080) */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 1920,
          height: 1080,
          marginLeft: -960,
          marginTop: -540,
          background: 'radial-gradient(circle at 65% 50%, #1E293B, #000 75%)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 80, alignItems: 'center', maxWidth: 1400 }}>
          {/* Left Column: 3D Product Visual Card */}
          <div style={{ perspective: 1200, position: 'relative' }}>
            <div
              style={{
                width: 520,
                height: 520,
                borderRadius: 28,
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(0,0,0,0.88))',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(245, 158, 11, 0.4)',
                position: 'relative',
                transformStyle: 'preserve-3d',
                overflow: 'hidden',
                opacity: cardOpacity,
                transform: `scale(${cardScale}) rotateX(${cardRotX}deg) rotateY(${cardRotY}deg) translateY(${floatBobY}px)`,
              }}
            >
              {/* Specular Shine Sweep */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'inherit',
                  pointerEvents: 'none',
                  background: 'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.45) 45%, rgba(245,158,11,0.5) 55%, transparent 75%)',
                  transform: `translateX(${shineX}%)`,
                  opacity: shineOpacity,
                  mixBlendMode: 'screen',
                  zIndex: 5,
                }}
              />

              {/* Price Tag Pill */}
              <div
                style={{
                  position: 'absolute',
                  top: 24,
                  right: 24,
                  background: primaryColor,
                  color: '#000',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 28,
                  fontWeight: 800,
                  padding: '8px 20px',
                  borderRadius: 999,
                  boxShadow: '0 10px 25px rgba(245, 158, 11, 0.5)',
                  zIndex: 10,
                }}
              >
                {price}
              </div>

              {/* Hero Headphone Vector SVG Icon */}
              <svg
                style={{
                  width: 260,
                  height: 260,
                  stroke: primaryColor,
                  strokeWidth: 1.5,
                  fill: 'none',
                  filter: 'drop-shadow(0 0 16px rgba(245, 158, 11, 0.4))',
                }}
                viewBox="0 0 24 24"
              >
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            </div>
          </div>

          {/* Right Column: Product Info & Specs */}
          <div style={{ maxWidth: 620, textAlign: 'left' }}>
            <div
              style={{
                display: 'inline-block',
                background: 'rgba(245, 158, 11, 0.15)',
                color: primaryColor,
                border: '1px solid rgba(245, 158, 11, 0.4)',
                fontSize: 14,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '6px 16px',
                borderRadius: 999,
                marginBottom: 20,
                opacity: badgeP,
                transform: `translateY(${interpolate(badgeP, [0, 1], [-15, 0])}px)`,
              }}
            >
              {categoryBadge}
            </div>

            <h1
              style={{
                fontSize: 64,
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: 24,
                opacity: titleP,
                transform: `translateX(${interpolate(titleP, [0, 1], [30, 0])}px)`,
              }}
            >
              {productName}
            </h1>

            <p
              style={{
                fontSize: 20,
                color: '#94A3B8',
                lineHeight: 1.6,
                marginBottom: 36,
                opacity: descP,
                transform: `translateY(${interpolate(descP, [0, 1], [20, 0])}px)`,
              }}
            >
              {productDesc}
            </p>

            {/* Spec Grid */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 40 }}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '14px 22px',
                  opacity: sp1,
                  transform: `translateY(${interpolate(sp1, [0, 1], [25, 0])}px)`,
                }}
              >
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 22, fontWeight: 700, color: '#FFF' }}>{spec1Val}</div>
                <div style={{ fontSize: 13, color: '#64748B', textTransform: 'uppercase', marginTop: 4 }}>{spec1Lbl}</div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '14px 22px',
                  opacity: sp2,
                  transform: `translateY(${interpolate(sp2, [0, 1], [25, 0])}px)`,
                }}
              >
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 22, fontWeight: 700, color: '#FFF' }}>{spec2Val}</div>
                <div style={{ fontSize: 13, color: '#64748B', textTransform: 'uppercase', marginTop: 4 }}>{spec2Lbl}</div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '14px 22px',
                  opacity: sp3,
                  transform: `translateY(${interpolate(sp3, [0, 1], [25, 0])}px)`,
                }}
              >
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 22, fontWeight: 700, color: '#FFF' }}>{spec3Val}</div>
                <div style={{ fontSize: 13, color: '#64748B', textTransform: 'uppercase', marginTop: 4 }}>{spec3Lbl}</div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              style={{
                background: primaryColor,
                color: '#000',
                fontSize: 22,
                fontWeight: 800,
                padding: '18px 44px',
                borderRadius: 14,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)',
                opacity: ctaP,
                transform: `scale(${interpolate(ctaP, [0, 1], [0.85, 1])})`,
              }}
            >
              {ctaText}
            </button>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default ProductShowcase;
