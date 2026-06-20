'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

// Pages that should NOT show the sidebar (public pages)
const PUBLIC_ROUTES = ['/landing', '/login', '/signup', '/'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith('/landing'));
  const isApp = !isPublic;

  useEffect(() => {
    if (isLoading) return;
    if (isApp && !user) {
      router.replace('/login');
    }
  }, [isApp, user, isLoading, router]);

  // Public pages — render without sidebar
  if (isPublic) {
    return <>{children}</>;
  }

  // App pages — show loading or auth guard
  if (isLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-logo">
          <div style={{
            width: 52, height: 52, borderRadius: 15, fontSize: 26,
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 28px rgba(16,185,129,0.4)'
          }}>💰</div>
          <span style={{
            fontSize: '1.5rem', fontWeight: 800,
            background: 'linear-gradient(135deg, #F0F4FF, #7B8DB0)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>KasFlow</span>
        </div>
        <div className="auth-loading-spinner" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 8 }}>
          Loading your workspace...
        </p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}
