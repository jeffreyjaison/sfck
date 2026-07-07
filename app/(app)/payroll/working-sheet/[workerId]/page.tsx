'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from '@/components/RoleProvider';
import { useScopedData } from '@/lib/client-fetch';
import { PrintSheet } from '@/components/PrintSheet';

type D4Block = {
  label: string;
  blockClass: string;
  daysTapped: number;
  producedKg: number;
  standardKg: number;
  incentive: number;
};

type Line = {
  workerId: number;
  checkRoll: string;
  name: string;
  category: string;
  blockClass: string;
  d4Blocks: D4Block[];
  incentive: number;
};

type Payroll = {
  period: { start: string; end: string };
  lines: Line[];
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export default function WorkingSheetPage() {
  const { workerId } = useParams<{ workerId: string }>();
  const { session } = useSession();
  const { data, loading } = useScopedData<Payroll>('/api/payroll', session);

  if (loading || !data) return <div className="text-slate-400">Loading…</div>;

  const line = data.lines.find((l) => l.workerId === Number(workerId));

  if (!line) {
    return (
      <div className="space-y-4">
        <Link href="/payroll" className="text-sm text-emerald-600 hover:underline">&larr; Back to Payroll</Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Working sheet unavailable (worker not a tapper or outside your access scope).
        </div>
      </div>
    );
  }

  const totalIncentive = round2(line.d4Blocks.reduce((sum, b) => sum + b.incentive, 0));

  return (
    <div className="space-y-4">
      <Link href="/payroll" className="text-sm text-emerald-600 hover:underline">&larr; Back to Payroll</Link>
      <PrintSheet>
        <div className="mx-auto w-full max-w-2xl border border-black bg-white p-5 text-black">
          <div className="text-center">
            <div className="text-base font-bold">State Farming Corporation of Kerala Ltd.</div>
            <div className="mt-2 border-t border-b border-black py-1 text-sm font-semibold">
              D4 Tapping Working Sheet
            </div>
            <div className="text-xs text-slate-600">Wage period 21 Jun – 20 Jul</div>
          </div>

          <table className="mt-3 w-full text-xs">
            <tbody>
              <tr>
                <td className="py-1 font-medium">Name</td>
                <td className="py-1 text-right">{line.name}</td>
              </tr>
              <tr className="border-t border-dashed border-black/40">
                <td className="py-1 font-medium">Check Roll Number</td>
                <td className="py-1 text-right">{line.checkRoll}</td>
              </tr>
              <tr className="border-t border-dashed border-black/40">
                <td className="py-1 font-medium">Category</td>
                <td className="py-1 text-right">{line.category}</td>
              </tr>
            </tbody>
          </table>

          <table className="mt-3 w-full text-xs">
            <thead>
              <tr className="border-t border-b border-black text-left">
                <th className="py-1">Block</th>
                <th className="py-1">Class</th>
                <th className="py-1 text-right">Days Tapped</th>
                <th className="py-1 text-right">Produced kg</th>
                <th className="py-1 text-right">Standard kg</th>
                <th className="py-1 text-right">Incentive ₹</th>
              </tr>
            </thead>
            <tbody>
              {line.d4Blocks.map((b) => (
                <tr key={b.label} className="border-t border-dashed border-black/40">
                  <td className="py-1">{b.label}</td>
                  <td className="py-1">{b.blockClass}</td>
                  <td className="py-1 text-right">{b.daysTapped}</td>
                  <td className="py-1 text-right">{b.producedKg.toFixed(2)}</td>
                  <td className="py-1 text-right">{b.standardKg.toFixed(2)}</td>
                  <td className="py-1 text-right">{b.incentive.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black font-semibold">
                <td className="py-1" colSpan={5}>Total Incentive</td>
                <td className="py-1 text-right">₹{totalIncentive.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-3 border-t border-black pt-2 text-[10px] text-slate-600">
            D4 system: 4 blocks per tapper, one tapped per 4-day cycle; incentive paid on production above each block&apos;s class standard.
          </div>
        </div>
      </PrintSheet>
      <button
        onClick={() => window.print()}
        className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
      >
        Print
      </button>
    </div>
  );
}
