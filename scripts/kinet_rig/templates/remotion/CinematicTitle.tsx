import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * CinematicTitle — Remotion port of the `assets/kinet-opener.html` look.
 *
 * Passes the shared rules in `references/laws-shared.md`:
 *   §1 anti-PowerPoint: one statement, two text levels (title + subtitle), continuous push-in.
 *   §5 colour: no hard colour cuts; every change is interpolated.
 *   §7 determinism: frame-driven only. No Date.now(), no Math.random().
 *
 * Props are plain data so the same component can be driven by a KVS scene.
 */
export type CinematicTitleProps = {
  title: string;
  subtitle: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontSize: number;
  letterSpacing: number;
  /** Final scale of the slow push-in. 1 = no zoom. */
  zoomIntensity: number;
};

const easeOutExpo = Easing.out(Easing.bezier(0.16, 1, 0.3, 1));

const CinematicTitle: React.FC<CinematicTitleProps> = ({
  title,
  subtitle,
  primaryColor,
  accentColor,
  backgroundColor,
  fontSize,
  letterSpacing,
  zoomIntensity,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Timing budget is derived from the composition length so short and long cuts both read well.
  const intro = Math.round(durationInFrames * 0.15);
  const outroStart = durationInFrames - Math.round(durationInFrames * 0.15);
  const perChar = Math.max(1, Math.round(durationInFrames * 0.006));

  const scale = interpolate(frame, [0, durationInFrames], [1, zoomIntensity], {
    extrapolateRight: 'clamp',
  });

  const masterOpacity = interpolate(
    frame,
    [0, intro, outroStart, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const ruleWidth = interpolate(frame, [intro, intro * 2.5], [0, 200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });

  const subtitleOpacity = interpolate(frame, [intro * 1.6, intro * 2.6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const subtitleY = interpolate(frame, [intro * 1.6, intro * 2.6], [10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        color: primaryColor,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Ambient accent bloom. Follows the same push-in so the light reads as part of the world. */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          background: `radial-gradient(circle, ${accentColor}33 0%, transparent 70%)`,
          filter: 'blur(60px)',
          transform: `scale(${scale * 1.5})`,
          opacity: 0.4,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${scale})`,
          opacity: masterOpacity,
          textAlign: 'center',
          padding: '0 96px',
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 900,
            letterSpacing,
            textTransform: 'uppercase',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            lineHeight: 1,
            marginBottom: 20,
          }}
        >
          {[...title].map((char, i) => {
            const local = frame - i * perChar;
            const charOpacity = interpolate(local, [0, intro], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const charBlur = interpolate(local, [0, intro], [20, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const charY = interpolate(local, [0, intro], [40, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: easeOutExpo,
            });

            return (
              <span
                key={`${char}-${i}`}
                style={{
                  display: 'inline-block',
                  opacity: charOpacity,
                  filter: `blur(${charBlur}px)`,
                  transform: `translateY(${charY}px)`,
                  whiteSpace: 'pre',
                  textShadow: `0 0 20px ${primaryColor}44`,
                }}
              >
                {char}
              </span>
            );
          })}
        </div>

        <div
          style={{
            width: ruleWidth,
            height: 4,
            backgroundColor: accentColor,
            borderRadius: 2,
            marginBottom: 30,
            boxShadow: `0 0 15px ${accentColor}`,
          }}
        />

        <div
          style={{
            fontSize: 24,
            fontWeight: 400,
            letterSpacing: 8,
            color: `${primaryColor}CC`,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* Vignette keeps focus on the title without a hard edge. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.6) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

export default CinematicTitle;
