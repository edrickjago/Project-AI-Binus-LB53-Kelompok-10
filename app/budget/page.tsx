'use client';

import { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency, formatMonth, getCurrentMonth } from '../../lib/utils';
import { EXPENSE_CATEGORIES } from '../../lib/categories';
import { Budget } from '../../types';

// ── Budget Modal ──────────────────────────────────────
interface ModalProps {
  onSave: (data: Omit<Budget, 'id'>) => void;
  onClose: () => void;
  editData?: Budget | null;
  defaultMonth: string;
}

function BudgetModal({ onSave, onClose, editData, defaultMonth }: ModalProps) {
  const [category, setCategory] = useState(editData?.category ?? EXPENSE_CATEGORIES[0]);
  const [limit, setLimit] = useState(editData?.limit?.toString() ?? '');
  const [month, setMonth] = useState(editData?.month ?? defaultMonth);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(limit);
    if (!parsed || parsed <= 0) return;
    onSave({ category, limit: parsed, month });
    onClose();
  };

  const closeBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer',
    color: 'var(--text-secondary)', width: '32px', height: '32px', borderRadius: '8px',
    fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{editData ? '✏️ Edit Anggaran' : '🎯 Tambah Anggaran'}</h2>
          <button id="budget-modal-close" onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label htmlFor="budget-category">Kategori Pengeluaran</label>
            <select id="budget-category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="budget-limit">Batas Anggaran (Rp)</label>
            <input id="budget-limit" type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Contoh: 1000000" required min="1" />
          </div>
          <div className="form-group">
            <label htmlFor="budget-month">Bulan</label>
            <input id="budget-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
            <button type="button" className="btn btn-secondary btn-full" onClick={onClose}>Batal</button>
            <button id="budget-submit" type="submit" className="btn btn-primary btn-full">
              {editData ? '💾 Simpan' : '➕ Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────
export default function BudgetPage() {
  const { transactions, budgets, addBudget, updateBudget, deleteBudget } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const monthBudgets = useMemo(() => budgets.filter((b) => b.month === selectedMonth), [budgets, selectedMonth]);

  const budgetsWithSpending = useMemo(() => {
    return monthBudgets.map((b) => {
      const spent = transactions
        .filter((t) => t.type === 'expense' && t.category === b.category && t.date.startsWith(b.month))
        .reduce((s, t) => s + t.amount, 0);
      const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      return { ...b, spent, pct: Math.min(pct, 100), isOver: spent > b.limit };
    });
  }, [monthBudgets, transactions]);

  const totalBudget = budgetsWithSpending.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgetsWithSpending.reduce((s, b) => s + b.spent, 0);

  const handleSave = (data: Omit<Budget, 'id'>) => {
    if (editBudget) updateBudget(editBudget.id, data);
    else addBudget(data);
    setEditBudget(null);
  };

  const labelStyle = { fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 700 };

  return (
    <>
      <div className="page-header animate-slide-up">
        <div>
          <h1 className="page-title">Anggaran</h1>
          <p className="page-subtitle">Kelola batas pengeluaran per kategori</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: 'auto', padding: '10px 14px' }} />
          <button id="add-budget-btn" className="btn btn-primary" onClick={() => { setEditBudget(null); setShowModal(true); }}>
            ➕ Tambah Anggaran
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Overview */}
        {totalBudget > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }} className="animate-slide-up delay-1">
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={labelStyle}>Total Anggaran</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(totalBudget)}</div>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={labelStyle}>Terpakai</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: totalSpent > totalBudget ? 'var(--accent-danger)' : 'var(--accent-primary)' }}>{formatCurrency(totalSpent)}</div>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={labelStyle}>Sisa Anggaran</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: totalBudget - totalSpent >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>
                {formatCurrency(Math.max(0, totalBudget - totalSpent))}
              </div>
            </div>
          </div>
        )}

        {/* Budget Cards */}
        {budgetsWithSpending.length === 0 ? (
          <div className="glass-panel animate-slide-up delay-2">
            <div className="empty-state">
              <span className="empty-icon">🎯</span>
              <p style={{ marginBottom: '8px' }}>Belum ada anggaran untuk {formatMonth(selectedMonth)}</p>
              <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Tambahkan anggaran untuk melacak pengeluaran per kategori</p>
              <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setShowModal(true)}>
                ➕ Tambah Anggaran Pertama
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }} className="animate-slide-up delay-2">
            {budgetsWithSpending.map((b) => (
              <div key={b.id} className="glass-panel" style={{ borderLeft: `3px solid ${b.isOver ? '#F43F5E' : b.pct >= 80 ? '#F59E0B' : '#10B981'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '6px' }}>{b.category}</div>
                    {b.isOver && (
                      <span style={{ fontSize: '0.7rem', background: 'var(--accent-danger-dim)', color: 'var(--accent-danger)', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>⚠️ Melebihi Batas</span>
                    )}
                    {!b.isOver && b.pct >= 80 && (
                      <span style={{ fontSize: '0.7rem', background: 'var(--accent-warning-dim)', color: 'var(--accent-warning)', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>⚡ Hampir Habis</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => { setEditBudget(b); setShowModal(true); }} style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(99,102,241,0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>✏️</button>
                    <button onClick={() => deleteBudget(b.id)} style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(244,63,94,0.1)', color: '#F43F5E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>🗑️</button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <span>Digunakan: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(b.spent)}</strong></span>
                  <span>Batas: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(b.limit)}</strong></span>
                </div>

                <div className="budget-bar">
                  <div className="budget-bar-fill" style={{ width: `${b.pct}%`, background: b.isOver ? '#F43F5E' : b.pct >= 80 ? '#F59E0B' : '#10B981' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>{b.pct.toFixed(0)}% terpakai</span>
                  <span>{b.isOver ? `Lebih ${formatCurrency(b.spent - b.limit)}` : `Sisa ${formatCurrency(b.limit - b.spent)}`}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <BudgetModal
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditBudget(null); }}
          editData={editBudget}
          defaultMonth={selectedMonth}
        />
      )}
    </>
  );
}
