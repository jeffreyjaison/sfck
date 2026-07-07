'use client';
import { useSession } from '@/components/RoleProvider';
import { useScopedData } from '@/lib/client-fetch';
import { StatCard } from '@/components/StatCard';
import { ProductionChart } from '@/components/ProductionChart';

type Dash = {
  stats: { totalLatexKg: number; activeWorkers: number; pendingApprovals: number; yoyPercent: number };
  byEstate: { estate: string; current: number; prior: number }[];
};

export default function DashboardPage() {
  const { session } = useSession();
  const { data, loading } = useScopedData<Dash>('/api/dashboard', session);
  if (loading || !data) return <div className="text-slate-400">Loading…</div>;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Latex (kg, current period)" value={data.stats.totalLatexKg.toLocaleString()} delta={`${data.stats.yoyPercent >= 0 ? '+' : ''}${data.stats.yoyPercent}% YoY`} />
        <StatCard label="Active Workers" value={String(data.stats.activeWorkers)} />
        <StatCard label="Pending Approvals" value={String(data.stats.pendingApprovals)} />
        <StatCard label="Estates in Scope" value={String(data.byEstate.length)} />
      </div>
      <ProductionChart data={data.byEstate} />
    </div>
  );
}
