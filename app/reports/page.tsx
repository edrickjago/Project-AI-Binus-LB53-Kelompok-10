'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency, getLast6Months, getMonthLabel, formatMonth } from '../../lib/utils';
import { CATEGORY_COLORS } from '../../lib/categories';

export default function ReportsPage() {
  const { activeTransactions, t } = useAppContext();
  const months = getLast6Months();

  const monthlyData = useMemo(() => months.map((month) => {
    const txs = activeTransactions.filter((tx) => tx.date.startsWith(month));
    const income = txs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
    const expense = txs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
    return { month: getMonthLabel(month), fullMonth: month, income, expense, net: income - expense, count: txs.length };
  }), [activeTransactions]);

  const currentMonth = months[months.length - 1];
  const categoryData = useMemo(() => {
    const mtd = activeTransactions.filter(tx => tx.type === 'expense' && tx.date.startsWith(currentMonth));
    const by: Record<string, number> = {};
    mtd.forEach(tx => { by[tx.category] = (by[tx.category] || 0) + tx.amount; });
    const total = Object.values(by).reduce((s, v) => s + v, 0);
    return Object.entries(by).sort((a, b) => b[1] - a[1]).map(([category, amount], i) => ({
      category, amount, pct: total > 0 ? ((amount / total) * 100).toFixed(1) : '0', color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
    }));
  }, [activeTransactions, currentMonth]);

  const totals = useMemo(() => {
    const income = activeTransactions.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
    const expense = activeTransactions.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
    return { income, expense, net: income - expense };
  }, [activeTransactions]);

  const handleExportCSV = () => {
    const rows = activeTransactions.map(tx => [tx.date, tx.type, tx.category, tx.amount, tx.note || ''].join(','));
    const csv = [['Date','Type','Category','Amount','Note'], ...rows.map(r => r.split(','))].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `kasflow_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePrintPDF = () => window.print();

  const tooltip = { background: 'rgba(8,11,18,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '13px' };
  const th = { padding: '10px 14px', textAlign: 'left' as const, color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' as const, letterSpacing: '0.06em' };

  return (
    <>
      {/* Print Header (visible only when printing) */}
      <div className="print-header" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>
        💰 KasFlow — {t('rep.incomeStatement')}
        <div style={{ fontSize: '0.9rem', fontWeight: 400, marginTop: '4px', color: '#475569' }}>{formatMonth(currentMonth)}</div>
      </div>

      <div className="page-header animate-slide-up">
        <div>
          <h1 className="page-title">{t('rep.title')}</h1>
          <p className="page-subtitle">{t('rep.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }} className="no-print">
          <button className="btn btn-secondary" onClick={handleExportCSV}>{t('rep.exportCSV')}</button>
          <button className="btn btn-primary" onClick={handlePrintPDF}>{t('rep.exportPDF')}</button>
        </div>
      </div>

      <div className="page-content">
        {/* Totals */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' }} className="animate-slide-up delay-1">
          {[
            { label: t('rep.totalIncome'), value: totals.income, color: 'var(--accent-primary)', border: '#10B981', sign: '+' },
            { label: t('rep.totalExpense'), value: totals.expense, color: 'var(--accent-danger)', border: '#F43F5E', sign: '-' },
            { label: t('rep.netBalance'), value: Math.abs(totals.net), color: totals.net >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)', border: '#6366F1', sign: totals.net >= 0 ? '+' : '-' },
          ].map(item => (
            <div key={item.label} className="glass-panel" style={{ borderLeft: `3px solid ${item.border}`, padding: '18px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px' }}>{item.label}</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: item.color }}>{item.sign}{formatCurrency(item.value)}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.73rem', marginTop: '4px' }}>{t('rep.allTime')}</div>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="glass-panel animate-slide-up delay-2" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>{t('rep.barTitle')}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '20px' }}>{t('rep.barSub')}</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={(v: number) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(0)}jt` : `${(v/1_000).toFixed(0)}rb`} />
              <Tooltip contentStyle={tooltip} labelStyle={{ color: 'var(--text-secondary)' }}
                formatter={(value: any, name: any) => [formatCurrency(Number(value || 0)), name === 'income' ? t('rep.income') : t('rep.expense')]} />
              <Legend formatter={(v) => v === 'income' ? t('rep.income') : t('rep.expense')} wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
              <Bar dataKey="income" fill="#10B981" radius={[4,4,0,0]} />
              <Bar dataKey="expense" fill="#F43F5E" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Table */}
        <div className="glass-panel animate-slide-up delay-3" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '18px' }}>{t('rep.tableTitle')}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {[t('rep.month'), t('rep.income'), t('rep.expense'), t('rep.net'), t('rep.txCount')].map(h => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {[...monthlyData].reverse().map(row => (
                  <tr key={row.fullMonth} style={{ borderBottom: '1px solid rgba(128,128,128,0.05)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{row.month}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--accent-primary)' }}>+{formatCurrency(row.income)}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--accent-danger)' }}>-{formatCurrency(row.expense)}</td>
                    <td style={{ padding: '12px 14px', color: row.net >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)', fontWeight: 700 }}>{row.net >= 0 ? '+' : ''}{formatCurrency(row.net)}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <div className="glass-panel animate-slide-up delay-4">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>{t('rep.catTitle')}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '18px' }}>{t('rep.catSub')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categoryData.map((item, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.855rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: item.color }} />
                      <span>{item.category}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.pct}%</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</span>
                    </div>
                  </div>
                  <div className="budget-bar"><div className="budget-bar-fill" style={{ width: `${item.pct}%`, background: item.color }} /></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
