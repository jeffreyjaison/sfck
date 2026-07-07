import { NextResponse } from 'next/server';
import { sessionFromRequest } from '@/lib/api-session';
import { workersForSession, ccsForSession } from '@/lib/db/queries';
import { db } from '@/lib/db/client';
import { collections, workers, collectionCentres, auditLog } from '@/lib/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const DAY = '2026-07-07';

export async function GET(req: Request) {
  const session = sessionFromRequest(req);
  const allWorkers = await workersForSession(session);
  const tappers = allWorkers.filter((w) => w.type === 'Tapper');
  const ccs = await ccsForSession(session);

  const workerName = new Map(allWorkers.map((w) => [w.id, w.name]));
  const workerCheckRoll = new Map(allWorkers.map((w) => [w.id, w.checkRoll]));
  const ccName = new Map(ccs.map((c) => [c.id, c.name]));

  const workerIds = allWorkers.map((w) => w.id);
  const rows = workerIds.length
    ? await db
        .select()
        .from(collections)
        .where(inArray(collections.workerId, workerIds))
        .orderBy(desc(collections.id))
        .limit(10)
    : [];

  return NextResponse.json({
    workers: tappers.map((w) => ({ id: w.id, name: w.name, checkRoll: w.checkRoll, type: w.type, ccId: w.ccId })),
    ccs: ccs.map((c) => ({ id: c.id, name: c.name })),
    recent: rows.map((r) => ({
      id: r.id,
      worker: workerName.get(r.workerId) ?? '',
      checkRoll: workerCheckRoll.get(r.workerId) ?? '',
      cc: ccName.get(r.ccId) ?? '',
      day: r.day,
      latexKg: Number(r.latexKg),
      scrapKg: Number(r.scrapKg),
      drc: r.drc === null ? null : Number(r.drc),
      locked: r.locked,
    })),
  });
}

export async function POST(req: Request) {
  const session = sessionFromRequest(req);
  const body = await req.json().catch(() => null);
  const action = body?.action;

  if (action === 'capture') {
    const workerId = Number(body?.workerId);
    const ccId = Number(body?.ccId);
    const latexKg = Number(body?.latexKg);
    const scrapKg = Number(body?.scrapKg);
    const drc = body?.drc === undefined || body?.drc === null || body?.drc === '' ? null : Number(body.drc);
    if (!workerId || !ccId || !Number.isFinite(latexKg) || !Number.isFinite(scrapKg)) {
      return NextResponse.json({ error: 'workerId, ccId, latexKg and scrapKg are required' }, { status: 400 });
    }

    const [worker] = await db.select().from(workers).where(eq(workers.id, workerId));
    const [cc] = await db.select().from(collectionCentres).where(eq(collectionCentres.id, ccId));
    if (!worker || !cc) {
      return NextResponse.json({ error: 'Unknown worker or collection centre' }, { status: 400 });
    }

    const [inserted] = await db
      .insert(collections)
      .values({
        workerId,
        ccId,
        day: DAY,
        latexKg: latexKg.toString(),
        scrapKg: scrapKg.toString(),
        drc: drc === null ? null : drc.toString(),
        locked: true,
        slipSentSms: true,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      slip: {
        id: inserted.id,
        worker: worker.name,
        checkRoll: worker.checkRoll,
        cc: cc.name,
        day: inserted.day,
        latexKg,
        scrapKg,
        drc: drc ?? 0,
      },
    });
  }

  if (action === 'correctionRequest') {
    const collectionId = Number(body?.collectionId);
    if (!collectionId) {
      return NextResponse.json({ error: 'collectionId is required' }, { status: 400 });
    }
    await db.insert(auditLog).values({
      actorRole: session.role,
      action: 'correction-requested',
      entity: `collection:${collectionId}`,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'approveCorrection') {
    const collectionId = Number(body?.collectionId);
    if (!collectionId) {
      return NextResponse.json({ error: 'collectionId is required' }, { status: 400 });
    }
    const [collection] = await db.select().from(collections).where(eq(collections.id, collectionId));
    if (!collection) {
      return NextResponse.json({ error: 'Out of jurisdiction' }, { status: 403 });
    }
    const scopedWorkers = await workersForSession(session);
    const inScope = new Set(scopedWorkers.map((w) => w.id));
    if (!inScope.has(collection.workerId)) {
      return NextResponse.json({ error: 'Out of jurisdiction' }, { status: 403 });
    }
    await db.update(collections).set({ locked: false }).where(eq(collections.id, collectionId));
    await db.insert(auditLog).values({
      actorRole: session.role,
      action: 'correction-approved',
      entity: `collection:${collectionId}`,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
