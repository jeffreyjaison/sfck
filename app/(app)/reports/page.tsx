'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/components/RoleProvider';
import { useScopedData } from '@/lib/client-fetch';
import { StatCard } from '@/components/StatCard';

type ReportRow = { label: string; current: number; prior: number; variancePct: number };
type Reports = {
  groupBy: string;
  rows: ReportRow[];
  totals: { current: number; prior: number; variancePct: number };
};

const DIMENSIONS: { id: 'estate' | 'division' | 'cc' | 'group'; label: string; column: string }[] = [
  { id: 'estate', label: 'Estate', column: 'Estate' },
  { id: 'division', label: 'Division', column: 'Division' },
  { id: 'cc', label: 'Collection Centre', column: 'Collection Centre' },
  { id: 'group', label: 'Group', column: 'Group' },
];

const STATUTORY_DOCS: { label: string; slug: string }[] = [
  { label: 'Daily Production Statement', slug: 'daily-production' },
  { label: 'Pocket Check Roll', slug: 'pocket-check-roll' },
  { label: 'Muster Chit', slug: 'muster-chit' },
  { label: 'Payment Slip', slug: 'payment-slip' },
  { label: 'Crop Book Part 1', slug: 'crop-book-1' },
  { label: 'Crop Book Part 2', slug: 'crop-book-2' },
  { label: 'Production Performance', slug: 'production-performance' },
  { label: 'Final DRC Values', slug: 'final-drc' },
  { label: 'Daily Target & Achievement', slug: 'target-achievement' },
  { label: 'Weight Slip', slug: 'weight-slip' },
];

function VarianceText({ value }: { value: number }) {
  return (
    <span className={value >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
      {value >= 0 ? '+' : ''}
      {value}%
    </span>
  );
}

export default function ReportsPage() {
  const { session } = useSession();
  const [groupBy, setGroupBy] = useState<'estate' | 'division' | 'cc' | 'group'>('estate');
  const { data, loading } = useScopedData<Reports>(`/api/reports?groupBy=${groupBy}`, session);
  const dimension = DIMENSIONS.find((d) => d.id === groupBy)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports &amp; MIS</h1>
        <p className="mt-1 text-sm text-slate-500">
          Consolidated dry-rubber production · comparative against the corresponding prior-year period.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DIMENSIONS.map((d) => (
          <button
            key={d.id}
            onClick={() => setGroupBy(d.id)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
              groupBy === d.id
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <div className="text-slate-400">Loading…</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total Current (kg)" value={data.totals.current.toLocaleString()} />
            <StatCard label="Total Prior (kg)" value={data.totals.prior.toLocaleString()} />
            <StatCard
              label="Overall Variance %"
              value={`${data.totals.variancePct >= 0 ? '+' : ''}${data.totals.variancePct}%`}
              tone={data.totals.variancePct >= 0 ? 'emerald' : 'rose'}
            />
          </div>

          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">{dimension.column}</th>
                  <th className="px-4 py-2 font-medium">Current Year (kg)</th>
                  <th className="px-4 py-2 font-medium">Prior Year (kg)</th>
                  <th className="px-4 py-2 font-medium">Variance %</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.label} className="border-t">
                    <td className="px-4 py-2">{r.label}</td>
                    <td className="px-4 py-2">{r.current.toLocaleString()}</td>
                    <td className="px-4 py-2">{r.prior.toLocaleString()}</td>
                    <td className="px-4 py-2 font-medium"><VarianceText value={r.variancePct} /></td>
                  </tr>
                ))}
                {!data.rows.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-slate-400">No data in scope.</td>
                  </tr>
                )}
              </tbody>
              {data.rows.length > 0 && (
                <tfoot>
                  <tr className="border-t bg-slate-50 font-semibold">
                    <td className="px-4 py-2">Total</td>
                    <td className="px-4 py-2">{data.totals.current.toLocaleString()}</td>
                    <td className="px-4 py-2">{data.totals.prior.toLocaleString()}</td>
                    <td className="px-4 py-2"><VarianceText value={data.totals.variancePct} /></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}

      <div>
        <h2 className="text-lg font-semibold">Statutory Documents</h2>
        <p className="mt-1 text-sm text-slate-500">Estate register &amp; statutory report formats.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STATUTORY_DOCS.map((doc) => (
            <Link
              key={doc.slug}
              href={`/reports/${doc.slug}`}
              className="rounded-xl border bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              {doc.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
