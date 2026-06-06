'use client';

import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ChartOfAccount, CoaType } from '../../types';

export default function CoaPage() {
  const { coa, addCoaAccount, updateCoaAccount, deleteCoaAccount, language } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editAcc, setEditAcc] = useState<ChartOfAccount | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<CoaType>('asset');
  const [normalBalance, setNormalBalance] = useState<'debit'|'credit'>('debit');
  const [description, setDescription] = useState('');

  const openModal = (acc?: ChartOfAccount) => {
    if (acc) {
      setEditAcc(acc);
      setCode(acc.code);
      setName(acc.name);
      setType(acc.type);
      setNormalBalance(acc.normalBalance);
      setDescription(acc.description || '');
    } else {
      setEditAcc(null);
      setCode('');
      setName('');
      setType('asset');
      setNormalBalance('debit');
      setDescription('');
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    
    if (editAcc) {
      updateCoaAccount(editAcc.code, { name, type, normalBalance, description });
    } else {
      // Check if code exists
      if (coa.find(c => c.code === code)) {
        alert('Kode akun sudah digunakan!');
        return;
      }
      addCoaAccount({ code, name, type, normalBalance, description });
    }
    setShowModal(false);
  };

  const TYPE_COLORS: Record<CoaType, string> = {
    asset: '#10B981', liability: '#F43F5E', equity: '#6366F1', revenue: '#06B6D4', expense: '#F59E0B'
  };

  const TYPE_LABELS: Record<CoaType, string> = {
    asset: 'Asset / Harta', liability: 'Liability / Kewajiban', equity: 'Equity / Modal', revenue: 'Revenue / Pendapatan', expense: 'Expense / Beban'
  };

  const sortedCoa = [...coa].sort((a, b) => a.code.localeCompare(b.code));

  return (
    <>
      <div className="page-header animate-slide-up">
        <div>
          <h1 className="page-title">📑 Chart of Accounts</h1>
          <p className="page-subtitle">{language === 'id' ? 'Manajemen master data bagan akun (COA)' : 'Master data management for chart of accounts'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>+ {language === 'id' ? 'Tambah Akun' : 'Add Account'}</button>
      </div>

      <div className="page-content">
        <div className="glass-panel animate-slide-up delay-1">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px' }}>Kode</th>
                <th style={{ padding: '12px' }}>Nama Akun</th>
                <th style={{ padding: '12px' }}>Tipe</th>
                <th style={{ padding: '12px' }}>Saldo Normal</th>
                <th style={{ padding: '12px' }}>Keterangan</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedCoa.map(acc => (
                <tr key={acc.code} style={{ borderBottom: '1px solid rgba(128,128,128,0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 700, fontFamily: 'monospace' }}>{acc.code}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>
                    {acc.name}
                    {acc.isSystem && <span style={{ marginLeft: 8, fontSize: '0.65rem', background: 'rgba(128,128,128,0.2)', padding: '2px 6px', borderRadius: 4 }}>SYSTEM</span>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ fontSize: '0.75rem', background: `${TYPE_COLORS[acc.type]}18`, color: TYPE_COLORS[acc.type], padding: '4px 8px', borderRadius: 12, fontWeight: 600 }}>
                      {TYPE_LABELS[acc.type]}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                    <span style={{ color: acc.normalBalance === 'debit' ? 'var(--accent-primary)' : 'var(--accent-danger)', fontWeight: 600 }}>
                      {acc.normalBalance}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{acc.description || '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button onClick={() => openModal(acc)} style={{ border: 'none', background: 'rgba(99,102,241,0.1)', color: '#6366F1', padding: '6px', borderRadius: 6, cursor: 'pointer' }}>✏️</button>
                      {!acc.isSystem && (
                        <button onClick={() => { if(confirm('Hapus akun ini?')) deleteCoaAccount(acc.code); }} style={{ border: 'none', background: 'rgba(244,63,94,0.1)', color: '#F43F5E', padding: '6px', borderRadius: 6, cursor: 'pointer' }}>🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editAcc ? 'Edit Akun COA' : 'Tambah Akun COA Baru'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Kode Akun</label>
                <input value={code} onChange={e => setCode(e.target.value)} disabled={!!editAcc} placeholder="Misal: 1101" required />
                {!editAcc && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kode tidak bisa diubah setelah dibuat.</span>}
              </div>
              <div className="form-group">
                <label>Nama Akun</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Misal: Kas Kecil" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label>Tipe Akun</label>
                  <select value={type} onChange={e => setType(e.target.value as CoaType)}>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Saldo Normal</label>
                  <select value={normalBalance} onChange={e => setNormalBalance(e.target.value as 'debit'|'credit')}>
                    <option value="debit">Debit</option>
                    <option value="credit">Kredit / Credit</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Keterangan (Opsional)</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi akun..." />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary btn-full" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-full">Simpan Akun</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
