'use client';

import { useState, useEffect } from 'react';
import { Transaction, TransactionType, RecurrenceType } from '../types';
import { useAppContext } from '../context/AppContext';

interface Props {
  onSave: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  editData?: Transaction | null;
}

export default function TransactionModal({ onSave, onClose, editData }: Props) {
  const { t, accounts, allExpenseCategories, allIncomeCategories } = useAppContext();
  const [type, setType] = useState<TransactionType>(editData?.type ?? 'expense');
  const [amount, setAmount] = useState(editData?.amount?.toString() ?? '');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(editData?.date ?? new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(editData?.note ?? '');
  const [accountId, setAccountId] = useState(editData?.accountId ?? accounts[0]?.id ?? 'default');
  const [toAccountId, setToAccountId] = useState(editData?.toAccountId ?? '');
  const [isRecurring, setIsRecurring] = useState(editData?.isRecurring ?? false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(editData?.recurrenceType ?? 'monthly');

  const categories = type === 'income' ? allIncomeCategories : allExpenseCategories;

  useEffect(() => {
    if (editData) {
      setType(editData.type); setAmount(editData.amount.toString());
      setCategory(editData.category); setDate(editData.date); setNote(editData.note);
      setAccountId(editData.accountId ?? accounts[0]?.id ?? 'default');
      setToAccountId(editData.toAccountId ?? '');
      setIsRecurring(editData.isRecurring ?? false);
      setRecurrenceType(editData.recurrenceType ?? 'monthly');
    } else {
      setCategory(categories[0] ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editData]);

  useEffect(() => {
    if (!editData) setCategory(categories[0] ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) return;
    onSave({ type, amount: parsed, category, date, note, accountId, toAccountId: toAccountId || undefined, isRecurring, recurrenceType: isRecurring ? recurrenceType : undefined });
    onClose();
  };

  const closeBtnStyle: React.CSSProperties = {
    background: 'rgba(128,128,128,0.08)', border: 'none', cursor: 'pointer',
    color: 'var(--text-secondary)', width: '30px', height: '30px', borderRadius: '8px',
    fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  const recurIntervals: { value: RecurrenceType; key: string }[] = [
    { value: 'daily', key: 'modal.daily' }, { value: 'weekly', key: 'modal.weekly' },
    { value: 'monthly', key: 'modal.monthly' }, { value: 'yearly', key: 'modal.yearly' },
  ];

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{editData ? t('modal.editTitle') : t('modal.addTitle')}</h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Type Tabs */}
          <div className="tab-group">
            <button type="button" className={`tab-btn ${type === 'income' ? 'active-income' : ''}`} onClick={() => setType('income')}>{t('modal.income')}</button>
            <button type="button" className={`tab-btn ${type === 'expense' ? 'active-expense' : ''}`} onClick={() => setType('expense')}>{t('modal.expense')}</button>
            <button type="button" className={`tab-btn ${type === 'transfer' ? 'active-transfer' : ''}`} onClick={() => setType('transfer')}>{t('modal.transfer')}</button>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label>{t('modal.amount')}</label>
            <input id="tx-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t('modal.amountPlaceholder')} required min="1" step="any" />
          </div>

          {/* Category + Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {type !== 'transfer' && (
              <div className="form-group">
                <label>{t('modal.category')}</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>{t('modal.date')}</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          {/* Account */}
          <div style={{ display: 'grid', gridTemplateColumns: type === 'transfer' ? '1fr 1fr' : '1fr', gap: '10px' }}>
            <div className="form-group">
              <label>{type === 'transfer' ? t('modal.account') : t('modal.account')}</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
              </select>
            </div>
            {type === 'transfer' && (
              <div className="form-group">
                <label>{t('modal.toAccount')}</label>
                <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
                  {accounts.filter(a => a.id !== accountId).map((a) => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Note */}
          <div className="form-group">
            <label>{t('modal.note')}</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('modal.notePlaceholder')} />
          </div>

          {/* Recurring */}
          <div style={{ background: 'rgba(128,128,128,0.05)', borderRadius: '12px', padding: '12px 14px' }}>
            <div className="switch-row">
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>🔁 {t('modal.recurring')}</span>
              <label className="switch">
                <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
                <span className="switch-slider" />
              </label>
            </div>
            {isRecurring && (
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>{t('modal.recurInterval')}</label>
                <select value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}>
                  {recurIntervals.map(r => <option key={r.value} value={r.value}>{t(r.key)}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button type="button" className="btn btn-secondary btn-full" onClick={onClose}>{t('modal.cancel')}</button>
            <button type="submit" className="btn btn-primary btn-full">{editData ? t('modal.save') : t('modal.add')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
