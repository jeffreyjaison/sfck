'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/components/RoleProvider';
import { Sidebar } from '@/components/Sidebar';
import { ScopeBanner } from '@/components/ScopeBanner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, hydrated } = useSession();
  const router = useRouter();
  useEffect(() => { if (hydrated && !session) router.replace('/'); }, [hydrated, session, router]);
  if (!hydrated || !session) return null;
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <ScopeBanner />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
