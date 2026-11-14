import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * GlitchTerminal — Remotion port of `assets/kinet-glitch-terminal.html`.
 * Cybernetic decrypt arena with telemetry columns, memory dump stream, and RGB chromatic split.
 */
export type GlitchTerminalProps = {
  eyebrow?: string;
  targetText?: string;
  solvedText?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
};

const GLYPHS = '01#@$%&*+=<>~XYZ_!/?';

export const GlitchTerminal: React.FC<GlitchTerminalProps> = ({
  eyebrow = 'CYBERNETIC TELEMETRY PROTOCOL',
  targetText = 'SYSTEM INTRUSION DETECTED',
  solvedText = 'QUANTUM CORE ACCESS GRANTED',
  primaryColor = '#10B981',
  accentColor = '#EF4444',
  backgroundColor = '#050811',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Story phases (based on 180 frames @ 60fps = 3.0s)
  const breachEnd = Math.floor(durationInFrames * 0.45);
  const isDecrypted = frame > breachEnd;

  // Active phrase
  const activeWord = isDecrypted ? solvedText : targetText;
  const progress = isDecrypted
    ? interpolate(frame, [breachEnd, durationInFrames - 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(frame, [0, breachEnd - 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Scramble math
  const revealedCount = Math.floor(progress * activeWord.length);
  let displayedText = '';
  for (let i = 0; i < activeWord.length; i++) {
    if (i < revealedCount) {
      displayedText += activeWord[i];
    } else {
      const charIndex = Math.floor((i * 7 + frame * 3) % GLYPHS.length);
      displayedText += GLYPHS[charIndex];
    }
  }

  // Chromatic glitch shake during breach
  const glitch = frame % 6 === 0 && frame < breachEnd;
  const glitchOffset = glitch ? 8 : 0;

  // Telemetry metric bars
  const memoryPct = Math.min(100, Math.floor(interpolate(frame, [0, durationInFrames], [14, 94])));

  const statusColor = isDecrypted ? primaryColor : accentColor;
  const statusLabel = isDecrypted ? 'STATE: VERIFIED SECURE' : 'STATE: BREACH DETECTED';

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        fontFamily: 'JetBrains Mono, monospace, system-ui',
        color: '#F8FAFC',
        overflow: 'hidden',
        padding: 48,
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', color: '#94A3B8', marginLeft: 8 }}>
            KINETRIG TERMINAL v2.0
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#64748B', display: 'flex', gap: 20 }}>
          <span>NODE: <strong style={{ color: primaryColor }}>127.0.0.1</strong></span>
          <span>LATENCY: <strong style={{ color: statusColor }}>{glitch ? '96ms' : '14ms'}</strong></span>
        </div>
      </div>

      {/* Main Grid: Left Dump, Center Arena, Right Telemetry */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', flex: 1, alignItems: 'center', gap: 40, marginTop: 24 }}>
        {/* Left Column: Memory Dump */}
        <div style={{ fontSize: 12, lineHeight: 2, color: 'rgba(16, 185, 129, 0.55)' }}>
          <div style={{ color: '#94A3B8', fontWeight: 700, borderBottom: '1px solid rgba(16, 185, 129, 0.2)', paddingBottom: 6, marginBottom: 12 }}>
            // MEMORY DUMP
          </div>
          <div>0x7F41A90B2E1C</div>
          <div>0x9C04E38D12FA</div>
          <div style={{ color: primaryColor, fontWeight: 700 }}>0x00F5AA6189B4</div>
          <div>0x33C910FD56AA</div>
          <div>0x88EE719A045B</div>
          <div style={{ color: accentColor }}>0xEF41508899BA</div>
        </div>

        {/* Center Hero: Scrambling Glitch Text */}
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.25em', color: statusColor, marginBottom: 16 }}>
            {eyebrow}
          </div>

          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* RGB Glitch Shadows */}
            {glitch && (
              <>
                <div style={{ position: 'absolute', inset: 0, color: '#EF4444', transform: `translate(-${glitchOffset}px, -2px)`, opacity: 0.8, fontSize: 64, fontWeight: 900 }}>
                  {displayedText}
                </div>
                <div style={{ position: 'absolute', inset: 0, color: '#00F0FF', transform: `translate(${glitchOffset}px, 2px)`, opacity: 0.8, fontSize: 64, fontWeight: 900 }}>
                  {displayedText}
                </div>
              </>
            )}
            <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: 2, textShadow: `0 0 30px ${statusColor}66` }}>
              {displayedText}
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', padding: '8px 20px', borderRadius: 9999, border: `1px solid ${statusColor}44` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{statusLabel}</span>
          </div>
        </div>

        {/* Right Column: Telemetry Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'rgba(10, 18, 30, 0.75)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Memory Load</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', marginBottom: 10 }}>{memoryPct}%</div>
            <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${memoryPct}%`, height: '100%', background: statusColor, borderRadius: 3 }} />
            </div>
          </div>

          <div style={{ background: 'rgba(10, 18, 30, 0.75)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Key Protocol</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: primaryColor }}>0x9F418B_ECC</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default GlitchTerminal;
