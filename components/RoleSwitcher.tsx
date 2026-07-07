'use client';
import { ROLES, DEMO_SCOPE, type RoleId } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';

export function RoleSwitcher() {
  const { session, setSession } = useSession();
  if (!session) return null;
  return (
    <select value={session.role}
      onChange={e => { const role = e.target.value as RoleId; setSession({ role, scopeId: DEMO_SCOPE[role] }); }}
      aria-label="Switch role"
      className="max-w-full cursor-pointer rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--emerald)]">
      {ROLES.map(r => <option key={r.id} value={r.id} className="bg-white text-ink">{r.label}</option>)}
    </select>
  );
}
