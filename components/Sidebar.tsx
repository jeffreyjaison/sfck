'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navFor } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';

export function Sidebar() {
  const { session } = useSession();
  const path = usePathname();
  if (!session) return null;
  return (
    <aside className="w-60 shrink-0 border-r bg-white p-4">
      <div className="mb-6 font-bold text-emerald-700">SFCK ERP</div>
      <nav className="space-y-1">
        {navFor(session.role).map(n => (
          <Link key={n.href} href={n.href}
            className={`block rounded-lg px-3 py-2 text-sm ${path === n.href ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
            {n.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
