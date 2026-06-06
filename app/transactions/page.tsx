'use client';

import { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency, formatMonth } from '../../lib/utils';
import TransactionItem from '../../components/TransactionItem';
import TransactionModal from '../../components/TransactionModal';
import { Transaction } from '../../types';

export default function TransactionsPage() {
  const { activeTransactions, addTransaction, deleteTransaction, updateTransaction, accounts, t } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [monthFilter, setMonthFilter] = useState('');

  const availableMonths = useMemo(() => {
    const months = new Set(activeTransactions.map((tx) => tx.date.substring(0, 7)));
    return Array.from(months).sort().reverse();
  }, [activeTransactions]);

  const filtered = useMemo(() => activeTransactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (monthFilter && !tx.date.startsWith(monthFilter)) return false;
    if (search && !tx.category.toLowerCase().includes(search.toLowerCase()) && !tx.note.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [activeTransactions, typeFilter, monthFilter, search]);

  const summary = useMemo(() => {
    const income = filtered.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
    const expense = filtered.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
    return { income, expense, net: income - expense };
  }, [filtered]);

  const handleEdit = (tx: Transaction) => { setEditTx(tx); setShowModal(true); };
  const handleSave = (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editTx) updateTransaction(editTx.id, data); else addTransaction(data);
    setEditTx(null);
  };

  const cardStyle = { textAlign: 'center' as const, padding: '14px' };
  const lbl = { fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 700 };

  return (
    <>
      <div className="page-header animate-slide-up">
        <div>
          <h1 className="page-title">{t('tx.title')}</h1>
          <p className="page-subtitle">{t('tx.subtitle', { count: String(activeTransactions.length) })}</p>
        </div>
        <button className="btn btn-primary no-print" onClick={() => { setEditTx(null); setShowModal(true); }}>{t('tx.addBtn')}</button>
      </div>

      <div className="page-content">
        <div className="glass-panel animate-slide-up delay-1" style={{ marginBottom: '18px' }}>
          <div className="filter-bar">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder={t('tx.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} style={{ width: 'auto', minWidth: '140px' }}>
              <option value="all">{t('tx.allTypes')}</option>
              <option value="income">{t('modal.income')}</option>
              <option value="expense">{t('modal.expense')}</option>
              <option value="transfer">{t('modal.transfer')}</option>
            </select>
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} style={{ width: 'auto', minWidth: '150px' }}>
              <option value="">{t('tx.allMonths')}</option>
              {availableMonths.map((m) => <option key={m} value={m}>{formatMonth(m)}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '18px' }} className="animate-slide-up delay-2">
          <div className="glass-panel" style={cardStyle}><div style={lbl}>{t('tx.incomeLabel')}</div><div style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '1.05rem' }}>+{formatCurrency(summary.income)}</div></div>
          <div className="glass-panel" style={cardStyle}><div style={lbl}>{t('tx.expenseLabel')}</div><div style={{ color: 'var(--accent-danger)', fontWeight: 700, fontSize: '1.05rem' }}>-{formatCurrency(summary.expense)}</div></div>
          <div className="glass-panel" style={cardStyle}><div style={lbl}>{t('tx.netLabel')}</div><div style={{ color: summary.net >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)', fontWeight: 700, fontSize: '1.05rem' }}>{summary.net >= 0 ? '+' : ''}{formatCurrency(summary.net)}</div></div>
        </div>

        <div className="glass-panel animate-slide-up delay-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '0.95rem' }}>{t('tx.listTitle')}</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t('tx.count', { count: String(filtered.length) })}</span>
          </div>
          {filtered.length === 0 ? (<div className="empty-state"><span className="empty-icon">🔎</span><p>{t('tx.empty')}</p></div>) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {filtered.map((tx) => <TransactionItem key={tx.id} transaction={tx} onDelete={deleteTransaction} onEdit={handleEdit} />)}
            </div>
          )}
        </div>
      </div>

      {showModal && <TransactionModal onSave={handleSave} onClose={() => { setShowModal(false); setEditTx(null); }} editData={editTx} />}
    </>
  );
}
