export function RetirementAlerts({ alerts }: { alerts: { id: number; checkRoll: string; name: string; retiresOn: string }[] }) {
  if (!alerts.length) return null;
  return (
    <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
      <div className="mb-2 text-sm font-semibold text-[color:var(--clay)]">⚠ Upcoming Retirements (within 2 months)</div>
      <ul className="space-y-1 text-sm text-ink">
        {alerts.map((a) => (
          <li key={a.id} className="flex justify-between gap-4">
            <span>{a.name} · {a.checkRoll}</span>
            <span className="mono text-[color:var(--clay)]">retires {a.retiresOn}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
