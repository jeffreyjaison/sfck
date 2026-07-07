import { NextResponse } from 'next/server';
import { sessionFromRequest } from '@/lib/api-session';
import { estatesForSession, workersForSession } from '@/lib/db/queries';
import { db } from '@/lib/db/client';
import { collections, attendance, estates as estatesTable } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { dailyTotals } from '@/lib/widgets/series';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = sessionFromRequest(req);
  const estates = await estatesForSession(session);
  const estateById = new Map(estates.map((e) => [e.id, e]));
  const estateIds = estates.map((e) => e.id);
  const allEstateRows = await db.select().from(estatesTable);
  const inScopeIds = new Set(estateIds);
  const allEstates = allEstateRows.map((e) => ({ id: e.id, name: e.name, inScope: inScopeIds.has(e.id) }));
  if (!estateIds.length) {
    return NextResponse.json({
      stats: { totalLatexKg: 0, activeWorkers: 0, pendingApprovals: 0, yoyPercent: 0 },
      byEstate: [],
      totalEstates: allEstateRows.length,
      inScopeEstates: 0,
      allEstates,
      dailySeries: [],
      categoryMix: { Permanent: 0, Casual: 0, Dependent: 0 },
      avgDrc: 0,
    });
  }
  const ws = await workersForSession(session);
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

  // Current-year collections only (dry-rubber = latexKg * drc).
  const curCols = cols.filter((c) => c.day >= '2026-01-01');
  const dailySeries = dailyTotals(
    curCols.map((c) => ({ day: c.day, kg: Number(c.latexKg) * Number(c.drc ?? 0) })),
  ).map((d) => Math.round(d.total));

  const categoryMix = { Permanent: 0, Casual: 0, Dependent: 0 };
  for (const w of ws) {
    if (w.category === 'Permanent') categoryMix.Permanent += 1;
    else if (w.category === 'Casual') categoryMix.Casual += 1;
    else if (w.category === 'Dependent') categoryMix.Dependent += 1;
  }

  const drcSum = curCols.reduce((acc, c) => acc + Number(c.drc ?? 0), 0);
  const avgDrc = curCols.length ? Math.round((drcSum / curCols.length) * 100 * 10) / 10 : 0;

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
    totalEstates: allEstateRows.length,
    inScopeEstates: estateIds.length,
    allEstates,
    dailySeries,
    categoryMix,
    avgDrc,
  });
}
