'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, theme, setTheme, language, setLanguage, accounts, activeAccountId, setActiveAccountId } = useAppContext();
  const { user, logout } = useAuth();

  const mainItems = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/ai-scanner', icon: '🤖', label: 'AI Scanner' },
    { href: '/ai-chatbot', icon: '💬', label: language === 'id' ? 'Deteksi Fraud AI' : 'AI Fraud Detector' },
    { href: '/transactions', icon: '💳', label: language === 'id' ? 'Transaksi' : 'Transactions' },
    { href: '/reports', icon: '📈', label: language === 'id' ? 'Laporan' : 'Reports' },
    { href: '/budget', icon: '🎯', label: language === 'id' ? 'Anggaran' : 'Budget' },
    { href: '/accounts', icon: '🏦', label: language === 'id' ? 'Akun' : 'Accounts' },
  ];

  const accountingItems = [
    { href: '/journal', icon: '📒', label: language === 'id' ? 'Jurnal Umum' : 'General Journal' },
    { href: '/ledger', icon: '📚', label: language === 'id' ? 'Buku Besar' : 'General Ledger' },
    { href: '/trial-balance', icon: '⚖️', label: language === 'id' ? 'Neraca Saldo' : 'Trial Balance' },
    { href: '/income-statement', icon: '📋', label: language === 'id' ? 'Lap. Laba Rugi' : 'Income Statement' },
    { href: '/balance-sheet', icon: '🏢', label: language === 'id' ? 'Neraca' : 'Balance Sheet' },
    { href: '/coa', icon: '📑', label: 'Chart of Accounts' },
  ];

  const NavLink = ({ href, icon, label }: { href: string; icon: string; label: string }) => (
    <Link href={href} className={`nav-link ${pathname === href ? 'active' : ''}`}>
      <span className="nav-icon">{icon}</span>
      <span style={{ fontSize: '0.84rem' }}>{label}</span>
    </Link>
  );

  const handleLogout = () => {
    logout();
    router.push('/landing');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">💰</div>
        <span className="sidebar-logo-text">KasFlow</span>
      </div>

      {/* User Profile */}
      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{user.avatar}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-email">{user.email}</div>
          </div>
        </div>
      )}

      {/* Account Selector */}
      <div className="account-selector">
        <select value={activeAccountId} onChange={(e) => setActiveAccountId(e.target.value)}>
          <option value="all">{language === 'id' ? 'Semua Akun' : 'All Accounts'}</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>{acc.icon} {acc.name}</option>
          ))}
        </select>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">{language === 'id' ? 'Menu Utama' : 'Main Menu'}</div>
        {mainItems.map((item) => <NavLink key={item.href} {...item} />)}

        <div className="nav-section-label" style={{ marginTop: 10 }}>
          {language === 'id' ? 'Akuntansi' : 'Accounting'}
        </div>
        {accountingItems.map((item) => <NavLink key={item.href} {...item} />)}

        <div className="nav-section-label" style={{ marginTop: 10 }}>
          {language === 'id' ? 'Preferensi' : 'Preferences'}
        </div>
        <NavLink href="/settings" icon="⚙️" label={language === 'id' ? 'Pengaturan' : 'Settings'} />
      </nav>

      {/* Theme + Language */}
      <div className="sidebar-prefs">
        <button className={`pref-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>🌙</button>
        <button className={`pref-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>☀️</button>
        <div style={{ width: 1, height: 20, background: 'var(--border-color)' }} />
        <button className={`pref-btn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>🇺🇸</button>
        <button className={`pref-btn ${language === 'id' ? 'active' : ''}`} onClick={() => setLanguage('id')}>🇮🇩</button>
      </div>

      {/* Logout */}
      <button className="sidebar-logout" onClick={handleLogout}>
        <span>🚪</span>
        <span>Sign Out</span>
      </button>

      <div className="sidebar-footer">KasFlow v2.0 · © 2026</div>
    </aside>
  );
}
