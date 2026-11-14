import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * GlitchTerminal — Exact Remotion Port of `assets/kinet-glitch-terminal.html`.
 *
 * Recreates the complete 6.0s (360 frames @ 60fps) cybernetic terminal storytelling:
 *  - Top header telemetry (Active -> Breach -> Decrypt -> Root Secure)
 *  - Left memory hex dump column with highlighted pointers
 *  - Right column: Memory load bar animation (14% -> 68% -> 94% -> 100%), Key & Firewall statuses
 *  - Center arena: Scrambling cipher text with character click cadence
 *  - 1.45s: Chromatic RGB glitch split transient (red & cyan lateral offset + viewport shake)
 *  - 2.10s - 3.80s: Quantum cipher decryption override
 *  - 4.10s - 6.00s: Root Access Granted triumph
 */
export type GlitchTerminalProps = {
  eyebrowInitial?: string;
  eyebrowBreached?: string;
  eyebrowDecrypted?: string;
  eyebrowGranted?: string;
  textPhase1?: string;
  textPhase2?: string;
  textPhase3?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
};

const GLYPHS = '01#@$%&*+=<>~XYZ_!/?';

export const GlitchTerminal: React.FC<GlitchTerminalProps> = ({
  eyebrowInitial = 'CYBERNETIC TELEMETRY PROTOCOL',
  eyebrowBreached = 'SECURITY ALERT // INTRUSION DETECTED',
  eyebrowDecrypted = 'QUANTUM OVERRIDE IN PROGRESS',
  eyebrowGranted = 'SECURITY VERIFIED // PROTOCOL CLEARED',
  textPhase1 = 'SYSTEM COMPROMISED',
  textPhase2 = 'DECRYPTING CIPHER',
  textPhase3 = 'ROOT ACCESS GRANTED',
  primaryColor = '#10B981',
  accentColor = '#EF4444',
  backgroundColor = '#050811',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t = (sec: number) => Math.round(sec * fps);

  // 1. Phasing Time Gates
  const isPhase1 = frame < t(2.1);
  const isPhase2 = frame >= t(2.1) && frame < t(4.1);
  const isPhase3 = frame >= t(4.1);

  // 2. Eyebrow & Status states
  let currentEyebrow = eyebrowInitial;
  let eyebrowColor = primaryColor;
  let statusText = 'STATE: INTRUSION';
  let statusColor = accentColor;
  let subStatus = 'SECURITY SHIELD: BYPASSING MEMORY SECTOR 04';
  let consoleLog = 'INITIALIZING SYSTEM TELEMETRY...';
  let keyVal = '0x9F418B';
  let fwText = 'BREACHED';
  let fwColor = accentColor;
  let headerState = 'BREACH';
  let latency = '48ms';

  if (isPhase2) {
    currentEyebrow = eyebrowDecrypted;
    eyebrowColor = '#F59E0B';
    statusText = 'STATE: DECRYPTING';
    statusColor = '#F59E0B';
    subStatus = 'CRACKING 512-BIT ELLIPTIC CURVE KEY';
    consoleLog = 'DECRYPTING BUFFER HASH: 0x9F418B... MATCH FOUND';
    keyVal = '0x88EE71';
    fwText = 'OVERRIDDEN';
    fwColor = '#F59E0B';
    headerState = 'DECRYPT';
    latency = '22ms';
  } else if (isPhase3) {
    currentEyebrow = eyebrowGranted;
    eyebrowColor = primaryColor;
    statusText = 'STATE: ROOT GRANTED';
    statusColor = primaryColor;
    subStatus = 'QUANTUM CORE ACCESS GRANTED // ZERO ERRORS';
    consoleLog = 'SUCCESS: ELEVATION COMPLETE. ACCESS GRANTED TO ROOT RUNTIME.';
    keyVal = '0x00F5AA';
    fwText = 'AUTHENTICATED';
    fwColor = primaryColor;
    headerState = 'ROOT SECURE';
    latency = '8ms';
  }

  // 3. Memory Allocation Bar: 14% -> 68% (0.15s - 1.4s) -> 94% (2.1s - 3.8s) -> 100% (4.1s+)
  let memProgress = 14;
  if (frame < t(1.4)) {
    memProgress = interpolate(frame, [t(0.15), t(1.4)], [14, 68], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  } else if (frame < t(3.8)) {
    memProgress = interpolate(frame, [t(2.1), t(3.8)], [68, 94], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  } else {
    memProgress = interpolate(frame, [t(4.1), t(4.5)], [94, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }
  const memInt = Math.round(memProgress);

  // 4. Text Scramble Logic
  let targetWord = textPhase1;
  let scrambleProgress = 0;

  if (isPhase1) {
    targetWord = textPhase1;
    scrambleProgress = interpolate(frame, [t(0.25), t(1.45)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  } else if (isPhase2) {
    targetWord = textPhase2;
    scrambleProgress = interpolate(frame, [t(2.2), t(3.5)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  } else {
    targetWord = textPhase3;
    scrambleProgress = interpolate(frame, [t(4.15), t(5.2)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }

  const revealedChars = Math.floor(scrambleProgress * targetWord.length);
  let mainDisplay = '';
  for (let i = 0; i < targetWord.length; i++) {
    if (i < revealedChars) {
      mainDisplay += targetWord[i];
    } else {
      const gIdx = Math.floor((i * 7 + frame * 5) % GLYPHS.length);
      mainDisplay += GLYPHS[gIdx];
    }
  }

  // 5. Chromatic RGB Glitch Split Transient (1.45s) and Root Flash (4.10s)
  const isGlitch1 = frame >= t(1.45) && frame <= t(1.65);
  const isGlitch2 = frame >= t(4.1) && frame <= t(4.25);
  const showRgbSplit = isGlitch1 || isGlitch2;
  const shakeX = isGlitch1 ? (frame % 2 === 0 ? -16 : 14) : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
        color: '#F8FAFC',
        overflow: 'hidden',
        padding: '36px 48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transform: `translateX(${shakeX}px)`,
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: 14,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', color: '#94A3B8', textTransform: 'uppercase', marginLeft: 6 }}>
            KINETRIG TERMINAL // ROOT ACCESS
          </span>
        </div>
        <div style={{ display: 'flex', gap: 28, fontSize: 12, color: '#64748B', fontWeight: 600 }}>
          <span>CORE: <b style={{ color: primaryColor }}>ACTIVE</b></span>
          <span>STATE: <b style={{ color: eyebrowColor }}>{headerState}</b></span>
          <span>LATENCY: <b style={{ color: statusColor }}>{latency}</b></span>
        </div>
      </div>

      {/* Main Grid: Left Hex Stream | Center Arena | Right Telemetry */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 280px', flex: 1, alignItems: 'center', gap: 40, margin: '20px 0' }}>
        {/* Left Column: Hex Dump Stream */}
        <div style={{ fontSize: 12, lineHeight: 2.1, color: 'rgba(16, 185, 129, 0.55)' }}>
          <div style={{ color: '#94A3B8', fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', paddingBottom: 6, marginBottom: 12 }}>
            // MEMORY DUMP
          </div>
          <div>0x7F41A90B2E1C</div>
          <div>0x9C04E38D12FA</div>
          <div style={{ color: primaryColor, fontWeight: 700 }}>0x00F5AA6189B4</div>
          <div>0x33C910FD56AA</div>
          <div>0x88EE719A045B</div>
          <div style={{ color: isPhase3 ? primaryColor : accentColor, fontWeight: 700 }}>0xEF41508899BA</div>
          <div>0x12BA9944CD01</div>
        </div>

        {/* Center Arena: Decrypting Scramble with RGB Glitch */}
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', color: eyebrowColor, marginBottom: 16 }}>
            {currentEyebrow}
          </div>

          <div style={{ position: 'relative', display: 'inline-block' }}>
            {showRgbSplit && (
              <>
                <div style={{ position: 'absolute', inset: 0, color: '#EF4444', transform: 'translate(-14px, -2px)', opacity: 0.9, fontSize: 62, fontWeight: 900 }}>
                  {mainDisplay}
                </div>
                <div style={{ position: 'absolute', inset: 0, color: '#00F0FF', transform: 'translate(14px, 2px)', opacity: 0.9, fontSize: 62, fontWeight: 900 }}>
                  {mainDisplay}
                </div>
              </>
            )}
            <div style={{ fontSize: 62, fontWeight: 900, letterSpacing: 3, textShadow: `0 0 35px ${statusColor}77` }}>
              {mainDisplay}
            </div>
          </div>

          <div style={{ marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 14, background: 'rgba(10, 18, 30, 0.65)', border: `1px solid ${statusColor}44`, padding: '10px 24px', borderRadius: 9999 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: statusColor, textTransform: 'uppercase' }}>{statusText}</span>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>{subStatus}</span>
          </div>
        </div>

        {/* Right Column: Telemetry Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Card 1: Memory */}
          <div style={{ background: 'rgba(10, 18, 30, 0.75)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Memory Allocation</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#F8FAFC' }}>{memInt}%</span>
              <span style={{ fontSize: 11, color: '#64748B' }}>4096 MB</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${memInt}%`, height: '100%', background: statusColor, borderRadius: 3 }} />
            </div>
          </div>

          {/* Card 2: Key */}
          <div style={{ background: 'rgba(10, 18, 30, 0.75)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Encryption Key</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC' }}>{keyVal}</div>
          </div>

          {/* Card 3: Firewall */}
          <div style={{ background: 'rgba(10, 18, 30, 0.75)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Security Firewall</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: fwColor }}>{fwText}</div>
          </div>
        </div>
      </div>

      {/* Bottom Console Log */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 14, fontSize: 11, color: '#64748B' }}>
        <span>LOG: <b style={{ color: '#E2E8F0' }}>{consoleLog}</b></span>
        <span>NODE: 127.0.0.1:4004 // 60 FPS VERIFIED</span>
      </div>
    </AbsoluteFill>
  );
};

export default GlitchTerminal;
