'use client';
import { Bell } from 'lucide-react';
import { ROLES } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';

// Fixed top app bar shown only on mobile/tablet (< lg). Replaces the ScopeBanner,
// which is hidden below lg. Role switching lives in the MobileBottomNav "More" sheet.
export function MobileTopBar() {
  const { session } = useSession();
  if (!session) return null;
  const role = ROLES.find((r) => r.id === session.role);
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
      <div className="flex min-w-0 items-center gap-2">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-extrabold shadow-sm"
          style={{ background: 'linear-gradient(135deg, var(--canopy), var(--canopy-2))', color: 'var(--latex)' }}
        >
          SFCK
        </div>
        <div className="min-w-0">
          <div className="font-display text-sm font-bold leading-tight text-ink">SFCK ERP</div>
          <div className="truncate text-[10px] leading-tight text-muted">{role?.label}</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--clay)]">
          Demo
        </span>
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted outline-none transition-colors hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-[color:var(--emerald)]"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
