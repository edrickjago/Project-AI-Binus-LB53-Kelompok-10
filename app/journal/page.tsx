'use client';

import { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { downloadExcelXML } from '../../lib/export';
import JournalModal from '../../components/JournalModal';

export default function JournalPage() {
  const { getAllJournalEntries, deleteJournalEntry, transactions, manualJournalEntries, language } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'auto' | 'manual'>('all');

  const allEntries = useMemo(() => getAllJournalEntries(), [transactions, manualJournalEntries]);

  const filtered = useMemo(() => allEntries.filter(e => {
    if (typeFilter === 'auto' && !e.isAutomatic) return false;
    if (typeFilter === 'manual' && e.isAutomatic) return false;
    if (search && !e.description.toLowerCase().includes(search.toLowerCase()) && !e.number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [allEntries, typeFilter, search]);

  const suggestedNumber = `JM-${new Date().getFullYear()}-${String(manualJournalEntries.length + 1).padStart(4, '0')}`;
  const totalDebit = filtered.reduce((s, e) => s + e.lines.reduce((ls, l) => ls + l.debit, 0), 0);

  const handleExportExcel = () => {
    const headers = ['Tanggal', 'No. Jurnal', 'Keterangan', 'Ref', 'Nama Akun', 'Kode Akun', 'Debit', 'Kredit'];
    const rows: any[][] = [];
    filtered.forEach(entry => {
      entry.lines.forEach(line => {
        rows.push([
          entry.date, entry.number, entry.description, entry.isAutomatic ? 'TX' : 'MAN',
          line.accountName, line.accountCode, line.debit || '', line.credit || ''
        ]);
      });
    });
    downloadExcelXML('Jurnal_Umum', headers, rows);
  };

  const th: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '9px 14px', fontSize: '0.84rem', verticalAlign: 'top' };

  return (
    <>
      <div className="page-header animate-slide-up">
        <div>
          <h1 className="page-title">📒 {language === 'id' ? 'Jurnal Umum' : 'General Journal'}</h1>
          <p className="page-subtitle">{language === 'id' ? 'Catatan setiap transaksi dalam format debit/kredit' : 'All transactions in debit/credit format'}</p>
        </div>
        <button className="btn btn-primary no-print" onClick={() => setShowModal(true)}>+ {language === 'id' ? 'Tambah Jurnal' : 'Add Entry'}</button>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="glass-panel animate-slide-up delay-1" style={{ marginBottom: 18 }}>
          <div className="filter-bar">
            <div className="search-input-wrapper" style={{ flex: 1 }}>
              <span className="search-icon">🔍</span>
              <input placeholder={language === 'id' ? 'Cari keterangan atau no. jurnal...' : 'Search description or journal no...'} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as typeof typeFilter)} style={{ width: 'auto', minWidth: 160 }}>
              <option value="all">{language === 'id' ? 'Semua Entri' : 'All Entries'}</option>
              <option value="auto">{language === 'id' ? 'Otomatis' : 'Automatic'}</option>
              <option value="manual">{language === 'id' ? 'Manual' : 'Manual'}</option>
            </select>
            <button className="btn btn-secondary btn-sm no-print" onClick={handleExportExcel}>⬇️ Excel</button>
            <button className="btn btn-secondary btn-sm no-print" onClick={() => window.print()}>🖨️ PDF</button>
          </div>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }} className="animate-slide-up delay-1">
          {[
            { label: language === 'id' ? 'Total Entri' : 'Total Entries', value: `${filtered.length}`, color: 'var(--text-primary)', isText: true },
            { label: 'Total Debit', value: formatCurrency(totalDebit), color: 'var(--accent-primary)', isText: false },
            { label: 'Total Kredit', value: formatCurrency(totalDebit), color: 'var(--accent-danger)', isText: false },
          ].map(s => (
            <div key={s.label} className="glass-panel" style={{ textAlign: 'center', padding: 14 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Journal Table */}
        <div className="glass-panel animate-slide-up delay-2">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ ...th, width: 100 }}>Tanggal</th>
                  <th style={{ ...th, width: 130 }}>No. Jurnal</th>
                  <th style={th}>Keterangan / Akun</th>
                  <th style={{ ...th, width: 80, textAlign: 'center' }}>Ref.</th>
                  <th style={{ ...th, textAlign: 'right' }}>Debit (Rp)</th>
                  <th style={{ ...th, textAlign: 'right' }}>Kredit (Rp)</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>📒 {language === 'id' ? 'Belum ada entri jurnal' : 'No journal entries yet'}</td></tr>
                ) : (
                  filtered.map((entry, ei) => (
                    <>
                      {/* Entry Header Row */}
                      <tr key={`h-${entry.id}`} style={{ background: 'rgba(128,128,128,0.04)', borderTop: ei > 0 ? '1px solid var(--border-color)' : 'none' }}>
                        <td style={{ ...td, fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{formatDate(entry.date)}</td>
                        <td style={{ ...td }}>
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: entry.isAutomatic ? 'var(--accent-secondary)' : 'var(--accent-primary)' }}>{entry.number}</span>
                          {entry.isAutomatic && <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>Auto</span>}
                        </td>
                        <td style={{ ...td, fontWeight: 600 }}>{entry.description}</td>
                        <td style={{ ...td, textAlign: 'center' }}>
                          {entry.isAutomatic ? <span style={{ fontSize: '0.68rem', background: 'var(--accent-secondary-dim)', color: 'var(--accent-secondary)', padding: '2px 6px', borderRadius: 10 }}>TX</span> : <span style={{ fontSize: '0.68rem', background: 'var(--accent-primary-dim)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: 10 }}>MAN</span>}
                        </td>
                        <td style={{ ...td, textAlign: 'right' }} />
                        <td style={{ ...td, textAlign: 'right' }} />
                        <td style={td}>
                          {!entry.isAutomatic && (
                            <button onClick={() => deleteJournalEntry(entry.id)} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(244,63,94,0.12)', color: '#F43F5E', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑️</button>
                          )}
                        </td>
                      </tr>
                      {/* Journal Lines */}
                      {entry.lines.map((line, li) => (
                        <tr key={`l-${entry.id}-${li}`} style={{ borderBottom: li === entry.lines.length - 1 ? '1px solid rgba(128,128,128,0.06)' : 'none' }}>
                          <td style={td} />
                          <td style={td} />
                          <td style={{ ...td, paddingLeft: 32, color: line.debit > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontStyle: line.credit > 0 ? 'italic' : 'normal', paddingRight: line.credit > 0 ? 0 : td.padding as string }}>
                            {line.credit > 0 && <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>└</span>}
                            {line.accountName}
                            <span style={{ marginLeft: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>[{line.accountCode}]</span>
                          </td>
                          <td style={td} />
                          <td style={{ ...td, textAlign: 'right', color: 'var(--accent-primary)', fontWeight: 600 }}>{line.debit > 0 ? formatCurrency(line.debit) : ''}</td>
                          <td style={{ ...td, textAlign: 'right', color: 'var(--accent-danger)', fontWeight: 600 }}>{line.credit > 0 ? formatCurrency(line.credit) : ''}</td>
                          <td />
                        </tr>
                      ))}
                    </>
                  ))
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border-color)', background: 'rgba(128,128,128,0.05)' }}>
                    <td colSpan={4} style={{ ...td, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.75rem' }}>TOTAL</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: 'var(--accent-primary)' }}>{formatCurrency(totalDebit)}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: 'var(--accent-danger)' }}>{formatCurrency(totalDebit)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {showModal && <JournalModal onClose={() => setShowModal(false)} suggestedNumber={suggestedNumber} />}
    </>
  );
}
