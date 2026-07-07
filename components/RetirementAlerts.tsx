export function RetirementAlerts({ alerts }: { alerts: { id: number; checkRoll: string; name: string; retiresOn: string }[] }) {
  if (!alerts.length) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-2 text-sm font-semibold text-amber-800">⚠ Upcoming Retirements (within 2 months)</div>
      <ul className="space-y-1 text-sm text-amber-900">
        {alerts.map((a) => (
          <li key={a.id} className="flex justify-between gap-4">
            <span>{a.name} · {a.checkRoll}</span>
            <span className="text-amber-700">retires {a.retiresOn}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
