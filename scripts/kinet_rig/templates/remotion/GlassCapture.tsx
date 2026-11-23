import React, { useEffect, useRef } from 'react';

/**
 * GlassCapture — snapshot of the full stage, taken after paint, for glass sampling.
 *
 * `backdrop-filter` is inert in this renderer (verified with an isolation probe: a blurred box
 * over a bright gradient renders flat). So the card glass is composited by hand:
 *   1. <GlassCapture> reads every pixel of the stage into a 2D canvas once per frame.
 *   2. <GlassBackdrop> crops + blurs each card's region out of that canvas.
 * The same pixels the viewer sees, so an orb passing behind a card always shows through it,
 * on every card, in sync — with no per-frame React reflow.
 *
 * ponytail: only the orb is registered as a capture source (the CSS aura is painted by DOM).
 * Register more canvases in `capSources` if a later template needs them.
 */
export const registered: { orb?: HTMLCanvasElement } = {};

/** Paints the stage's CSS ambient (aura + Siri conic) so glass can sample it too. */
const paintAmbient = (
  ctx: CanvasRenderingContext2D,
  siri: { opacity: number; scale: number; rotation: number },
) => {
  // Spatial ambient aura — same stop values as the CSS layer.
  const blobs: [number, number, string][] = [
    [960, 518, 'rgba(10,132,255,0.18)'],
    [672, 432, 'rgba(191,90,242,0.14)'],
    [1248, 594, 'rgba(100,210,255,0.12)'],
  ];
  for (const [cx, cy, color] of blobs) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 760);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1920, 1080);
  }

  // Siri conic aura.
  if (siri.opacity > 0.001) {
    ctx.save();
    ctx.globalAlpha = siri.opacity;
    ctx.translate(960, 540);
    ctx.rotate(siri.rotation);
    ctx.scale(siri.scale, siri.scale);
    const r = 340;
    const stops = ['#FF375F', '#BF5AF2', '#0A84FF', '#64D2FF', '#30D158', '#FF9F0A', '#FF375F'];
    for (let i = 0; i < stops.length - 1; i++) {
      const a0 = (i / (stops.length - 1)) * Math.PI * 2;
      const a1 = ((i + 1) / (stops.length - 1)) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, a0, a1);
      ctx.closePath();
      ctx.fillStyle = stops[i];
      ctx.fill();
    }
    ctx.restore();
  }
};

export const capSources = new Set<HTMLCanvasElement>();

export const GlassCapture: React.FC<{
  frame: number;
  onReady: (c: HTMLCanvasElement) => void;
  siri: { opacity: number; scale: number; rotation: number };
}> = ({ frame, onReady, siri }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;

    // Snapshot synchronously: the orb's WebGL buffer is only readable immediately after its
    // render, so a deferred rAF would read a cleared buffer.
    {
      target.width = 1920;
      target.height = 1080;
      const ctx = target.getContext('2d');
      if (!ctx) return;

      // Rebuild what sits behind the cards: the CSS ambient aura, then the Siri conic, then the
      // orb canvas. Same order as the DOM stack, so the glass refracts the right composite.
      ctx.fillStyle = '#07090E';
      ctx.fillRect(0, 0, 1920, 1080);
      paintAmbient(ctx, siri);
      const orb = registered.orb;
      if (orb && orb.width > 0) ctx.drawImage(orb, 0, 0, 1920, 1080);
      onReady(target);
    }
  }, [frame, onReady, siri]);

  return (
    <canvas
      ref={ref}
      width={1920}
      height={1080}
      style={{
        position: 'absolute',
        inset: 0,
        // opacity:0 keeps the bitmap out of the frame while the element keeps a real layout box,
        // so getContext('2d') still works. Off-screen positioning was leaving a stray top-left
        // compositing artifact in headless Chrome.
        opacity: 0,
        top: 0,
        pointerEvents: 'none',
        zIndex: 7,
      }}
    />
  );
};
