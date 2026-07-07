'use client';
import { useState } from 'react';
import { useSession } from '@/components/RoleProvider';
import { useScopedData } from '@/lib/client-fetch';
import { StatCard } from '@/components/StatCard';

type AttendanceRow = {
  id: number;
  worker: string;
  checkRoll: string;
  type: string;
  markedAt: string;
  isExcess: boolean;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Locked';
  outcome: 'Approved' | 'Pending' | 'Rejected';
};

type Attendance = {
  day: string;
  rows: AttendanceRow[];
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  excessCount: number;
};

const STATUS_BADGE: Record<string, string> = {
  Approved: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-amber-100 text-amber-700',
  Rejected: 'bg-rose-100 text-rose-700',
  Locked: 'bg-slate-100 text-slate-600',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

export default function AttendancePage() {
  const { session } = useSession();
  const { data, loading, reload } = useScopedData<Attendance>('/api/attendance', session);
  const [busyId, setBusyId] = useState<number | null>(null);

  const act = async (action: 'approve' | 'reject' | 'markExcess', id: number) => {
    setBusyId(id);
    await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id }),
    });
    setBusyId(null);
    reload();
  };

  if (loading || !data) return <div className="text-slate-400">Loading…</div>;

  const pending = data.rows.filter((r) => r.status === 'Pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <p className="mt-1 text-sm text-slate-500">Day: {data.day}</p>
      </div>

      <div className="rounded-lg border bg-slate-50 p-3 text-xs text-slate-500">
        Tapper cut-off 06:15 · AM approval window 06:15–06:30 · restricted after 06:30 · General workers
        08:00–17:00 · Tapper-on-non-tapping-duty 06:00–14:00 · Excess/additional attendance needs EM+
        approval and is paid as a separate voucher (excluded from PF, Bonus, Seniority).
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Approved" value={data.approvedCount.toString()} />
        <StatCard label="Pending" value={data.pendingCount.toString()} />
        <StatCard label="Rejected" value={data.rejectedCount.toString()} />
        <StatCard label="Excess" value={data.excessCount.toString()} />
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold">AM Approval Queue</h2>
        <p className="mt-1 text-xs text-slate-500">Attendance marked in the 06:15–06:30 window, awaiting approval.</p>
        {pending.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Check Roll</th>
                  <th className="px-4 py-2 font-medium">Worker</th>
                  <th className="px-4 py-2 font-medium">Marked At</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2">{r.checkRoll}</td>
                    <td className="px-4 py-2">{r.worker}</td>
                    <td className="px-4 py-2 text-amber-600">{r.markedAt}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => act('approve', r.id)}
                          disabled={busyId === r.id}
                          className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => act('reject', r.id)}
                          disabled={busyId === r.id}
                          className="rounded-lg bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 text-sm text-slate-400">No pending approvals.</div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Check Roll</th>
              <th className="px-4 py-2 font-medium">Worker</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Marked At</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.checkRoll}</td>
                <td className="px-4 py-2">{r.worker}</td>
                <td className="px-4 py-2">{r.type}</td>
                <td
                  className={
                    r.outcome === 'Approved'
                      ? 'px-4 py-2 text-emerald-600'
                      : r.outcome === 'Pending'
                        ? 'px-4 py-2 text-amber-600'
                        : 'px-4 py-2 text-rose-600'
                  }
                >
                  {r.markedAt}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    {r.isExcess && (
                      <span className="inline-block rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                        Excess
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">
                  {r.status === 'Approved' && !r.isExcess ? (
                    <button
                      onClick={() => act('markExcess', r.id)}
                      disabled={busyId === r.id}
                      className="rounded-lg border border-violet-300 px-2 py-1 text-xs text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                    >
                      Mark excess
                    </button>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!data.rows.length && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-slate-400">No attendance records.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
