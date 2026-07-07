'use client';
import { useRouter } from 'next/navigation';
import {
  Warehouse,
  ClipboardList,
  Building2,
  Users,
  Landmark,
  Sprout,
  Wallet,
  ShieldCheck,
  Leaf,
  type LucideIcon,
} from 'lucide-react';
import { ROLES, DEMO_SCOPE, type RoleId } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';

const ROLE_ICONS: Record<RoleId, LucideIcon> = {
  cc: Warehouse,
  fo: ClipboardList,
  am: Building2,
  em: Users,
  md: Landmark,
};

const HIGHLIGHTS: { icon: LucideIcon; text: string }[] = [
  { icon: Sprout, text: '4 rubber estates, 16 collection centres' },
  { icon: Wallet, text: 'D4 wage engine & Malayalam payslips' },
  { icon: ShieldCheck, text: 'Role-based, jurisdiction-bound access' },
];

export default function Login() {
  const router = useRouter();
  const { setSession } = useSession();
  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel */}
      <aside
        className="relative isolate flex flex-col justify-between overflow-hidden px-8 py-8 text-white lg:w-[42%] lg:px-14 lg:py-14"
        style={{ background: 'linear-gradient(160deg, var(--canopy), var(--canopy-2))' }}
      >
        {/* Decorative watermark */}
        <Sprout
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -right-12 h-72 w-72 text-leaf/[0.07] lg:h-[26rem] lg:w-[26rem]"
          strokeWidth={1}
        />
        {/* Soft radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.25), transparent 70%)' }}
        />

        {/* Top: logo + wordmark */}
        <div className="relative z-10 flex items-center gap-4 lg:flex-col lg:items-start lg:gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-latex text-base font-bold tracking-wide text-canopy shadow-card">
            SFCK
          </div>
          <div className="lg:hidden">
            <div className="font-display text-lg font-bold leading-tight">SFCK Plantation ERP</div>
            <div className="text-xs text-leaf/90">The State Farming Corporation of Kerala Ltd.</div>
          </div>
        </div>

        {/* Middle: headline + highlights (hidden on small screens) */}
        <div className="relative z-10 hidden lg:block">
          <h1 className="font-display text-4xl font-bold leading-[1.1] xl:text-5xl">
            SFCK Plantation ERP
          </h1>
          <p className="mt-4 text-lg font-medium text-leaf">
            The State Farming Corporation of Kerala Ltd.
          </p>
          <p className="mt-2 max-w-md text-sm text-white/70">
            Estate · Production · Attendance · Payroll — one console.
          </p>

          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/80">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-4.5 w-4.5 text-leaf" strokeWidth={1.75} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: undertaking + demo pill (hidden on small screens) */}
        <div className="relative z-10 hidden items-center gap-3 lg:flex">
          <span className="inline-flex items-center gap-2 text-xs text-white/60">
            <Leaf className="h-3.5 w-3.5 text-leaf/70" />
            Government of Kerala Undertaking
          </span>
          <span className="inline-flex items-center rounded-full bg-clay px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
            Demo
          </span>
        </div>
      </aside>

      {/* Role selection panel */}
      <section className="flex flex-1 items-center justify-center bg-paper px-6 py-12 lg:px-12">
        <div className="w-full max-w-lg">
          <div className="mb-1 flex items-center gap-3">
            <h2 className="font-display text-2xl font-bold text-ink">Select your role</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-clay/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-clay">
              <span className="h-1.5 w-1.5 rounded-full bg-clay" />
              Demo data
            </span>
          </div>
          <p className="mb-8 text-sm text-muted">Choose a role to explore the system.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {ROLES.map((r, i) => {
              const Icon = ROLE_ICONS[r.id];
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setSession({ role: r.id, scopeId: DEMO_SCOPE[r.id] });
                    router.push('/dashboard');
                  }}
                  style={{ '--rise-delay': `${i * 60}ms` } as React.CSSProperties}
                  className="group animate-rise rounded-2xl border border-line bg-white p-5 text-left shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-emerald-brand hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-brand transition group-hover:bg-emerald-brand group-hover:text-white">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="font-semibold text-ink">{r.label}</div>
                  <div className="mt-0.5 text-sm text-muted">{r.scope}</div>
                </button>
              );
            })}
          </div>

          <p className="mt-10 text-xs text-muted/80">
            © 2026 The State Farming Corporation of Kerala Ltd. · Government of Kerala Undertaking
          </p>
        </div>
      </section>
    </main>
  );
}
