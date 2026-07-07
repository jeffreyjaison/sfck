import { NextResponse } from 'next/server';
import { sessionFromRequest } from '@/lib/api-session';
import { estatesForSession, workersForSession } from '@/lib/db/queries';
import { db } from '@/lib/db/client';
import { collections, collectionCentres, divisions, groups } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type GroupBy = 'estate' | 'division' | 'cc' | 'group';

export async function GET(req: Request) {
  const session = sessionFromRequest(req);
  const url = new URL(req.url);
  const groupBy = (url.searchParams.get('groupBy') ?? 'estate') as GroupBy;

  const estates = await estatesForSession(session);
  const estateIds = estates.map((e) => e.id);
  const ws = await workersForSession(session);
  const workerIds = ws.map((w) => w.id);

  if (!estateIds.length || !workerIds.length) {
    return NextResponse.json({ groupBy, rows: [], totals: { current: 0, prior: 0, variancePct: 0 } });
  }

  const divs = await db.select().from(divisions).where(inArray(divisions.estateId, estateIds));
  const divIds = divs.map((d) => d.id);
  const ccs = divIds.length ? await db.select().from(collectionCentres).where(inArray(collectionCentres.divisionId, divIds)) : [];
  const allGroups = await db.select().from(groups);

  // Lookup maps
  const workerEstateId = new Map(ws.map((w) => [w.id, w.estateId]));
  const workerCcId = new Map(ws.map((w) => [w.id, w.ccId]));
  const ccInfo = new Map(ccs.map((c) => [c.id, { divisionId: c.divisionId, name: c.name }]));
  const divInfo = new Map(divs.map((d) => [d.id, { estateId: d.estateId, name: d.name }]));
  const estateInfo = new Map(estates.map((e) => [e.id, { groupId: e.groupId, name: e.name }]));
  const groupName = new Map(allGroups.map((g) => [g.id, g.name]));

  const cols = await db.select().from(collections).where(inArray(collections.workerId, workerIds));

  function bucketFor(workerId: number): { key: string; label: string } | null {
    const estateId = workerEstateId.get(workerId);
    if (estateId === undefined) return null;
    if (groupBy === 'estate') {
      const est = estateInfo.get(estateId);
      if (!est) return null;
      return { key: `estate-${estateId}`, label: est.name };
    }
    if (groupBy === 'group') {
      const est = estateInfo.get(estateId);
      if (!est) return null;
      const gName = groupName.get(est.groupId);
      if (!gName) return null;
      return { key: `group-${est.groupId}`, label: gName };
    }
    const ccId = workerCcId.get(workerId);
    if (ccId === null || ccId === undefined) return null;
    const cc = ccInfo.get(ccId);
    if (!cc) return null;
    if (groupBy === 'cc') {
      return { key: `cc-${ccId}`, label: cc.name };
    }
    // division
    const div = divInfo.get(cc.divisionId);
    if (!div) return null;
    return { key: `division-${cc.divisionId}`, label: div.name };
  }

  const buckets = new Map<string, { label: string; current: number; prior: number }>();

  for (const c of cols) {
    const bucket = bucketFor(c.workerId);
    if (!bucket) continue;
    const dry = Number(c.latexKg) * Number(c.drc ?? 0);
    const isCurrent = c.day >= '2026-01-01';
    let entry = buckets.get(bucket.key);
    if (!entry) {
      entry = { label: bucket.label, current: 0, prior: 0 };
      buckets.set(bucket.key, entry);
    }
    if (isCurrent) entry.current += dry;
    else entry.prior += dry;
  }

  const rows = Array.from(buckets.values())
    .map((b) => {
      const current = Math.round(b.current);
      const prior = Math.round(b.prior);
      const variancePct = prior > 0 ? Math.round(((current - prior) / prior) * 100 * 10) / 10 : 0;
      return { label: b.label, current, prior, variancePct };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  const totalCurrent = Math.round(rows.reduce((sum, r) => sum + r.current, 0));
  const totalPrior = Math.round(rows.reduce((sum, r) => sum + r.prior, 0));
  const totalVariancePct = totalPrior > 0 ? Math.round(((totalCurrent - totalPrior) / totalPrior) * 100 * 10) / 10 : 0;

  return NextResponse.json({
    groupBy,
    rows,
    totals: { current: totalCurrent, prior: totalPrior, variancePct: totalVariancePct },
  });
}
