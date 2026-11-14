import React from 'react';
import { Composition } from 'remotion';
import CinematicTitle, { CinematicTitleProps } from '../templates/remotion/CinematicTitle';
import GlitchTerminal, { GlitchTerminalProps } from '../templates/remotion/GlitchTerminal';
import SaasMacro, { SaasMacroProps } from '../templates/remotion/SaasMacro';
import BentoGrid, { BentoGridProps } from '../templates/remotion/BentoGrid';
import ChatDialogue, { ChatDialogueProps } from '../templates/remotion/ChatDialogue';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 1. Cinematic Title (Opener & Brand Teaser) */}
      <Composition
        id="CinematicTitle"
        component={CinematicTitle}
        durationInFrames={180}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'NUR AQILAH ZAHIDAH',
          subtitle: 'AI REMOTION PRODUCTION ENGINE',
          primaryColor: '#FFFFFF',
          accentColor: '#00F0FF',
          backgroundColor: '#08090D',
          fontSize: 120,
          letterSpacing: 8,
          zoomIntensity: 1.15,
        } as CinematicTitleProps}
      />

      {/* 2. Glitch Terminal (Cipher/Tech/Cybersecurity) */}
      <Composition
        id="GlitchTerminal"
        component={GlitchTerminal}
        durationInFrames={360} // 6.0 seconds matching exact kinet-glitch-terminal.html storytelling
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          eyebrowInitial: "CYBERNETIC TELEMETRY PROTOCOL",
          eyebrowBreached: "SECURITY ALERT // INTRUSION DETECTED",
          eyebrowDecrypted: "QUANTUM OVERRIDE IN PROGRESS",
          eyebrowGranted: "SECURITY VERIFIED // PROTOCOL CLEARED",
          textPhase1: "SYSTEM COMPROMISED",
          textPhase2: "DECRYPTING CIPHER",
          textPhase3: "ROOT ACCESS GRANTED",
          primaryColor: "#10B981",
          accentColor: "#EF4444",
          backgroundColor: "#050811",
        } as GlitchTerminalProps}
      />

      {/* 3. SaaS Macro (Interactive UI / Analytics) */}
      <Composition
        id="SaasMacro"
        component={SaasMacro}
        durationInFrames={420} // 7.0 seconds matching exact kinet-saas-macro.html
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          headline: "Sub-Millisecond Execution",
          subHeadline: "Real-time throughput metrics running on native threadpool",
          urlBarText: "https://app.kinetrig.ai/telemetry/live",
          primaryColor: "#38BDF8",
          accentColor: "#10B981",
          backgroundColor: "#020617",
        } as SaasMacroProps}
      />

      {/* 4. Bento Grid (Modular Architecture) */}
      <Composition
        id="BentoGrid"
        component={BentoGrid}
        durationInFrames={240} // 4.0 seconds at 60fps
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          headline: "Modular Motion Intelligence",
          metricBig: "99.98%",
          metricLabel: "DETERMINISTIC FRAME SYNCHRONIZATION",
          featureTitle1: "Sub-Pixel Kinematics",
          featureTitle2: "3D Camera Trajectories",
          primaryColor: "#A855F7",
          accentColor: "#06B6D4",
          backgroundColor: "#0B0814",
        } as BentoGridProps}
      />

      {/* 5. Chat Dialogue (Diegetic AI Conversation) */}
      <Composition
        id="ChatDialogue"
        component={ChatDialogue}
        durationInFrames={240} // 4.0 seconds at 60fps
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          userName: "Alex Rivera",
          agentName: "KinetRig AI",
          userPrompt: "Generate a 60 FPS spatial kinetic video for SaaS launch",
          agentResponse: "Done! Synthesized 5 narrative beats with 3-layer audio ducking.",
          primaryColor: "#38BDF8",
          backgroundColor: "#0B1120",
        } as ChatDialogueProps}
      />
    </>
  );
};
