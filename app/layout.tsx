import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import AppShell from '../components/AppShell';

export const metadata: Metadata = {
  title: 'KasFlow — Smart Financial Management',
  description: 'AI-powered accounting and cash flow management for modern businesses. Track transactions, analyze spending, detect fraud, and generate financial reports.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
