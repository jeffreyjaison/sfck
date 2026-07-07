'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/components/RoleProvider';
import { useScopedData } from '@/lib/client-fetch';
import { RetirementAlerts } from '@/components/RetirementAlerts';

type Worker = {
  id: number; checkRoll: string; name: string; category: string; type: string;
  gender: string; dob: string; dateOfJoining: string; mobile: string | null;
  estate: string; age: number;
};

type Employees = {
  workers: Worker[];
  retirementAlerts: { id: number; checkRoll: string; name: string; retiresOn: string }[];
  estates: { id: number; name: string }[];
  retirementAge: number;
};

const AGE_GROUPS = ['<30', '30-44', '45-57', '58+'] as const;

function ageGroup(age: number): (typeof AGE_GROUPS)[number] {
  if (age < 30) return '<30';
  if (age < 45) return '30-44';
  if (age < 58) return '45-57';
  return '58+';
}

export default function EmployeesPage() {
  const { session } = useSession();
  const { data, loading } = useScopedData<Employees>('/api/employees', session);
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState('');
  const [estate, setEstate] = useState('');
  const [ageBucket, setAgeBucket] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.workers.filter((w) => {
      if (q && !w.name.toLowerCase().includes(q) && !w.checkRoll.toLowerCase().includes(q)) return false;
      if (gender && w.gender !== gender) return false;
      if (category && w.category !== category) return false;
      if (estate && w.estate !== estate) return false;
      if (ageBucket && ageGroup(w.age) !== ageBucket) return false;
      return true;
    });
  }, [data, search, gender, category, estate, ageBucket]);

  if (loading || !data) return <div className="text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Employee Master &amp; Check Roll</h1>

      <RetirementAlerts alerts={data.retirementAlerts} />

      <div className="rounded-xl border bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            placeholder="Search name or check roll…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">All Categories</option>
            <option value="Dependent">Dependent</option>
            <option value="Casual">Casual</option>
            <option value="Permanent">Permanent</option>
          </select>
          <select value={estate} onChange={(e) => setEstate(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">All Estates</option>
            {data.estates.map((e) => (
              <option key={e.id} value={e.name}>{e.name}</option>
            ))}
          </select>
          <select value={ageBucket} onChange={(e) => setAgeBucket(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">All Ages</option>
            {AGE_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          Showing {filtered.length} of {data.workers.length}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Check Roll</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Gender</th>
              <th className="px-4 py-2 font-medium">Age</th>
              <th className="px-4 py-2 font-medium">Estate</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="px-4 py-2">
                  <Link href={`/employees/${w.id}`} className="text-emerald-600 hover:text-emerald-700 hover:underline">
                    {w.checkRoll}
                  </Link>
                </td>
                <td className="px-4 py-2">{w.name}</td>
                <td className="px-4 py-2">{w.category}</td>
                <td className="px-4 py-2">{w.type}</td>
                <td className="px-4 py-2">{w.gender}</td>
                <td className="px-4 py-2">{w.age}</td>
                <td className="px-4 py-2">{w.estate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
