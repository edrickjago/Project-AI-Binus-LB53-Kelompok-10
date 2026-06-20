'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/landing');
    }
  }, [user, isLoading, router]);

  return (
    <div className="auth-loading-screen">
      <div className="auth-loading-logo">
        <div style={{
          width: 56, height: 56, borderRadius: 16, fontSize: 28,
          background: 'linear-gradient(135deg, #10B981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 32px rgba(16,185,129,0.4)'
        }}>💰</div>
        <span style={{
          fontSize: '1.6rem', fontWeight: 700,
          background: 'linear-gradient(135deg, #F0F4FF, #7B8DB0)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>KasFlow</span>
      </div>
      <div className="auth-loading-spinner" />
    </div>
  );
}
