'use client';
import { useMemo } from 'react';
import { useSession } from '@/components/RoleProvider';
import { useScopedData } from '@/lib/client-fetch';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';

type ReplantingRow = {
  id: number;
  estate: string;
  blockCode: string;
  plantingYear: number;
  areaHa: number;
  surviving: number;
  decayed: number;
  vacant: number;
  expenditure: number;
  yieldKg: number;
  yieldStartYear: number;
  producing: boolean;
  status: string;
};

type Replanting = {
  rows: ReplantingRow[];
  census: { surviving: number; decayed: number; vacant: number };
  roi: { expenditure: number; yieldKg: number; yieldValue: number; roiPct: number };
};

const currency = (n: number) => `₹${Math.round(n).toLocaleString()}`;

export default function ReplantingPage() {
  const { session } = useSession();
  const { data, loading } = useScopedData<Replanting>('/api/replanting', session);

  const sortedRows = useMemo(
    () => (data ? [...data.rows].sort((a, b) => a.plantingYear - b.plantingYear) : []),
    [data],
  );

  if (loading || !data) return <div className="text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Replanting Management</h1>
        <p className="mt-1 text-sm text-muted">
          Year-wise history from 2014 · yield commences in year 7.
        </p>
      </div>

      <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Surviving Trees" value={data.census.surviving.toLocaleString()} />
        <StatCard label="Decayed" value={data.census.decayed.toLocaleString()} />
        <StatCard label="Vacant" value={data.census.vacant.toLocaleString()} />
        <StatCard
          label="ROI"
          value={`${data.roi.roiPct >= 0 ? '+' : ''}${data.roi.roiPct}%`}
          delta={`${currency(data.roi.expenditure)} spent · ${currency(data.roi.yieldValue)} yield value`}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Block</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Planting Year</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Area (ha)</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Surviving</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Decayed</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Vacant</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Expenditure (₹)</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Yield (kg)</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Status</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Estate</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-4 py-2">{r.blockCode}</td>
                <td className="px-4 py-2 mono">{r.plantingYear}</td>
                <td className="px-4 py-2 mono">{r.areaHa}</td>
                <td className="px-4 py-2 mono">{r.surviving.toLocaleString()}</td>
                <td className="px-4 py-2 mono">{r.decayed.toLocaleString()}</td>
                <td className="px-4 py-2 mono">{r.vacant.toLocaleString()}</td>
                <td className="px-4 py-2 mono">{currency(r.expenditure)}</td>
                <td className="px-4 py-2 mono">{r.yieldKg.toLocaleString()}</td>
                <td className="px-4 py-2">
                  {r.producing ? (
                    <Badge tone="emerald">Producing</Badge>
                  ) : (
                    <Badge tone="slate">Immature — yields from {r.yieldStartYear}</Badge>
                  )}
                </td>
                <td className="px-4 py-2">{r.estate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
