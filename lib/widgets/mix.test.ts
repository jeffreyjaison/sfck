import { describe, it, expect } from 'vitest';
import { categoryMix, donutSegments } from './mix';

describe('categoryMix', () => {
  it('computes count and pct per category', () => {
    expect(categoryMix({ Permanent: 2, Casual: 1, Dependent: 1 })).toEqual([
      { key: 'Permanent', count: 2, pct: 50 },
      { key: 'Casual', count: 1, pct: 25 },
      { key: 'Dependent', count: 1, pct: 25 },
    ]);
  });

  it('returns all pct 0 when total is 0', () => {
    expect(categoryMix({ Permanent: 0, Casual: 0, Dependent: 0 })).toEqual([
      { key: 'Permanent', count: 0, pct: 0 },
      { key: 'Casual', count: 0, pct: 0 },
      { key: 'Dependent', count: 0, pct: 0 },
    ]);
  });
});

describe('donutSegments', () => {
  it('computes dash, gap and offset per segment', () => {
    expect(
      donutSegments(
        [
          { key: 'Permanent', pct: 50 },
          { key: 'Casual', pct: 25 },
          { key: 'Dependent', pct: 25 },
        ],
        100,
      ),
    ).toEqual([
      { key: 'Permanent', dash: 50, gap: 50, offset: 0 },
      { key: 'Casual', dash: 25, gap: 75, offset: -50 },
      { key: 'Dependent', dash: 25, gap: 75, offset: -75 },
    ]);
  });

  it('returns [] for no items', () => {
    expect(donutSegments([], 100)).toEqual([]);
  });
});
