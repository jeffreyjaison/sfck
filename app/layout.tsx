import type { Metadata } from 'next';
import { Inter, Noto_Sans_Malayalam, Plus_Jakarta_Sans } from 'next/font/google';
import { RoleProvider } from '@/components/RoleProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const malayalam = Noto_Sans_Malayalam({ subsets: ['malayalam'], variable: '--font-ml', weight: ['400', '600'] });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700'] });

export const metadata: Metadata = { title: 'SFCK Plantation ERP', description: 'Demo' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${malayalam.variable} ${jakarta.variable} antialiased bg-slate-50 text-slate-800`}>
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  );
}
