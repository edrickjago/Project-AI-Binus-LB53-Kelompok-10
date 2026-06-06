'use client';

import { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { getLedger } from '../../lib/accounting';
import { downloadExcelXML } from '../../lib/export';

export default function LedgerPage() {
  const { getAllJournalEntries, coa, transactions, manualJournalEntries, language } = useAppContext();
  const [selectedCode, setSelectedCode] = useState(coa[0]?.code ?? '');

  const ledger = useMemo(() => getLedger(getAllJournalEntries(), coa), [transactions, manualJournalEntries, coa]);
  const account = ledger.find(a => a.code === selectedCode);
  const accountsWithActivity = ledger.filter(a => a.totalDebit > 0 || a.totalCredit > 0);

  const handleExportExcel = () => {
    if (!account) return;
    const headers = ['Tanggal', 'No. Jurnal', 'Keterangan', 'Debit', 'Kredit', 'Saldo'];
    const rows: any[][] = [];
    account.lines.forEach(line => {
      rows.push([line.date, line.number, line.description, line.debit || '', line.credit || '', line.balance]);
    });
    rows.push(['TOTAL', '', '', account.totalDebit, account.totalCredit, account.balance]);
    downloadExcelXML(`Buku_Besar_${account.code}`, headers, rows);
  };

  const th: React.CSSProperties = { padding: '10px 14px', textAlign: 'left' as const, color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' as const, letterSpacing: '0.06em' };
  const td: React.CSSProperties = { padding: '10px 14px', fontSize: '0.84rem', borderBottom: '1px solid rgba(128,128,128,0.05)' };

  return (
    <>
      <div className="page-header animate-slide-up">
        <div>
          <h1 className="page-title">📚 {language === 'id' ? 'Buku Besar' : 'General Ledger'}</h1>
          <p className="page-subtitle">{language === 'id' ? 'Detail transaksi per akun dengan saldo berjalan' : 'Transaction detail per account with running balance'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary no-print" onClick={handleExportExcel}>⬇️ Excel</button>
          <button className="btn btn-secondary no-print" onClick={() => window.print()}>🖨️ PDF</button>
        </div>
      </div>

      <div className="page-content">
        {/* Account Selector */}
        <div className="glass-panel animate-slide-up delay-1" style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={selectedCode} onChange={e => setSelectedCode(e.target.value)} style={{ flex: 1, minWidth: 250 }}>
              <optgroup label="— Semua Akun Aktif —">
                {accountsWithActivity.map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
              </optgroup>
              <optgroup label="— Chart of Accounts —">
                {coa.filter(c => !accountsWithActivity.find(a => a.code === c.code)).map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
              </optgroup>
            </select>
            <div style={{ display: 'flex', gap: 10 }}>
              {coa.filter(c => accountsWithActivity.find(a => a.code === c.code)).slice(0, 5).map(c => (
                <button key={c.code} onClick={() => setSelectedCode(c.code)} className={`btn btn-sm ${selectedCode === c.code ? 'btn-primary' : 'btn-secondary'}`}>{c.code}</button>
              ))}
            </div>
          </div>
        </div>

        {account && (
          <>
            {/* Account Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }} className="animate-slide-up delay-2">
              {[
                { label: language === 'id' ? 'Nama Akun' : 'Account', value: account.name, color: 'var(--text-primary)' },
                { label: 'Total Debit', value: formatCurrency(account.totalDebit), color: 'var(--accent-primary)' },
                { label: 'Total Kredit', value: formatCurrency(account.totalCredit), color: 'var(--accent-danger)' },
                { label: language === 'id' ? 'Saldo' : 'Balance', value: formatCurrency(Math.abs(account.balance)), color: account.balance >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)' },
              ].map(s => (
                <div key={s.label} className="glass-panel" style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Ledger Table (T-Account style) */}
            <div className="glass-panel animate-slide-up delay-3">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem' }}>{account.code} — {account.name}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {language === 'id' ? 'Saldo Normal' : 'Normal Balance'}: <strong style={{ color: account.normalBalance === 'debit' ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>{account.normalBalance.toUpperCase()}</strong> · {account.lines.length} {language === 'id' ? 'transaksi' : 'entries'}
                  </p>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ ...th, width: 110 }}>{language === 'id' ? 'Tanggal' : 'Date'}</th>
                      <th style={{ ...th, width: 130 }}>No. Jurnal</th>
                      <th style={th}>{language === 'id' ? 'Keterangan' : 'Description'}</th>
                      <th style={{ ...th, textAlign: 'right' }}>Debit</th>
                      <th style={{ ...th, textAlign: 'right' }}>Kredit</th>
                      <th style={{ ...th, textAlign: 'right' }}>{language === 'id' ? 'Saldo' : 'Balance'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.lines.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>{language === 'id' ? 'Belum ada transaksi untuk akun ini' : 'No transactions for this account'}</td></tr>
                    ) : (
                      account.lines.map((line, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(128,128,128,0.05)' }}>
                          <td style={{ ...td, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{formatDate(line.date)}</td>
                          <td style={{ ...td, fontWeight: 600, fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>{line.number}</td>
                          <td style={{ ...td }}>{line.description}</td>
                          <td style={{ ...td, textAlign: 'right', color: 'var(--accent-primary)', fontWeight: 600 }}>{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
                          <td style={{ ...td, textAlign: 'right', color: 'var(--accent-danger)', fontWeight: 600 }}>{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
                          <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: line.balance >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>{formatCurrency(Math.abs(line.balance))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border-color)', background: 'rgba(128,128,128,0.04)' }}>
                      <td colSpan={3} style={{ ...td, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: 'var(--accent-primary)' }}>{formatCurrency(account.totalDebit)}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: 'var(--accent-danger)' }}>{formatCurrency(account.totalCredit)}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: account.balance >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>{formatCurrency(Math.abs(account.balance))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
