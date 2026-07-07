const TONE_CLASSES = {
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
  slate: 'bg-slate-100 text-slate-600',
} as const;

export function Badge({ tone, children }: { tone: 'emerald' | 'amber' | 'rose' | 'slate'; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}
