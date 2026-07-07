'use client';
import { ROLES } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';
import { RoleSwitcher } from '@/components/RoleSwitcher';

export function ScopeBanner() {
  const { session } = useSession();
  if (!session) return null;
  const role = ROLES.find(r => r.id === session.role)!;
  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-3">
      <div className="text-sm">
        <span className="font-medium text-slate-700">{role.label}</span>
        <span className="text-slate-400"> · {role.scope}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Demo data</span>
        <RoleSwitcher />
      </div>
    </header>
  );
}
