'use client';
import { useRouter } from 'next/navigation';
import { ROLES, DEMO_SCOPE } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';

export default function Login() {
  const router = useRouter();
  const { setSession } = useSession();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-emerald-700">SFCK Plantation ERP</h1>
        <p className="text-slate-500">Select a role to explore the system (demo data)</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
        {ROLES.map(r => (
          <button key={r.id}
            onClick={() => { setSession({ role: r.id, scopeId: DEMO_SCOPE[r.id] }); router.push('/dashboard'); }}
            className="rounded-xl border bg-white p-5 text-left shadow-sm hover:shadow-md hover:border-emerald-400 transition">
            <div className="font-semibold">{r.label}</div>
            <div className="text-sm text-slate-500">{r.scope}</div>
          </button>
        ))}
      </div>
    </main>
  );
}
