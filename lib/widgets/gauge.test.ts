import { describe, it, expect } from 'vitest';
import { clampPct, gaugeDash } from './gauge';

describe('clampPct', () => {
  it('clamps above 100', () => {
    expect(clampPct(120)).toBe(100);
  });

  it('clamps below 0', () => {
    expect(clampPct(-5)).toBe(0);
  });

  it('passes through in-range values', () => {
    expect(clampPct(42)).toBe(42);
  });
});

describe('gaugeDash', () => {
  it('computes filled and gap from pct and circumference', () => {
    expect(gaugeDash(25, 100)).toEqual({ filled: 25, gap: 75 });
  });

  it('clamps pct before computing', () => {
    expect(gaugeDash(150, 100)).toEqual({ filled: 100, gap: 0 });
  });
});
