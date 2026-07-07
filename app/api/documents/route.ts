import { NextResponse } from 'next/server';
import { sessionFromRequest } from '@/lib/api-session';
import { estatesForSession, workersForSession, ccsForSession } from '@/lib/db/queries';
import { db } from '@/lib/db/client';
import { collections, attendance, replanting } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { round2 } from '@/lib/engine/money';

export const dynamic = 'force-dynamic';

const DAY = '2026-07-06';
const PERIOD_START = '2026-07-01';
const PERIOD_END = '2026-07-06';
const CURRENT_CUTOFF = '2026-01-01';
const BLOCK_CLASSES = ['II', 'III', 'IV'] as const;

type Column = { key: string; label: string };
type Row = Record<string, string | number>;

export async function GET(req: Request) {
  const session = sessionFromRequest(req);
  const url = new URL(req.url);
  const doc = url.searchParams.get('doc') ?? '';

  if (doc === 'payment-slip') {
    return NextResponse.json({ title: 'Payment Slip', special: 'payslip' });
  }
  if (doc === 'weight-slip') {
    return NextResponse.json({ title: 'Weight Slip', special: 'weightslip' });
  }

  const KNOWN_DOCS = [
    'daily-production',
    'pocket-check-roll',
    'muster-chit',
    'crop-book-1',
    'crop-book-2',
    'production-performance',
    'final-drc',
    'target-achievement',
  ];
  if (!KNOWN_DOCS.includes(doc)) {
    return NextResponse.json({ error: 'Unknown document' }, { status: 400 });
  }

  const estates = await estatesForSession(session);
  const estateIds = estates.map((e) => e.id);
  const estateName = new Map(estates.map((e) => [e.id, e.name]));

  const ws = await workersForSession(session);
  const workerIds = ws.map((w) => w.id);
  const workerById = new Map(ws.map((w) => [w.id, w]));

  const ccs = await ccsForSession(session);
  const ccIds = ccs.map((c) => c.id);
  const ccName = new Map(ccs.map((c) => [c.id, c.name]));

  const cols = workerIds.length
    ? await db.select().from(collections).where(inArray(collections.workerId, workerIds))
    : [];
  const att = workerIds.length
    ? await db.select().from(attendance).where(inArray(attendance.workerId, workerIds))
    : [];
  const repl = estateIds.length
    ? await db.select().from(replanting).where(inArray(replanting.estateId, estateIds))
    : [];

  let title = '';
  let subtitle: string | undefined;
  let columns: Column[] = [];
  let rows: Row[] = [];

  switch (doc) {
    case 'daily-production': {
      title = 'Daily Production Statement';
      subtitle = DAY;
      columns = [
        { key: 'cc', label: 'Collection Centre' },
        { key: 'latex', label: 'Latex (kg)' },
        { key: 'scrap', label: 'Scrap (kg)' },
        { key: 'drc', label: 'DRC' },
      ];
      const byCc = new Map(ccIds.map((id) => [id, { latex: 0, scrap: 0, drcSum: 0, drcCount: 0 }]));
      for (const c of cols) {
        if (c.day !== DAY) continue;
        const bucket = byCc.get(c.ccId);
        if (!bucket) continue;
        bucket.latex += Number(c.latexKg);
        bucket.scrap += Number(c.scrapKg);
        if (c.drc !== null) {
          bucket.drcSum += Number(c.drc);
          bucket.drcCount += 1;
        }
      }
      rows = ccIds.map((id) => {
        const b = byCc.get(id)!;
        return {
          cc: ccName.get(id) ?? '',
          latex: Math.round(b.latex),
          scrap: Math.round(b.scrap),
          drc: b.drcCount ? round2(b.drcSum / b.drcCount) : 0,
        };
      });
      break;
    }

    case 'pocket-check-roll': {
      title = 'Pocket Check Roll';
      columns = [
        { key: 'checkRoll', label: 'Check Roll' },
        { key: 'worker', label: 'Worker' },
        { key: 'category', label: 'Category' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
      ];
      const statusByWorker = new Map<number, string>();
      for (const a of att) {
        if (a.day === DAY) statusByWorker.set(a.workerId, a.status);
      }
      rows = ws.map((w) => ({
        checkRoll: w.checkRoll,
        worker: w.name,
        category: w.category,
        type: w.type,
        status: statusByWorker.get(w.id) ?? '—',
      }));
      break;
    }

    case 'muster-chit': {
      title = 'Muster Chit';
      subtitle = DAY;
      columns = [
        { key: 'cc', label: 'Collection Centre' },
        { key: 'present', label: 'Present' },
        { key: 'pending', label: 'Pending' },
        { key: 'excess', label: 'Excess' },
      ];
      const byCc = new Map(ccIds.map((id) => [id, { present: 0, pending: 0, excess: 0 }]));
      for (const a of att) {
        if (a.day !== DAY) continue;
        const w = workerById.get(a.workerId);
        const ccId = w?.ccId;
        if (ccId === null || ccId === undefined) continue;
        const bucket = byCc.get(ccId);
        if (!bucket) continue;
        if (a.status === 'Approved') bucket.present += 1;
        if (a.status === 'Pending') bucket.pending += 1;
        if (a.isExcess) bucket.excess += 1;
      }
      rows = ccIds.map((id) => {
        const b = byCc.get(id)!;
        return { cc: ccName.get(id) ?? '', present: b.present, pending: b.pending, excess: b.excess };
      });
      break;
    }

    case 'crop-book-1': {
      title = 'Crop Book — Part 1 (Production)';
      columns = [
        { key: 'cc', label: 'Collection Centre' },
        { key: 'blockClass', label: 'Block Class' },
        { key: 'latexKg', label: 'Latex (kg)' },
      ];
      const key = (ccId: number, bc: string) => `${ccId}-${bc}`;
      const sums = new Map<string, number>();
      for (const ccId of ccIds) {
        for (const bc of BLOCK_CLASSES) sums.set(key(ccId, bc), 0);
      }
      for (const c of cols) {
        if (c.day < PERIOD_START || c.day > PERIOD_END) continue;
        if (!sums.has(key(c.ccId, BLOCK_CLASSES[0]))) continue;
        const w = workerById.get(c.workerId);
        if (!w) continue;
        const bc = BLOCK_CLASSES[w.id % 3];
        const k = key(c.ccId, bc);
        sums.set(k, (sums.get(k) ?? 0) + Number(c.latexKg));
      }
      rows = [];
      for (const ccId of ccIds) {
        for (const bc of BLOCK_CLASSES) {
          rows.push({
            cc: ccName.get(ccId) ?? '',
            blockClass: bc,
            latexKg: round2(sums.get(key(ccId, bc)) ?? 0),
          });
        }
      }
      break;
    }

    case 'crop-book-2': {
      title = 'Crop Book — Part 2 (Yield)';
      columns = [
        { key: 'estate', label: 'Estate' },
        { key: 'block', label: 'Block' },
        { key: 'plantingYear', label: 'Planting Year' },
        { key: 'yieldKg', label: 'Yield (kg)' },
      ];
      rows = repl.map((r) => ({
        estate: estateName.get(r.estateId) ?? '',
        block: r.blockCode,
        plantingYear: r.plantingYear,
        yieldKg: Number(r.yieldKg),
      }));
      break;
    }

    case 'production-performance':
    case 'target-achievement': {
      const buckets = new Map<number, { current: number; prior: number }>();
      for (const id of estateIds) buckets.set(id, { current: 0, prior: 0 });
      for (const c of cols) {
        const w = workerById.get(c.workerId);
        if (!w) continue;
        const bucket = buckets.get(w.estateId);
        if (!bucket) continue;
        const dry = Number(c.latexKg) * Number(c.drc ?? 0);
        if (c.day >= CURRENT_CUTOFF) bucket.current += dry;
        else bucket.prior += dry;
      }

      if (doc === 'production-performance') {
        title = 'Production Performance of Estates';
        columns = [
          { key: 'estate', label: 'Estate' },
          { key: 'current', label: 'Current Year (kg)' },
          { key: 'prior', label: 'Prior Year (kg)' },
          { key: 'variancePct', label: 'Variance %' },
        ];
        rows = estateIds
          .map((id) => {
            const b = buckets.get(id)!;
            const current = Math.round(b.current);
            const prior = Math.round(b.prior);
            const variancePct = prior > 0 ? Math.round(((current - prior) / prior) * 100 * 10) / 10 : 0;
            return { estate: estateName.get(id) ?? '', current, prior, variancePct };
          })
          .sort((a, b) => a.estate.localeCompare(b.estate));
      } else {
        title = 'Daily Target & Achievement';
        columns = [
          { key: 'estate', label: 'Estate' },
          { key: 'target', label: 'Target (kg)' },
          { key: 'achieved', label: 'Achieved (kg)' },
          { key: 'pct', label: 'Achievement %' },
        ];
        rows = estateIds
          .map((id) => {
            const b = buckets.get(id)!;
            const achieved = Math.round(b.current);
            const target = Math.round(b.prior);
            const pct = target > 0 ? Math.round((achieved / target) * 100) : 0;
            return { estate: estateName.get(id) ?? '', target, achieved, pct };
          })
          .sort((a, b) => a.estate.localeCompare(b.estate));
      }
      break;
    }

    case 'final-drc': {
      title = 'Final DRC Values';
      columns = [
        { key: 'cc', label: 'Collection Centre' },
        { key: 'finalDrc', label: 'Final DRC' },
      ];
      const byCc = new Map(ccIds.map((id) => [id, { sum: 0, count: 0 }]));
      for (const c of cols) {
        if (c.day < PERIOD_START || c.day > PERIOD_END) continue;
        const bucket = byCc.get(c.ccId);
        if (!bucket || c.drc === null) continue;
        bucket.sum += Number(c.drc);
        bucket.count += 1;
      }
      rows = ccIds.map((id) => {
        const b = byCc.get(id)!;
        return { cc: ccName.get(id) ?? '', finalDrc: b.count ? round2(b.sum / b.count) : 0 };
      });
      break;
    }

    default:
      return NextResponse.json({ error: 'Unknown document' }, { status: 400 });
  }

  return NextResponse.json({ title, subtitle, columns, rows });
}
