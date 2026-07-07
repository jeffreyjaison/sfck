export type Category = 'Dependent' | 'Casual' | 'Permanent';

export function blockIncentive(
  { producedKg, standardKg, incentiveRate }: { producedKg: number; standardKg: number; incentiveRate: number },
): number {
  const over = Math.max(0, producedKg - standardKg);
  return over * incentiveRate;
}

export function statutoryDeductions(
  { category, gross, pfPercent }: { category: Category; gross: number; pfPercent: number },
): { pf: number } {
  const pfEligible = category === 'Permanent' || category === 'Casual';
  return { pf: pfEligible ? (gross * pfPercent) / 100 : 0 };
}

export function permanentAllowances(
  { category, weightage, washing }: { category: Category; weightage: number; washing: number },
): { weightage: number; washing: number } {
  return category === 'Permanent' ? { weightage, washing } : { weightage: 0, washing: 0 };
}

export function netPay(
  { gross, incentive, weightage, washing, pf, other }:
  { gross: number; incentive: number; weightage: number; washing: number; pf: number; other: number },
): number {
  return gross + incentive + weightage + washing - pf - other;
}
