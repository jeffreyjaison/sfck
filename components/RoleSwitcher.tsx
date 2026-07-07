'use client';
import { ROLES, DEMO_SCOPE, type RoleId } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';

export function RoleSwitcher() {
  const { session, setSession } = useSession();
  if (!session) return null;
  return (
    <select value={session.role}
      onChange={e => { const role = e.target.value as RoleId; setSession({ role, scopeId: DEMO_SCOPE[role] }); }}
      className="rounded-lg border px-2 py-1 text-sm">
      {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
    </select>
  );
}
