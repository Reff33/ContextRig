import React from 'react';
import { Composition } from 'remotion';
import KinetOpener, { KinetOpenerProps } from '../templates/remotion/KinetOpener';
import GlitchTerminal, { GlitchTerminalProps } from '../templates/remotion/GlitchTerminal';
import SaasMacro, { SaasMacroProps } from '../templates/remotion/SaasMacro';
import BentoGrid, { BentoGridProps } from '../templates/remotion/BentoGrid';
import ChatDialogue, { ChatDialogueProps } from '../templates/remotion/ChatDialogue';
import DataMetrics, { DataMetricsProps } from '../templates/remotion/DataMetrics';
import ReelHook, { ReelHookProps } from '../templates/remotion/ReelHook';
import ProductShowcase, { ProductShowcaseProps } from '../templates/remotion/ProductShowcase';
import ActionFlow, { ActionFlowProps } from '../templates/remotion/ActionFlow';
import EditorialDossier, { EditorialDossierProps } from '../templates/remotion/EditorialDossier';
import StudioCatalog, { StudioCatalogProps } from '../templates/remotion/StudioCatalog';
import PaperCollage, { PaperCollageProps } from '../templates/remotion/PaperCollage';
import ProsceniumStage, { ProsceniumStageProps } from '../templates/remotion/ProsceniumStage';
import LiquidGlass, { LiquidGlassProps } from '../templates/remotion/LiquidGlass';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 1. KinetOpener (Exact 100% Remotion Port of assets/kinet-opener.html) */}
      <Composition
        id="KinetOpener"
        component={KinetOpener}
        durationInFrames={600} // 10.0 seconds matching exact kinet-opener.html
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          scene1HeroTop: "ULTRA FLUID.",
          scene1HeroHighlight: "UP TO 240 FPS.",
          scene1Subtitle: "Deterministic mathematical timeline stepping. Zero dropped frames.",
          card1Text: "Zero Runtime Build",
          card2Text: "100% Inline SVGs",
          card3Text: "Lossless Headless Export",
          scene2HeroTop: "CRAFTED FOR",
          scene2HeroHighlight: "AI CODING AGENTS",
          scene2Subtitle: "npx -y skills@latest add https://github.com/Reff33/KinetRig",
          primaryColor: "#00F5FF",
          backgroundColor: "#040810",
        } as KinetOpenerProps}
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
        durationInFrames={480} // 8.0 seconds matching exact kinet-flow.html
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          zone1Title: "MOST TOOLS RELY ON",
          zone1Highlight: "STATIC DECK FADES",
          zone1Desc: "Traditional video templates change scenes by fading out sections. That looks like PowerPoint, not motion design.",
          zone2Title: "KINETRIG TRAVELS",
          zone2Highlight: "THROUGH ONE CONTINUOUS WORLD",
          zone2Desc: "The camera pans smoothly across unified space while the hero object leads the viewer's eye into the climax.",
          node1Text: "LATENCY: 0.00ms",
          node2Text: "FPS: 240 HFR",
          primaryColor: "#C084FC",
          backgroundColor: "#07050A",
        } as ActionFlowProps}
      />

      {/* 10. Editorial Dossier (Investigative Journalism / Classified Archive) */}
      <Composition
        id="EditorialDossier"
        component={EditorialDossier}
        durationInFrames={540} // 9.0 seconds matching exact kinet-editorial.html
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          caseNumber: "CASE NO. 9042-ALPHA",
          fieldVerification: "FIELD VERIFICATION: 100% CONFIRMED",
          title1Top: "EVIDENCE HIDDEN",
          redactedText: "CLASSIFIED",
          title1Bottom: "DOCUMENTS.",
          desc1Text: "Traditional explainer videos present claims as static bulleted lists. Investigative journalism uses forensic pacing: reveal documents, pinpoint anomalies, and verify physical records.",
          statusText: "STATUS: FORENSIC INVESTIGATION ACTIVE",
          scene2TitleTop: "DATA DOES NOT LIE.",
          scene2TitleHl: "EVERY FRAME MOTIVATED.",
          desc2Text: "Case findings closed. Video storytelling elevated through cinematic pacing, high-contrast monospace typography, and authenticated archival evidence.",
          cyanColor: "#06B6D4",
          yellowColor: "#F59E0B",
          redColor: "#EF4444",
          backgroundColor: "#07090E",
        } as EditorialDossierProps}
      />

      {/* 11. Studio Catalog (Swiss Minimalist Catalog & Camera Tracking Rig) */}
      <Composition
        id="StudioCatalog"
        component={StudioCatalog}
        durationInFrames={660} // 11.0 seconds matching exact kinet-catalog.html Scene 1
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          ghostYear: "1972",
          headlinePart1: "Studio precision, ",
          headlineHighlight: "two words.",
          handNote: "verified 64 px",
          docSubtitle: "1972 · flagship release",
          stampText: "VERIFIED",
          primaryColor: "#FF3C2B",
          yellowHighlight: "#FFE500",
          inkColor: "#141414",
        } as StudioCatalogProps}
      />

      {/* 12. Paper Collage (Stop-Motion Paper Scrapbook - 100% exact to kinet-collage.html) */}
      <Composition
        id="PaperCollage"
        component={PaperCollage}
        durationInFrames={540} // 9.0 seconds matching exact kinet-collage.html
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          polaroidCaption1: "analog print session '74",
          scrapText1: "STOP-MOTION\nCOLLAGE",
          stampText1: "★ VERIFIED PRINT ★",
          headlinePart1: "PAPER TEXTURE WITH ",
          headlineSticker: "STOP-MOTION RHYTHM",
          scrapText2: "AUTHENTIC CRAFT\nNOT DIGITAL PPT",
          polaroidCaption2: "press master copy #14",
          primaryPaper: "#F5F0E6",
          paperDark: "#EAE0D0",
          accentOrange: "#EA580C",
          accentYellow: "#FDE047",
          accentRed: "#DC2626",
        } as PaperCollageProps}
      />

      {/* 13. Proscenium Stage (Theatrical Puppet Proscenium Stage - 100% exact to kinet-stage.html) */}
      <Composition
        id="ProsceniumStage"
        component={ProsceniumStage}
        durationInFrames={720} // 12.0 seconds matching exact kinet-stage.html
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          signText: "UPGRADE",
          primaryCurtain: "#5B1832",
          accentCoral: "#E0714F",
        } as ProsceniumStageProps}
      />

      {/* 14. Liquid Glass (Apple VisionOS & Dynamic Island - 100% exact to kinet-ios-liquid-glass.html) */}
      <Composition
        id="LiquidGlass"
        component={LiquidGlass}
        durationInFrames={900} // 15.0 seconds matching exact kinet-ios-liquid-glass.html
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          primaryColor: "#0A84FF",
          accentPurple: "#BF5AF2",
          backgroundColor: "#020305",
        } as LiquidGlassProps}
      />
    </>
  );
};
