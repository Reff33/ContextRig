import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * GlitchTerminal — 100% Exact Remotion Port of `assets/kinet-glitch-terminal.html`.
 *
 * Exact styling, CRT scanlines, cyber grid, vignette, and timeline match:
 *  - Master Stage: 1920x1080 with radial-gradient(circle at 50% 50%, #081426 0%, #040810 85%).
 *  - CRT Scanlines: 4px striped scanlines overlay.
 *  - Cyber Vignette: inset 0 0 160px rgba(0,0,0,0.92).
 *  - Cyber Grid: 60px x 60px green gridlines.
 *  - Top Header: #latVal, CIPHER, #headerState (ACTIVE -> BREACH -> DECRYPT -> ROOT SECURE).
 *  - Left Hex Col: 8 hex lines with dynamic shifting highlight.
 *  - Right Telemetry Col: Memory load progress bar, Encryption key, Firewall status.
 *  - Center Arena:
 *      Phase 1 (0.15s - 1.45s): Intrusion breach, red alert, memory floods 14% -> 68%, "SYSTEM COMPROMISED".
 *      1.45s Transient: Full RGB chromatic glitch split (red & cyan offset ±12px) + #world lateral shake (-16px).
 *      Phase 2 (2.10s - 3.80s): Quantum override, amber warning, memory 68% -> 94%, "DECRYPTING CIPHER".
 *      Phase 3 (4.10s - 6.00s): Root access triumph, emerald verified, memory 100%, "ROOT ACCESS GRANTED", final stage shudder.
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

const GLYPHS = 'ABCDEF0123456789!@#$%^&*<>_-+=';

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
  backgroundColor = '#040810',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sec = (s: number) => Math.round(s * fps);

  // Time gates matching exact GSAP calls
  const isPhase1 = frame < sec(2.10);
  const isPhase2 = frame >= sec(2.10) && frame < sec(4.10);
  const isPhase3 = frame >= sec(4.10);

  // Status & Telemetry
  let eyebrow = eyebrowInitial;
  let eyebrowColor = primaryColor;
  let statusText = 'STATE: INTRUSION';
  let statusClass: 'danger' | 'warning' | 'normal' = 'danger';
  let subStatus = 'SECURITY SHIELD: BYPASSING MEMORY SECTOR 04';
  let consoleLog = 'INITIALIZING SYSTEM TELEMETRY...';
  let keyVal = '0x9F418B';
  let fwVal = 'BREACHED';
  let fwColor = '#EF4444';
  let headerState = 'ACTIVE';
  let headerStateColor = primaryColor;
  let latVal = '12ms';

  if (frame >= sec(0.15) && frame < sec(2.10)) {
    eyebrow = eyebrowBreached;
    eyebrowColor = '#EF4444';
    statusText = 'STATE: INTRUSION';
    statusClass = 'danger';
    subStatus = 'BYPASSING MEMORY SECTOR 04';
    consoleLog = 'INTRUSION DETECTED: UNAUTHORIZED PRIVILEGE ESCALATION AT 0x7F41';
    headerState = 'BREACH';
    headerStateColor = '#EF4444';
    latVal = '48ms';
  } else if (isPhase2) {
    eyebrow = eyebrowDecrypted;
    eyebrowColor = '#F59E0B';
    statusText = 'STATE: DECRYPTING';
    statusClass = 'warning';
    subStatus = 'CRACKING 512-BIT ELLIPTIC CURVE KEY';
    consoleLog = 'DECRYPTING BUFFER HASH: 0x9F418B... MATCH FOUND';
    keyVal = '0x88EE71';
    fwVal = 'OVERRIDDEN';
    fwColor = '#F59E0B';
    headerState = 'DECRYPT';
    headerStateColor = '#F59E0B';
    latVal = '22ms';
  } else if (isPhase3) {
    eyebrow = eyebrowGranted;
    eyebrowColor = primaryColor;
    statusText = 'STATE: ROOT GRANTED';
    statusClass = 'normal';
    subStatus = 'QUANTUM CORE ACCESS GRANTED // ZERO ERRORS';
    consoleLog = 'SUCCESS: ELEVATION COMPLETE. ACCESS GRANTED TO ROOT RUNTIME.';
    keyVal = '0x00F5AA';
    fwVal = 'AUTHENTICATED';
    fwColor = primaryColor;
    headerState = 'ROOT SECURE';
    headerStateColor = primaryColor;
    latVal = '8ms';
  }

  // Memory buffer progression
  let memProgress = 14;
  if (frame < sec(0.15)) {
    memProgress = 14;
  } else if (frame < sec(1.40)) {
    memProgress = interpolate(frame, [sec(0.15), sec(1.40)], [14, 68], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  } else if (frame < sec(2.10)) {
    memProgress = 68;
  } else if (frame < sec(3.80)) {
    memProgress = interpolate(frame, [sec(2.10), sec(3.80)], [68, 94], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  } else if (frame < sec(4.10)) {
    memProgress = 94;
  } else {
    memProgress = 100;
  }
  const memInt = Math.round(memProgress);

  // Scramble text computation
  let targetString = textPhase1;
  let p = 0;
  if (isPhase1) {
    targetString = textPhase1;
    p = interpolate(frame, [sec(0.25), sec(1.45)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  } else if (isPhase2) {
    targetString = textPhase2;
    p = interpolate(frame, [sec(2.20), sec(3.50)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  } else {
    targetString = textPhase3;
    p = interpolate(frame, [sec(4.20), sec(5.30)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }

  const len = targetString.length;
  const revealed = Math.floor(len * p);
  let mainText = '';
  for (let i = 0; i < len; i++) {
    if (i < revealed) mainText += targetString[i];
    else mainText += GLYPHS[Math.floor((i * 7 + p * 50 + frame * 0.4) % GLYPHS.length)];
  }

  // 1.45s Chromatic RGB Glitch Transient
  const isGlitchTransient = frame >= sec(1.45) && frame <= sec(1.65);
  const glitchOpacity = isGlitchTransient ? 0.95 : 0;
  let worldX = 0;
  let worldY = 0;
  let worldScale = 1.0;

  if (isGlitchTransient) {
    worldX = interpolate(frame, [sec(1.45), sec(1.59)], [-16, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    worldScale = 1.01;
  } else if (frame >= sec(4.15) && frame <= sec(4.50)) {
    worldScale = interpolate(frame, [sec(4.15), sec(4.50)], [1.02, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  } else if (frame >= sec(5.30) && frame <= sec(5.42)) {
    worldY = interpolate(frame, [sec(5.30), sec(5.36), sec(5.42)], [0, -6, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }

  // Dynamic Hex shift
  const hexShift = Math.floor((frame / fps) * 8) % 16;
  const dynamicHex3 = '0x' + ((0x00F5AA + hexShift * 0x111) & 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0') + '6189B4';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        overflow: 'hidden',
        color: '#fff',
        fontFamily: "'JetBrains Mono', monospace",
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
          background: `radial-gradient(circle at 50% 50%, #081426 0%, ${backgroundColor} 85%)`,
          overflow: 'hidden',
        }}
      >
        {/* CRT Scanlines overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%)',
            backgroundSize: '100% 4px',
            pointerEvents: 'none',
            zIndex: 30,
            opacity: 0.65,
          }}
        />

        {/* Cyber Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 160px rgba(0,0,0,0.92)',
            pointerEvents: 'none',
            zIndex: 31,
          }}
        />

        {/* #world Container with glitch displacement */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: 1920,
            height: 1080,
            transform: `translate3d(${worldX}px, ${worldY}px, 0px) scale(${worldScale})`,
            willChange: 'transform, filter',
          }}
        >
          {/* Cyber Grid */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.05) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
              opacity: 0.7,
            }}
          />

          {/* Top Header Bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 60,
              background: 'rgba(8, 14, 24, 0.85)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 48px',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', color: '#94A3B8', textTransform: 'uppercase' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
              </div>
              <span>KINET_SECURITY_GRID // QUANTUM_CIPHER_ENGINE</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              <span>LATENCY: <b style={{ color: primaryColor, fontWeight: 700 }}>{latVal}</b></span>
              <span>CIPHER: <b style={{ color: primaryColor, fontWeight: 700 }}>SHA-512/EC</b></span>
              <span>STATE: <b style={{ color: headerStateColor, fontWeight: 700 }}>{headerState}</b></span>
            </div>
          </div>

          {/* Left Hex Column */}
          <div
            style={{
              position: 'absolute',
              left: 48,
              top: 96,
              bottom: 80,
              width: 220,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              fontSize: 12,
              lineHeight: 2.0,
              color: 'rgba(16, 185, 129, 0.55)',
              zIndex: 5,
            }}
          >
            <div style={{ color: '#94A3B8', fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', paddingBottom: 6, marginBottom: 12 }}>
              // MEMORY DUMP
            </div>
            <div>0x7F41A90B2E1C</div>
            <div>0x9C04E38D12FA</div>
            <div>0x2B889A1450CD</div>
            <div style={{ color: primaryColor, fontWeight: 700 }}>{dynamicHex3}</div>
            <div>0x33C910FD56AA</div>
            <div>0x88EE719A045B</div>
            <div>0x12BA9944CD01</div>
            <div style={{ color: isPhase3 ? primaryColor : accentColor, fontWeight: 700 }}>0xEF41508899BA</div>
          </div>

          {/* Right Telemetry Column */}
          <div
            style={{
              position: 'absolute',
              right: 48,
              top: 96,
              bottom: 80,
              width: 250,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              zIndex: 5,
            }}
          >
            <div style={{ background: 'rgba(10, 18, 30, 0.75)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, padding: '16px 18px', backdropFilter: 'blur(12px)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                Memory Allocation
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC' }}>{memInt}%</span>
                <span style={{ fontSize: 11, color: '#64748B' }}>4096 MB</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${memInt}%`, height: '100%', background: isPhase3 ? primaryColor : (isPhase2 ? '#F59E0B' : primaryColor), borderRadius: 3 }} />
              </div>
            </div>

            <div style={{ background: 'rgba(10, 18, 30, 0.75)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, padding: '16px 18px', backdropFilter: 'blur(12px)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                Encryption Key
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC' }}>{keyVal}</div>
            </div>

            <div style={{ background: 'rgba(10, 18, 30, 0.75)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, padding: '16px 18px', backdropFilter: 'blur(12px)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                Security Firewall
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: fwColor }}>{fwVal}</div>
            </div>
          </div>

          {/* Center Arena */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 1300,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.35em',
                color: eyebrowColor,
                textTransform: 'uppercase',
                marginBottom: 24,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ width: 36, height: 1, background: 'currentColor', opacity: 0.6 }} />
              {eyebrow}
              <span style={{ width: 36, height: 1, background: 'currentColor', opacity: 0.6 }} />
            </div>

            {/* Scramble Hero with RGB split copies */}
            <div
              style={{
                position: 'relative',
                fontFamily: "'Space Grotesk', sans-serif, system-ui",
                fontSize: 88,
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                textTransform: 'uppercase',
                color: '#F8FAFC',
                minHeight: 190,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* RGB Red Copy */}
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  color: '#EF4444',
                  transform: 'translate(-12px, 0)',
                  mixBlendMode: 'screen',
                  opacity: glitchOpacity,
                }}
              >
                {mainText}
              </span>

              {/* RGB Cyan Copy */}
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  color: '#06B6D4',
                  transform: 'translate(12px, 0)',
                  mixBlendMode: 'screen',
                  opacity: glitchOpacity,
                }}
              >
                {mainText}
              </span>

              {/* Base Scrambled Hero Text */}
              <span>{mainText}</span>
            </div>

            {/* Status metadata pill & substatus */}
            <div
              style={{
                marginTop: 36,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                fontSize: 15,
                color: '#94A3B8',
              }}
            >
              <span
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  background: statusClass === 'danger'
                    ? 'rgba(239, 68, 68, 0.18)'
                    : (statusClass === 'warning' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.15)'),
                  borderColor: statusClass === 'danger'
                    ? 'rgba(239, 68, 68, 0.5)'
                    : (statusClass === 'warning' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.4)'),
                  color: statusClass === 'danger'
                    ? '#EF4444'
                    : (statusClass === 'warning' ? '#F59E0B' : primaryColor),
                  boxShadow: statusClass === 'danger'
                    ? '0 0 16px rgba(239, 68, 68, 0.25)'
                    : (statusClass === 'warning' ? '0 0 16px rgba(245, 158, 11, 0.25)' : 'none'),
                  border: '1px solid',
                }}
              >
                {statusText}
              </span>
              <span>{subStatus}</span>
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 22,
                  background: primaryColor,
                  verticalAlign: 'middle',
                  opacity: frame % 30 < 15 ? 1 : 0,
                }}
              />
            </div>
          </div>

          {/* Bottom Console Log Ticker */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: 48,
              background: 'rgba(8, 14, 24, 0.9)',
              borderTop: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 48px',
              fontSize: 12,
              color: '#64748B',
              zIndex: 10,
            }}
          >
            <span>LOG: <span style={{ color: '#F8FAFC' }}>{consoleLog}</span></span>
            <span>NODE: 127.0.0.1:4004 // 60 FPS VERIFIED</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default GlitchTerminal;
