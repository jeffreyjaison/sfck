import { describe, it, expect } from 'vitest';
import { computePayrollLine, type PayrollConfig } from './payroll';

const CONFIG: PayrollConfig = {
  workingDays: 26,
  pfPercent: 12,
  dailyWage: 400,
  weightage: 500,
  washing: 150,
  classSpec: {
    II: { standardKg: 18, incentiveRate: 12 },
    III: { standardKg: 15, incentiveRate: 10 },
    IV: { standardKg: 12, incentiveRate: 8 },
  },
};

// worker.id 0 → D4 block classes for positions A..D are exactly ['II','III','III','IV'].
const worker = (over: Partial<{ id: number; category: 'Permanent' | 'Casual' | 'Dependent' }> = {}) => ({
  id: over.id ?? 0,
  checkRoll: 'CR-1',
  name: 'Tapper One',
  category: over.category ?? ('Permanent' as const),
});

const col = (day: string, latexKg: number, drc: number | null) => ({ day, latexKg, drc });

describe('computePayrollLine — server-side wage computation', () => {
  it('computes gross as dailyWage × workingDays regardless of client input', () => {
    const line = computePayrollLine({ worker: worker(), collections: [], config: CONFIG });
    expect(line.gross).toBe(400 * 26);
  });

  it('recomputes PF from category and gross (Permanent: 12%)', () => {
    const line = computePayrollLine({ worker: worker(), collections: [], config: CONFIG });
    expect(line.pf).toBe((400 * 26 * 12) / 100);
  });

  it('gives zero PF and zero allowances to Dependent workers', () => {
    const line = computePayrollLine({ worker: worker({ category: 'Dependent' }), collections: [], config: CONFIG });
    expect(line.pf).toBe(0);
    expect(line.weightage).toBe(0);
    expect(line.washing).toBe(0);
  });

  it('excludes null-DRC collections from the DRC average instead of counting them as 0', () => {
    const line = computePayrollLine({
      worker: worker(),
      collections: [col('2026-07-01', 20, 0.5), col('2026-07-02', 20, null)],
      config: CONFIG,
    });
    expect(line.drcAvg).toBeCloseTo(0.5, 5); // was 0.25 with the null-as-zero bug
  });

  it('returns drcAvg 0 when the tapper has no collections', () => {
    const line = computePayrollLine({ worker: worker(), collections: [], config: CONFIG });
    expect(line.drcAvg).toBe(0);
    expect(line.tappingDays).toBe(0);
  });

  it('attributes sorted collection days to D4 blocks and pays block incentive above standard', () => {
    // Day 1 → Block A (class II, standard 18/day). 60kg × 0.5 DRC = 30 dry kg → 12 over → ₹144.
    const line = computePayrollLine({
      worker: worker(),
      collections: [col('2026-07-01', 60, 0.5)],
      config: CONFIG,
    });
    expect(line.tappingDays).toBe(1);
    expect(line.producedKg).toBeCloseTo(30, 2);
    expect(line.incentive).toBeCloseTo((30 - 18) * 12, 2);
    expect(line.d4Blocks[0].daysTapped).toBe(1);
    expect(line.d4Blocks[1].daysTapped).toBe(0);
  });

  it('honors a client "other recovery" amount in net pay', () => {
    const base = computePayrollLine({ worker: worker(), collections: [], config: CONFIG });
    const withOther = computePayrollLine({ worker: worker(), collections: [], config: CONFIG, other: 100 });
    expect(withOther.other).toBe(100);
    expect(withOther.net).toBeCloseTo(base.net - 100, 2);
  });

  it('clamps negative or non-finite "other recovery" to 0 (cannot inflate net pay)', () => {
    const neg = computePayrollLine({ worker: worker(), collections: [], config: CONFIG, other: -500 });
    const nan = computePayrollLine({ worker: worker(), collections: [], config: CONFIG, other: NaN });
    expect(neg.other).toBe(0);
    expect(nan.other).toBe(0);
  });
});
