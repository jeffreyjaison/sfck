export function DataTable<T extends Record<string, unknown>>(
  { columns, rows }: { columns: { key: keyof T; label: string }[]; rows: T[] },
) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-400">
          <tr>{columns.map((c) => <th key={String(c.key)} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide">{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100">
              {columns.map((c) => <td key={String(c.key)} className="tnum px-4 py-2">{String(r[c.key] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
