const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function consolidateDrc(
  { ccSamples, factorySamples }: { ccSamples: number[]; factorySamples: number[] },
): number {
  const parts: number[] = [];
  if (ccSamples.length) parts.push(avg(ccSamples));
  if (factorySamples.length) parts.push(avg(factorySamples));
  return parts.length ? avg(parts) : 0;
}

export function dryRubberKg({ latexKg, drc }: { latexKg: number; drc: number }): number {
  return latexKg * drc;
}
