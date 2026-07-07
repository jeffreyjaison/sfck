import { donutSegments } from '@/lib/widgets/mix';

const COLORS = ['var(--emerald)', 'var(--leaf)', 'var(--clay)', 'var(--muted)'];

export function Donut({
  segments,
  size = 132,
  thickness = 16,
}: {
  segments: { key: string; count: number; pct: number }[];
  size?: number;
  thickness?: number;
}) {
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashed = donutSegments(segments, circumference);

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} className="-rotate-90 shrink-0" role="img" aria-label="Category mix">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth={thickness} />
        {dashed.map((seg, i) => (
          <circle
            key={seg.key}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={thickness}
            strokeDasharray={`${seg.dash} ${seg.gap}`}
            strokeDashoffset={seg.offset}
          />
        ))}
      </svg>
      <ul className="space-y-1.5">
        {segments.map((s, i) => (
          <li key={s.key} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: COLORS[i % COLORS.length] }}
              aria-hidden="true"
            />
            <span className="font-medium text-ink">{s.key}</span>
            <span className="text-muted">·</span>
            <span className="mono text-muted">{s.count}</span>
            <span className="text-muted">·</span>
            <span className="mono text-muted">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
