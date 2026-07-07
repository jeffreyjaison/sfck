'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from '@/components/RoleProvider';
import { useScopedData } from '@/lib/client-fetch';
import { PrintSheet } from '@/components/PrintSheet';
import { PayslipMalayalam } from '@/components/PayslipMalayalam';
import { WeightSlip } from '@/components/WeightSlip';
import { DocumentSheet } from '@/components/DocumentSheet';

const DOC_LABELS: Record<string, string> = {
  'daily-production': 'Daily Production Statement',
  'pocket-check-roll': 'Pocket Check Roll',
  'muster-chit': 'Muster Chit',
  'payment-slip': 'Payment Slip',
  'crop-book-1': 'Crop Book Part 1',
  'crop-book-2': 'Crop Book Part 2',
  'production-performance': 'Production Performance',
  'final-drc': 'Final DRC Values',
  'target-achievement': 'Daily Target & Achievement',
  'weight-slip': 'Weight Slip',
};

type PayrollLine = {
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
type Payroll = { period: { start: string; end: string }; lines: PayrollLine[] };

type FieldRecent = {
  id: number;
  worker: string;
  checkRoll: string;
  cc: string;
  day: string;
  latexKg: number;
  scrapKg: number;
  drc: number | null;
};
type Field = { recent: FieldRecent[] };

type Column = { key: string; label: string };
type Row = Record<string, string | number>;
type DocumentData = { title: string; subtitle?: string; columns: Column[]; rows: Row[]; error?: string };

function BackLink() {
  return (
    <Link href="/reports" className="text-sm text-emerald-600 hover:underline">
      &larr; Back to Reports
    </Link>
  );
}

function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
    >
      Print
    </button>
  );
}

function PaymentSlipDoc() {
  const { session } = useSession();
  const { data, loading } = useScopedData<Payroll>('/api/payroll', session);

  if (loading || !data) return <div className="text-slate-400">Loading…</div>;

  const line = data.lines[0];
  if (!line) {
    return (
      <div className="rounded-lg bg-orange-50 p-4 text-sm text-[color:var(--clay)]">
        No payroll lines available in your scope to preview a payment slip.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PrintSheet>
        <PayslipMalayalam line={line} period={data.period} />
      </PrintSheet>
      <PrintButton />
    </div>
  );
}

function WeightSlipDoc() {
  const { session } = useSession();
  const { data, loading } = useScopedData<Field>('/api/field', session);

  if (loading || !data) return <div className="text-slate-400">Loading…</div>;

  const recent = data.recent[0];
  if (!recent) {
    return (
      <div className="rounded-lg bg-orange-50 p-4 text-sm text-[color:var(--clay)]">
        No recent field collections available in your scope to preview a weight slip.
      </div>
    );
  }

  const slip = {
    id: recent.id,
    worker: recent.worker,
    checkRoll: recent.checkRoll,
    cc: recent.cc,
    day: recent.day,
    latexKg: recent.latexKg,
    scrapKg: recent.scrapKg,
    drc: recent.drc ?? 0,
  };

  return (
    <div className="space-y-4">
      <PrintSheet>
        <WeightSlip slip={slip} />
      </PrintSheet>
      <PrintButton />
    </div>
  );
}

function GenericDoc({ doc }: { doc: string }) {
  const { session } = useSession();
  const { data, loading } = useScopedData<DocumentData>(`/api/documents?doc=${doc}`, session);

  if (loading || !data) return <div className="text-slate-400">Loading…</div>;

  if (data.error) {
    return (
      <div className="rounded-lg bg-orange-50 p-4 text-sm text-[color:var(--clay)]">
        Unknown document type.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PrintSheet>
        <DocumentSheet title={data.title} subtitle={data.subtitle} columns={data.columns} rows={data.rows} />
      </PrintSheet>
      <PrintButton />
    </div>
  );
}

export default function DocumentPage() {
  const { doc } = useParams<{ doc: string }>();
  const label = DOC_LABELS[doc] ?? doc;

  return (
    <div className="space-y-4">
      <BackLink />
      <h1 className="text-2xl font-semibold text-ink">{label}</h1>

      {doc === 'payment-slip' ? (
        <PaymentSlipDoc />
      ) : doc === 'weight-slip' ? (
        <WeightSlipDoc />
      ) : (
        <GenericDoc doc={doc} />
      )}
    </div>
  );
}
