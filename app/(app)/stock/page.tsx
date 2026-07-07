'use client';
import { useState } from 'react';
import { useSession } from '@/components/RoleProvider';
import { useScopedData } from '@/lib/client-fetch';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';

const REQ_TONE: Record<string, 'emerald' | 'amber' | 'rose' | 'slate'> = {
  Approved: 'emerald',
  Pending: 'amber',
  Rejected: 'rose',
};

type StockItem = { id: number; estate: string; name: string; unit: string; balance: number };
type Cc = { id: number; name: string };
type Requisition = { id: number; cc: string; item: string; qty: number; status: string };

type Stock = {
  items: StockItem[];
  ccs: Cc[];
  requisitions: Requisition[];
  consumption: { ammonia: number; latexKg: number; ammoniaPerTonne: number };
};

function TransferControl({ item, onDone }: { item: StockItem; onDone: () => void }) {
  const [qty, setQty] = useState('');
  const [busy, setBusy] = useState(false);

  const transfer = async () => {
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) return;
    setBusy(true);
    await fetch('/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'transfer', itemId: item.id, qty: n }),
    });
    setQty('');
    setBusy(false);
    onDone();
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          placeholder="Qty"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-20 rounded-lg border px-2 py-1 text-sm"
        />
        <button
          onClick={transfer}
          disabled={busy}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Dispatch to factory
        </button>
      </div>
      <span className="text-[11px] text-muted">recorded as factory dispatch</span>
    </div>
  );
}

function RequisitionForm({ ccs, onDone }: { ccs: Cc[]; onDone: () => void }) {
  const [ccId, setCcId] = useState(ccs[0]?.id.toString() ?? '');
  const [item, setItem] = useState('');
  const [qty, setQty] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const n = Number(qty);
    if (!ccId || !item.trim() || !Number.isFinite(n) || n <= 0) return;
    setBusy(true);
    await fetch('/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'requisition', ccId: Number(ccId), item, qty: n }),
    });
    setItem('');
    setQty('');
    setBusy(false);
    onDone();
  };

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <select value={ccId} onChange={(e) => setCcId(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
        {ccs.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Item"
        value={item}
        onChange={(e) => setItem(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm"
      />
      <input
        type="number"
        min="0"
        placeholder="Qty"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm"
      />
      <button
        onClick={submit}
        disabled={busy}
        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        Submit Requisition
      </button>
    </div>
  );
}

export default function StockPage() {
  const { session } = useSession();
  const { data, loading, reload } = useScopedData<Stock>('/api/stock', session);
  const [statusBusy, setStatusBusy] = useState<number | null>(null);

  const setReqStatus = async (reqId: number, status: 'Approved' | 'Rejected') => {
    setStatusBusy(reqId);
    await fetch('/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reqStatus', reqId, status }),
    });
    setStatusBusy(null);
    reload();
  };

  if (loading || !data) return <div className="text-slate-400">Loading…</div>;

  const totalFor = (name: string) => data.items.filter((i) => i.name === name).reduce((sum, i) => sum + i.balance, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Stock &amp; Material</h1>

      <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Latex Balance" value={totalFor('Latex').toLocaleString()} />
        <StatCard label="Scrap Balance" value={totalFor('Scrap').toLocaleString()} />
        <StatCard label="Ammonia Balance" value={totalFor('Ammonia').toLocaleString()} />
        <StatCard
          label="Ammonia L / Tonne Latex"
          value={data.consumption.ammoniaPerTonne.toString()}
          delta="Monitoring indicator"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Item</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Unit</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Balance</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Estate</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((i) => (
              <tr key={i.id} className="border-t border-line">
                <td className="px-4 py-2">{i.name}</td>
                <td className="px-4 py-2">{i.unit}</td>
                <td className="px-4 py-2 mono">{i.balance.toLocaleString()}</td>
                <td className="px-4 py-2">{i.estate}</td>
                <td className="px-4 py-2">
                  <TransferControl item={i} onDone={reload} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold text-ink">Requisitions</h2>
        <p className="mt-1 text-xs text-muted">Online requisition → AM review, approval &amp; issue.</p>
        <div className="mt-4">
          <RequisitionForm ccs={data.ccs} onDone={reload} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Collection Centre</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Item</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Qty</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Status</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.requisitions.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-4 py-2">{r.cc}</td>
                <td className="px-4 py-2">{r.item}</td>
                <td className="px-4 py-2 mono">{r.qty}</td>
                <td className="px-4 py-2"><Badge tone={REQ_TONE[r.status] ?? 'slate'}>{r.status}</Badge></td>
                <td className="px-4 py-2">
                  {r.status === 'Pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReqStatus(r.id, 'Approved')}
                        disabled={statusBusy === r.id}
                        className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setReqStatus(r.id, 'Rejected')}
                        disabled={statusBusy === r.id}
                        className="rounded-lg bg-[color:var(--clay)] px-2 py-1 text-xs text-white hover:opacity-90 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!data.requisitions.length && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-muted">No requisitions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
