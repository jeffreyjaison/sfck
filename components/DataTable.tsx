export function DataTable<T extends Record<string, unknown>>(
  { columns, rows }: { columns: { key: keyof T; label: string }[]; rows: T[] },
) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>{columns.map((c) => <th key={String(c.key)} className="px-4 py-2 font-medium">{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {columns.map((c) => <td key={String(c.key)} className="px-4 py-2">{String(r[c.key] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
