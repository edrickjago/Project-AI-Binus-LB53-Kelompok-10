import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import Sidebar from '../components/Sidebar';

export const metadata: Metadata = {
  title: 'KasFlow — Keuangan Cerdas',
  description: 'Aplikasi akuntansi dan manajemen arus kas keuangan personal',
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
          <div className="app-shell">
            <Sidebar />
            <main className="main-content">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
