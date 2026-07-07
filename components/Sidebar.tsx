'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CalendarCheck, Smartphone, Wallet,
  CalendarDays, Package, Sprout, ChartColumn, Settings, type LucideIcon,
} from 'lucide-react';
import { navFor, ROLES } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';

export const ICON_BY_HREF: Record<string, LucideIcon> = {
  '/dashboard': LayoutDashboard,
  '/employees': Users,
  '/attendance': CalendarCheck,
  '/field': Smartphone,
  '/payroll': Wallet,
  '/leave': CalendarDays,
  '/stock': Package,
  '/replanting': Sprout,
  '/reports': ChartColumn,
  '/settings': Settings,
};

export function Sidebar() {
  const { session } = useSession();
  const path = usePathname();
  if (!session) return null;
  const role = ROLES.find(r => r.id === session.role);
  const initials = role ? role.label.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '';

  return (
    <aside
      className="hidden w-64 shrink-0 flex-col text-white lg:flex"
      style={{ background: 'linear-gradient(180deg, var(--canopy), var(--canopy-2))' }}
    >
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[11px] font-extrabold shadow-sm"
            style={{ background: 'var(--latex)', color: 'var(--canopy)' }}
          >
            SFCK
          </div>
          <div>
            <div className="font-display text-base font-bold leading-tight text-white">SFCK ERP</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-emerald-200/80">Estate Console</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navFor(session.role).map(n => {
          const Icon = ICON_BY_HREF[n.href];
          const active = path === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[color:var(--leaf)] ${
                active
                  ? 'bg-white/10 font-semibold text-white'
                  : 'text-emerald-100 hover:bg-white/5 hover:text-white'
              }`}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r"
                  style={{ background: 'var(--leaf)' }}
                  aria-hidden="true"
                />
              )}
              {Icon && (
                <Icon
                  className="h-4 w-4 shrink-0"
                  style={{ color: active ? 'var(--leaf)' : undefined }}
                />
              )}
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl bg-black/20 p-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: 'var(--leaf)', color: 'var(--canopy)' }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-white">{role?.label}</div>
            <div className="truncate text-[11px] text-emerald-200/70">{role?.scope}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
