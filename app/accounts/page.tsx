'use client';

import { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency, formatMonth, getCurrentMonth } from '../../lib/utils';
import { Account } from '../../types';

const ACCOUNT_TYPES = ['bank', 'cash', 'ewallet', 'investment', 'credit'] as const;
const ICONS = ['🏦', '💵', '💳', '📱', '📈', '🏧', '💰', '🪙', '🐷', '💼'];
const COLORS = ['#10B981', '#6366F1', '#F59E0B', '#F43F5E', '#06B6D4', '#EC4899', '#8B5CF6', '#14B8A6', '#FB923C', '#94A3B8'];

interface ModalProps {
  onSave: (data: Omit<Account, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  editData?: Account | null;
  t: (key: string, vars?: Record<string, string>) => string;
}
function AccountModal({ onSave, onClose, editData, t }: ModalProps) {
  const [name, setName] = useState(editData?.name ?? '');
  const [type, setType] = useState<Account['type']>(editData?.type ?? 'bank');
  const [icon, setIcon] = useState(editData?.icon ?? '🏦');
  const [color, setColor] = useState(editData?.color ?? COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), type, icon, color });
    onClose();
  };

  const closeBtnStyle: React.CSSProperties = { background: 'rgba(128,128,128,0.08)', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', width: '30px', height: '30px', borderRadius: '8px', fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center' };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{editData ? t('acc.editModal') : t('acc.addModal')}</h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group"><label>{t('acc.name')}</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BCA Tabungan" required /></div>
          <div className="form-group">
            <label>{t('acc.type')}</label>
            <select value={type} onChange={e => setType(e.target.value as Account['type'])}>
              {ACCOUNT_TYPES.map(at => <option key={at} value={at}>{t(`acc.${at}`)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>{t('acc.icon')}</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {ICONS.map(ic => <button key={ic} type="button" onClick={() => setIcon(ic)} style={{ width: '38px', height: '38px', borderRadius: '9px', border: icon === ic ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)', background: icon === ic ? 'var(--accent-primary-dim)' : 'transparent', cursor: 'pointer', fontSize: '18px' }}>{ic}</button>)}
            </div>
          </div>
          <div className="form-group">
            <label>Color</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {COLORS.map(c => <button key={c} type="button" onClick={() => setColor(c)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: color === c ? '3px solid white' : '2px solid transparent', background: c, cursor: 'pointer', outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} />)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button type="button" className="btn btn-secondary btn-full" onClick={onClose}>{t('acc.cancel')}</button>
            <button type="submit" className="btn btn-primary btn-full">{editData ? t('acc.save') : t('acc.add2')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const { accounts, transactions, addAccount, updateAccount, deleteAccount, t } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editAcc, setEditAcc] = useState<Account | null>(null);

  const accountsWithBalance = useMemo(() => accounts.map(acc => {
    const txs = transactions.filter(tx => tx.accountId === acc.id);
    const income = txs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
    const expense = txs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
    const transferIn = transactions.filter(tx => tx.type === 'transfer' && tx.toAccountId === acc.id).reduce((s, tx) => s + tx.amount, 0);
    const transferOut = txs.filter(tx => tx.type === 'transfer').reduce((s, tx) => s + tx.amount, 0);
    const balance = income - expense + transferIn - transferOut;
    return { ...acc, balance, count: txs.length };
  }), [accounts, transactions]);

  const netWorth = accountsWithBalance.reduce((s, a) => s + a.balance, 0);

  const handleSave = (data: Omit<Account, 'id' | 'createdAt'>) => {
    if (editAcc) updateAccount(editAcc.id, data); else addAccount(data);
    setEditAcc(null);
  };

  return (
    <>
      <div className="page-header animate-slide-up">
        <div><h1 className="page-title">{t('acc.title')}</h1><p className="page-subtitle">{t('acc.subtitle')}</p></div>
        <button className="btn btn-primary" onClick={() => { setEditAcc(null); setShowModal(true); }}>{t('acc.add')}</button>
      </div>

      <div className="page-content">
        {/* Net Worth */}
        <div className="glass-panel animate-slide-up delay-1" style={{ marginBottom: '20px', textAlign: 'center', padding: '28px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>{t('acc.netWorth')}</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: netWorth >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>{netWorth >= 0 ? '+' : ''}{formatCurrency(netWorth)}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '6px' }}>{accounts.length} accounts</div>
        </div>

        {/* Account Cards */}
        {accountsWithBalance.length === 0 ? (
          <div className="glass-panel animate-slide-up delay-2">
            <div className="empty-state">
              <span className="empty-icon">🏦</span>
              <p style={{ marginBottom: '8px' }}>{t('acc.empty')}</p>
              <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>{t('acc.emptySub')}</p>
              <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setShowModal(true)}>{t('acc.addFirst')}</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '16px' }} className="animate-slide-up delay-2">
            {accountsWithBalance.map(acc => (
              <div key={acc.id} className="glass-panel" style={{ borderLeft: `4px solid ${acc.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${acc.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{acc.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{acc.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', textTransform: 'capitalize' }}>{acc.type} · {acc.count} {t('acc.transactions')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => { setEditAcc(acc); setShowModal(true); }} style={{ width: '28px', height: '28px', borderRadius: '7px', border: 'none', cursor: 'pointer', background: 'rgba(99,102,241,0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✏️</button>
                    {acc.id !== 'default' && <button onClick={() => { if (confirm('Delete this account?')) deleteAccount(acc.id); }} style={{ width: '28px', height: '28px', borderRadius: '7px', border: 'none', cursor: 'pointer', background: 'rgba(244,63,94,0.1)', color: '#F43F5E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>🗑️</button>}
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', fontWeight: 600 }}>{t('acc.balance')}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: acc.balance >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>{acc.balance >= 0 ? '+' : ''}{formatCurrency(acc.balance)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <AccountModal onSave={handleSave} onClose={() => { setShowModal(false); setEditAcc(null); }} editData={editAcc} t={t} />}
    </>
  );
}
