'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Menu, X } from 'lucide-react';
import { navFor, ROLES } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { ICON_BY_HREF } from '@/components/Sidebar';

// Mobile/tablet (< lg) navigation: a fixed top app bar with a hamburger that opens a
// slide-in SIDE drawer containing the full role-scoped nav, user profile, and role
// switcher. Robust across devices (a simple overlay — no fixed-bottom-bar issues).
export function MobileNav() {
  const { session } = useSession();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  // Close on route change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentionally close the drawer when navigating
    setOpen(false);
  }, [path]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!session) return null;
  const role = ROLES.find((r) => r.id === session.role);
  const initials = role ? role.label.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : '';
  const items = navFor(session.role);

  return (
    <>
      {/* Top app bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-white px-2 lg:hidden">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={open}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink outline-none transition-colors hover:bg-paper focus-visible:ring-2 focus-visible:ring-[color:var(--emerald)]"
          >
            <Menu className="h-5 w-5" />
          </button>
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
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--clay)]">
            Demo
          </span>
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-paper hover:text-ink"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Slide-in side drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-200 motion-reduce:transition-none ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col text-white shadow-2xl transition-transform duration-200 motion-reduce:transition-none ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ background: 'linear-gradient(180deg, var(--canopy), var(--canopy-2))' }}
        >
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[11px] font-extrabold"
                style={{ background: 'var(--latex)', color: 'var(--canopy)' }}
              >
                SFCK
              </div>
              <div>
                <div className="font-display text-base font-bold leading-tight text-white">SFCK ERP</div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-emerald-200/80">Estate Console</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="rounded-full p-1.5 text-emerald-100 outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[color:var(--leaf)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
            {items.map((n) => {
              const Icon = ICON_BY_HREF[n.href];
              const active = path === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[color:var(--leaf)] ${
                    active ? 'bg-white/10 font-semibold text-white' : 'text-emerald-100 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r"
                      style={{ background: 'var(--leaf)' }}
                      aria-hidden="true"
                    />
                  )}
                  {Icon && <Icon className="h-4 w-4 shrink-0" style={{ color: active ? 'var(--leaf)' : undefined }} />}
                  <span>{n.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-3">
            <div className="mb-2 flex items-center gap-3 rounded-xl bg-black/20 p-3">
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
            <div className="px-1 pb-1">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-200/70">Switch role</div>
              <RoleSwitcher />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
