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

  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));

  const availableYears = useMemo(() => {
    const years = new Set(activeTransactions.map(tx => tx.date.split('-')[0]));
    years.add(new Date().getFullYear().toString()); // always include current year
    return Array.from(years).sort().reverse();
  }, [activeTransactions]);

  const filteredTransactions = useMemo(() => {
    if (selectedYear === 'all') return activeTransactions;
    if (selectedMonth === 'all') return activeTransactions.filter(tx => tx.date.startsWith(`${selectedYear}-`));
    return activeTransactions.filter(tx => tx.date.startsWith(`${selectedYear}-${selectedMonth}-`));
  }, [activeTransactions, selectedYear, selectedMonth]);

  const stats = useMemo(() => {
    const income = filteredTransactions.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
    const expense = filteredTransactions.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
    const balance = activeTransactions.reduce((s, tx) => tx.type === 'income' ? s + tx.amount : tx.type === 'expense' ? s - tx.amount : s, 0);
    return { income, expense, balance, savings: income - expense };
  }, [filteredTransactions, activeTransactions]);

  const chartData = useMemo(() => {
    if (selectedYear === 'all') {
      return availableYears.slice().reverse().map(year => {
        const txs = activeTransactions.filter(tx => tx.date.startsWith(year));
        return {
          month: year,
          income: txs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
          expense: txs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
        };
      });
    } else if (selectedMonth === 'all') {
      return Array.from({ length: 12 }, (_, i) => {
        const m = String(i + 1).padStart(2, '0');
        const monthPrefix = `${selectedYear}-${m}`;
        const txs = activeTransactions.filter((tx) => tx.date.startsWith(monthPrefix));
        const date = new Date(Number(selectedYear), i, 1);
        const label = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(date);
        
        return { 
          month: label, 
          income: txs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0), 
          expense: txs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0) 
        };
      });
    } else {
      const daysInMonth = new Date(Number(selectedYear), Number(selectedMonth), 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => {
        const d = String(i + 1).padStart(2, '0');
        const datePrefix = `${selectedYear}-${selectedMonth}-${d}`;
        const txs = activeTransactions.filter(tx => tx.date.startsWith(datePrefix));
        return {
          month: d,
          income: txs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
          expense: txs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
        };
      });
    }
  }, [activeTransactions, selectedYear, selectedMonth, availableYears]);

  const categoryData = useMemo(() => {
    const by: Record<string, number> = {};
    filteredTransactions.filter(tx => tx.type === 'expense').forEach((tx) => { by[tx.category] = (by[tx.category] || 0) + tx.amount; });
    return Object.entries(by).sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({ name, value, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }));
  }, [filteredTransactions]);

  let displayLabel = 'Total (All Time)';
  if (selectedYear !== 'all') {
    if (selectedMonth === 'all') {
      displayLabel = `Tahun ${selectedYear}`;
    } else {
      const date = new Date(Number(selectedYear), Number(selectedMonth) - 1, 1);
      displayLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
    }
  }

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
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px', alignItems: 'center', flexWrap: 'wrap' }} className="no-print">
            <select className="input" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }} value={selectedYear} onChange={(e) => {
              setSelectedYear(e.target.value);
              if (e.target.value === 'all') setSelectedMonth('all');
            }}>
              <option value="all">Total (All Time)</option>
              {availableYears.map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>

            {selectedYear !== 'all' && (
              <select className="input" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                <option value="all">Yearly (All Months)</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            )}

            <button className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => {
              setSelectedYear(new Date().getFullYear().toString());
              setSelectedMonth(String(new Date().getMonth() + 1).padStart(2, '0'));
            }}>
              Current Month
            </button>
          </div>
        </div>
        <button className="btn btn-primary no-print" onClick={() => { setEditTx(null); setShowModal(true); }}>{t('dash.addTx')}</button>
      </div>

      <div className="page-content">
        <div className="stats-grid animate-slide-up delay-1">
          <StatsCard type="balance" label={t('dash.balance')} amount={stats.balance} />
          <StatsCard type="income" label={t('dash.income')} amount={stats.income} subtitle={displayLabel} />
          <StatsCard type="expense" label={t('dash.expense')} amount={stats.expense} subtitle={displayLabel} />
          <StatsCard type="savings" label={t('dash.savings')} amount={stats.savings} subtitle={displayLabel} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: '18px', marginTop: '18px' }} className="animate-slide-up delay-2">
          <div className="glass-panel">
            <h3 style={{ marginBottom: '4px', fontSize: '0.95rem' }}>{t('dash.cashflowTitle')}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '18px' }}>
              {selectedYear === 'all' ? 'All Time (Yearly)' : selectedMonth === 'all' ? `Tahun ${selectedYear}` : `Bulan ${displayLabel} (Harian)`}
            </p>
            <CashflowChart data={chartData} />
          </div>
          <div className="glass-panel">
            <h3 style={{ marginBottom: '4px', fontSize: '0.95rem' }}>{t('dash.catTitle')}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '14px' }}>{displayLabel}</p>
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
