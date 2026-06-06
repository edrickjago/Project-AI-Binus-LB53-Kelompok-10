'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '../context/AppContext';
import { formatCurrency, formatMonth, getCurrentMonth, getCurrentYearMonths, getMonthLabel } from '../lib/utils';
import { CATEGORY_COLORS } from '../lib/categories';
import dynamic from 'next/dynamic';
import StatsCard from '../components/StatsCard';

const CashflowChart = dynamic(() => import('../components/CashflowChart'), { ssr: false, loading: () => <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>Memuat grafik...</div> });
const CategoryChart = dynamic(() => import('../components/CategoryChart'), { ssr: false, loading: () => <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>Memuat grafik...</div> });
import TransactionItem from '../components/TransactionItem';
import TransactionModal from '../components/TransactionModal';
import { Transaction } from '../types';

export default function DashboardPage() {
  const { activeTransactions, addTransaction, deleteTransaction, updateTransaction, t } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const currentMonth = getCurrentMonth();
  const currentMonthLabel = formatMonth(currentMonth);
  const currentYear = new Date().getFullYear();

  const stats = useMemo(() => {
    const mtd = activeTransactions.filter((tx) => tx.date.startsWith(currentMonth));
    const income = mtd.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
    const expense = mtd.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
    const balance = activeTransactions.reduce((s, tx) => tx.type === 'income' ? s + tx.amount : tx.type === 'expense' ? s - tx.amount : s, 0);
    return { income, expense, balance, savings: income - expense };
  }, [activeTransactions, currentMonth]);

  const chartData = useMemo(() => getCurrentYearMonths().map((month) => {
    const txs = activeTransactions.filter((tx) => tx.date.startsWith(month));
    return { month: getMonthLabel(month), income: txs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0), expense: txs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0) };
  }), [activeTransactions]);

  const categoryData = useMemo(() => {
    const mtd = activeTransactions.filter((tx) => tx.type === 'expense' && tx.date.startsWith(currentMonth));
    const by: Record<string, number> = {};
    mtd.forEach((tx) => { by[tx.category] = (by[tx.category] || 0) + tx.amount; });
    return Object.entries(by).sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({ name, value, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }));
  }, [activeTransactions, currentMonth]);

  const recentTxs = activeTransactions.slice(0, 5);
  const handleEdit = (tx: Transaction) => { setEditTx(tx); setShowModal(true); };
  const handleSave = (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editTx) updateTransaction(editTx.id, data); else addTransaction(data);
    setEditTx(null);
  };

  return (
    <>
      <div className="page-header animate-slide-up">
        <div>
          <h1 className="page-title">{t('dash.title')}</h1>
          <p className="page-subtitle">{t('dash.subtitle')}</p>
        </div>
        <button className="btn btn-primary no-print" onClick={() => { setEditTx(null); setShowModal(true); }}>{t('dash.addTx')}</button>
      </div>

      <div className="page-content">
        <div className="stats-grid animate-slide-up delay-1">
          <StatsCard type="balance" label={t('dash.balance')} amount={stats.balance} />
          <StatsCard type="income" label={t('dash.income')} amount={stats.income} subtitle={currentMonthLabel} />
          <StatsCard type="expense" label={t('dash.expense')} amount={stats.expense} subtitle={currentMonthLabel} />
          <StatsCard type="savings" label={t('dash.savings')} amount={stats.savings} subtitle={currentMonthLabel} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: '18px', marginTop: '18px' }} className="animate-slide-up delay-2">
          <div className="glass-panel">
            <h3 style={{ marginBottom: '4px', fontSize: '0.95rem' }}>{t('dash.cashflowTitle')}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '18px' }}>{t('dash.cashflowSub')} — {currentYear}</p>
            <CashflowChart data={chartData} />
          </div>
          <div className="glass-panel">
            <h3 style={{ marginBottom: '4px', fontSize: '0.95rem' }}>{t('dash.catTitle')}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '14px' }}>{currentMonthLabel}</p>
            <CategoryChart data={categoryData} />
          </div>
        </div>

        <div className="glass-panel animate-slide-up delay-3" style={{ marginTop: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem' }}>{t('dash.recentTitle')}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px' }}>{t('dash.recentSub')}</p>
            </div>
            <Link href="/transactions" className="btn btn-secondary btn-sm">{t('dash.viewAll')}</Link>
          </div>
          {recentTxs.length === 0 ? (
            <div className="empty-state"><span className="empty-icon">💳</span><p>{t('dash.empty')}</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {recentTxs.map((tx) => <TransactionItem key={tx.id} transaction={tx} onDelete={deleteTransaction} onEdit={handleEdit} />)}
            </div>
          )}
        </div>
      </div>

      {showModal && <TransactionModal onSave={handleSave} onClose={() => { setShowModal(false); setEditTx(null); }} editData={editTx} />}
    </>
  );
}
