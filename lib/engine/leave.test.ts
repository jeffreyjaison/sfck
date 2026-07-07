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
  it('pays nothing once the 14-day cap is fully used', () => {
    expect(medicalLeavePayable({ requestedDays: 5, takenThisYear: 14, dailyWage: 300 }))
      .toEqual({ paidDays: 0, amount: 0 });
  });
  it('rounds the paid amount to two decimals (paisa)', () => {
    expect(medicalLeavePayable({ requestedDays: 5, takenThisYear: 0, dailyWage: 250 }))
      .toEqual({ paidDays: 5, amount: 833.33 });
  });
});

describe('annualLeaveAccrued', () => {
  it('accrues one day per 20 working days', () => {
    expect(annualLeaveAccrued(60)).toBe(3);
    expect(annualLeaveAccrued(59)).toBe(2);
  });
  it('accrues the first day exactly at 20 working days and none at 19', () => {
    expect(annualLeaveAccrued(20)).toBe(1);
    expect(annualLeaveAccrued(19)).toBe(0);
  });
  it('clamps negative working days to 0', () => {
    expect(annualLeaveAccrued(-5)).toBe(0);
  });
});

describe('isLeaveEligible', () => {
  it('restricts leave eligibility to Permanent employees', () => {
    expect(isLeaveEligible('Permanent')).toBe(true);
    expect(isLeaveEligible('Casual')).toBe(false);
    expect(isLeaveEligible('Dependent')).toBe(false);
  });
});
