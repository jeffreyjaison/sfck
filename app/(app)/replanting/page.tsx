'use client';
import { useMemo } from 'react';
import { useSession } from '@/components/RoleProvider';
import { useScopedData } from '@/lib/client-fetch';
import { StatCard } from '@/components/StatCard';

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
        <h1 className="text-2xl font-semibold">Replanting Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Year-wise history from 2014 · yield commences in year 7.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Surviving Trees" value={data.census.surviving.toLocaleString()} />
        <StatCard label="Decayed" value={data.census.decayed.toLocaleString()} />
        <StatCard label="Vacant" value={data.census.vacant.toLocaleString()} />
        <StatCard
          label="ROI"
          value={`${data.roi.roiPct >= 0 ? '+' : ''}${data.roi.roiPct}%`}
          delta={`${currency(data.roi.expenditure)} spent · ${currency(data.roi.yieldValue)} yield value`}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Block</th>
              <th className="px-4 py-2 font-medium">Planting Year</th>
              <th className="px-4 py-2 font-medium">Area (ha)</th>
              <th className="px-4 py-2 font-medium">Surviving</th>
              <th className="px-4 py-2 font-medium">Decayed</th>
              <th className="px-4 py-2 font-medium">Vacant</th>
              <th className="px-4 py-2 font-medium">Expenditure (₹)</th>
              <th className="px-4 py-2 font-medium">Yield (kg)</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Estate</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.blockCode}</td>
                <td className="px-4 py-2">{r.plantingYear}</td>
                <td className="px-4 py-2">{r.areaHa}</td>
                <td className="px-4 py-2">{r.surviving.toLocaleString()}</td>
                <td className="px-4 py-2">{r.decayed.toLocaleString()}</td>
                <td className="px-4 py-2">{r.vacant.toLocaleString()}</td>
                <td className="px-4 py-2">{currency(r.expenditure)}</td>
                <td className="px-4 py-2">{r.yieldKg.toLocaleString()}</td>
                <td className="px-4 py-2">
                  {r.producing ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                      Producing
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      Immature — yields from {r.yieldStartYear}
                    </span>
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
