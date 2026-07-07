import type { Category } from './wages';

const MEDICAL_CAP = 14;

export function medicalLeavePayable(
  { requestedDays, takenThisYear, dailyWage }:
  { requestedDays: number; takenThisYear: number; dailyWage: number },
): { paidDays: number; amount: number } {
  const remaining = Math.max(0, MEDICAL_CAP - takenThisYear);
  const paidDays = Math.min(requestedDays, remaining);
  return { paidDays, amount: paidDays * ((dailyWage * 2) / 3) };
}

export function annualLeaveAccrued(workingDays: number): number {
  return Math.floor(workingDays / 20);
}

export function isLeaveEligible(category: Category): boolean {
  return category === 'Permanent';
}
