import React from 'react';
import { Composition } from 'remotion';
import CinematicTitle, { CinematicTitleProps } from '../templates/remotion/CinematicTitle';
import GlitchTerminal, { GlitchTerminalProps } from '../templates/remotion/GlitchTerminal';
import SaasMacro, { SaasMacroProps } from '../templates/remotion/SaasMacro';
import BentoGrid, { BentoGridProps } from '../templates/remotion/BentoGrid';
import ChatDialogue, { ChatDialogueProps } from '../templates/remotion/ChatDialogue';
import DataMetrics, { DataMetricsProps } from '../templates/remotion/DataMetrics';
import ReelHook, { ReelHookProps } from '../templates/remotion/ReelHook';
import ProductShowcase, { ProductShowcaseProps } from '../templates/remotion/ProductShowcase';
import ActionFlow, { ActionFlowProps } from '../templates/remotion/ActionFlow';
import EditorialDossier, { EditorialDossierProps } from '../templates/remotion/EditorialDossier';

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
          backgroundColor: "#040810",
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
          backgroundColor: "#030712",
        } as SaasMacroProps}
      />

      {/* 4. Bento Grid (Modular Architecture - 100% Exact to kinet-bento-grid.html) */}
      <Composition
        id="BentoGrid"
        component={BentoGrid}
        durationInFrames={390} // 6.5 seconds matching exact kinet-bento-grid.html
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          card1Title: "Distributed Neural Rendering",
          card1Desc: "Sub-millisecond frame synthesis executed on unified GPU compute clusters.",
          card1Metric: "99.98%",
          card2Title: "Zero Trust Core",
          card2Desc: "Hardware-isolated enclave cryptographic guarantees.",
          card2Badge: "AES-256-GCM",
          card3Title: "Peak Bandwidth",
          card3Desc: "Ultra-low latency pipe.",
          card3Metric: "40 Gbps",
          card4Title: "Deterministic 240 FPS Pipeline",
          card4Desc: "Guaranteed zero jitter frame generation for production motion broadcast.",
          primaryColor: "#A855F7",
          accentColor: "#06B6D4",
          backgroundColor: "#09090E",
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

      {/* 6. Data Metrics (KPI Cards & Dynamic SVG Bar Chart) */}
      <Composition
        id="DataMetrics"
        component={DataMetrics}
        durationInFrames={480} // 8.0 seconds matching exact kinet-metrics.html
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          titlePrefix: "Real-Time Performance ",
          titleHighlight: "Metrics",
          currency: "$",
          metric1Val: 14400,
          metric1Label: "Transactions / Sec",
          metric2Val: 84,
          metric2Label: "Cache Hit Rate",
          metric3Val: 256,
          metric3Label: "Quarterly Volume",
          primaryColor: "#10B981",
          backgroundColor: "#040810",
        } as DataMetricsProps}
      />

      {/* 7. Reel Hook (Shorts & High-Retention Hook) */}
      <Composition
        id="ReelHook"
        component={ReelHook}
        durationInFrames={360} // 6.0 seconds matching exact kinet-reel-hook.html
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          badgeText: "HIGH RETENTION HOOK",
          word1: "Stop",
          word2: "Scrolling.",
          word3: "Watch",
          word4: "This",
          word5: "Move.",
          statValue: 18.5,
          statLabel: "Organic Video Impressions",
          sticker1: "100% RETENTION",
          sticker2: "60 FPS",
          urgentColor: "#FF1E40",
          accentColor: "#FFE600",
          primaryColor: "#FF2E93",
        } as ReelHookProps}
      />

      {/* 8. Product Showcase (3D E-Commerce Showcase) */}
      <Composition
        id="ProductShowcase"
        component={ProductShowcase}
        durationInFrames={420} // 7.0 seconds matching exact kinet-showcase.html
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          categoryBadge: "FLAGSHIP AUDIO RIG",
          productName: "KinetPro Spatial Headset",
          productDesc: "Planar magnetic acoustic drivers with zero-latency spatial head tracking and aerospace titanium headband.",
          price: "$349",
          spec1Val: "0.4ms",
          spec1Lbl: "Ultra Latency",
          spec2Val: "10-48k",
          spec2Lbl: "Frequency",
          spec3Val: "42h",
          spec3Lbl: "Battery Life",
          ctaText: "Order Now — Free Worldwide Shipping",
          primaryColor: "#F59E0B",
          backgroundColor: "#000000",
        } as ProductShowcaseProps}
      />

      {/* 9. Action Flow (Persistent Traveling Object across 3840px World) */}
      <Composition
        id="ActionFlow"
        component={ActionFlow}
        durationInFrames={360} // 6.0 seconds matching exact kinet-flow.html
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          zone1Title: "From Static Code to ",
          zone1Highlight: "Fluid Cinema",
          zone1Desc: "Motion graphics that breathe in real 3D space with continuous physics.",
          zone2Title: "Zero PowerPoint Fades. ",
          zone2Highlight: "Infinite Momentum.",
          zone2Desc: "Persistent hero objects traversing across unified worlds without jump cuts.",
          chip1Text: "FPS: 60 BROADCAST",
          chip2Text: "VELOCITY: 3840PX/S",
          primaryColor: "#A855F7",
          backgroundColor: "#07050A",
        } as ActionFlowProps}
      />

      {/* 10. Editorial Dossier (Investigative Journalism / Classified Archive) */}
      <Composition
        id="EditorialDossier"
        component={EditorialDossier}
        durationInFrames={390} // 6.5 seconds matching exact kinet-editorial.html
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          caseNumber: "CASE NO. 9042-ALPHA",
          headlineWord1: "EVIDENCE HIDDEN",
          headlineWord2: "BEHIND",
          redactedText: "CLASSIFIED",
          scene2Headline: "FIELD SURVEILLANCE LOG // CONFIRMED",
          primaryColor: "#06B6D4",
          accentYellow: "#EAB308",
          accentRed: "#EF4444",
          backgroundColor: "#090B10",
        } as EditorialDossierProps}
      />
    </>
  );
};
