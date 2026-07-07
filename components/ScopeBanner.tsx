'use client';
import { Bell } from 'lucide-react';
import { ROLES } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';
import { RoleSwitcher } from '@/components/RoleSwitcher';

export function ScopeBanner() {
  const { session } = useSession();
  if (!session) return null;
  const role = ROLES.find(r => r.id === session.role)!;
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div className="text-sm">
        <span className="font-medium text-slate-700">{role.label}</span>
        <span className="text-slate-400"> · {role.scope}</span>
        {role.id !== 'md' && (
          <span className="text-slate-300"> · jurisdiction-restricted</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">Demo data</span>
        <button type="button" aria-label="Notifications" className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-medium text-slate-400 sm:inline">Switch Role</span>
          <RoleSwitcher />
        </div>
      </div>
    </header>
  );
}
