'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal, X } from 'lucide-react';
import { navFor } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { ICON_BY_HREF } from '@/components/Sidebar';

// Fixed bottom navigation shown only on mobile/tablet (< lg). Shows up to 4 primary
// role destinations; if the role has more, a 5th "More" tab opens a sheet with the
// full nav + the role switcher. Reuses navFor() so it stays role-scoped and correct.
export function MobileBottomNav() {
  const { session } = useSession();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  if (!session) return null;

  const items = navFor(session.role);
  const hasMore = items.length > 5;
  const primary = hasMore ? items.slice(0, 4) : items;

  const tabClass = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium outline-none focus-visible:bg-paper ${
      active ? 'text-[color:var(--emerald)]' : 'text-muted'
    }`;

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-line bg-white lg:hidden"
        aria-label="Primary"
      >
        {primary.map((n) => {
          const Icon = ICON_BY_HREF[n.href];
          const active = path === n.href;
          return (
            <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined} className={tabClass(active)}>
              {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
              <span className="max-w-full truncate px-1">{n.label.split(' ')[0]}</span>
            </Link>
          );
        })}
        {hasMore && (
          <button type="button" onClick={() => setOpen(true)} className={tabClass(false)} aria-haspopup="dialog">
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            <span>More</span>
          </button>
        )}
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-base font-semibold text-ink">Menu</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1 text-muted hover:bg-paper">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {items.map((n) => {
                const Icon = ICON_BY_HREF[n.href];
                const active = path === n.href;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm ${
                      active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-line text-ink'
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                    <span className="truncate">{n.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 border-t border-line pt-3">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Switch role</div>
              <RoleSwitcher />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
