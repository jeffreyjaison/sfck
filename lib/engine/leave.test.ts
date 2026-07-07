import { describe, it, expect } from 'vitest';
import { medicalLeavePayable, annualLeaveAccrued, isLeaveEligible } from './leave';

describe('medicalLeavePayable', () => {
  it('caps medical leave at 14 days/year and pays two-thirds daily wage', () => {
    expect(medicalLeavePayable({ requestedDays: 5, takenThisYear: 0, dailyWage: 300 }))
      .toEqual({ paidDays: 5, amount: 1000 });
  });
  it('does not pay beyond the 14-day annual cap', () => {
    expect(medicalLeavePayable({ requestedDays: 5, takenThisYear: 12, dailyWage: 300 }))
      .toEqual({ paidDays: 2, amount: 400 });
  });
});

describe('annualLeaveAccrued', () => {
  it('accrues one day per 20 working days', () => {
    expect(annualLeaveAccrued(60)).toBe(3);
    expect(annualLeaveAccrued(59)).toBe(2);
  });
});

describe('isLeaveEligible', () => {
  it('restricts leave eligibility to Permanent employees', () => {
    expect(isLeaveEligible('Permanent')).toBe(true);
    expect(isLeaveEligible('Casual')).toBe(false);
    expect(isLeaveEligible('Dependent')).toBe(false);
  });
});
