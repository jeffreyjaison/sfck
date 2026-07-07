export function StatCard({
  label, value, delta, tone, icon,
}: { label: string; value: string; delta?: string; tone?: 'emerald' | 'rose'; icon?: React.ReactNode }) {
  const toneClass = tone === 'emerald' ? 'text-emerald-600' : tone === 'rose' ? 'text-rose-600' : 'text-slate-800';
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
        {icon && <div className="shrink-0 text-emerald-600">{icon}</div>}
      </div>
      <div className={`tnum mt-1 text-2xl font-semibold ${toneClass}`}>{value}</div>
      {delta && <div className="text-xs text-emerald-600">{delta}</div>}
    </div>
  );
}
