import { NextResponse } from 'next/server';
import { sessionFromRequest } from '@/lib/api-session';
import { estatesForSession, ccsForSession, workersForSession } from '@/lib/db/queries';
import { db } from '@/lib/db/client';
import { stockItems, requisitions, collections } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = sessionFromRequest(req);
  const estates = await estatesForSession(session);
  const estateName = new Map(estates.map((e) => [e.id, e.name]));
  const estateIds = estates.map((e) => e.id);

  const ccs = await ccsForSession(session);
  const ccIds = ccs.map((c) => c.id);
  const ccName = new Map(ccs.map((c) => [c.id, c.name]));

  if (!estateIds.length) {
    return NextResponse.json({
      items: [],
      ccs: [],
      requisitions: [],
      consumption: { ammonia: 0, latexKg: 0, ammoniaPerTonne: 0 },
    });
  }

  const items = await db.select().from(stockItems).where(inArray(stockItems.estateId, estateIds));

  const reqs = ccIds.length
    ? await db.select().from(requisitions).where(inArray(requisitions.ccId, ccIds))
    : [];

  const workers = await workersForSession(session);
  const workerIds = workers.map((w) => w.id);
  const cols = workerIds.length
    ? await db.select().from(collections).where(inArray(collections.workerId, workerIds))
    : [];
  const latexKg = cols.reduce((sum, c) => sum + Number(c.latexKg), 0);
  const ammonia = items
    .filter((i) => i.name === 'Ammonia')
    .reduce((sum, i) => sum + Number(i.balance), 0);
  const ammoniaPerTonne = latexKg > 0 ? Math.round((ammonia / (latexKg / 1000)) * 10) / 10 : 0;

  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      estate: estateName.get(i.estateId) ?? '',
      name: i.name,
      unit: i.unit,
      balance: Number(i.balance),
    })),
    ccs: ccs.map((c) => ({ id: c.id, name: c.name })),
    requisitions: reqs.map((r) => ({
      id: r.id,
      cc: ccName.get(r.ccId) ?? '',
      item: r.item,
      qty: r.qty,
      status: r.status,
    })),
    consumption: { ammonia, latexKg, ammoniaPerTonne },
  });
}

export async function POST(req: Request) {
  const session = sessionFromRequest(req);
  const body = await req.json().catch(() => null);
  const action = body?.action;

  if (action === 'transfer') {
    const itemId = Number(body?.itemId);
    const qty = Number(body?.qty);
    if (!itemId || !Number.isFinite(qty)) {
      return NextResponse.json({ error: 'itemId and qty are required' }, { status: 400 });
    }
    const [item] = await db.select().from(stockItems).where(eq(stockItems.id, itemId));
    if (!item) {
      return NextResponse.json({ error: 'Unknown item' }, { status: 400 });
    }
    const estates = await estatesForSession(session);
    const estateIds = new Set(estates.map((e) => e.id));
    if (!estateIds.has(item.estateId)) {
      return NextResponse.json({ error: 'Out of jurisdiction' }, { status: 403 });
    }
    const newBalance = Math.max(0, Number(item.balance) - qty);
    await db.update(stockItems).set({ balance: newBalance.toString() }).where(eq(stockItems.id, itemId));
    return NextResponse.json({ ok: true });
  }

  if (action === 'requisition') {
    const ccId = Number(body?.ccId);
    const item = body?.item;
    const qty = Number(body?.qty);
    if (!ccId || typeof item !== 'string' || !item.trim() || !Number.isFinite(qty)) {
      return NextResponse.json({ error: 'ccId, item and qty are required' }, { status: 400 });
    }
    const ccs = await ccsForSession(session);
    const ccIds = new Set(ccs.map((c) => c.id));
    if (!ccIds.has(ccId)) {
      return NextResponse.json({ error: 'Out of jurisdiction' }, { status: 403 });
    }
    await db.insert(requisitions).values({ ccId, item, qty, status: 'Pending' });
    return NextResponse.json({ ok: true });
  }

  if (action === 'reqStatus') {
    const reqId = Number(body?.reqId);
    const status = body?.status;
    if (!reqId || (status !== 'Approved' && status !== 'Rejected')) {
      return NextResponse.json({ error: 'reqId and a valid status are required' }, { status: 400 });
    }
    const [reqRow] = await db.select().from(requisitions).where(eq(requisitions.id, reqId));
    if (!reqRow) {
      return NextResponse.json({ error: 'Out of jurisdiction' }, { status: 403 });
    }
    const ccs = await ccsForSession(session);
    const ccIds = new Set(ccs.map((c) => c.id));
    if (!ccIds.has(reqRow.ccId)) {
      return NextResponse.json({ error: 'Out of jurisdiction' }, { status: 403 });
    }
    await db.update(requisitions).set({ status }).where(eq(requisitions.id, reqId));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
