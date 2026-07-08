import { Sparkline } from '@/components/Sparkline';

// Accepts new tones ('up' | 'down' | 'flat') and legacy tones ('emerald' | 'rose')
// so existing callers passing only {label, value, delta} keep working.
type Tone = 'up' | 'down' | 'flat' | 'emerald' | 'rose' | string;

function resolveTone(tone: Tone | undefined, delta: string | undefined): 'up' | 'down' | 'flat' {
  if (tone === 'up' || tone === 'emerald') return 'up';
  if (tone === 'down' || tone === 'rose') return 'down';
  if (tone === 'flat') return 'flat';
  // Infer from delta sign for legacy callers that pass delta with no tone.
  if (delta) return delta.trim().startsWith('-') ? 'down' : 'up';
  return 'flat';
}

const CHIP: Record<'up' | 'down' | 'flat', string> = {
  up: 'bg-emerald-50 text-emerald-700',
  down: 'bg-orange-50 text-[color:var(--clay)]',
  flat: 'bg-slate-100 text-slate-600',
};

export function StatCard({
  label,
  value,
  delta,
  note,
  tone,
  series,
  icon,
}: {
  label: string;
  value: string;
  /** Short badge text — rendered as a rounded pill; keep it to a few words. */
  delta?: string;
  /** Longer footnote — rendered as plain wrapping muted text (use instead of `delta` for long strings). */
  note?: string;
  tone?: Tone;
  series?: number[];
  icon?: React.ReactNode;
}) {
  const t = resolveTone(tone, delta);
  const hasFooter = Boolean(delta) || Boolean(note) || Boolean(series && series.length > 0);
  return (
    <div className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>
        {icon && <div className="shrink-0 text-[color:var(--emerald)]">{icon}</div>}
      </div>
      <div className="mono mt-2 text-2xl font-bold leading-none text-ink sm:text-3xl">{value}</div>
      {hasFooter && (
        <div className="mt-auto pt-3">
          {delta && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${CHIP[t]}`}>
              {delta}
            </span>
          )}
          {note && <div className={`text-xs text-muted ${delta ? 'mt-1.5' : ''}`}>{note}</div>}
          {series && series.length > 0 && (
            <div className={delta || note ? 'mt-3' : ''}>
              <Sparkline values={series} width={220} height={36} className="w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
