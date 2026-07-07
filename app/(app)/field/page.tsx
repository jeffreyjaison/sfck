'use client';
import { useState } from 'react';
import { useSession } from '@/components/RoleProvider';
import { useScopedData } from '@/lib/client-fetch';
import { PhoneFrame } from '@/components/PhoneFrame';
import { PrintSheet } from '@/components/PrintSheet';
import { WeightSlip } from '@/components/WeightSlip';

type Worker = { id: number; name: string; checkRoll: string; type: string; ccId: number | null };
type Cc = { id: number; name: string };
type Recent = {
  id: number;
  worker: string;
  checkRoll: string;
  cc: string;
  day: string;
  latexKg: number;
  scrapKg: number;
  drc: number | null;
  locked: boolean;
};
type Slip = {
  id: number;
  worker: string;
  checkRoll: string;
  cc: string;
  day: string;
  latexKg: number;
  scrapKg: number;
  drc: number;
};
type Field = { workers: Worker[]; ccs: Cc[]; recent: Recent[] };

function CaptureForm({ workers, ccs, onSaved }: { workers: Worker[]; ccs: Cc[]; onSaved: (slip: Slip) => void }) {
  const [workerId, setWorkerId] = useState(workers[0]?.id.toString() ?? '');
  const [ccId, setCcId] = useState(() => {
    const w = workers[0];
    return (w?.ccId ?? ccs[0]?.id ?? '').toString();
  });
  const [latexKg, setLatexKg] = useState('');
  const [scrapKg, setScrapKg] = useState('');
  const [drc, setDrc] = useState('0.42');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onWorkerChange = (id: string) => {
    setWorkerId(id);
    const w = workers.find((x) => x.id.toString() === id);
    if (w?.ccId) setCcId(w.ccId.toString());
  };

  const submit = async () => {
    const latex = Number(latexKg);
    const scrap = Number(scrapKg);
    if (!workerId || !ccId || !Number.isFinite(latex) || latex <= 0 || !Number.isFinite(scrap) || scrap < 0) {
      setError('Enter a worker, CC and valid latex/scrap weights.');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch('/api/field', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'capture',
        workerId: Number(workerId),
        ccId: Number(ccId),
        latexKg: latex,
        scrapKg: scrap,
        drc: drc === '' ? 0.42 : Number(drc),
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? 'Save failed');
      return;
    }
    setLatexKg('');
    setScrapKg('');
    onSaved(json.slip as Slip);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-slate-500">Worker (Tapper)</label>
        <select
          value={workerId}
          onChange={(e) => onWorkerChange(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        >
          {workers.map((w) => (
            <option key={w.id} value={w.id}>{w.checkRoll} — {w.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500">Collection Centre</label>
        <select
          value={ccId}
          onChange={(e) => setCcId(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        >
          {ccs.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500">Latex (kg)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={latexKg}
            onChange={(e) => setLatexKg(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Scrap (kg)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={scrapKg}
            onChange={(e) => setScrapKg(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500">DRC</label>
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={drc}
          onChange={(e) => setDrc(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>
      {error && <div className="text-xs text-[color:var(--clay)]">{error}</div>}
      <button
        onClick={submit}
        disabled={busy || !workers.length}
        className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {busy ? 'Saving…' : 'Save & generate slip'}
      </button>
    </div>
  );
}

function RecentRow({ row, onDone }: { row: Recent; onDone: () => void }) {
  const { session } = useSession();
  const [busy, setBusy] = useState(false);
  const [approving, setApproving] = useState(false);
  const [sent, setSent] = useState(false);

  const canApprove = session ? ['am', 'em', 'md'].includes(session.role) : false;

  const requestCorrection = async () => {
    setBusy(true);
    await fetch('/api/field', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'correctionRequest', collectionId: row.id }),
    });
    setBusy(false);
    setSent(true);
    onDone();
    setTimeout(() => setSent(false), 3000);
  };

  const approveCorrection = async () => {
    setApproving(true);
    await fetch('/api/field', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approveCorrection', collectionId: row.id }),
    });
    setApproving(false);
    onDone();
  };

  return (
    <tr className="border-t border-line">
      <td className="px-4 py-2">{row.checkRoll} — {row.worker}</td>
      <td className="px-4 py-2">{row.cc}</td>
      <td className="px-4 py-2">{row.day}</td>
      <td className="px-4 py-2 mono">{row.latexKg.toFixed(2)}</td>
      <td className="px-4 py-2 mono">{row.scrapKg.toFixed(2)}</td>
      <td className="px-4 py-2 mono">{row.drc !== null ? `${(row.drc * 100).toFixed(0)}%` : '—'}</td>
      <td className="px-4 py-2">
        {row.locked ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            🔒 Locked
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
            🔓 Editable
          </span>
        )}
      </td>
      <td className="px-4 py-2">
        {sent && <div className="mb-1 text-xs text-emerald-600">Correction request sent to AM</div>}
        {row.locked && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={requestCorrection}
              disabled={busy}
              className="rounded-lg border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Request correction (AM approval)
            </button>
            {canApprove && (
              <button
                onClick={approveCorrection}
                disabled={approving}
                className="rounded-lg border border-emerald-300 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              >
                Approve correction (AM)
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

export default function FieldPage() {
  const { session } = useSession();
  const { data, loading, reload } = useScopedData<Field>('/api/field', session);
  const [slip, setSlip] = useState<Slip | null>(null);

  if (loading || !data) return <div className="text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Field Data Capture</h1>
        <p className="mt-1 text-sm text-muted">
          Daily latex &amp; scrap entry · handheld app · offline-first · data locked after entry.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PhoneFrame>
          <CaptureForm
            workers={data.workers}
            ccs={data.ccs}
            onSaved={(s) => { setSlip(s); reload(); }}
          />
        </PhoneFrame>

        {slip && (
          <div className="space-y-3">
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              ✓ Weight slip sent via SMS
            </div>
            <PrintSheet>
              <WeightSlip slip={slip} />
            </PrintSheet>
            <button
              onClick={() => window.print()}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
            >
              Print
            </button>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-ink">Recent entries (locked)</h2>
        <p className="mt-1 text-xs text-muted">
          Entries are locked after capture; corrections require AM-authorised approval.
        </p>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Worker</th>
                <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">CC</th>
                <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Day</th>
                <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Latex (kg)</th>
                <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Scrap (kg)</th>
                <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">DRC</th>
                <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((r) => (
                <RecentRow key={r.id} row={r} onDone={reload} />
              ))}
              {!data.recent.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-muted">No entries yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
