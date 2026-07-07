import { NextResponse } from 'next/server';
import { sessionFromRequest } from '@/lib/api-session';
import { workersForSession } from '@/lib/db/queries';
import { db } from '@/lib/db/client';
import { leaveRecords, settings } from '@/lib/db/schema';
import { inArray, and, eq } from 'drizzle-orm';
import { medicalLeavePayable, annualLeaveAccrued, isLeaveEligible } from '@/lib/engine/leave';

export const dynamic = 'force-dynamic';

const DEMO_YEAR = 2026;
const DEMO_WORKING_DAYS = 240;

export async function GET(req: Request) {
  const session = sessionFromRequest(req);
  const workers = await workersForSession(session);
  const ids = workers.map((w) => w.id);

  const settingRows = await db.select().from(settings);
  const settingsMap = new Map(settingRows.map((s) => [s.key, s.value]));
  const medicalCap = Number(settingsMap.get('medical_leave_cap') ?? 14);

  const records = ids.length
    ? await db.select().from(leaveRecords).where(inArray(leaveRecords.workerId, ids))
    : [];

  const annualTaken = new Map<number, number>();
  const medicalTaken = new Map<number, number>();
  for (const r of records) {
    if (r.year !== DEMO_YEAR) continue;
    if (r.kind === 'Annual') annualTaken.set(r.workerId, (annualTaken.get(r.workerId) ?? 0) + r.days);
    if (r.kind === 'Medical') medicalTaken.set(r.workerId, (medicalTaken.get(r.workerId) ?? 0) + r.days);
  }

  const accrued = annualLeaveAccrued(DEMO_WORKING_DAYS);

  const workersOut = workers.map((w) => {
    const eligible = isLeaveEligible(w.category);
    const medTaken = medicalTaken.get(w.id) ?? 0;
    return {
      id: w.id,
      checkRoll: w.checkRoll,
      name: w.name,
      category: w.category,
      eligible,
      annualBalance: accrued - (annualTaken.get(w.id) ?? 0),
      medicalTaken: medTaken,
      medicalRemaining: Math.max(0, medicalCap - medTaken),
    };
  });

  return NextResponse.json({ workers: workersOut });
}

export async function POST(req: Request) {
  const session = sessionFromRequest(req);
  const body = await req.json().catch(() => null);
  const workerId = Number(body?.workerId);
  const kind = body?.kind;
  const days = Number(body?.days);
  const dailyWage = Number(body?.dailyWage ?? 300);

  if (!workerId || (kind !== 'Medical' && kind !== 'Annual') || !Number.isFinite(days) || days <= 0) {
    return NextResponse.json({ error: 'workerId, kind and a positive days value are required' }, { status: 400 });
  }

  const workers = await workersForSession(session);
  const worker = workers.find((w) => w.id === workerId);
  if (!worker) {
    return NextResponse.json({ error: 'Worker is out of scope' }, { status: 400 });
  }
  if (!isLeaveEligible(worker.category)) {
    return NextResponse.json({ error: 'Only Permanent employees are eligible for leave' }, { status: 400 });
  }

  if (kind === 'Medical') {
    const settingRows = await db.select().from(settings);
    const settingsMap = new Map(settingRows.map((s) => [s.key, s.value]));
    const medicalCap = Number(settingsMap.get('medical_leave_cap') ?? 14);

    const existing = await db
      .select()
      .from(leaveRecords)
      .where(and(eq(leaveRecords.workerId, workerId), eq(leaveRecords.kind, 'Medical'), eq(leaveRecords.year, DEMO_YEAR)));
    const takenThisYear = existing.reduce((sum, r) => sum + r.days, 0);
    const { paidDays, amount } = medicalLeavePayable({ requestedDays: days, takenThisYear, dailyWage, cap: medicalCap });
    await db.insert(leaveRecords).values({ workerId, kind: 'Medical', days: paidDays, year: DEMO_YEAR });
    return NextResponse.json({ ok: true, paidDays, amount });
  }

  await db.insert(leaveRecords).values({ workerId, kind: 'Annual', days, year: DEMO_YEAR });
  return NextResponse.json({ ok: true });
}
