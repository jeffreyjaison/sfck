import { blockIncentive, statutoryDeductions, permanentAllowances, netPay, type Category } from './wages';

export type { Category };
import { round2 } from './money';
import { averageDrc } from './drc';

// D4 tapping model: each tapper is assigned 4 blocks (positions A..D). Only one block
// is tapped per day, rotating through a 4-day cycle (block index = day-sequence % 4).
export const D4_CLASSES = ['II', 'III', 'III', 'IV'] as const;
export const D4_LABELS = ['A', 'B', 'C', 'D'] as const;

export type BlockClass = 'II' | 'III' | 'IV';

export interface PayrollConfig {
  workingDays: number;
  pfPercent: number;
  dailyWage: number;
  weightage: number;
  washing: number;
  classSpec: Record<BlockClass, { standardKg: number; incentiveRate: number }>;
}

export interface PayrollWorker {
  id: number;
  checkRoll: string;
  name: string;
  category: Category;
}

export interface PayrollCollection {
  day: string;
  latexKg: number;
  drc: number | null;
}

// Server-side wage computation for one tapper. Everything is derived from the
// worker row, their collections and the settings-backed config — the ONLY
// client-controllable input is `other` (other recovery), clamped to >= 0.
export function computePayrollLine({
  worker,
  collections,
  config,
  other = 0,
}: {
  worker: PayrollWorker;
  collections: PayrollCollection[];
  config: PayrollConfig;
  other?: number;
}) {
  const cols = collections
    .slice()
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
  const tappingDays = cols.length;
  const drcAvg = round2(averageDrc(cols.map((c) => c.drc)));

  // Assign each of the 4 blocks its class for this tapper, then attribute each
  // collection day (sorted ascending) to block index k % 4 of the 4-day cycle.
  const blockAgg = Array.from({ length: 4 }, (_, j) => ({
    produced: 0,
    daysTapped: 0,
    blockClass: D4_CLASSES[(worker.id + j) % 4] as BlockClass,
  }));
  cols.forEach((c, k) => {
    const j = k % 4;
    blockAgg[j].produced += c.latexKg * (c.drc ?? 0);
    blockAgg[j].daysTapped += 1;
  });

  const d4Blocks = blockAgg.map((b, j) => {
    const spec = config.classSpec[b.blockClass];
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

  const gross = config.dailyWage * config.workingDays;
  const pf = statutoryDeductions({ category: worker.category, gross, pfPercent: config.pfPercent }).pf;
  const allow = permanentAllowances({ category: worker.category, weightage: config.weightage, washing: config.washing });
  const otherSafe = Number.isFinite(other) && other > 0 ? round2(other) : 0;
  const net = netPay({ gross, incentive, weightage: allow.weightage, washing: allow.washing, pf, other: otherSafe });

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
    other: otherSafe,
    net,
  };
}
