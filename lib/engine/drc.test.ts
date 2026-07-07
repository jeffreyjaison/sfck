import { describe, it, expect } from 'vitest';
import { consolidateDrc, dryRubberKg } from './drc';

describe('consolidateDrc', () => {
  it('averages CC samples with factory/tanker samples into one uniform CC DRC', () => {
    expect(consolidateDrc({ ccSamples: [0.38, 0.42], factorySamples: [0.44] })).toBeCloseTo(0.42, 5);
  });
});

describe('dryRubberKg', () => {
  it('multiplies wet latex kg by the uniform CC DRC', () => {
    expect(dryRubberKg({ latexKg: 100, drc: 0.42 })).toBeCloseTo(42, 5);
  });
});
