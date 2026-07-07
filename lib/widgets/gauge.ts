/** Clamp a percentage into 0..100. */
export function clampPct(v: number): number {
  return Math.max(0, Math.min(100, v));
}

/** filled = clampPct(pct)/100*C; gap = C - filled. */
export function gaugeDash(pct: number, circumference: number): { filled: number; gap: number } {
  const filled = (clampPct(pct) / 100) * circumference;
  return { filled, gap: circumference - filled };
}
