import { round2 } from './money';

export type Category = 'Dependent' | 'Casual' | 'Permanent';

export function blockIncentive(
  { producedKg, standardKg, incentiveRate }: { producedKg: number; standardKg: number; incentiveRate: number },
): number {
  const over = Math.max(0, producedKg - standardKg);
  return round2(over * incentiveRate);
}

export function statutoryDeductions(
  { category, gross, pfPercent }: { category: Category; gross: number; pfPercent: number },
): { pf: number } {
  const pfEligible = category === 'Permanent' || category === 'Casual';
  return { pf: round2(pfEligible ? (gross * pfPercent) / 100 : 0) };
}

// Weightage & Washing Allowance apply to Permanent only.
export function permanentAllowances(
  { category, weightage, washing }: { category: Category; weightage: number; washing: number },
): { weightage: number; washing: number } {
  return category === 'Permanent' ? { weightage, washing } : { weightage: 0, washing: 0 };
}

export function netPay(
  { gross, incentive, weightage, washing, pf, other }:
  { gross: number; incentive: number; weightage: number; washing: number; pf: number; other: number },
): number {
  return round2(gross + incentive + weightage + washing - pf - other);
}
