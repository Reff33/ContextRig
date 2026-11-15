import React, { useEffect, useRef } from 'react';

/**
 * GlassBackdrop — real glass sampling for Remotion.
 *
 * `backdrop-filter` samples nothing in headless Chrome (verified with an isolation probe),
 * so the card can't use it. Instead we read the actual pixels painted behind the card out of
 * its canvas, blur them ourselves, and paint the result as the card fill. Same pixels the user
 * sees → the orb passing behind the card always shows through, in sync, on every card.
 *
 * ponytail: reads the whole stage each frame and blurs with a canvas filter (cheap 2-pass).
 * Swap to drawImage of a region + smaller blur radius if frame cost ever matters.
 */
export const GlassBackdrop: React.FC<{
  /** Stage-local rect of the card, in px. */
  rect: { x: number; y: number; w: number; h: number };
  blur?: number;
  opacity?: number;
  sourceCanvas: () => HTMLCanvasElement | null;
}> = ({ rect, blur = 26, opacity = 1, sourceCanvas }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const target = ref.current;
    const source = sourceCanvas();
    if (!target || !source || source.width === 0) return;

    // The card sizes itself to its content, so measure it rather than trusting rect.h.
    // offsetHeight is the border-box height the card actually renders at.
    const host = target.parentElement;
    const w = Math.round(rect.w);
    const h = Math.round(rect.h > 0 ? rect.h : host?.offsetHeight ?? 0);
    const x = Math.round(rect.x);
    const y = Math.round(rect.y > 0 ? rect.y : host ? host.getBoundingClientRect().top : 0);
    if (h <= 0) return;

    const ctx = target.getContext('2d');
    if (!ctx) return;

    target.width = Math.max(1, w);
    target.height = Math.max(1, h);

    // Blur the whole stage once, then crop the card region out of the blurred result.
    const scratch = document.createElement('canvas');
    scratch.width = source.width;
    scratch.height = source.height;
    const sctx = scratch.getContext('2d');
    if (!sctx) return;

    sctx.filter = `blur(${blur}px)`;
    sctx.drawImage(source, 0, 0);

    // Crop the card's stage rect out of the blurred snapshot. The <canvas> itself is laid out
    // inside the card, so it starts at 0,0 — only the crop is in stage coordinates.
    ctx.drawImage(scratch, x, y, w, h, 0, 0, w, h);
  }, [rect.x, rect.y, rect.w, rect.h, blur, sourceCanvas]);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        opacity,
        pointerEvents: 'none',
        // Behind the card's own text/icons, above the card's tint background.
        zIndex: 0,
      }}
    />
  );
};
