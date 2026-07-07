'use client';
import { useSession } from '@/components/RoleProvider';
import { useScopedData } from '@/lib/client-fetch';
import { StatCard } from '@/components/StatCard';
import { ProductionChart } from '@/components/ProductionChart';
import { ProductionPulse } from '@/components/ProductionPulse';
import { RadialGauge } from '@/components/RadialGauge';
import { Donut } from '@/components/Donut';
import { Timeline } from '@/components/Timeline';
import { trendPct } from '@/lib/widgets/series';
import { categoryMix } from '@/lib/widgets/mix';
import { ROLES } from '@/lib/rbac';

type Dash = {
  stats: { totalLatexKg: number; activeWorkers: number; pendingApprovals: number; yoyPercent: number };
  byEstate: { estate: string; current: number; prior: number }[];
  totalEstates: number;
  inScopeEstates: number;
  allEstates: { id: number; name: string; inScope: boolean }[];
  dailySeries: number[];
  categoryMix: { Permanent: number; Casual: number; Dependent: number };
  avgDrc: number;
};

type AuditEntry = { id: number; actorRole: string; action: string; entity: string; at: string };

function EstatesJurisdictionPanel({
  allEstates,
  byEstate,
}: {
  allEstates: { id: number; name: string; inScope: boolean }[];
  byEstate: { estate: string; current: number; prior: number }[];
}) {
  const productionByName = new Map(byEstate.map((e) => [e.estate, e]));
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <h2 className="text-lg font-semibold text-ink">Estates — Jurisdiction</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {allEstates.map((e) => {
          const prod = productionByName.get(e.name);
          return (
            <li
              key={e.id}
              className={`flex items-center justify-between rounded-lg border-t border-line pt-2 first:border-t-0 first:pt-0 ${
                e.inScope ? '' : 'bg-latex/60 px-2 opacity-80'
              }`}
            >
              <span className="font-medium text-ink">{e.name}</span>
              {e.inScope ? (
                <span className="mono text-muted">
                  {prod ? `${prod.current.toLocaleString()} kg` : '—'}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[color:var(--clay)]">
                  🔒 <span className="text-xs font-medium">Restricted</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AuditTimelinePanel() {
  const { session } = useSession();
  const { data } = useScopedData<{ entries: AuditEntry[] }>('/api/audit', session);
  const roleLabel = (id: string) => ROLES.find((r) => r.id === id)?.label ?? id;
  const fmt = (at: string) =>
    new Date(at).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const items = (data?.entries ?? []).map((e) => ({
    title: e.action,
    meta: `${roleLabel(e.actorRole)} · ${e.entity}`,
    time: fmt(e.at),
    tone: (e.action.includes('reject') || e.action.includes('restrict') ? 'clay' : 'emerald') as 'clay' | 'emerald',
  }));

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <h2 className="text-lg font-semibold text-ink">Audit Trail — Data Integrity</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No recorded activity yet.</p>
      ) : (
        <div className="mt-4">
          <Timeline items={items} />
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { session } = useSession();
  const { data, loading } = useScopedData<Dash>('/api/dashboard', session);
  if (loading || !data) return <div className="text-muted">Loading…</div>;

  const { stats, dailySeries, avgDrc } = data;
  const restrictedCount = data.totalEstates - data.inScopeEstates;
  const trend = trendPct(dailySeries);
  const avgDailyLatex = Math.round(
    dailySeries.reduce((a, b) => a + b, 0) / Math.max(1, dailySeries.length),
  );

  const chips = [
    {
      label: 'YoY',
      value: `${stats.yoyPercent >= 0 ? '+' : ''}${stats.yoyPercent}%`,
      tone: (stats.yoyPercent >= 0 ? 'up' : 'down') as 'up' | 'down',
    },
    {
      label: '14-day trend',
      value: `${trend >= 0 ? '+' : ''}${trend}%`,
      tone: (trend >= 0 ? 'up' : 'down') as 'up' | 'down',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>

      {restrictedCount > 0 && (
        <div className="animate-rise rounded-lg bg-orange-50 px-3 py-2 text-sm text-[color:var(--clay)]">
          🔒 {restrictedCount} estate{restrictedCount === 1 ? '' : 's'} outside your jurisdiction{' '}
          {restrictedCount === 1 ? 'is' : 'are'} restricted.
        </div>
      )}

      {/* Hero row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProductionPulse
            label="Latex — current period"
            value={stats.totalLatexKg}
            unit="kg"
            series={dailySeries}
            chips={chips}
          />
        </div>
        <div
          className="animate-rise flex flex-col items-center justify-center rounded-2xl border border-line bg-white p-6 shadow-card"
          style={{ '--rise-delay': '80ms' } as React.CSSProperties}
        >
          <RadialGauge value={avgDrc} max={100} label="Avg DRC" unit="%" />
          <p className="mt-3 text-xs text-muted">dry rubber content</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          <StatCard key="aw" label="Active Workers" value={String(stats.activeWorkers)} />,
          <StatCard
            key="pa"
            label="Pending Approvals"
            value={String(stats.pendingApprovals)}
            tone={stats.pendingApprovals > 0 ? 'down' : 'flat'}
            delta={stats.pendingApprovals > 0 ? 'needs action' : undefined}
          />,
          <StatCard
            key="es"
            label="Estates in Scope"
            value={`${data.inScopeEstates} of ${data.totalEstates}`}
          />,
          <StatCard
            key="adl"
            label="Avg daily latex"
            value={`${avgDailyLatex.toLocaleString()} kg`}
            series={dailySeries}
          />,
        ].map((card, i) => (
          <div
            key={card.key}
            className="animate-rise"
            style={{ '--rise-delay': `${120 + i * 60}ms` } as React.CSSProperties}
          >
            {card}
          </div>
        ))}
      </div>

      {/* Analytics row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div
          className="animate-rise lg:col-span-2"
          style={{ '--rise-delay': '160ms' } as React.CSSProperties}
        >
          <ProductionChart data={data.byEstate} />
        </div>
        <div
          className="animate-rise rounded-2xl border border-line bg-white p-5 shadow-card"
          style={{ '--rise-delay': '220ms' } as React.CSSProperties}
        >
          <h2 className="text-lg font-semibold text-ink">Workforce mix</h2>
          <div className="mt-5 flex justify-center">
            <Donut segments={categoryMix(data.categoryMix)} />
          </div>
        </div>
      </div>

      {/* Jurisdiction + Audit row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="animate-rise" style={{ '--rise-delay': '260ms' } as React.CSSProperties}>
          <EstatesJurisdictionPanel allEstates={data.allEstates} byEstate={data.byEstate} />
          {restrictedCount > 0 && (
            <p className="mt-2 text-xs text-[color:var(--clay)]">
              {restrictedCount} estate{restrictedCount === 1 ? '' : 's'} restricted — outside your jurisdiction.
            </p>
          )}
        </div>
        <div className="animate-rise" style={{ '--rise-delay': '300ms' } as React.CSSProperties}>
          <AuditTimelinePanel />
        </div>
      </div>
    </div>
  );
}
