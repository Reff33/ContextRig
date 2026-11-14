import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * ChatDialogue — Remotion Port of `assets/kinet-dialogue.html`.
 * Diegetic chat simulation with 3D device tilt, human typing cadence in input box,
 * pulsing typing indicator dots wave, message cascade with spring pops, and reaction badges.
 */
export type ChatDialogueProps = {
  userName?: string;
  agentName?: string;
  userPrompt?: string;
  agentResponse?: string;
  primaryColor?: string;
  backgroundColor?: string;
};

export const ChatDialogue: React.FC<ChatDialogueProps> = ({
  userName = 'Alex Rivera',
  agentName = 'KinetRig AI',
  userPrompt = 'Generate a 60 FPS spatial kinetic video for SaaS launch',
  agentResponse = 'Done! Synthesized 5 narrative beats with 3-layer audio ducking.',
  primaryColor = '#38BDF8',
  backgroundColor = '#0B1120',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t = (sec: number) => Math.round(sec * fps);

  // 1. Device 3D Lean (leans forward during user typing, rises when AI answers)
  const tiltX = interpolate(
    frame,
    [t(0.1), t(0.7), t(1.2), t(2.2)],
    [0, 6, 6, -1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) }
  );

  // 2. Human Typing Cadence in Input Box (0.10s - 0.70s)
  const typingProgress = interpolate(frame, [t(0.1), t(0.7)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const typedLength = Math.floor(typingProgress * userPrompt.length);
  const inputDisplay = frame < t(0.75) ? userPrompt.slice(0, typedLength) : '';

  // 3. User Message Pop (0.75s)
  const userMsgProgress = interpolate(frame, [t(0.75), t(1.05)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.bezier(0.16, 1, 0.3, 1)),
  });

  // 4. Typing Indicator Wave (1.05s - 1.80s)
  const showDots = frame >= t(1.05) && frame < t(1.85);

  // 5. AI Message Pop (1.88s) — Pops in directly fully formed!
  const aiMsgProgress = interpolate(frame, [t(1.88), t(2.25)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.bezier(0.16, 1, 0.3, 1)),
  });

  // 6. Reaction Pill Stamp (2.30s)
  const reactionScale = interpolate(frame, [t(2.3), t(2.55)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.bezier(0.34, 1.56, 0.64, 1)),
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 40%, #1E293B 0%, ${backgroundColor} 80%)`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 1200,
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#F8FAFC',
      }}
    >
      {/* 3D Chat Device Shell */}
      <div
        style={{
          width: 820,
          borderRadius: 28,
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '32px 36px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(56, 189, 248, 0.15)',
          backdropFilter: 'blur(24px)',
          transform: `rotateX(${tiltX}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            paddingBottom: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(2, 132, 199, 0.4)',
            }}
          >
            <svg style={{ width: 28, height: 28, stroke: '#FFF', strokeWidth: 2, fill: 'none' }} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{agentName}</div>
            <div style={{ fontSize: 13, color: primaryColor, fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              ONLINE // AUTONOMOUS AGENT ACTIVE
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div style={{ height: 380, display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
          {/* User Message */}
          <div
            style={{
              alignSelf: 'flex-end',
              maxWidth: '80%',
              background: '#0284C7',
              padding: '16px 24px',
              borderRadius: '22px 22px 4px 22px',
              fontSize: 18,
              lineHeight: 1.5,
              opacity: userMsgProgress,
              transform: `translateY(${interpolate(userMsgProgress, [0, 1], [30, 0])}px) scale(${interpolate(userMsgProgress, [0, 1], [0.92, 1])})`,
              boxShadow: '0 10px 25px rgba(2, 132, 199, 0.25)',
            }}
          >
            {userPrompt}
          </div>

          {/* Typing Indicator Dots */}
          {showDots && (
            <div
              style={{
                alignSelf: 'flex-start',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '14px 20px',
                borderRadius: 20,
                display: 'flex',
                gap: 8,
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#94A3B8',
                    transform: `translateY(${Math.sin((frame + i * 8) * 0.3) * 4}px)`,
                  }}
                />
              ))}
            </div>
          )}

          {/* AI Response Message */}
          <div
            style={{
              alignSelf: 'flex-start',
              maxWidth: '85%',
              background: '#1E293B',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '18px 26px',
              borderRadius: '22px 22px 22px 4px',
              fontSize: 18,
              lineHeight: 1.5,
              opacity: aiMsgProgress,
              transform: `translateY(${interpolate(aiMsgProgress, [0, 1], [25, 0])}px) scale(${interpolate(aiMsgProgress, [0, 1], [0.92, 1])})`,
              position: 'relative',
              boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
            }}
          >
            {agentResponse}

            {/* Reaction Pill Badge */}
            <div
              style={{
                position: 'absolute',
                bottom: -12,
                right: 20,
                background: '#090D16',
                border: `1px solid ${primaryColor}`,
                color: primaryColor,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: 9999,
                transform: `scale(${reactionScale})`,
                boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
              }}
            >
              ✓ VERIFIED
            </div>
          </div>
        </div>

        {/* Input Bar with Simulated Typing */}
        <div
          style={{
            marginTop: 20,
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 16,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ color: inputDisplay ? '#FFF' : '#64748B', fontSize: 16 }}>
            {inputDisplay || 'Ask KinetRig anything...'}
            {frame < t(0.75) && <span style={{ opacity: frame % 16 < 8 ? 1 : 0, color: primaryColor }}>|</span>}
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: inputDisplay ? primaryColor : 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg style={{ width: 18, height: 18, stroke: inputDisplay ? '#000' : '#64748B', strokeWidth: 2, fill: 'none' }} viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default ChatDialogue;
