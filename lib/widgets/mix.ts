export type MixItem = { key: string; count: number; pct: number };

/** Category counts -> [{key,count,pct}]; pct = round(count/total*100); total 0 -> pct 0. */
export function categoryMix(counts: {
  Permanent: number;
  Casual: number;
  Dependent: number;
}): MixItem[] {
  const total = counts.Permanent + counts.Casual + counts.Dependent;
  return (['Permanent', 'Casual', 'Dependent'] as const).map((key) => {
    const count = counts[key];
    const pct = total === 0 ? 0 : Math.round((count / total) * 100);
    return { key, count, pct };
  });
}

export type DonutSegment = { key: string; dash: number; gap: number; offset: number };

/**
 * dash = pct/100*C; gap = C - dash; offset = -(cumulative prior pct)/100*C.
 */
export function donutSegments(
  items: { key: string; pct: number }[],
  circumference: number,
): DonutSegment[] {
  let cumulative = 0;
  return items.map((item) => {
    const dash = (item.pct / 100) * circumference;
    const gap = circumference - dash;
    const offset = -(cumulative / 100) * circumference + 0;
    cumulative += item.pct;
    return { key: item.key, dash, gap, offset };
  });
}
