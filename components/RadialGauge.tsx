import { clampPct, gaugeDash } from '@/lib/widgets/gauge';

export function RadialGauge({
  value,
  max,
  label,
  unit,
  size = 132,
}: {
  value: number;
  max: number;
  label: string;
  unit?: string;
  size?: number;
}) {
  const pct = max > 0 ? clampPct((value / max) * 100) : 0;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const { filled, gap } = gaugeDash(pct, circumference);
  const gid = `gauge-${label.replace(/\W+/g, '')}`;

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`${label}: ${value}${unit ?? ''} of ${max}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--emerald)" />
              <stop offset="100%" stopColor="var(--leaf)" />
            </linearGradient>
          </defs>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${gap}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="mono text-2xl font-bold text-ink leading-none">{value.toLocaleString()}</span>
          {unit && <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">{unit}</span>}
        </div>
      </div>
      <span className="mt-2 text-xs font-medium text-muted">{label}</span>
    </div>
  );
}
