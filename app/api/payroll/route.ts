import { NextResponse } from 'next/server';
import { sessionFromRequest } from '@/lib/api-session';
import { canFinalizePayroll } from '@/lib/authz';
import { estatesForSession, workersForSession } from '@/lib/db/queries';
import { db } from '@/lib/db/client';
import { collections, settings, payrollRuns, payrollLines } from '@/lib/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { computePayrollLine, type PayrollConfig, type Category } from '@/lib/engine/payroll';

export const dynamic = 'force-dynamic';

const PERIOD = { start: '2026-06-21', end: '2026-07-20' };
const DAILY_WAGE = 400;
const WEIGHTAGE = 500;
const WASHING = 150;

function configFromSettings(rows: { key: string; value: string }[]): PayrollConfig {
  const map = new Map(rows.map((s) => [s.key, s.value]));
  const num = (k: string, d: number) => {
    const v = map.get(k);
    return v !== undefined ? Number(v) : d;
  };
  return {
    workingDays: num('working_days', 26),
    pfPercent: num('pf_percent', 12),
    dailyWage: DAILY_WAGE,
    weightage: WEIGHTAGE,
    washing: WASHING,
    classSpec: {
      II: { standardKg: num('block_II_target', 18), incentiveRate: num('block_II_rate', 12) },
      III: { standardKg: num('block_III_target', 15), incentiveRate: num('block_III_rate', 10) },
      IV: { standardKg: num('block_IV_target', 12), incentiveRate: num('block_IV_rate', 8) },
    },
  };
}

// Compute all payroll lines for the session's scope entirely from the DB.
// `otherByWorker` (other recovery) is the only client-controllable input.
async function computeScopedLines(
  session: ReturnType<typeof sessionFromRequest>,
  config: PayrollConfig,
  otherByWorker?: Map<number, number>,
) {
  const ws = await workersForSession(session);
  const tappers = ws.filter((w) => w.type === 'Tapper');
  const tapperIds = tappers.map((w) => w.id);

  const cols = tapperIds.length
    ? await db.select().from(collections).where(inArray(collections.workerId, tapperIds))
    : [];
  const periodCols = cols.filter((c) => c.day >= PERIOD.start && c.day <= PERIOD.end);
  const colsByWorker = new Map<number, { day: string; latexKg: number; drc: number | null }[]>();
  for (const c of periodCols) {
    const list = colsByWorker.get(c.workerId) ?? [];
    list.push({ day: c.day, latexKg: Number(c.latexKg), drc: c.drc === null ? null : Number(c.drc) });
    colsByWorker.set(c.workerId, list);
  }

  return tappers.map((worker) =>
    computePayrollLine({
      worker: { id: worker.id, checkRoll: worker.checkRoll, name: worker.name, category: worker.category as Category },
      collections: colsByWorker.get(worker.id) ?? [],
      config,
      other: otherByWorker?.get(worker.id) ?? 0,
    }),
  );
}

export async function GET(req: Request) {
  const session = sessionFromRequest(req);
  const settingRows = await db.select().from(settings);
  const config = configFromSettings(settingRows);
  const lines = await computeScopedLines(session, config);
  return NextResponse.json({
    period: PERIOD,
    workingDays: config.workingDays,
    pfPercent: config.pfPercent,
    dailyWage: config.dailyWage,
    lines,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const action = body?.action;

  if (action === 'finalize') {
    const session = sessionFromRequest(req);
    if (!canFinalizePayroll(session.role)) {
      return NextResponse.json({ error: 'Not authorized to finalize payroll' }, { status: 403 });
    }

    const estates = await estatesForSession(session);
    const estateId = estates[0]?.id;
    if (!estateId) {
      return NextResponse.json({ error: 'No estate in scope' }, { status: 400 });
    }

    // Idempotency: one finalized run per estate/period.
    const [existing] = await db
      .select({ id: payrollRuns.id })
      .from(payrollRuns)
      .where(
        and(
          eq(payrollRuns.estateId, estateId),
          eq(payrollRuns.periodStart, PERIOD.start),
          eq(payrollRuns.periodEnd, PERIOD.end),
          eq(payrollRuns.status, 'Finalized'),
        ),
      );
    if (existing) {
      return NextResponse.json(
        { error: `Payroll already finalized for this period (run #${existing.id})` },
        { status: 409 },
      );
    }

    // The only client input honored is "other recovery" per worker; every wage
    // figure is recomputed server-side from collections + settings.
    const otherByWorker = new Map<number, number>(
      Array.isArray(body?.lines)
        ? body.lines.map((l: { workerId: number; other: number }) => [Number(l.workerId), Number(l.other)])
        : [],
    );

    const settingRows = await db.select().from(settings);
    const config = configFromSettings(settingRows);
    const lines = await computeScopedLines(session, config, otherByWorker);

    // No interactive transactions on neon-http: insert as Draft first and flip to
    // Finalized only after the lines land, so a failed line insert can never
    // leave a finalized run without lines.
    const [run] = await db
      .insert(payrollRuns)
      .values({ estateId, periodStart: PERIOD.start, periodEnd: PERIOD.end, workingDays: config.workingDays, status: 'Draft' })
      .returning({ id: payrollRuns.id });

    if (lines.length) {
      await db.insert(payrollLines).values(
        lines.map((l) => ({
          runId: run.id,
          workerId: l.workerId,
          grossWage: String(l.gross),
          incentive: String(l.incentive),
          weightage: String(l.weightage),
          washing: String(l.washing),
          pf: String(l.pf),
          otherRecovery: String(l.other),
          netPay: String(l.net),
        })),
      );
    }

    await db.update(payrollRuns).set({ status: 'Finalized' }).where(eq(payrollRuns.id, run.id));

    return NextResponse.json({ ok: true, runId: run.id, count: lines.length });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
