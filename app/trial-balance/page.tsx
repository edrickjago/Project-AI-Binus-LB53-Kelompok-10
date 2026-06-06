'use client';

import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency } from '../../lib/utils';
import { getLedger, getTrialBalance } from '../../lib/accounting';
import { downloadExcelXML } from '../../lib/export';

const TYPE_COLORS: Record<string, string> = {
  asset: '#10B981', liability: '#F43F5E', equity: '#6366F1', revenue: '#06B6D4', expense: '#F59E0B',
};
const TYPE_LABELS: Record<string, Record<string, string>> = {
  asset: { en: 'Asset', id: 'Aset' }, liability: { en: 'Liability', id: 'Liabilitas' },
  equity: { en: 'Equity', id: 'Ekuitas' }, revenue: { en: 'Revenue', id: 'Pendapatan' },
  expense: { en: 'Expense', id: 'Beban' },
};

export default function TrialBalancePage() {
  const { getAllJournalEntries, coa, transactions, manualJournalEntries, language } = useAppContext();
  const entries = useMemo(() => getAllJournalEntries(), [transactions, manualJournalEntries]);
  const ledger = useMemo(() => getLedger(entries, coa), [entries, coa]);
  const tb = useMemo(() => getTrialBalance(ledger), [ledger]);

  const handleExportExcel = () => {
    const headers = ['Kode Akun', 'Nama Akun', 'Tipe', 'Debit', 'Kredit'];
    const rows: any[][] = [];
    tb.lines.forEach(line => {
      rows.push([line.code, line.name, TYPE_LABELS[line.type][language] ?? line.type, line.debit || '', line.credit || '']);
    });
    rows.push(['TOTAL', '', '', tb.totalDebit, tb.totalCredit]);
    downloadExcelXML('Neraca_Saldo', headers, rows);
  };

  const th: React.CSSProperties = { padding: '10px 14px', textAlign: 'left' as const, color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' as const, letterSpacing: '0.06em' };
  const td: React.CSSProperties = { padding: '10px 14px', fontSize: '0.85rem', borderBottom: '1px solid rgba(128,128,128,0.05)' };

  const groupedByType = tb.lines.reduce((acc, line) => {
    if (!acc[line.type]) acc[line.type] = [];
    acc[line.type].push(line);
    return acc;
  }, {} as Record<string, typeof tb.lines>);

  const typeOrder = ['asset', 'liability', 'equity', 'revenue', 'expense'];

  return (
    <>
      <div className="page-header animate-slide-up">
        <div>
          <h1 className="page-title">⚖️ {language === 'id' ? 'Neraca Saldo' : 'Trial Balance'}</h1>
          <p className="page-subtitle">{language === 'id' ? 'Verifikasi keseimbangan debit dan kredit seluruh akun' : 'Verify debit and credit balance across all accounts'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary no-print" onClick={handleExportExcel}>⬇️ Excel</button>
          <button className="btn btn-secondary no-print" onClick={() => window.print()}>🖨️ PDF</button>
        </div>
      </div>

      <div className="page-content">
        {/* Balance Indicator */}
        <div className="glass-panel animate-slide-up delay-1" style={{ marginBottom: 18, textAlign: 'center', padding: 24, borderLeft: `4px solid ${tb.isBalanced ? 'var(--accent-primary)' : 'var(--accent-danger)'}` }}>
          <div style={{ fontSize: '2rem', marginBottom: 6 }}>{tb.isBalanced ? '✅' : '⚠️'}</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: tb.isBalanced ? 'var(--accent-primary)' : 'var(--accent-danger)', marginBottom: 4 }}>
            {tb.isBalanced ? (language === 'id' ? 'Neraca Saldo SEIMBANG' : 'Trial Balance BALANCED') : (language === 'id' ? 'Neraca Saldo TIDAK SEIMBANG' : 'Trial Balance NOT BALANCED')}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Total Debit: <strong style={{ color: 'var(--accent-primary)' }}>{formatCurrency(tb.totalDebit)}</strong>
            {'  |  '}
            Total Kredit: <strong style={{ color: 'var(--accent-danger)' }}>{formatCurrency(tb.totalCredit)}</strong>
          </div>
        </div>

        {/* Trial Balance Table */}
        <div className="glass-panel animate-slide-up delay-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: '0.95rem' }}>{language === 'id' ? 'Daftar Saldo Akun' : 'Account Balances'}</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{tb.lines.length} {language === 'id' ? 'akun aktif' : 'active accounts'}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ ...th, width: 90 }}>Kode</th>
                  <th style={th}>{language === 'id' ? 'Nama Akun' : 'Account Name'}</th>
                  <th style={{ ...th, width: 110 }}>{language === 'id' ? 'Tipe' : 'Type'}</th>
                  <th style={{ ...th, textAlign: 'right' }}>Debit (Rp)</th>
                  <th style={{ ...th, textAlign: 'right' }}>Kredit (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {tb.lines.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>{language === 'id' ? 'Belum ada transaksi' : 'No transactions yet'}</td></tr>
                ) : (
                  typeOrder.filter(t => groupedByType[t]).map(type => (
                    <>
                      <tr key={`group-${type}`} style={{ background: `${TYPE_COLORS[type]}0D` }}>
                        <td colSpan={5} style={{ padding: '7px 14px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: TYPE_COLORS[type] }}>
                          {TYPE_LABELS[type][language] ?? type}
                        </td>
                      </tr>
                      {groupedByType[type].map(line => (
                        <tr key={line.code}>
                          <td style={{ ...td, fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem', color: TYPE_COLORS[line.type] }}>{line.code}</td>
                          <td style={td}>{line.name}</td>
                          <td style={{ ...td }}>
                            <span style={{ fontSize: '0.72rem', background: `${TYPE_COLORS[line.type]}18`, color: TYPE_COLORS[line.type], padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                              {TYPE_LABELS[line.type][language]}
                            </span>
                          </td>
                          <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: line.debit > 0 ? 'var(--accent-primary)' : 'var(--text-muted)' }}>{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
                          <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: line.credit > 0 ? 'var(--accent-danger)' : 'var(--text-muted)' }}>{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
                        </tr>
                      ))}
                    </>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border-color)', background: 'rgba(128,128,128,0.05)' }}>
                  <td colSpan={3} style={{ ...td, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>TOTAL</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1rem' }}>{formatCurrency(tb.totalDebit)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: 'var(--accent-danger)', fontSize: '1rem' }}>{formatCurrency(tb.totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
