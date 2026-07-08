import { describe, it, expect } from 'vitest';
import { canManageSettings, canFinalizePayroll } from './authz';

describe('canManageSettings', () => {
  it('allows the Assistant Manager (settings is an estate-admin task)', () => {
    expect(canManageSettings('am')).toBe(true);
  });
  it('allows the MD/GM (corporation-wide authority)', () => {
    expect(canManageSettings('md')).toBe(true);
  });
  it('denies cc, fo and em', () => {
    expect(canManageSettings('cc')).toBe(false);
    expect(canManageSettings('fo')).toBe(false);
    expect(canManageSettings('em')).toBe(false);
  });
});

describe('canFinalizePayroll', () => {
  it('allows am, em and md (the roles with payroll in their nav)', () => {
    expect(canFinalizePayroll('am')).toBe(true);
    expect(canFinalizePayroll('em')).toBe(true);
    expect(canFinalizePayroll('md')).toBe(true);
  });
  it('denies cc and fo', () => {
    expect(canFinalizePayroll('cc')).toBe(false);
    expect(canFinalizePayroll('fo')).toBe(false);
  });
});
