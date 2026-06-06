"use client";

import { useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../lib/utils';

interface Props {
  transactions: Transaction[];
}

export default function DashboardOverview({ transactions }: Props) {
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    return transactions.reduce(
      (acc, curr) => {
        if (curr.type === 'income') {
          acc.totalIncome += curr.amount;
          acc.balance += curr.amount;
        } else {
          acc.totalExpense += curr.amount;
          acc.balance -= curr.amount;
        }
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, balance: 0 }
    );
  }, [transactions]);

  return (
    <div className="glass-panel animate-slide-up delay-1">
      <h2 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Saldo</h2>
      <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '24px' }}>
        {formatCurrency(balance)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Pemasukan</div>
          <div className="text-income" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            +{formatCurrency(totalIncome)}
          </div>
        </div>

        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Pengeluaran</div>
          <div className="text-expense" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            -{formatCurrency(totalExpense)}
          </div>
        </div>
      </div>
    </div>
  );
}
