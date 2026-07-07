'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from '@/components/RoleProvider';
import { useScopedData } from '@/lib/client-fetch';
import { PrintSheet } from '@/components/PrintSheet';
import { PayslipMalayalam } from '@/components/PayslipMalayalam';

type Line = {
  workerId: number;
  checkRoll: string;
  name: string;
  category: string;
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
  lines: Line[];
};

export default function PayslipPage() {
  const { workerId } = useParams<{ workerId: string }>();
  const { session } = useSession();
  const { data, loading } = useScopedData<Payroll>('/api/payroll', session);

  if (loading || !data) return <div className="text-slate-400">Loading…</div>;

  const line = data.lines.find((l) => l.workerId === Number(workerId));

  if (!line) {
    return (
      <div className="space-y-4">
        <Link href="/payroll" className="text-sm text-emerald-600 hover:underline">&larr; Back to Payroll</Link>
        <div className="rounded-lg bg-orange-50 p-4 text-sm text-[color:var(--clay)]">
          Slip unavailable (worker not a tapper or outside your access scope).
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/payroll" className="text-sm text-emerald-600 hover:underline">&larr; Back to Payroll</Link>
      <PrintSheet>
        <PayslipMalayalam line={line} period={data.period} />
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
