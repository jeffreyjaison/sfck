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
    <header className="flex items-center justify-between border-b border-line bg-white px-6 py-3 shadow-card">
      <div className="text-sm">
        <span className="font-display font-semibold text-ink">{role.label}</span>
        <span className="text-muted"> · {role.scope}</span>
        {role.id !== 'md' && (
          <span className="text-muted/60"> · jurisdiction-restricted</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--clay)]">
          Demo data
        </span>
        <button
          type="button"
          aria-label="Notifications"
          className="rounded-full p-2 text-muted outline-none transition-colors hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-[color:var(--emerald)]"
        >
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-medium text-muted sm:inline">Switch Role</span>
          <RoleSwitcher />
        </div>
      </div>
    </header>
  );
}
