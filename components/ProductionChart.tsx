'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

export function ProductionChart({ data }: { data: { estate: string; current: number; prior: number }[] }) {
  return (
    <div className="h-72 w-full rounded-xl border bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="estate" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Legend />
          <Bar dataKey="prior" name="Prior Year" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="current" name="Current Year" fill="#059669" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
