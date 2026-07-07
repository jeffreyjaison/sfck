'use client';
import { useState } from 'react';
import { useSession } from '@/components/RoleProvider';
import { useScopedData } from '@/lib/client-fetch';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';

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

const STATUS_TONE: Record<string, 'emerald' | 'amber' | 'rose' | 'slate'> = {
  Approved: 'emerald',
  Pending: 'amber',
  Rejected: 'rose',
  Locked: 'slate',
};

function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? 'slate'}>{status}</Badge>;
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
        <h1 className="text-2xl font-semibold text-ink">Attendance</h1>
        <p className="mt-1 text-sm text-muted">Day: {data.day}</p>
      </div>

      <div className="rounded-lg border border-line bg-latex/60 p-3 text-xs text-muted">
        Tapper cut-off 06:15 · AM approval window 06:15–06:30 · restricted after 06:30 · General workers
        08:00–17:00 · Tapper-on-non-tapping-duty 06:00–14:00 · Excess/additional attendance needs EM+
        approval and is paid as a separate voucher (excluded from PF, Bonus, Seniority).
      </div>

      <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Approved" value={data.approvedCount.toString()} />
        <StatCard label="Pending" value={data.pendingCount.toString()} />
        <StatCard label="Rejected" value={data.rejectedCount.toString()} />
        <StatCard label="Excess" value={data.excessCount.toString()} />
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold text-ink">AM Approval Queue</h2>
        <p className="mt-1 text-xs text-muted">Attendance marked in the 06:15–06:30 window, awaiting approval.</p>
        {pending.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted">
                <tr>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Check Roll</th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Worker</th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Marked At</th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="px-4 py-2 mono">{r.checkRoll}</td>
                    <td className="px-4 py-2">{r.worker}</td>
                    <td className="px-4 py-2 mono text-[color:var(--clay)]">{r.markedAt}</td>
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
                          className="rounded-lg bg-[color:var(--clay)] px-2 py-1 text-xs text-white hover:opacity-90 disabled:opacity-50"
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
          <div className="mt-4 text-sm text-muted">No pending approvals.</div>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Check Roll</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Worker</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Type</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Marked At</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Status</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-4 py-2 mono">{r.checkRoll}</td>
                <td className="px-4 py-2">{r.worker}</td>
                <td className="px-4 py-2">{r.type}</td>
                <td
                  className={
                    r.outcome === 'Approved'
                      ? 'px-4 py-2 mono text-emerald-600'
                      : 'px-4 py-2 mono text-[color:var(--clay)]'
                  }
                >
                  {r.markedAt}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    {r.isExcess && (
                      <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-[color:var(--clay)]">
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
                      className="rounded-lg border border-[color:var(--clay)]/40 px-2 py-1 text-xs text-[color:var(--clay)] hover:bg-orange-50 disabled:opacity-50"
                    >
                      Mark excess
                    </button>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!data.rows.length && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-muted">No attendance records.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
