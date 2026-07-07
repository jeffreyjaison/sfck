export type Point = { x: number; y: number };

/** Sum kg per day, sorted ascending by day. */
export function dailyTotals(rows: { day: string; kg: number }[]): { day: string; total: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.day, (map.get(r.day) ?? 0) + r.kg);
  }
  return [...map.entries()]
    .map(([day, total]) => ({ day, total }))
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
}

/**
 * Evenly spaced x across 0..w; y maps min -> h (bottom) and max -> 0 (top).
 * Single value -> {x:0, y:h/2}; empty -> []; all-equal -> y = h/2.
 */
export function sparklinePoints(values: number[], w: number, h: number): Point[] {
  const n = values.length;
  if (n === 0) return [];
  if (n === 1) return [{ x: 0, y: h / 2 }];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  return values.map((v, i) => {
    const x = (i / (n - 1)) * w;
    const y = range === 0 ? h / 2 : h - ((v - min) / range) * h;
    return { x, y };
  });
}

/** Build an SVG path: "M x,y L x,y …". */
export function toPath(points: Point[]): string {
  if (points.length === 0) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
    .join(' ');
}

/** Percent change first -> last, rounded to 1dp. 0 if <2 values or first is 0. */
export function trendPct(values: number[]): number {
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  if (first === 0) return 0;
  return Math.round(((last - first) / first) * 1000) / 10;
}
