import { describe, it, expect } from 'vitest';
import { blockIncentive, statutoryDeductions, permanentAllowances, netPay } from './wages';

describe('blockIncentive', () => {
  it('pays incentive only on kg above the block-class standard target', () => {
    expect(blockIncentive({ producedKg: 18, standardKg: 15, incentiveRate: 10 })).toBe(30);
  });
  it('returns 0 when production is at or below the standard target', () => {
    expect(blockIncentive({ producedKg: 12, standardKg: 15, incentiveRate: 10 })).toBe(0);
  });
  it('returns 0 exactly at the target (producedKg === standardKg)', () => {
    expect(blockIncentive({ producedKg: 15, standardKg: 15, incentiveRate: 10 })).toBe(0);
  });
});

describe('permanentAllowances', () => {
  it('passes weightage/washing through unchanged for Permanent', () => {
    expect(permanentAllowances({ category: 'Permanent', weightage: 50, washing: 20 }))
      .toEqual({ weightage: 50, washing: 20 });
  });
  it('zeroes both allowances for Casual', () => {
    expect(permanentAllowances({ category: 'Casual', weightage: 50, washing: 20 }))
      .toEqual({ weightage: 0, washing: 0 });
  });
  it('zeroes both allowances for Dependent', () => {
    expect(permanentAllowances({ category: 'Dependent', weightage: 50, washing: 20 }))
      .toEqual({ weightage: 0, washing: 0 });
  });
});

describe('statutoryDeductions', () => {
  it('applies 12% PF for Permanent tappers', () => {
    expect(statutoryDeductions({ category: 'Permanent', gross: 1000, pfPercent: 12 }).pf).toBe(120);
  });
  it('applies PF for Casual too', () => {
    expect(statutoryDeductions({ category: 'Casual', gross: 1000, pfPercent: 12 }).pf).toBe(120);
  });
  it('excludes PF for Dependent workers', () => {
    expect(statutoryDeductions({ category: 'Dependent', gross: 1000, pfPercent: 12 }).pf).toBe(0);
  });
});

describe('netPay', () => {
  it('adds earnings then subtracts recoveries', () => {
    expect(netPay({ gross: 1000, incentive: 30, weightage: 50, washing: 20, pf: 120, other: 10 })).toBe(970);
  });
});
