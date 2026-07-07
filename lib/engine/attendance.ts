export type AttendanceOutcome = 'Approved' | 'Pending' | 'Rejected';

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Tapper cut-off 6:15; AM approval window 6:15–6:30; restricted thereafter. Assumes a well-formed HH:MM string.
export function tapperAttendanceOutcome(markedAt: string): AttendanceOutcome {
  const t = toMinutes(markedAt);
  if (t <= toMinutes('06:15')) return 'Approved';
  if (t <= toMinutes('06:30')) return 'Pending';
  return 'Rejected';
}
