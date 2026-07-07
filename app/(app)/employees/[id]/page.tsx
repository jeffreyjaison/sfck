'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from '@/components/RoleProvider';
import { useScopedData } from '@/lib/client-fetch';

type Worker = {
  id: number; checkRoll: string; name: string; category: string; type: string;
  gender: string; dob: string; dateOfJoining: string; mobile: string | null;
  estate: string;
  error?: string;
};

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useSession();
  const { data, loading } = useScopedData<Worker>(`/api/employees/${id}`, session);

  if (loading || !data) return <div className="text-slate-400">Loading…</div>;

  if (data.error) {
    return (
      <div className="space-y-4">
        <Link href="/employees" className="text-sm text-emerald-600 hover:underline">&larr; Back to Employees</Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Employee not found or outside your access scope.
        </div>
      </div>
    );
  }

  const fields: { label: string; value: string }[] = [
    { label: 'Name', value: data.name },
    { label: 'Category', value: data.category },
    { label: 'Type', value: data.type },
    { label: 'Gender', value: data.gender },
    { label: 'Date of Birth', value: data.dob },
    { label: 'Date of Joining', value: data.dateOfJoining },
    { label: 'Mobile', value: data.mobile ?? '—' },
    { label: 'Estate', value: data.estate },
  ];

  return (
    <div className="space-y-6">
      <Link href="/employees" className="text-sm text-emerald-600 hover:underline">&larr; Back to Employees</Link>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="text-xs uppercase tracking-wide text-emerald-700">Check Roll Number</div>
        <div className="mt-1 text-3xl font-bold text-emerald-900">{data.checkRoll}</div>
        <div className="mt-1 text-xs text-emerald-700">Unique · Permanent · Non-reusable</div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">{data.name}</h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => (
            <div key={f.label}>
              <dt className="text-xs uppercase tracking-wide text-slate-400">{f.label}</dt>
              <dd className="mt-0.5 text-sm text-slate-800">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
