"use client";

import { useState } from 'react';
import { TransactionType, Transaction } from '../types';
import { useAppContext } from '../context/AppContext';

interface Props {
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

const CATEGORIES = {
  income: ['Gaji', 'Bonus', 'Investasi', 'Lainnya'],
  expense: ['Makanan', 'Transportasi', 'Tagihan', 'Hiburan', 'Lainnya']
};

export default function TransactionForm({ onAddTransaction }: Props) {
  const { accounts } = useAppContext();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES.expense[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    onAddTransaction({
      type,
      amount: Number(amount),
      category,
      date,
      note,
      accountId: accounts[0]?.id || 'default'
    });

    // Reset form mostly
    setAmount('');
    setNote('');
  };

  return (
    <div className="glass-panel animate-slide-up delay-2">
      <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Tambah Transaksi</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '14px' }}>
          <button 
            type="button"
            onClick={() => { setType('income'); setCategory(CATEGORIES.income[0]); }}
            style={{ 
              flex: 1, 
              padding: '10px', 
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              background: type === 'income' ? 'var(--accent-primary)' : 'transparent',
              color: type === 'income' ? '#fff' : 'var(--text-secondary)'
            }}
          >Pemasukan</button>
          <button 
            type="button"
            onClick={() => { setType('expense'); setCategory(CATEGORIES.expense[0]); }}
            style={{ 
              flex: 1, 
              padding: '10px', 
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              background: type === 'expense' ? 'var(--accent-danger)' : 'transparent',
              color: type === 'expense' ? '#fff' : 'var(--text-secondary)'
            }}
          >Pengeluaran</button>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Jumlah Rupiah</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Contoh: 50000"
            required
            min="1"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Kategori</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {((type === 'income' ? CATEGORIES.income : CATEGORIES.expense) as string[]).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Tanggal</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Catatan (Opsional)</label>
          <input 
            type="text" 
            value={note} 
            onChange={(e) => setNote(e.target.value)}
            placeholder="Beli makan siang..."
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', width: '100%' }}>
          Simpan Transaksi
        </button>
      </form>
    </div>
  );
}
