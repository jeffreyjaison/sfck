import { describe, it, expect } from 'vitest';
import { tapperAttendanceOutcome } from './attendance';

describe('tapperAttendanceOutcome', () => {
  it('auto-approves a tapper marked at or before 6:15', () => {
    expect(tapperAttendanceOutcome('06:10')).toBe('Approved');
  });
  it('requires AM approval between 6:15 and 6:30', () => {
    expect(tapperAttendanceOutcome('06:25')).toBe('Pending');
  });
  it('rejects a tapper after 6:30', () => {
    expect(tapperAttendanceOutcome('06:45')).toBe('Rejected');
  });
});
