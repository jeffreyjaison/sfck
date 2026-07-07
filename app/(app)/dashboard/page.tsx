'use client';
import { useSession } from '@/components/RoleProvider';
import { useScopedData } from '@/lib/client-fetch';
import { StatCard } from '@/components/StatCard';
import { ProductionChart } from '@/components/ProductionChart';
import { ROLES } from '@/lib/rbac';

type Dash = {
  stats: { totalLatexKg: number; activeWorkers: number; pendingApprovals: number; yoyPercent: number };
  byEstate: { estate: string; current: number; prior: number }[];
  totalEstates: number;
  inScopeEstates: number;
  allEstates: { id: number; name: string; inScope: boolean }[];
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
    <div className="rounded-xl border bg-white p-4">
      <h2 className="text-lg font-semibold">Estates — Jurisdiction</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {allEstates.map((e) => {
          const prod = productionByName.get(e.name);
          return (
            <li
              key={e.id}
              className={`flex items-center justify-between border-t pt-2 first:border-t-0 first:pt-0 ${e.inScope ? '' : 'bg-slate-50 opacity-60'}`}
            >
              <span className="font-medium text-slate-700">{e.name}</span>
              {e.inScope ? (
                <span className="text-slate-600">
                  {prod ? `${prod.current.toLocaleString()} kg (current)` : '—'}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-400">
                  🔒 Restricted — outside your jurisdiction
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AuditTrailPanel() {
  const { session } = useSession();
  const { data } = useScopedData<{ entries: AuditEntry[] }>('/api/audit', session);
  const roleLabel = (id: string) => ROLES.find((r) => r.id === id)?.label ?? id;

  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="text-lg font-semibold">Audit Trail — Data Integrity</h2>
      {!data || !data.entries.length ? (
        <p className="mt-2 text-sm text-slate-400">No recorded activity yet.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {data.entries.map((e) => (
            <li key={e.id} className="flex flex-wrap items-baseline gap-x-2 border-t pt-2 first:border-t-0 first:pt-0">
              <span className="font-medium text-slate-700">{roleLabel(e.actorRole)}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600">{e.action}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600">{e.entity}</span>
              <span className="ml-auto text-xs text-slate-400">{new Date(e.at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { session } = useSession();
  const { data, loading } = useScopedData<Dash>('/api/dashboard', session);
  if (loading || !data) return <div className="text-slate-400">Loading…</div>;
  const restrictedCount = data.totalEstates - data.inScopeEstates;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {restrictedCount > 0 && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          🔒 {restrictedCount} estate{restrictedCount === 1 ? '' : 's'} outside your jurisdiction {restrictedCount === 1 ? 'is' : 'are'} restricted.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Latex (kg, current period)" value={data.stats.totalLatexKg.toLocaleString()} delta={`${data.stats.yoyPercent >= 0 ? '+' : ''}${data.stats.yoyPercent}% YoY`} />
        <StatCard label="Active Workers" value={String(data.stats.activeWorkers)} />
        <StatCard label="Pending Approvals" value={String(data.stats.pendingApprovals)} />
        <StatCard label="Estates in Scope" value={String(data.byEstate.length)} />
      </div>
      <ProductionChart data={data.byEstate} />
      <EstatesJurisdictionPanel allEstates={data.allEstates} byEstate={data.byEstate} />
      <AuditTrailPanel />
    </div>
  );
}
