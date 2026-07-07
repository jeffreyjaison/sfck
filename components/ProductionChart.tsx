'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

type Row = { estate: string; current: number; prior: number };

type TooltipPayload = { name?: string; value?: number; dataKey?: string; color?: string };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 shadow-card">
      <div className="mb-1 text-xs font-semibold text-ink">{label}</div>
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={p.dataKey} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: p.color }} aria-hidden="true" />
            <span className="text-muted">{p.name}</span>
            <span className="mono ml-auto font-semibold text-ink">
              {Math.round(Number(p.value ?? 0)).toLocaleString()} kg
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-latex px-2.5 py-1 text-[11px] font-medium text-muted">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} aria-hidden="true" />
      {label}
    </span>
  );
}

function ChartLegend() {
  return (
    <div className="mt-1 flex justify-center gap-2">
      <LegendPill color="#34D399" label="Current year" />
      <LegendPill color="#cbd5e1" label="Prior year" />
    </div>
  );
}

export function ProductionChart({ data }: { data: Row[] }) {
  return (
    <div className="h-80 w-full rounded-2xl border border-line bg-white p-5 shadow-card">
      <h2 className="mb-2 text-sm font-semibold text-ink">Production by estate</h2>
      <ResponsiveContainer width="100%" height="88%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={4}>
          <defs>
            <linearGradient id="barCurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="estate"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--muted)' }}
            dy={4}
          />
          <YAxis
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--muted)' }}
            width={48}
          />
          <Tooltip cursor={{ fill: 'rgba(11,61,46,0.04)' }} content={<ChartTooltip />} />
          <Legend content={<ChartLegend />} />
          <Bar dataKey="prior" name="Prior year" fill="#cbd5e1" radius={[6, 6, 0, 0]} maxBarSize={48} />
          <Bar dataKey="current" name="Current year" fill="url(#barCurrent)" radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
