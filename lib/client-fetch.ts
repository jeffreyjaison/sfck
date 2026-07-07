'use client';
import { useEffect, useState, useCallback } from 'react';
import type { Session } from '@/lib/rbac';

export function useScopedData<T>(path: string, session: Session | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    if (!session) return;
    // Kicking off a fetch (and its loading flag) in response to path/session/tick
    // changes is the intended synchronization here, not a cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const q = new URLSearchParams({ role: session.role, scopeId: session.scopeId?.toString() ?? '' });
    fetch(`${path}?${q.toString()}`)
      .then((r) => r.json())
      .then((d) => { setData(d as T); setLoading(false); })
      .catch(() => setLoading(false));
  }, [path, session, tick]);
  return { data, loading, reload };
}
