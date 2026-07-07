'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@/lib/rbac';

const KEY = 'sfck-session';
const Ctx = createContext<{ session: Session | null; setSession: (s: Session) => void; hydrated: boolean }>({
  session: null, setSession: () => {}, hydrated: false,
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // Reading the persisted session after hydration is intentional, not a cascading render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setSessionState(JSON.parse(raw));
    } catch {
      // ignore corrupted session
    }
    setHydrated(true);
  }, []);
  const setSession = (s: Session) => { localStorage.setItem(KEY, JSON.stringify(s)); setSessionState(s); };
  return <Ctx.Provider value={{ session, setSession, hydrated }}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
