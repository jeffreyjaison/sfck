'use client';
import { useMemo, useState } from 'react';
import { useSession } from '@/components/RoleProvider';
import { useScopedData } from '@/lib/client-fetch';

type WorkerLeave = {
  id: number;
  checkRoll: string;
  name: string;
  category: string;
  eligible: boolean;
  annualBalance: number;
  medicalTaken: number;
  medicalRemaining: number;
};

type Leave = { workers: WorkerLeave[] };

export default function LeavePage() {
  const { session } = useSession();
  const { data, loading, reload } = useScopedData<Leave>('/api/leave', session);

  const eligibleWorkers = useMemo(() => (data ? data.workers.filter((w) => w.eligible) : []), [data]);

  const [workerId, setWorkerId] = useState('');
  const [kind, setKind] = useState<'Medical' | 'Annual'>('Medical');
  const [days, setDays] = useState('');
  const [dailyWage, setDailyWage] = useState('300');
  const [holidaysInPeriod, setHolidaysInPeriod] = useState('0');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [holidayNote, setHolidayNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedId = workerId || eligibleWorkers[0]?.id.toString() || '';

  const submit = async () => {
    const n = Number(days);
    if (!selectedId || !Number.isFinite(n) || n <= 0) return;
    setBusy(true);
    setResult(null);
    setHolidayNote(null);
    setError(null);
    const holidays = Number(holidaysInPeriod) || 0;
    const res = await fetch('/api/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workerId: Number(selectedId),
        kind,
        days: n,
        dailyWage: Number(dailyWage) || 300,
        ...(kind === 'Medical' ? { holidaysInPeriod: holidays } : {}),
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? 'Request failed');
      return;
    }
    if (kind === 'Medical') {
      setResult(`Paid ${json.paidDays} days · ₹${json.amount}`);
      if (holidays > 0) {
        setHolidayNote('Holidays auto-excluded — no double benefit.');
      }
    } else {
      setResult('Annual leave recorded');
    }
    setDays('');
    reload();
  };

  if (loading || !data) return <div className="text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Leave &amp; Weightage</h1>
        <p className="mt-1 text-sm text-slate-500">
          Medical leave capped at 14 days/yr at ⅔ daily wage · Annual leave accrues 1 per 20 working days ·
          Permanent employees only · holiday-within-medical-leave overlap auto-resolved.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold">Record Leave</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <select
            value={selectedId}
            onChange={(e) => setWorkerId(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            {eligibleWorkers.map((w) => (
              <option key={w.id} value={w.id}>{w.checkRoll} — {w.name}</option>
            ))}
          </select>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as 'Medical' | 'Annual')}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="Medical">Medical</option>
            <option value="Annual">Annual</option>
          </select>
          <input
            type="number"
            min="0"
            placeholder="Days"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          {kind === 'Medical' && (
            <input
              type="number"
              min="0"
              placeholder="Daily wage (default 300)"
              value={dailyWage}
              onChange={(e) => setDailyWage(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            />
          )}
          {kind === 'Medical' && (
            <input
              type="number"
              min="0"
              placeholder="Holidays in period"
              value={holidaysInPeriod}
              onChange={(e) => setHolidaysInPeriod(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            />
          )}
          <button
            onClick={submit}
            disabled={busy || !eligibleWorkers.length}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Submit
          </button>
        </div>
        {result && <div className="mt-3 text-sm text-emerald-600">{result}</div>}
        {holidayNote && <div className="mt-1 text-sm text-slate-500">{holidayNote}</div>}
        {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Check Roll</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Eligible?</th>
              <th className="px-4 py-2 font-medium">Annual Balance</th>
              <th className="px-4 py-2 font-medium">Medical Remaining (of 14)</th>
            </tr>
          </thead>
          <tbody>
            {data.workers.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="px-4 py-2">{w.checkRoll}</td>
                <td className="px-4 py-2">{w.name}</td>
                <td className="px-4 py-2">{w.category}</td>
                <td className="px-4 py-2">{w.eligible ? '✓' : '—'}</td>
                <td className="px-4 py-2">{w.eligible ? w.annualBalance : <span className="text-slate-400">Not eligible</span>}</td>
                <td className="px-4 py-2">{w.eligible ? w.medicalRemaining : <span className="text-slate-400">Not eligible</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
