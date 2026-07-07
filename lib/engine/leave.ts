import type { Category } from './wages';
import { round2 } from './money';

const MEDICAL_CAP = 14;

export function medicalLeavePayable(
  { requestedDays, takenThisYear, dailyWage }:
  { requestedDays: number; takenThisYear: number; dailyWage: number },
): { paidDays: number; amount: number } {
  const requested = Math.max(0, requestedDays);
  const taken = Math.max(0, takenThisYear);
  const remaining = Math.max(0, MEDICAL_CAP - taken);
  const paidDays = Math.min(requested, remaining);
  return { paidDays, amount: round2(paidDays * ((dailyWage * 2) / 3)) };
}

export function annualLeaveAccrued(workingDays: number): number {
  return Math.floor(Math.max(0, workingDays) / 20);
}

export function isLeaveEligible(category: Category): boolean {
  return category === 'Permanent';
}
