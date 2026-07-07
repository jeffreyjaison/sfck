'use client';
import { ROLES, type RoleId } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';

const DEMO_SCOPE: Record<string, number | null> = { cc: 1, fo: 1, am: 1, em: 1, md: null };

export function RoleSwitcher() {
  const { session, setSession } = useSession();
  if (!session) return null;
  return (
    <select value={session.role}
      onChange={e => setSession({ role: e.target.value as RoleId, scopeId: DEMO_SCOPE[e.target.value] })}
      className="rounded-lg border px-2 py-1 text-sm">
      {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
    </select>
  );
}
