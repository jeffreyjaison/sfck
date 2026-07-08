'use client';
import { useState } from 'react';
import { useSession } from '@/components/RoleProvider';
import { useScopedData, withSession } from '@/lib/client-fetch';

type Setting = { key: string; value: string; label: string };
type Settings = { settings: Setting[] };

function SettingRow({ setting, onSaved }: { setting: Setting; onSaved: () => void }) {
  const { session } = useSession();
  const [value, setValue] = useState(setting.value);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const save = async () => {
    setStatus('saving');
    await fetch(withSession('/api/settings', session), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: setting.key, value }),
    });
    setStatus('saved');
    onSaved();
    setTimeout(() => setStatus('idle'), 1500);
  };

  return (
    <div className="flex flex-col gap-2 border-t border-line px-4 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-medium text-ink">{setting.label}</div>
        <div className="text-xs text-muted">{setting.key}</div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-32 rounded-lg border px-3 py-1.5 text-sm"
        />
        <button
          onClick={save}
          disabled={status === 'saving'}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
        {status === 'saved' && <span className="text-xs text-emerald-600">Saved ✓</span>}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { session } = useSession();
  const { data, loading, reload } = useScopedData<Settings>('/api/settings', session);

  if (loading || !data) return <div className="text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Settings / Configuration</h1>
        <p className="mt-1 text-sm text-muted">
          Business parameters — editable without code changes.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        {data.settings.map((s) => (
          <SettingRow key={s.key} setting={s} onSaved={reload} />
        ))}
      </div>

      <p className="text-xs text-muted">
        Changes here drive retirement alerts, payroll working days, PF %, and leave caps.
      </p>
    </div>
  );
}
