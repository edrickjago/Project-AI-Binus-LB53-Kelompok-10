'use client';

import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAppContext } from '../context/AppContext';

interface Props {
  transaction: Transaction;
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

export default function TransactionItem({ transaction: t, onDelete, onEdit }: Props) {
  const { accounts } = useAppContext();
  const isIncome = t.type === 'income';
  const isTransfer = t.type === 'transfer';
  const account = accounts.find(a => a.id === t.accountId);

  const iconBg = isTransfer ? 'rgba(99,102,241,0.12)' : isIncome ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)';
  const amtColor = isTransfer ? 'var(--accent-secondary)' : isIncome ? 'var(--accent-primary)' : 'var(--accent-danger)';
  const prefix = isTransfer ? '↔' : isIncome ? '+' : '-';

  return (
    <div className="transaction-item">
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0, flex: 1 }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 }}>
          {isTransfer ? '🔄' : isIncome ? '📥' : '📤'}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.category || (isTransfer ? 'Transfer' : '')}</span>
            {t.isRecurring && <span className="badge-recurring">🔁 {t.recurrenceType}</span>}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span>{formatDate(t.date)}</span>
            {account && <span style={{ opacity: 0.7 }}>· {account.icon} {account.name}</span>}
            {t.note && <span>· {t.note}</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: amtColor }}>
          {prefix}{formatCurrency(t.amount)}
        </div>
        <div style={{ display: 'flex', gap: '3px' }}>
          <button id={`edit-${t.id}`} onClick={() => onEdit(t)} title="Edit"
            style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(99,102,241,0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', fontSize: '13px' }}>✏️</button>
          <button id={`del-${t.id}`} onClick={() => onDelete(t.id)} title="Delete"
            style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(244,63,94,0.1)', color: '#F43F5E', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', fontSize: '13px' }}>🗑️</button>
        </div>
      </div>
    </div>
  );
}
