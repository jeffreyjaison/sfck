import type { Metadata } from 'next';
import { Inter, Noto_Sans_Malayalam, Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google';
import { RoleProvider } from '@/components/RoleProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const malayalam = Noto_Sans_Malayalam({ subsets: ['malayalam'], variable: '--font-ml', weight: ['400', '600'] });
const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', weight: ['400', '600', '700', '800'] });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['500', '700'] });

export const metadata: Metadata = { title: 'SFCK Plantation ERP', description: 'Demo' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${malayalam.variable} ${display.variable} ${mono.variable} antialiased`}>
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  );
}
