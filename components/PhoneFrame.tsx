'use client';
import { useEffect, useState } from 'react';

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-[390px] rounded-[2.5rem] border-8 border-slate-800 bg-slate-800 shadow-xl">
      <div className="flex items-center justify-between px-5 py-2 text-xs text-slate-200">
        <span>{time || 'SFCK Field'}</span>
        <span className="flex items-center gap-1 rounded-full bg-slate-900/60 px-2 py-0.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Offline · Synced
        </span>
      </div>
      <div className="max-h-[70vh] overflow-y-auto rounded-b-[2rem] rounded-t-lg bg-white p-4">
        {children}
      </div>
    </div>
  );
}
