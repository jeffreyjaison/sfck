const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function consolidateDrc(
  { ccSamples, factorySamples }: { ccSamples: number[]; factorySamples: number[] },
): number {
  return (avg(ccSamples) + avg(factorySamples)) / 2;
}

export function dryRubberKg({ latexKg, drc }: { latexKg: number; drc: number }): number {
  return latexKg * drc;
}
