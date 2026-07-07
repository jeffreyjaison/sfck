export function StatCard({
  label, value, delta, tone,
}: { label: string; value: string; delta?: string; tone?: 'emerald' | 'rose' }) {
  const toneClass = tone === 'emerald' ? 'text-emerald-600' : tone === 'rose' ? 'text-rose-600' : '';
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</div>
      {delta && <div className="text-xs text-emerald-600">{delta}</div>}
    </div>
  );
}
