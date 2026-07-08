import { describe, it, expect } from 'vitest';
import { sessionFromRequest } from './api-session';

const req = (qs: string) => new Request(`http://localhost/api/x${qs}`);

describe('sessionFromRequest', () => {
  it('uses the role and scopeId from the query string', () => {
    expect(sessionFromRequest(req('?role=am&scopeId=2'))).toEqual({ role: 'am', scopeId: 2 });
  });
  it('defaults to the LEAST-privileged role (cc) when no role is supplied', () => {
    expect(sessionFromRequest(req('')).role).toBe('cc');
  });
  it('defaults to an unknown role falling back to cc (no privilege escalation via garbage)', () => {
    expect(sessionFromRequest(req('?role=superadmin')).role).toBe('cc');
  });
  it('returns scopeId null when the param is missing or empty', () => {
    expect(sessionFromRequest(req('?role=md')).scopeId).toBeNull();
    expect(sessionFromRequest(req('?role=md&scopeId=')).scopeId).toBeNull();
  });
  it('returns scopeId null (not NaN) for a non-numeric scopeId', () => {
    expect(sessionFromRequest(req('?role=am&scopeId=abc')).scopeId).toBeNull();
  });
});
