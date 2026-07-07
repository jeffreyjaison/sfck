'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { RoleId, Session } from '@/lib/rbac';

const KEY = 'sfck-session';
const Ctx = createContext<{ session: Session | null; setSession: (s: Session) => void }>({
  session: null, setSession: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) setSessionState(JSON.parse(raw));
  }, []);
  const setSession = (s: Session) => { localStorage.setItem(KEY, JSON.stringify(s)); setSessionState(s); };
  return <Ctx.Provider value={{ session, setSession }}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
export type { RoleId };
