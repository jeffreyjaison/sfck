const DOT: Record<'emerald' | 'clay' | 'slate', string> = {
  emerald: 'var(--emerald)',
  clay: 'var(--clay)',
  slate: 'var(--muted)',
};

export function Timeline({
  items,
}: {
  items: { title: string; meta: string; time: string; tone?: 'emerald' | 'clay' | 'slate' }[];
}) {
  return (
    <ol className="relative">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && <span className="absolute left-[5px] top-3 h-full w-px bg-line" aria-hidden="true" />}
            <span
              className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white"
              style={{ background: DOT[item.tone ?? 'slate'] }}
              aria-hidden="true"
            />
            <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink">{item.title}</div>
                <div className="truncate text-xs text-muted">{item.meta}</div>
              </div>
              <div className="mono shrink-0 text-[11px] text-muted">{item.time}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
