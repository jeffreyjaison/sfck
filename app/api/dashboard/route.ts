import { NextResponse } from 'next/server';
import { sessionFromRequest } from '@/lib/api-session';
import { estatesForSession } from '@/lib/db/queries';
import { db } from '@/lib/db/client';
import { workers, collections, attendance, estates as estatesTable } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = sessionFromRequest(req);
  const estates = await estatesForSession(session);
  const estateById = new Map(estates.map((e) => [e.id, e]));
  const estateIds = estates.map((e) => e.id);
  const allEstates = await db.select().from(estatesTable);
  if (!estateIds.length) {
    return NextResponse.json({
      stats: { totalLatexKg: 0, activeWorkers: 0, pendingApprovals: 0, yoyPercent: 0 },
      byEstate: [],
      totalEstates: allEstates.length,
      inScopeEstates: 0,
    });
  }
  const ws = await db.select().from(workers).where(inArray(workers.estateId, estateIds));
  const workerEstate = new Map(ws.map((w) => [w.id, w.estateId]));
  const workerIds = ws.map((w) => w.id);
  const cols = workerIds.length ? await db.select().from(collections).where(inArray(collections.workerId, workerIds)) : [];
  const atts = workerIds.length ? await db.select().from(attendance).where(inArray(attendance.workerId, workerIds)) : [];

  let curLatex = 0, priorLatex = 0;
  const perEstate = new Map<number, { current: number; prior: number }>();
  for (const id of estateIds) perEstate.set(id, { current: 0, prior: 0 });
  for (const c of cols) {
    const kg = Number(c.latexKg);
    const eid = workerEstate.get(c.workerId);
    if (eid === undefined) continue;
    const isCurrent = c.day >= '2026-01-01';
    if (isCurrent) { curLatex += kg; perEstate.get(eid)!.current += kg; }
    else { priorLatex += kg; perEstate.get(eid)!.prior += kg; }
  }
  const pending = atts.filter((a) => a.status === 'Pending').length;
  const yoy = priorLatex ? ((curLatex - priorLatex) / priorLatex) * 100 : 0;

  return NextResponse.json({
    stats: {
      totalLatexKg: Math.round(curLatex),
      activeWorkers: ws.filter((w) => w.active).length,
      pendingApprovals: pending,
      yoyPercent: Math.round(yoy * 10) / 10,
    },
    byEstate: estateIds.map((id) => ({
      estate: estateById.get(id)!.name,
      current: Math.round(perEstate.get(id)!.current),
      prior: Math.round(perEstate.get(id)!.prior),
    })),
    totalEstates: allEstates.length,
    inScopeEstates: estateIds.length,
  });
}
