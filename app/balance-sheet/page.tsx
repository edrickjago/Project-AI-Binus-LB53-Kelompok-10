'use client';

import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency } from '../../lib/utils';
import { getLedger, getIncomeStatement, getBalanceSheet } from '../../lib/accounting';
import { downloadExcelXML } from '../../lib/export';

export default function BalanceSheetPage() {
  const { getAllJournalEntries, coa, transactions, manualJournalEntries, language, companyProfile } = useAppContext();
  
  const entries = useMemo(() => getAllJournalEntries(), [transactions, manualJournalEntries]);
  const ledger = useMemo(() => getLedger(entries, coa), [entries, coa]);
  const incomeStmt = useMemo(() => getIncomeStatement(ledger), [ledger]);
  const balanceSheet = useMemo(() => getBalanceSheet(ledger, incomeStmt.netIncome), [ledger, incomeStmt.netIncome]);

  const handleExportExcel = () => {
    const headers = ['Kategori', 'Kode Akun', 'Nama Akun', 'Nilai'];
    const rows: any[][] = [];
    rows.push(['ASET', '', '', '']);
    balanceSheet.assets.accounts.forEach(a => rows.push(['', a.code, a.name, a.amount]));
    rows.push(['TOTAL ASET', '', '', balanceSheet.assets.total]);
    rows.push(['', '', '', '']);
    rows.push(['LIABILITAS', '', '', '']);
    balanceSheet.liabilities.accounts.forEach(a => rows.push(['', a.code, a.name, a.amount]));
    rows.push(['TOTAL LIABILITAS', '', '', balanceSheet.liabilities.total]);
    rows.push(['', '', '', '']);
    rows.push(['EKUITAS', '', '', '']);
    balanceSheet.equity.accounts.forEach(a => rows.push(['', a.code, a.name, a.amount]));
    rows.push(['TOTAL EKUITAS', '', '', balanceSheet.equity.total]);
    rows.push(['', '', '', '']);
    rows.push(['TOTAL LIABILITAS & EKUITAS', '', '', balanceSheet.liabilities.total + balanceSheet.equity.total]);
    downloadExcelXML('Neraca_Keuangan', headers, rows);
  };

  const tdStyle: React.CSSProperties = { padding: '8px 12px', fontSize: '0.9rem' };
  const thStyle: React.CSSProperties = { ...tdStyle, fontWeight: 700, backgroundColor: 'rgba(128,128,128,0.05)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' };
  
  return (
    <>
      <div className="page-header animate-slide-up no-print">
        <div>
          <h1 className="page-title">🏢 {language === 'id' ? 'Neraca' : 'Balance Sheet'}</h1>
          <p className="page-subtitle">{language === 'id' ? 'Posisi keuangan perusahaan (Aset = Liabilitas + Ekuitas)' : 'Company financial position (Assets = Liabilities + Equity)'}</p>
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '5px 0' }}>{language === 'id' ? 'NERACA KEUANGAN' : 'BALANCE SHEET'}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Per tanggal {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: balanceSheet.isBalanced ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', color: balanceSheet.isBalanced ? '#10B981' : '#F43F5E', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              {balanceSheet.isBalanced ? '✅ SEIMBANG (BALANCED)' : '⚠️ TIDAK SEIMBANG (UNBALANCED)'}
            </div>
          </div>

          {/* Formal Accounting Table - Balance Sheet format (Assets on top, Liab+Equity below) */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono), monospace' }}>
            <tbody>
              {/* ASSETS SECTION */}
              <tr>
                <td colSpan={2} style={{ ...thStyle, borderBottom: '1px solid var(--border-color)', color: 'var(--accent-primary)' }}>{language === 'id' ? 'ASET' : 'ASSETS'}</td>
              </tr>
              {balanceSheet.assets.accounts.length === 0 ? (
                <tr><td colSpan={2} style={{ ...tdStyle, fontStyle: 'italic', color: 'var(--text-muted)', paddingLeft: 24 }}>Tidak ada aset tercatat</td></tr>
              ) : (
                balanceSheet.assets.accounts.map(acc => (
                  <tr key={acc.code}>
                    <td style={{ ...tdStyle, paddingLeft: 24 }}>{acc.code} - {acc.name}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(acc.amount)}</td>
                  </tr>
                ))
              )}
              <tr>
                <td style={{ ...tdStyle, paddingLeft: 24, fontWeight: 800 }}>TOTAL ASET</td>
                <td style={{ 
                  ...tdStyle, 
                  textAlign: 'right', 
                  fontWeight: 800, 
                  borderTop: '1px solid var(--border-color)',
                  borderBottom: '4px double var(--border-color)' 
                }}>
                  {formatCurrency(balanceSheet.assets.total)}
                </td>
              </tr>

              <tr><td colSpan={2} style={{ height: 30 }}></td></tr>

              {/* LIABILITIES SECTION */}
              <tr>
                <td colSpan={2} style={{ ...thStyle, borderBottom: '1px solid var(--border-color)', color: 'var(--accent-danger)' }}>{language === 'id' ? 'LIABILITAS (KEWAJIBAN)' : 'LIABILITIES'}</td>
              </tr>
              {balanceSheet.liabilities.accounts.length === 0 ? (
                <tr><td colSpan={2} style={{ ...tdStyle, fontStyle: 'italic', color: 'var(--text-muted)', paddingLeft: 24 }}>Tidak ada liabilitas</td></tr>
              ) : (
                balanceSheet.liabilities.accounts.map(acc => (
                  <tr key={acc.code}>
                    <td style={{ ...tdStyle, paddingLeft: 24 }}>{acc.code} - {acc.name}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(acc.amount)}</td>
                  </tr>
                ))
              )}
              <tr>
                <td style={{ ...tdStyle, paddingLeft: 24, fontWeight: 700 }}>Total Liabilitas</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, borderTop: '1px solid var(--border-color)' }}>
                  {formatCurrency(balanceSheet.liabilities.total)}
                </td>
              </tr>

              <tr><td colSpan={2} style={{ height: 20 }}></td></tr>

              {/* EQUITY SECTION */}
              <tr>
                <td colSpan={2} style={{ ...thStyle, borderBottom: '1px solid var(--border-color)', color: '#6366F1' }}>{language === 'id' ? 'EKUITAS (MODAL)' : 'EQUITY'}</td>
              </tr>
              {balanceSheet.equity.accounts.length === 0 ? (
                <tr><td colSpan={2} style={{ ...tdStyle, fontStyle: 'italic', color: 'var(--text-muted)', paddingLeft: 24 }}>Tidak ada ekuitas</td></tr>
              ) : (
                balanceSheet.equity.accounts.map(acc => (
                  <tr key={acc.code}>
                    <td style={{ ...tdStyle, paddingLeft: 24 }}>
                      {acc.code} - {acc.name}
                      {acc.code === 'L/R' && <span style={{ fontSize: '0.7em', marginLeft: 8, color: 'var(--text-muted)' }}>(Dari Laba Rugi)</span>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(acc.amount)}</td>
                  </tr>
                ))
              )}
              <tr>
                <td style={{ ...tdStyle, paddingLeft: 24, fontWeight: 700 }}>Total Ekuitas</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, borderTop: '1px solid var(--border-color)' }}>
                  {formatCurrency(balanceSheet.equity.total)}
                </td>
              </tr>

              <tr><td colSpan={2} style={{ height: 20 }}></td></tr>

              {/* TOTAL LIABILITIES + EQUITY */}
              <tr>
                <td style={{ ...tdStyle, fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase' }}>TOTAL LIABILITAS & EKUITAS</td>
                <td style={{ 
                  ...tdStyle, 
                  textAlign: 'right', 
                  fontWeight: 800, 
                  fontSize: '1.1rem',
                  borderTop: '2px solid var(--border-color)',
                  borderBottom: '4px double var(--border-color)'
                }}>
                  {formatCurrency(balanceSheet.liabilities.total + balanceSheet.equity.total)}
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
