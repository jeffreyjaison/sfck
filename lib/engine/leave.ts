import type { Category } from './wages';
import { round2 } from './money';

const MEDICAL_CAP = 14;

export function medicalLeavePayable(
  { requestedDays, takenThisYear, dailyWage, cap = MEDICAL_CAP, holidaysInPeriod = 0 }:
  { requestedDays: number; takenThisYear: number; dailyWage: number; cap?: number; holidaysInPeriod?: number },
): { paidDays: number; amount: number } {
  const requested = Math.max(0, requestedDays);
  const taken = Math.max(0, takenThisYear);
  const remaining = Math.max(0, cap - taken);
  const cappedDays = Math.min(requested, remaining);
  const paidDays = Math.max(0, cappedDays - Math.max(0, holidaysInPeriod));
  return { paidDays, amount: round2(paidDays * ((dailyWage * 2) / 3)) };
}

export function annualLeaveAccrued(workingDays: number): number {
  return Math.floor(Math.max(0, workingDays) / 20);
}

export function isLeaveEligible(category: Category): boolean {
  return category === 'Permanent';
}
