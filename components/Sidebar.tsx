'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CalendarCheck, Smartphone, Wallet,
  CalendarDays, Package, Sprout, ChartColumn, Settings, type LucideIcon,
} from 'lucide-react';
import { navFor, ROLES } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';

const ICON_BY_HREF: Record<string, LucideIcon> = {
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
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
            SFCK
          </div>
          <div>
            <div className="font-display font-bold text-slate-800 leading-tight">SFCK ERP</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Plantation Management</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navFor(session.role).map(n => {
          const Icon = ICON_BY_HREF[n.href];
          const active = path === n.href;
          return (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              {Icon && <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />}
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-slate-700">{role?.label}</div>
            <div className="truncate text-[11px] text-slate-400">{role?.scope}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
