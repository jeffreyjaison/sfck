export type RoleId = 'cc' | 'fo' | 'am' | 'em' | 'md';

export interface Session { role: RoleId; scopeId: number | null; }

export interface NavItem { href: string; label: string; }

const ALL_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/field', label: 'Field Capture' },
  { href: '/employees', label: 'Employees' },
  { href: '/attendance', label: 'Attendance' },
  { href: '/payroll', label: 'Payroll' },
  { href: '/leave', label: 'Leave' },
  { href: '/stock', label: 'Stock' },
  { href: '/replanting', label: 'Replanting' },
  { href: '/reports', label: 'Reports & MIS' },
  { href: '/settings', label: 'Settings' },
];

export const ROLES: { id: RoleId; label: string; scope: string }[] = [
  { id: 'cc', label: 'Collection Centre Worker', scope: 'Assigned CC' },
  { id: 'fo', label: 'Field Officer', scope: 'Their Divisions' },
  { id: 'am', label: 'Assistant Manager', scope: 'Whole Estate' },
  { id: 'em', label: 'Estate Manager', scope: 'Their Group' },
  { id: 'md', label: 'Managing Director / GM', scope: 'Corporation-wide' },
];

const NAV_BY_ROLE: Record<RoleId, string[]> = {
  cc: ['/dashboard', '/field'],
  fo: ['/dashboard', '/employees', '/attendance', '/reports'],
  am: ['/dashboard', '/employees', '/attendance', '/field', '/payroll', '/leave', '/stock', '/replanting', '/reports', '/settings'],
  em: ['/dashboard', '/employees', '/attendance', '/payroll', '/leave', '/stock', '/replanting', '/reports'],
  md: ['/dashboard', '/employees', '/attendance', '/payroll', '/leave', '/stock', '/replanting', '/reports'],
};

// NOTE: for role 'cc', scopeId identifies a collectionCentre id (id 1 = "CC Chi-11"),
// whereas for fo/am/em, scopeId identifies an estate id. 'md' is unscoped (null).
export const DEMO_SCOPE: Record<RoleId, number | null> = { cc: 1, fo: 1, am: 1, em: 1, md: null };

export function navFor(role: RoleId): NavItem[] {
  const allowed = new Set(NAV_BY_ROLE[role]);
  return ALL_NAV.filter(n => allowed.has(n.href));
}

export function canAccessEstate(session: Session, estateId: number): boolean {
  if (session.role === 'md') return true;
  return session.scopeId === estateId;
}
