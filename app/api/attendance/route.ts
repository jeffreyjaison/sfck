import { NextResponse } from 'next/server';
import { sessionFromRequest } from '@/lib/api-session';
import { workersForSession } from '@/lib/db/queries';
import { db } from '@/lib/db/client';
import { attendance, auditLog } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { tapperAttendanceOutcome } from '@/lib/engine/attendance';

export const dynamic = 'force-dynamic';

const DAY = '2026-07-06';

export async function GET(req: Request) {
  const session = sessionFromRequest(req);
  const workers = await workersForSession(session);
  const workerIds = workers.map((w) => w.id);
  const workerName = new Map(workers.map((w) => [w.id, w.name]));
  const workerCheckRoll = new Map(workers.map((w) => [w.id, w.checkRoll]));
  const workerType = new Map(workers.map((w) => [w.id, w.type]));

  const rows = workerIds.length
    ? await db.select().from(attendance).where(
        and(inArray(attendance.workerId, workerIds), eq(attendance.day, DAY)),
      )
    : [];

  const mapped = rows.map((r) => ({
    id: r.id,
    worker: workerName.get(r.workerId) ?? '',
    checkRoll: workerCheckRoll.get(r.workerId) ?? '',
    type: workerType.get(r.workerId) ?? '',
    markedAt: r.markedAt,
    isExcess: r.isExcess,
    status: r.status,
    outcome: workerType.get(r.workerId) === 'Tapper' ? tapperAttendanceOutcome(r.markedAt) : 'Approved',
  }));

  return NextResponse.json({
    day: DAY,
    rows: mapped,
    pendingCount: mapped.filter((r) => r.status === 'Pending').length,
    approvedCount: mapped.filter((r) => r.status === 'Approved').length,
    rejectedCount: mapped.filter((r) => r.status === 'Rejected').length,
    excessCount: mapped.filter((r) => r.isExcess).length,
  });
}

export async function POST(req: Request) {
  const session = sessionFromRequest(req);
  const body = await req.json().catch(() => null);
  const action = body?.action;
  const id = Number(body?.id);

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  if (action === 'approve' || action === 'reject' || action === 'markExcess') {
    const [row] = await db.select().from(attendance).where(eq(attendance.id, id));
    if (!row) {
      return NextResponse.json({ error: 'Out of jurisdiction' }, { status: 403 });
    }
    const workers = await workersForSession(session);
    const inScope = new Set(workers.map((w) => w.id));
    if (!inScope.has(row.workerId)) {
      return NextResponse.json({ error: 'Out of jurisdiction' }, { status: 403 });
    }

    if (action === 'approve') {
      await db.update(attendance).set({ status: 'Approved' }).where(eq(attendance.id, id));
      return NextResponse.json({ ok: true });
    }
    if (action === 'reject') {
      await db.update(attendance).set({ status: 'Rejected' }).where(eq(attendance.id, id));
      return NextResponse.json({ ok: true });
    }
    await db.update(attendance).set({ isExcess: true, status: 'Approved' }).where(eq(attendance.id, id));
    await db.insert(auditLog).values({
      actorRole: session.role,
      action: 'excess-voucher-created',
      entity: `attendance:${id}`,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
