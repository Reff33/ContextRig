import React from 'react';
import { Composition } from 'remotion';
import CinematicTitle, { CinematicTitleProps } from '../templates/remotion/CinematicTitle';
import GlitchTerminal, { GlitchTerminalProps } from '../templates/remotion/GlitchTerminal';
import SaasMacro, { SaasMacroProps } from '../templates/remotion/SaasMacro';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 1. Cinematic Title (Opener) */}
      <Composition
        id="CinematicTitle"
        component={CinematicTitle}
        durationInFrames={180}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          title: "KINETRIG STUDIO",
          subtitle: "AI REMOTION PRODUCTION ENGINE",
          primaryColor: "#FFFFFF",
          accentColor: "#00F0FF",
          backgroundColor: "#08090D",
          fontSize: 120,
          letterSpacing: 8,
          zoomIntensity: 1.15,
        } as CinematicTitleProps}
      />

      {/* 2. Glitch Terminal (Cipher/Tech/Cybersecurity) */}
      <Composition
        id="GlitchTerminal"
        component={GlitchTerminal}
        durationInFrames={180}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          eyebrow: "CYBERNETIC TELEMETRY PROTOCOL",
          targetText: "SYSTEM INTRUSION DETECTED",
          solvedText: "QUANTUM CORE VERIFIED",
          primaryColor: "#10B981",
          accentColor: "#EF4444",
          backgroundColor: "#050811",
        } as GlitchTerminalProps}
      />

      {/* 3. SaaS Macro (Interactive UI / Analytics) */}
      <Composition
        id="SaasMacro"
        component={SaasMacro}
        durationInFrames={180}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          headline: "AUTONOMOUS REVENUE ORCHESTRATION",
          metricLabel: "ACTIVE MRR PIPELINE",
          metricValue: "$148,200",
          primaryColor: "#38BDF8",
          accentColor: "#10B981",
          backgroundColor: "#0B0F19",
        } as SaasMacroProps}
      />
    </>
  );
};
