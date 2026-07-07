import { describe, it, expect } from 'vitest';
import { ROLES, navFor, canAccessEstate } from './rbac';

describe('rbac', () => {
  it('defines all five roles', () => {
    expect(ROLES.map(r => r.id)).toEqual(['cc', 'fo', 'am', 'em', 'md']);
  });
  it('MD can access every estate', () => {
    expect(canAccessEstate({ role: 'md', scopeId: null }, 3)).toBe(true);
  });
  it('AM can access only their own estate', () => {
    expect(canAccessEstate({ role: 'am', scopeId: 1 }, 1)).toBe(true);
    expect(canAccessEstate({ role: 'am', scopeId: 1 }, 2)).toBe(false);
  });
  it('CC role sees only field + dashboard nav', () => {
    expect(navFor('cc').map(n => n.href)).toEqual(['/dashboard', '/field']);
  });
});
