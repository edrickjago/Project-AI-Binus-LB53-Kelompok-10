'use client';

import { useState } from 'react';
import { JournalLine } from '../types';
import { useAppContext } from '../context/AppContext';
import { formatCurrency } from '../lib/utils';

interface Props {
  onClose: () => void;
  suggestedNumber: string;
}

interface DraftLine { accountCode: string; debit: string; credit: string; }

export default function JournalModal({ onClose, suggestedNumber }: Props) {
  const { coa, addJournalEntry } = useAppContext();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [number, setNumber] = useState(suggestedNumber);
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([
    { accountCode: coa[0]?.code ?? '', debit: '', credit: '' },
    { accountCode: coa[1]?.code ?? '', debit: '', credit: '' },
  ]);

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const updateLine = (i: number, field: keyof DraftLine, value: string) => {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };
  const addLine = () => setLines(prev => [...prev, { accountCode: coa[0]?.code ?? '', debit: '', credit: '' }]);
  const removeLine = (i: number) => { if (lines.length > 2) setLines(prev => prev.filter((_, idx) => idx !== i)); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;
    if (!description.trim()) return;
    const journalLines: JournalLine[] = lines
      .filter(l => parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0)
      .map(l => {
        const acc = coa.find(c => c.code === l.accountCode);
        return { accountCode: l.accountCode, accountName: acc?.name ?? l.accountCode, debit: parseFloat(l.debit) || 0, credit: parseFloat(l.credit) || 0 };
      });
    addJournalEntry({ date, number, description, lines: journalLines, isAutomatic: false });
    onClose();
  };

  const coaOpts = [...coa].sort((a, b) => a.code.localeCompare(b.code));
  const closeStyle: React.CSSProperties = { background: 'rgba(128,128,128,0.08)', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', width: 30, height: 30, borderRadius: 8, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const tdStyle: React.CSSProperties = { padding: '5px 6px', verticalAlign: 'middle' };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2 className="modal-title">📒 Tambah Jurnal Umum</h2>
          <button onClick={onClose} style={closeStyle}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group"><label>No. Jurnal</label><input value={number} onChange={e => setNumber(e.target.value)} required /></div>
            <div className="form-group"><label>Tanggal</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
          </div>
          <div className="form-group"><label>Keterangan</label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi jurnal..." required /></div>

          {/* Journal Lines */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ marginBottom: 0 }}>Entri Jurnal</label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>+ Tambah Baris</button>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(128,128,128,0.07)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ ...tdStyle, textAlign: 'left', width: '45%', fontWeight: 700, fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Akun</th>
                    <th style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Debit (Rp)</th>
                    <th style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kredit (Rp)</th>
                    <th style={{ width: 32 }} />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={tdStyle}>
                        <select value={line.accountCode} onChange={e => updateLine(i, 'accountCode', e.target.value)} style={{ fontSize: '0.8rem', padding: '6px 8px' }}>
                          {coaOpts.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <input type="number" value={line.debit} onChange={e => updateLine(i, 'debit', e.target.value)} min="0" step="any" placeholder="0" style={{ textAlign: 'right', fontSize: '0.82rem', padding: '6px 8px' }} />
                      </td>
                      <td style={tdStyle}>
                        <input type="number" value={line.credit} onChange={e => updateLine(i, 'credit', e.target.value)} min="0" step="any" placeholder="0" style={{ textAlign: 'right', fontSize: '0.82rem', padding: '6px 8px' }} />
                      </td>
                      <td style={tdStyle}>
                        <button type="button" onClick={() => removeLine(i)} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(244,63,94,0.12)', color: '#F43F5E', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(128,128,128,0.05)' }}>
                    <td style={{ ...tdStyle, fontWeight: 700, fontSize: '0.8rem' }}>TOTAL</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: isBalanced ? 'var(--accent-primary)' : 'var(--accent-danger)', fontSize: '0.82rem' }}>{formatCurrency(totalDebit)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: isBalanced ? 'var(--accent-primary)' : 'var(--accent-danger)', fontSize: '0.82rem' }}>{formatCurrency(totalCredit)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            {!isBalanced && totalDebit > 0 && (
              <p style={{ color: 'var(--accent-danger)', fontSize: '0.78rem', marginTop: 6 }}>⚠️ Total Debit harus sama dengan Total Kredit</p>
            )}
            {isBalanced && <p style={{ color: 'var(--accent-primary)', fontSize: '0.78rem', marginTop: 6 }}>✅ Jurnal seimbang</p>}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-secondary btn-full" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary btn-full" disabled={!isBalanced}>📒 Simpan Jurnal</button>
          </div>
        </form>
      </div>
    </div>
  );
}
