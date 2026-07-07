const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// Uniform DRC for all workers attached to a CC: consolidated from CC samples and factory/tanker samples.
export function consolidateDrc(
  { ccSamples, factorySamples }: { ccSamples: number[]; factorySamples: number[] },
): number {
  const parts: number[] = [];
  if (ccSamples.length) parts.push(avg(ccSamples));
  if (factorySamples.length) parts.push(avg(factorySamples));
  return avg(parts);
}

export function dryRubberKg({ latexKg, drc }: { latexKg: number; drc: number }): number {
  return latexKg * drc;
}
