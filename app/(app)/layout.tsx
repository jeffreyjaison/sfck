'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/components/RoleProvider';
import { Sidebar } from '@/components/Sidebar';
import { ScopeBanner } from '@/components/ScopeBanner';
import { AppFooter } from '@/components/AppFooter';
import { MobileNav } from '@/components/MobileNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, hydrated } = useSession();
  const router = useRouter();
  useEffect(() => { if (hydrated && !session) router.replace('/'); }, [hydrated, session, router]);
  if (!hydrated || !session) return null;
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* Mobile/tablet: hamburger top bar + slide-in side drawer (Sidebar is hidden below lg). */}
      <MobileNav />
      {/* min-w-0 lets the content column shrink so wide tables scroll internally
          instead of forcing the whole page wider than the viewport. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <ScopeBanner />
        <main className="flex-1 px-4 pb-10 pt-16 lg:px-6 lg:pb-6 lg:pt-6">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
