import { describe, it, expect } from 'vitest';
import { consolidateDrc, dryRubberKg } from './drc';

describe('consolidateDrc', () => {
  it('averages CC samples with factory/tanker samples into one uniform CC DRC', () => {
    expect(consolidateDrc({ ccSamples: [0.38, 0.42], factorySamples: [0.44] })).toBeCloseTo(0.42, 5);
  });
  it('returns the CC average when factorySamples is empty', () => {
    expect(consolidateDrc({ ccSamples: [0.40, 0.42], factorySamples: [] })).toBeCloseTo(0.41, 5);
  });
  it('returns the factory average when ccSamples is empty', () => {
    expect(consolidateDrc({ ccSamples: [], factorySamples: [0.44, 0.46] })).toBeCloseTo(0.45, 5);
  });
  it('returns 0 when both sample sets are empty', () => {
    expect(consolidateDrc({ ccSamples: [], factorySamples: [] })).toBe(0);
  });
});

describe('dryRubberKg', () => {
  it('multiplies wet latex kg by the uniform CC DRC', () => {
    expect(dryRubberKg({ latexKg: 100, drc: 0.42 })).toBeCloseTo(42, 5);
  });
});
