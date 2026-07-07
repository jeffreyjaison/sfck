'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/components/RoleProvider';
import { useScopedData } from '@/lib/client-fetch';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';

const CATEGORY_TONE: Record<string, 'emerald' | 'amber' | 'slate'> = {
  Permanent: 'emerald',
  Casual: 'slate',
  Dependent: 'amber',
};

type Line = {
  workerId: number;
  checkRoll: string;
  name: string;
  category: string;
  blockClass: string;
  producedKg: number;
  drcAvg: number;
  gross: number;
  incentive: number;
  weightage: number;
  washing: number;
  pf: number;
  other: number;
  net: number;
};

type Payroll = {
  period: { start: string; end: string };
  workingDays: number;
  pfPercent: number;
  dailyWage: number;
  lines: Line[];
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export default function PayrollPage() {
  const { session } = useSession();
  const { data, loading } = useScopedData<Payroll>('/api/payroll', session);
  const [lines, setLines] = useState<Line[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const rows = lines ?? data?.lines ?? null;

  if (loading || !data || !rows) return <div className="text-slate-400">Loading…</div>;

  const updateOther = (workerId: number, other: number) => {
    const next = (lines ?? data.lines).map((l) => {
      if (l.workerId !== workerId) return l;
      const net = round2(l.gross + l.incentive + l.weightage + l.washing - l.pf - other);
      return { ...l, other, net };
    });
    setLines(next);
  };

  const finalize = async () => {
    setBusy(true);
    setResult(null);
    const res = await fetch('/api/payroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'finalize',
        lines: rows.map((l) => ({
          workerId: l.workerId,
          gross: l.gross,
          incentive: l.incentive,
          weightage: l.weightage,
          washing: l.washing,
          pf: l.pf,
          other: l.other,
          net: l.net,
        })),
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (json.ok) {
      setResult(`Run #${json.runId} finalized (${json.count} lines)`);
    } else {
      setResult(json.error ?? 'Finalize failed');
    }
  };

  const totalNet = round2(rows.reduce((sum, l) => sum + l.net, 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Payroll — D4 Wage Engine</h1>
        <p className="mt-1 text-sm text-slate-500">
          Wage period 21 Jun – 20 Jul · block class II/III/IV · CC-wise DRC · PF 12% (Permanent &amp; Casual) · Weightage/Washing (Permanent only)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Tappers in scope" value={rows.length.toString()} />
        <StatCard label="Total Net Pay" value={`₹${totalNet.toLocaleString()}`} />
        <StatCard label="Working Days / PF %" value={`${data.workingDays} / ${data.pfPercent}%`} />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full whitespace-nowrap text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Check Roll</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Class</th>
              <th className="px-3 py-2 font-medium">Produced kg</th>
              <th className="px-3 py-2 font-medium">DRC</th>
              <th className="px-3 py-2 font-medium">Gross</th>
              <th className="px-3 py-2 font-medium">Incentive</th>
              <th className="px-3 py-2 font-medium">Weightage</th>
              <th className="px-3 py-2 font-medium">Washing</th>
              <th className="px-3 py-2 font-medium">PF</th>
              <th className="px-3 py-2 font-medium">Other Recovery</th>
              <th className="px-3 py-2 font-medium">Net</th>
              <th className="px-3 py-2 font-medium">Slip</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.workerId} className="border-t">
                <td className="px-3 py-2">{l.checkRoll}</td>
                <td className="px-3 py-2">{l.name}</td>
                <td className="px-3 py-2"><Badge tone={CATEGORY_TONE[l.category] ?? 'slate'}>{l.category}</Badge></td>
                <td className="px-3 py-2">{l.blockClass}</td>
                <td className="px-3 py-2">{l.producedKg.toFixed(2)}</td>
                <td className="px-3 py-2">{(l.drcAvg * 100).toFixed(0)}%</td>
                <td className="px-3 py-2">₹{l.gross.toLocaleString()}</td>
                <td className="px-3 py-2">₹{l.incentive.toLocaleString()}</td>
                <td className="px-3 py-2">₹{l.weightage.toLocaleString()}</td>
                <td className="px-3 py-2">₹{l.washing.toLocaleString()}</td>
                <td className="px-3 py-2">
                  <span title="EPF — not editable">🔒 ₹{l.pf.toLocaleString()}</span>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    value={l.other}
                    onChange={(e) => updateOther(l.workerId, Number(e.target.value) || 0)}
                    className="w-20 rounded-lg border px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-3 py-2 font-medium">₹{l.net.toLocaleString()}</td>
                <td className="px-3 py-2 space-x-1">
                  <Link
                    href={`/payroll/slip/${l.workerId}`}
                    className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                  >
                    Slip
                  </Link>
                  <Link
                    href={`/payroll/working-sheet/${l.workerId}`}
                    className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                  >
                    D4 Sheet
                  </Link>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={14} className="px-4 py-4 text-center text-slate-400">No tappers in scope.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={finalize}
          disabled={busy || !rows.length}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Finalize payroll run
        </button>
        {result && <span className="text-sm text-slate-700">{result}</span>}
      </div>
    </div>
  );
}
