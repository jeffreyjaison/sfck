import type { RoleId } from '@/lib/rbac';

// Write-action gates. Roles mirror NAV_BY_ROLE in lib/rbac.ts: settings is an
// estate-admin (am) screen, payroll is visible to am/em/md. md is included as
// the corporation-wide authority.
export function canManageSettings(role: RoleId): boolean {
  return role === 'am' || role === 'md';
}

export function canFinalizePayroll(role: RoleId): boolean {
  return role === 'am' || role === 'em' || role === 'md';
}
