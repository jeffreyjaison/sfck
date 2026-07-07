import { NextResponse } from 'next/server';
import { sessionFromRequest } from '@/lib/api-session';
import { estatesForSession, workersForSession } from '@/lib/db/queries';
import { db } from '@/lib/db/client';
import { collections, settings, payrollRuns, payrollLines, workers } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { blockIncentive, statutoryDeductions, permanentAllowances, netPay, type Category } from '@/lib/engine/wages';
import { round2 } from '@/lib/engine/money';

export const dynamic = 'force-dynamic';

const PERIOD = { start: '2026-06-21', end: '2026-07-20' };
const DAILY_WAGE = 400;
const WEIGHTAGE = 500;
const WASHING = 150;

export async function GET(req: Request) {
  const session = sessionFromRequest(req);

  const settingRows = await db.select().from(settings);
  const settingsMap = new Map(settingRows.map((s) => [s.key, s.value]));
  const workingDays = Number(settingsMap.get('working_days') ?? 26);
  const pfPercent = Number(settingsMap.get('pf_percent') ?? 12);

  const num = (k: string, d: number) => {
    const r = settingRows.find((s) => s.key === k);
    return r ? Number(r.value) : d;
  };
  const CLASS_SPEC = {
    II: { standardKg: num('block_II_target', 18), incentiveRate: num('block_II_rate', 12) },
    III: { standardKg: num('block_III_target', 15), incentiveRate: num('block_III_rate', 10) },
    IV: { standardKg: num('block_IV_target', 12), incentiveRate: num('block_IV_rate', 8) },
  };

  const workers = await workersForSession(session);
  const tappers = workers.filter((w) => w.type === 'Tapper');
  const tapperIds = tappers.map((w) => w.id);

  const cols = tapperIds.length
    ? await db.select().from(collections).where(inArray(collections.workerId, tapperIds))
    : [];
  const periodCols = cols.filter((c) => c.day >= PERIOD.start && c.day <= PERIOD.end);
  const colsByWorker = new Map<number, typeof periodCols>();
  for (const c of periodCols) {
    const list = colsByWorker.get(c.workerId) ?? [];
    list.push(c);
    colsByWorker.set(c.workerId, list);
  }

  // D4 tapping model: each tapper is assigned 4 blocks (positions A..D). Only one block
  // is tapped per day, rotating through a 4-day cycle (block index = day-sequence % 4).
  const D4_CLASSES = ['II', 'III', 'III', 'IV'] as const;
  const D4_LABELS = ['A', 'B', 'C', 'D'] as const;

  const lines = tappers.map((worker) => {
    const workerCols = (colsByWorker.get(worker.id) ?? [])
      .slice()
      .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
    const tappingDays = workerCols.length;
    const drcAvg = workerCols.length
      ? round2(workerCols.reduce((sum, c) => sum + Number(c.drc ?? 0), 0) / workerCols.length)
      : 0;

    // Assign each of the 4 blocks its class for this tapper, then attribute each
    // collection day (sorted ascending) to block index k % 4 of the 4-day cycle.
    const blockAgg = Array.from({ length: 4 }, (_, j) => {
      const blockClassVal = D4_CLASSES[(worker.id + j) % 4];
      return { produced: 0, daysTapped: 0, blockClass: blockClassVal };
    });
    workerCols.forEach((c, k) => {
      const j = k % 4;
      const dry = Number(c.latexKg) * Number(c.drc ?? 0);
      blockAgg[j].produced += dry;
      blockAgg[j].daysTapped += 1;
    });

    const d4Blocks = blockAgg.map((b, j) => {
      const spec = CLASS_SPEC[b.blockClass];
      const producedKg = round2(b.produced);
      const standardKg = round2(spec.standardKg * b.daysTapped);
      const incentive = blockIncentive({ producedKg, standardKg, incentiveRate: spec.incentiveRate });
      return {
        label: `Block ${D4_LABELS[j]}`,
        blockClass: b.blockClass,
        daysTapped: b.daysTapped,
        producedKg,
        standardKg,
        incentive,
      };
    });

    const producedKg = round2(d4Blocks.reduce((sum, b) => sum + b.producedKg, 0));
    const incentive = round2(d4Blocks.reduce((sum, b) => sum + b.incentive, 0));
    const blockClassSummary = d4Blocks.map((b) => b.blockClass).join('·');

    const gross = DAILY_WAGE * workingDays;
    const category = worker.category as Category;
    const pf = statutoryDeductions({ category, gross, pfPercent }).pf;
    const allow = permanentAllowances({ category, weightage: WEIGHTAGE, washing: WASHING });
    const other = 0;
    const net = netPay({ gross, incentive, weightage: allow.weightage, washing: allow.washing, pf, other });

    return {
      workerId: worker.id,
      checkRoll: worker.checkRoll,
      name: worker.name,
      category: worker.category,
      blockClass: blockClassSummary,
      d4Blocks,
      tappingDays,
      producedKg,
      drcAvg,
      gross,
      incentive,
      weightage: allow.weightage,
      washing: allow.washing,
      pf,
      other,
      net,
    };
  });

  return NextResponse.json({ period: PERIOD, workingDays, pfPercent, dailyWage: DAILY_WAGE, lines });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const action = body?.action;

  if (action === 'finalize') {
    const session = sessionFromRequest(req);
    const lines = Array.isArray(body?.lines) ? body.lines : [];

    const estates = await estatesForSession(session);
    const estateId = estates[0]?.id;
    if (!estateId) {
      return NextResponse.json({ error: 'No estate in scope' }, { status: 400 });
    }

    const settingRows = await db.select().from(settings);
    const settingsMap = new Map(settingRows.map((s) => [s.key, s.value]));
    const workingDays = Number(settingsMap.get('working_days') ?? 26);
    const pfPercent = Number(settingsMap.get('pf_percent') ?? 12);

    const [run] = await db
      .insert(payrollRuns)
      .values({ estateId, periodStart: PERIOD.start, periodEnd: PERIOD.end, workingDays, status: 'Finalized' })
      .returning({ id: payrollRuns.id });

    if (lines.length) {
      const workerIds = lines.map((l: { workerId: number }) => Number(l.workerId)).filter(Boolean);
      const workerRows = workerIds.length
        ? await db.select().from(workers).where(inArray(workers.id, workerIds))
        : [];
      const categoryByWorker = new Map(workerRows.map((w) => [w.id, w.category as Category]));

      await db.insert(payrollLines).values(
        lines.map((l: { workerId: number; gross: number; incentive: number; weightage: number; washing: number; pf: number; other: number; net: number }) => {
          const category = categoryByWorker.get(l.workerId);
          const gross = Number(l.gross);
          const pf = category
            ? statutoryDeductions({ category, gross, pfPercent }).pf
            : 0;
          const other = Number(l.other);
          const net = netPay({
            gross,
            incentive: Number(l.incentive),
            weightage: Number(l.weightage),
            washing: Number(l.washing),
            pf,
            other,
          });
          return {
            runId: run.id,
            workerId: l.workerId,
            grossWage: String(gross),
            incentive: String(l.incentive),
            weightage: String(l.weightage),
            washing: String(l.washing),
            pf: String(pf),
            otherRecovery: String(other),
            netPay: String(net),
          };
        }),
      );
    }

    return NextResponse.json({ ok: true, runId: run.id, count: lines.length });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
