'use client';
import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Sparkline } from '@/components/Sparkline';

type Chip = { label: string; value: string; tone: 'up' | 'down' | 'flat' };

function useCountUp(target: number, duration = 700): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || duration <= 0) {
      // Reduced-motion: show the final value immediately, no animation frames.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setN(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setN(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

const CHIP_TONE: Record<'up' | 'down' | 'flat', { cls: string; Icon: typeof ArrowUpRight }> = {
  up: { cls: 'text-[color:var(--leaf)]', Icon: ArrowUpRight },
  down: { cls: 'text-orange-300', Icon: ArrowDownRight },
  flat: { cls: 'text-white/70', Icon: Minus },
};

export function ProductionPulse({
  label,
  value,
  unit,
  series,
  chips,
}: {
  label: string;
  value: number;
  unit: string;
  series: number[];
  chips: Chip[];
}) {
  const animated = useCountUp(value);
  const display = Math.round(animated).toLocaleString();

  return (
    <div
      className="animate-rise relative flex h-full flex-col justify-center overflow-hidden rounded-2xl p-6 text-white shadow-card"
      style={{ background: 'linear-gradient(135deg, var(--canopy), var(--canopy-2))' }}
    >
      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--leaf)]">{label}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="mono text-5xl font-bold leading-none tabular-nums">{display}</span>
            <span className="text-sm font-medium text-white/70">{unit}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {chips.map((c) => {
              const { cls, Icon } = CHIP_TONE[c.tone];
              return (
                <div key={c.label} className="flex items-center gap-1.5">
                  <Icon className={`h-3.5 w-3.5 ${cls}`} aria-hidden="true" />
                  <span className={`mono text-sm font-semibold ${cls}`}>{c.value}</span>
                  <span className="text-xs text-white/60">{c.label}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="w-full md:w-80">
          <Sparkline
            values={series}
            width={320}
            height={72}
            stroke="var(--leaf)"
            fill="var(--leaf)"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
