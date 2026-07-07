import { describe, it, expect } from 'vitest';
import { dailyTotals, sparklinePoints, toPath, trendPct } from './series';

describe('dailyTotals', () => {
  it('sums kg per day and sorts ascending', () => {
    expect(
      dailyTotals([
        { day: '2026-01-02', kg: 3 },
        { day: '2026-01-01', kg: 2 },
        { day: '2026-01-01', kg: 3 },
      ]),
    ).toEqual([
      { day: '2026-01-01', total: 5 },
      { day: '2026-01-02', total: 3 },
    ]);
  });

  it('returns [] for empty input', () => {
    expect(dailyTotals([])).toEqual([]);
  });
});

describe('sparklinePoints', () => {
  it('maps min to bottom and max to top, x evenly spaced', () => {
    expect(sparklinePoints([0, 5, 10], 100, 10)).toEqual([
      { x: 0, y: 10 },
      { x: 50, y: 5 },
      { x: 100, y: 0 },
    ]);
  });

  it('handles a single value at x:0, y:h/2', () => {
    expect(sparklinePoints([7], 100, 10)).toEqual([{ x: 0, y: 5 }]);
  });

  it('returns [] for empty input', () => {
    expect(sparklinePoints([], 100, 10)).toEqual([]);
  });

  it('maps all-equal values to y = h/2', () => {
    expect(sparklinePoints([4, 4, 4], 100, 10)).toEqual([
      { x: 0, y: 5 },
      { x: 50, y: 5 },
      { x: 100, y: 5 },
    ]);
  });
});

describe('toPath', () => {
  it('builds an SVG path from points', () => {
    expect(
      toPath([
        { x: 0, y: 10 },
        { x: 100, y: 0 },
      ]),
    ).toBe('M0,10 L100,0');
  });

  it('returns empty string for no points', () => {
    expect(toPath([])).toBe('');
  });
});

describe('trendPct', () => {
  it('computes percent change first to last', () => {
    expect(trendPct([100, 120])).toBe(20);
  });

  it('returns 0 when values are flat', () => {
    expect(trendPct([100, 100])).toBe(0);
  });

  it('returns 0 for empty or single value', () => {
    expect(trendPct([])).toBe(0);
    expect(trendPct([50])).toBe(0);
  });

  it('returns 0 when first value is 0', () => {
    expect(trendPct([0, 50])).toBe(0);
  });

  it('rounds to 1 decimal place', () => {
    expect(trendPct([100, 133])).toBe(33);
    expect(trendPct([3, 4])).toBe(33.3);
  });
});
