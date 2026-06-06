'use client';

import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency, formatMonth } from '../../lib/utils';
import { getLedger, getIncomeStatement } from '../../lib/accounting';
import { downloadExcelXML } from '../../lib/export';

export default function IncomeStatementPage() {
  const { getAllJournalEntries, coa, transactions, manualJournalEntries, language, companyProfile } = useAppContext();
  
  const entries = useMemo(() => getAllJournalEntries(), [transactions, manualJournalEntries]);
  const ledger = useMemo(() => getLedger(entries, coa), [entries, coa]);
  const incomeStmt = useMemo(() => getIncomeStatement(ledger), [ledger]);

  const handleExportExcel = () => {
    const headers = ['Kategori', 'Kode Akun', 'Nama Akun', 'Nilai'];
    const rows: any[][] = [];
    rows.push(['PENDAPATAN', '', '', '']);
    incomeStmt.revenue.accounts.forEach(a => rows.push(['', a.code, a.name, a.amount]));
    rows.push(['TOTAL PENDAPATAN', '', '', incomeStmt.revenue.total]);
    rows.push(['', '', '', '']);
    rows.push(['BEBAN', '', '', '']);
    incomeStmt.expense.accounts.forEach(a => rows.push(['', a.code, a.name, a.amount]));
    rows.push(['TOTAL BEBAN', '', '', incomeStmt.expense.total]);
    rows.push(['', '', '', '']);
    rows.push(['LABA BERSIH', '', '', incomeStmt.netIncome]);
    downloadExcelXML('Laporan_Laba_Rugi', headers, rows);
  };

  const tdStyle: React.CSSProperties = { padding: '8px 12px', fontSize: '0.9rem' };
  const thStyle: React.CSSProperties = { ...tdStyle, fontWeight: 700, backgroundColor: 'rgba(128,128,128,0.05)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' };
  
  return (
    <>
      <div className="page-header animate-slide-up no-print">
        <div>
          <h1 className="page-title">📋 {language === 'id' ? 'Laporan Laba Rugi' : 'Income Statement'}</h1>
          <p className="page-subtitle">{language === 'id' ? 'Laporan kinerja keuangan perusahaan (Pendapatan vs Beban)' : 'Company financial performance report (Revenue vs Expenses)'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary no-print" onClick={handleExportExcel}>⬇️ Excel</button>
          <button className="btn btn-secondary no-print" onClick={() => window.print()}>🖨️ Cetak PDF</button>
        </div>
      </div>

      <div className="page-content">
        <div className="glass-panel animate-slide-up delay-1" style={{ maxWidth: 800, margin: '0 auto', backgroundColor: 'var(--bg-color)' }}>
          {/* Formal Report Header */}
          <div style={{ textAlign: 'center', marginBottom: 30, borderBottom: '2px solid var(--border-color)', paddingBottom: 20 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{companyProfile.name}</h2>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '5px 0' }}>{language === 'id' ? 'LAPORAN LABA RUGI' : 'INCOME STATEMENT'}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Untuk periode yang berakhir saat ini</p>
          </div>

          {/* Formal Accounting Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono), monospace' }}>
            <tbody>
              {/* REVENUE SECTION */}
              <tr>
                <td colSpan={2} style={{ ...thStyle, borderBottom: '1px solid var(--border-color)' }}>{language === 'id' ? 'PENDAPATAN' : 'REVENUE'}</td>
              </tr>
              {incomeStmt.revenue.accounts.length === 0 ? (
                <tr><td colSpan={2} style={{ ...tdStyle, fontStyle: 'italic', color: 'var(--text-muted)', paddingLeft: 24 }}>Tidak ada pendapatan</td></tr>
              ) : (
                incomeStmt.revenue.accounts.map(acc => (
                  <tr key={acc.code}>
                    <td style={{ ...tdStyle, paddingLeft: 24 }}>{acc.code} - {acc.name}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(acc.amount)}</td>
                  </tr>
                ))
              )}
              <tr>
                <td style={{ ...tdStyle, paddingLeft: 24, fontWeight: 700 }}>Total Pendapatan</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, borderTop: '1px solid var(--border-color)' }}>{formatCurrency(incomeStmt.revenue.total)}</td>
              </tr>

              <tr><td colSpan={2} style={{ height: 20 }}></td></tr>

              {/* EXPENSE SECTION */}
              <tr>
                <td colSpan={2} style={{ ...thStyle, borderBottom: '1px solid var(--border-color)' }}>{language === 'id' ? 'BEBAN & PENGELUARAN' : 'EXPENSES'}</td>
              </tr>
              {incomeStmt.expense.accounts.length === 0 ? (
                <tr><td colSpan={2} style={{ ...tdStyle, fontStyle: 'italic', color: 'var(--text-muted)', paddingLeft: 24 }}>Tidak ada beban</td></tr>
              ) : (
                incomeStmt.expense.accounts.map(acc => (
                  <tr key={acc.code}>
                    <td style={{ ...tdStyle, paddingLeft: 24 }}>{acc.code} - {acc.name}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(acc.amount)}</td>
                  </tr>
                ))
              )}
              <tr>
                <td style={{ ...tdStyle, paddingLeft: 24, fontWeight: 700 }}>Total Beban</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, borderTop: '1px solid var(--border-color)' }}>{formatCurrency(incomeStmt.expense.total)}</td>
              </tr>

              <tr><td colSpan={2} style={{ height: 30 }}></td></tr>

              {/* NET INCOME */}
              <tr>
                <td style={{ ...tdStyle, fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase' }}>
                  {incomeStmt.netIncome >= 0 ? (language === 'id' ? 'LABA BERSIH' : 'NET INCOME') : (language === 'id' ? 'RUGI BERSIH' : 'NET LOSS')}
                </td>
                <td style={{ 
                  ...tdStyle, 
                  textAlign: 'right', 
                  fontWeight: 800, 
                  fontSize: '1.1rem',
                  color: incomeStmt.netIncome >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)',
                  borderTop: '2px solid var(--border-color)',
                  borderBottom: '4px double var(--border-color)'
                }}>
                  {formatCurrency(incomeStmt.netIncome)}
                </td>
              </tr>
            </tbody>
          </table>
          
          <div style={{ marginTop: 40, borderTop: '1px solid var(--border-color)', paddingTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Digenerate secara otomatis oleh KasFlow System pada {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>
    </>
  );
}
