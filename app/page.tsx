'use client';
import { useRouter } from 'next/navigation';
import { Warehouse, ClipboardList, Building2, Users, Landmark, type LucideIcon } from 'lucide-react';
import { ROLES, DEMO_SCOPE, type RoleId } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';

const ROLE_ICONS: Record<RoleId, LucideIcon> = {
  cc: Warehouse,
  fo: ClipboardList,
  am: Building2,
  em: Users,
  md: Landmark,
};

export default function Login() {
  const router = useRouter();
  const { setSession } = useSession();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-bold tracking-wide text-white shadow-sm">
          SFCK
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold text-emerald-800 sm:text-4xl">SFCK Plantation ERP</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-500 sm:text-base">
          The State Farming Corporation of Kerala Ltd. — Estate, Production, Attendance &amp; Payroll Management
        </p>
      </div>

      <div className="mt-10 flex items-center justify-center gap-3">
        <h2 className="font-display text-lg font-semibold text-slate-800">Select a role to continue</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Demo data
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
        {ROLES.map(r => {
          const Icon = ROLE_ICONS[r.id];
          return (
            <button key={r.id}
              onClick={() => { setSession({ role: r.id, scopeId: DEMO_SCOPE[r.id] }); router.push('/dashboard'); }}
              className="group rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div className="font-semibold">{r.label}</div>
              <div className="text-sm text-slate-500">{r.scope}</div>
            </button>
          );
        })}
      </div>

      <p className="mt-12 text-center text-xs text-slate-400">
        © 2026 The State Farming Corporation of Kerala Ltd. · Government of Kerala Undertaking
      </p>
    </main>
  );
}
