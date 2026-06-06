"use client";

import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export default function TransactionList({ transactions, onDelete }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="glass-panel animate-slide-up delay-3" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Belum ada transaksi direkam.</div>
        <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Mulailah dengan menambahkan pemasukan atau pengeluaran baru.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-slide-up delay-3">
      <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Riwayat Transaksi</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {transactions.map((t) => (
          <div 
            key={t.id} 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              transition: 'background 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: t.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: t.type === 'income' ? 'var(--accent-primary)' : 'var(--accent-danger)'
              }}>
                {t.type === 'income' ? '↓' : '↑'}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{t.category}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {formatDate(t.date)} {t.note && `• ${t.note}`}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div 
                className={t.type === 'income' ? 'text-income' : 'text-expense'}
                style={{ fontWeight: 600 }}
              >
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
              </div>
              <button 
                onClick={() => onDelete(t.id)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--text-secondary)', 
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
                title="Hapus"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
