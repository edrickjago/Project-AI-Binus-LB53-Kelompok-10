'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency } from '../../lib/utils';

type ActivityType = 'operating' | 'investing' | 'financing';
type FraudRisk = 'low' | 'medium' | 'high';

interface ScannedTx {
  date: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  activityType: ActivityType;
  fraudRisk: FraudRisk;
  fraudNote: string;
  selected: boolean;
}

interface ScanResult {
  documentType: string;
  period: string;
  accountName: string;
  overallFraudRisk: FraudRisk;
  aiConclusion: string;
  transactions: Omit<ScannedTx, 'selected'>[];
  validCount: number;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const ACTIVITY_LABELS: Record<ActivityType, { label: string; icon: string; color: string }> = {
  operating:  { label: 'Operating',  icon: '⚙️', color: '#3b82f6' },
  investing:  { label: 'Investing',  icon: '📈', color: '#8b5cf6' },
  financing:  { label: 'Financing',  icon: '🏦', color: '#f59e0b' },
};

const FRAUD_LABELS: Record<FraudRisk, { label: string; color: string; bg: string }> = {
  low:    { label: 'Low Risk',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  medium: { label: 'Med Risk',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  high:   { label: 'High Risk', color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
};

const OVERALL_RISK_CONFIG: Record<FraudRisk, { icon: string; title: string; border: string; bg: string; color: string }> = {
  low:    { icon: '✅', title: 'Risiko Rendah',   border: 'rgba(34,197,94,0.35)',   bg: 'rgba(34,197,94,0.08)',   color: '#22c55e' },
  medium: { icon: '⚠️', title: 'Risiko Sedang',   border: 'rgba(245,158,11,0.35)',  bg: 'rgba(245,158,11,0.08)',  color: '#f59e0b' },
  high:   { icon: '🚨', title: 'Risiko Tinggi',   border: 'rgba(239,68,68,0.35)',   bg: 'rgba(239,68,68,0.08)',   color: '#ef4444' },
};

const EXCEL_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

function isExcelFile(name: string): boolean {
  return EXCEL_EXTENSIONS.some(ext => name.toLowerCase().endsWith(ext));
}

// ─── component ───────────────────────────────────────────────────────────────

export default function AiScannerPage() {
  const { language, addTransaction, accounts, activeAccountId, allExpenseCategories, allIncomeCategories } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview]       = useState<string | null>(null);
  const [fileName, setFileName]     = useState('');
  const [fileType, setFileType]     = useState<'image' | 'excel'>('image');
  const [excelCsv, setExcelCsv]    = useState<string>('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [result, setResult]         = useState<ScanResult | null>(null);
  const [txList, setTxList]         = useState<ScannedTx[]>([]);
  const [imported, setImported]     = useState(false);
  const [dragOver, setDragOver]     = useState(false);

  const isId = language === 'id';

  // ─── File processing ───────────────────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    setError('');
    setResult(null);
    setTxList([]);
    setImported(false);
    setExcelCsv('');

    const isExcel = isExcelFile(file.name);
    const isImage = file.type.startsWith('image/');
    const isPdf   = file.type === 'application/pdf';

    if (!isImage && !isPdf && !isExcel) {
      setError(isId
        ? 'Format file tidak didukung. Gunakan JPG, PNG, PDF, XLSX, XLS, atau CSV.'
        : 'Unsupported file format. Use JPG, PNG, PDF, XLSX, XLS, or CSV.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError(isId ? 'File terlalu besar (maks 20MB).' : 'File too large (max 20MB).');
      return;
    }

    setFileName(file.name);

    if (isExcel) {
      // ─── Excel/CSV: parse to text with SheetJS ─────────────────────
      setFileType('excel');
      try {
        const XLSX = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        // Combine all sheets
        let csvText = '';
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          if (workbook.SheetNames.length > 1) {
            csvText += `\n--- Sheet: ${sheetName} ---\n`;
          }
          csvText += csv + '\n';
        }
        setExcelCsv(csvText);
        // Show a "preview" marker (no image to show)
        setPreview('excel-file');
      } catch {
        setError(isId
          ? 'Gagal membaca file Excel. Pastikan file tidak rusak.'
          : 'Failed to read Excel file. Make sure the file is not corrupted.');
      }
    } else {
      // ─── Image/PDF: read as data URL ───────────────────────────────
      setFileType('image');
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, [isId]);

  const handleScan = async () => {
    if (!preview) return;

    setLoading(true);
    setError('');

    try {
      let res: Response;

      if (fileType === 'excel') {
        // ─── Send CSV text to text-based API ─────────────────────────
        res = await fetch('/api/scan-cashflow-text', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ csvText: excelCsv, fileName }),
        });
      } else {
        // ─── Send image to vision API ────────────────────────────────
        const base64   = preview!.split(',')[1];
        const mimeType = preview!.split(';')[0].split(':')[1];
        res = await fetch('/api/scan-cashflow', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ imageData: base64, mimeType }),
        });
      }

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Terjadi kesalahan'); return; }

      setResult(data);
      setTxList(data.transactions.map((tx: Omit<ScannedTx, 'selected'>) => ({ ...tx, selected: true })));
    } catch (err) {
      setError(isId ? 'Gagal menghubungi server. Pastikan koneksi internet aktif.' : 'Failed to reach server. Check your internet connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Export to Excel ───────────────────────────────────────────────────
  const handleExportExcel = async () => {
    if (!txList.length) return;

    const XLSX = await import('xlsx');

    const exportData = txList.map(tx => ({
      'Tanggal':        tx.date,
      'Tipe':           tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      'Jumlah':         tx.amount,
      'Kategori':       tx.category,
      'Activity Type':  tx.activityType === 'operating' ? 'Operating' : tx.activityType === 'investing' ? 'Investing' : 'Financing',
      'Fraud Risk':     tx.fraudRisk === 'low' ? 'Low' : tx.fraudRisk === 'medium' ? 'Medium' : 'High',
      'Fraud Note':     tx.fraudNote,
      'Keterangan':     tx.note,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    // Add summary rows at top if we have AI conclusion
    const wb = XLSX.utils.book_new();

    // Create summary sheet
    if (result) {
      const summaryData = [
        { Field: 'Document Type',     Value: result.documentType },
        { Field: 'Period',            Value: result.period },
        { Field: 'Account Name',      Value: result.accountName },
        { Field: 'Overall Fraud Risk', Value: result.overallFraudRisk.toUpperCase() },
        { Field: 'AI Conclusion',     Value: result.aiConclusion },
        { Field: 'Total Income',      Value: totalIncome },
        { Field: 'Total Expense',     Value: totalExpense },
        { Field: 'Total Transactions', Value: txList.length },
      ];
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      // Set column widths
      summaryWs['!cols'] = [{ wch: 20 }, { wch: 80 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    }

    // Set column widths for transactions
    ws['!cols'] = [
      { wch: 12 },  // Tanggal
      { wch: 12 },  // Tipe
      { wch: 15 },  // Jumlah
      { wch: 18 },  // Kategori
      { wch: 14 },  // Activity Type
      { wch: 12 },  // Fraud Risk
      { wch: 40 },  // Fraud Note
      { wch: 40 },  // Keterangan
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    const docName = result?.documentType?.replace(/[^a-zA-Z0-9]/g, '_') || 'scan_result';
    XLSX.writeFile(wb, `KasFlow_AI_Scan_${docName}.xlsx`);
  };

  // ─── Drag & drop / file select ─────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // ─── Table actions ─────────────────────────────────────────────────────
  const toggleTx  = (idx: number) => setTxList(prev => prev.map((tx, i) => i === idx ? { ...tx, selected: !tx.selected } : tx));
  const toggleAll = () => { const all = txList.every(t => t.selected); setTxList(prev => prev.map(t => ({ ...t, selected: !all }))); };
  const updateTx  = (idx: number, field: keyof ScannedTx, value: string | number) =>
    setTxList(prev => prev.map((tx, i) => i === idx ? { ...tx, [field]: value } : tx));

  const handleImport = () => {
    const selected = txList.filter(tx => tx.selected);
    if (!selected.length) return;
    const targetAccountId = activeAccountId === 'all' ? (accounts[0]?.id ?? 'default') : activeAccountId;
    selected.forEach(tx => addTransaction({
      type: tx.type, amount: tx.amount, category: tx.category,
      date: tx.date, note: `[AI Scan] ${tx.note}`, accountId: targetAccountId, isRecurring: false,
    }));
    setImported(true);
  };

  const resetAll = () => {
    setPreview(null); setFileName(''); setResult(null); setTxList([]);
    setImported(false); setError(''); setExcelCsv(''); setFileType('image');
  };

  const selectedCount  = txList.filter(tx => tx.selected).length;
  const totalIncome    = txList.filter(tx => tx.selected && tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const totalExpense   = txList.filter(tx => tx.selected && tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const categories     = (type: 'income' | 'expense') => type === 'income' ? allIncomeCategories : allExpenseCategories;

  const riskConfig = result ? OVERALL_RISK_CONFIG[result.overallFraudRisk ?? 'low'] : null;

  return (
    <>
      <div className="page-header animate-slide-up">
        <div>
          <h1 className="page-title">🤖 AI Scanner</h1>
          <p className="page-subtitle">
            {isId
              ? 'Upload gambar, PDF, atau Excel untuk dianalisis AI secara otomatis'
              : 'Upload image, PDF, or Excel for automatic AI analysis'}
          </p>
        </div>
        {(preview || result) && (
          <button className="btn btn-secondary" onClick={resetAll}>🔄 Reset</button>
        )}
      </div>

      <div className="page-content">
        {/* Error */}
        {error && (
          <div className="animate-slide-up" style={{ background: 'var(--accent-danger-dim)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 14, padding: '14px 18px', marginBottom: 18, color: 'var(--accent-danger)', fontSize: '0.88rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* Upload Area */}
        {!result && (
          <div className="glass-panel animate-slide-up" style={{ marginBottom: 20 }}>
            {!preview ? (
              <div
                className={`scanner-dropzone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="scanner-dropzone-icon">📄</div>
                <div className="scanner-dropzone-title">{isId ? 'Seret & Lepas File di Sini' : 'Drag & Drop File Here'}</div>
                <div className="scanner-dropzone-sub">{isId ? 'atau klik untuk memilih file' : 'or click to browse files'}</div>
                <div className="scanner-dropzone-formats">JPG, PNG, PDF, XLSX, XLS, CSV (maks 20MB)</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{fileType === 'excel' ? '📊' : '📎'}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{fileName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {fileType === 'excel' && (
                          <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '1px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600 }}>
                            Excel
                          </span>
                        )}
                        {isId ? 'Siap untuk di-scan' : 'Ready to scan'}
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setPreview(null); setFileName(''); setExcelCsv(''); setFileType('image'); }}>
                    {isId ? 'Ganti File' : 'Change File'}
                  </button>
                </div>

                {/* Image Preview (only for images) */}
                {fileType === 'image' && preview && preview.startsWith('data:image') && (
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: 16, maxHeight: 350, display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                    <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 350, objectFit: 'contain' }} />
                  </div>
                )}

                {/* Excel Preview */}
                {fileType === 'excel' && excelCsv && (
                  <div style={{ borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 16, padding: 16, background: 'rgba(0,0,0,0.15)', maxHeight: 250, overflow: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 18 }}>📊</span>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{isId ? 'Preview Data Excel' : 'Excel Data Preview'}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {excelCsv.split('\n').filter(l => l.trim()).length} {isId ? 'baris' : 'rows'}
                      </span>
                    </div>
                    <pre style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, maxHeight: 160, overflow: 'auto' }}>
                      {excelCsv.slice(0, 2000)}{excelCsv.length > 2000 ? '\n...(truncated)' : ''}
                    </pre>
                  </div>
                )}

                <button className="btn btn-primary btn-full" onClick={handleScan} disabled={loading} style={{ fontSize: '1rem', padding: '14px 24px' }}>
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="scanner-spinner" /> {isId ? 'AI sedang menganalisis...' : 'AI is analyzing...'}
                    </span>
                  ) : (
                    <>{isId ? '🤖 Scan dengan AI' : '🤖 Scan with AI'}</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {result && !imported && (
          <>
            {/* Document Info */}
            <div className="glass-panel animate-slide-up" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--accent-secondary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📋</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{result.documentType}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {result.accountName !== '-' && `${result.accountName} · `}{result.period}
                  </div>
                </div>
              </div>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card" style={{ padding: '14px 16px' }}>
                  <div className="stat-label">{isId ? 'Transaksi' : 'Transactions'}</div>
                  <div className="stat-amount" style={{ fontSize: '1.2rem' }}>{selectedCount}/{txList.length}</div>
                </div>
                <div className="stat-card" style={{ padding: '14px 16px' }}>
                  <div className="stat-label">{isId ? 'Total Masuk' : 'Total In'}</div>
                  <div className="stat-amount text-income" style={{ fontSize: '1rem' }}>{formatCurrency(totalIncome)}</div>
                </div>
                <div className="stat-card" style={{ padding: '14px 16px' }}>
                  <div className="stat-label">{isId ? 'Total Keluar' : 'Total Out'}</div>
                  <div className="stat-amount text-expense" style={{ fontSize: '1rem' }}>{formatCurrency(totalExpense)}</div>
                </div>
              </div>
            </div>

            {/* ── AI Conclusion Card ── */}
            {riskConfig && result.aiConclusion && (
              <div
                className="animate-slide-up"
                style={{
                  marginBottom: 16,
                  borderRadius: 16,
                  border: `1.5px solid ${riskConfig.border}`,
                  background: riskConfig.bg,
                  padding: '18px 20px',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 28 }}>{riskConfig.icon}</div>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em',
                    background: riskConfig.color, color: '#fff',
                    padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap',
                  }}>
                    {riskConfig.title}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: riskConfig.color, marginBottom: 6 }}>
                    🤖 Kesimpulan AI
                  </div>
                  <div style={{ fontSize: '0.85rem', lineHeight: 1.65, color: 'var(--text-primary)' }}>
                    {result.aiConclusion}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                    {(['low','medium','high'] as FraudRisk[]).map(risk => {
                      const count = txList.filter(t => t.fraudRisk === risk).length;
                      if (!count) return null;
                      const cfg = FRAUD_LABELS[risk];
                      return (
                        <span key={risk} style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                          {cfg.label}: {count}
                        </span>
                      );
                    })}
                    {(['operating','investing','financing'] as ActivityType[]).map(act => {
                      const count = txList.filter(t => t.activityType === act).length;
                      if (!count) return null;
                      const cfg = ACTIVITY_LABELS[act];
                      return (
                        <span key={act} style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                          {cfg.icon} {cfg.label}: {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Table */}
            <div className="glass-panel animate-slide-up delay-1" style={{ marginBottom: 16, overflowX: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {isId ? 'Hasil Scan Transaksi' : 'Scanned Transactions'}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleExportExcel}
                    style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    📥 Export Excel
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={toggleAll}>
                    {txList.every(tx => tx.selected) ? (isId ? 'Batal Semua' : 'Deselect All') : (isId ? 'Pilih Semua' : 'Select All')}
                  </button>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '8px 6px', textAlign: 'center', width: 32 }}>✓</th>
                    <th style={{ padding: '8px 6px', textAlign: 'left', whiteSpace: 'nowrap' }}>{isId ? 'Tanggal' : 'Date'}</th>
                    <th style={{ padding: '8px 6px', textAlign: 'left', whiteSpace: 'nowrap' }}>{isId ? 'Tipe' : 'Type'}</th>
                    <th style={{ padding: '8px 6px', textAlign: 'left', whiteSpace: 'nowrap' }}>{isId ? 'Kategori' : 'Category'}</th>
                    <th style={{ padding: '8px 6px', textAlign: 'left', whiteSpace: 'nowrap' }}>Activity</th>
                    <th style={{ padding: '8px 6px', textAlign: 'left', whiteSpace: 'nowrap' }}>Fraud Risk</th>
                    <th style={{ padding: '8px 6px', textAlign: 'left', whiteSpace: 'nowrap' }}>{isId ? 'Keterangan' : 'Note'}</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right', whiteSpace: 'nowrap' }}>{isId ? 'Jumlah' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody>
                  {txList.map((tx, idx) => {
                    const fraudCfg = FRAUD_LABELS[tx.fraudRisk];
                    const actCfg   = ACTIVITY_LABELS[tx.activityType];
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', opacity: tx.selected ? 1 : 0.35, transition: 'opacity 0.2s' }}>
                        <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                          <input type="checkbox" checked={tx.selected} onChange={() => toggleTx(idx)} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                        </td>
                        <td style={{ padding: '8px 6px' }}>
                          <input type="date" value={tx.date} onChange={e => updateTx(idx, 'date', e.target.value)} style={{ padding: '3px 6px', fontSize: '0.78rem', width: 128 }} />
                        </td>
                        <td style={{ padding: '8px 6px' }}>
                          <select value={tx.type} onChange={e => updateTx(idx, 'type', e.target.value)} style={{ padding: '3px 6px', fontSize: '0.78rem', width: 92, color: tx.type === 'income' ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>
                            <option value="income">{isId ? 'Masuk' : 'Income'}</option>
                            <option value="expense">{isId ? 'Keluar' : 'Expense'}</option>
                          </select>
                        </td>
                        <td style={{ padding: '8px 6px' }}>
                          <select value={tx.category} onChange={e => updateTx(idx, 'category', e.target.value)} style={{ padding: '3px 6px', fontSize: '0.78rem', width: 140 }}>
                            {categories(tx.type).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '8px 6px' }}>
                          <select
                            value={tx.activityType}
                            onChange={e => updateTx(idx, 'activityType', e.target.value)}
                            style={{ padding: '3px 6px', fontSize: '0.78rem', width: 116, color: actCfg.color, fontWeight: 600 }}
                          >
                            <option value="operating">⚙️ Operating</option>
                            <option value="investing">📈 Investing</option>
                            <option value="financing">🏦 Financing</option>
                          </select>
                        </td>
                        <td style={{ padding: '8px 6px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <select
                              value={tx.fraudRisk}
                              onChange={e => updateTx(idx, 'fraudRisk', e.target.value)}
                              style={{ padding: '3px 6px', fontSize: '0.76rem', fontWeight: 700, color: fraudCfg.color, background: fraudCfg.bg, border: `1px solid ${fraudCfg.color}50`, borderRadius: 6, width: 100 }}
                            >
                              <option value="low">✅ Low</option>
                              <option value="medium">⚠️ Medium</option>
                              <option value="high">🚨 High</option>
                            </select>
                            {tx.fraudNote && (
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', maxWidth: 140, lineHeight: 1.3 }} title={tx.fraudNote}>
                                {tx.fraudNote.length > 40 ? tx.fraudNote.slice(0, 40) + '…' : tx.fraudNote}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '8px 6px' }}>
                          <input value={tx.note} onChange={e => updateTx(idx, 'note', e.target.value)} style={{ padding: '3px 6px', fontSize: '0.78rem', width: '100%', minWidth: 130 }} />
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, color: tx.type === 'income' ? 'var(--accent-primary)' : 'var(--accent-danger)', whiteSpace: 'nowrap' }}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Import Button */}
            <div className="animate-slide-up delay-2" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={resetAll}>{isId ? '❌ Batal' : '❌ Cancel'}</button>
              <button className="btn btn-primary" onClick={handleImport} disabled={selectedCount === 0} style={{ fontSize: '0.95rem', padding: '12px 28px' }}>
                {isId ? `✅ Import ${selectedCount} Transaksi` : `✅ Import ${selectedCount} Transactions`}
              </button>
            </div>
          </>
        )}

        {/* Success */}
        {imported && (
          <div className="glass-panel animate-slide-up" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>
              {isId ? 'Import Berhasil!' : 'Import Successful!'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              {isId ? `${selectedCount} transaksi berhasil ditambahkan ke sistem KasFlow.` : `${selectedCount} transactions have been added to KasFlow.`}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={resetAll}>{isId ? '📄 Scan Lagi' : '📄 Scan Again'}</button>
              <Link href="/transactions" className="btn btn-primary">{isId ? '💳 Lihat Transaksi' : '💳 View Transactions'}</Link>
            </div>
          </div>
        )}

        {/* How to Guide */}
        {!preview && !result && (
          <div className="glass-panel animate-slide-up delay-1" style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14 }}>
              {isId ? '📖 Cara Penggunaan' : '📖 How to Use'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { icon: '1️⃣', title: isId ? 'Upload Dokumen' : 'Upload Document', desc: isId ? 'Seret foto, PDF, atau file Excel (XLSX/XLS/CSV)' : 'Drag a photo, PDF, or Excel file (XLSX/XLS/CSV)' },
                { icon: '2️⃣', title: isId ? 'AI Menganalisis' : 'AI Analyzes', desc: isId ? 'Gemini AI membaca, mengekstrak, dan menilai risiko transaksi' : 'Gemini AI reads, extracts, and assesses transaction risk' },
                { icon: '3️⃣', title: isId ? 'Review & Edit' : 'Review & Edit', desc: isId ? 'Periksa hasil, edit kategori, activity type, dan fraud risk' : 'Check results, edit categories, activity type, and fraud risk' },
                { icon: '4️⃣', title: isId ? 'Export & Import' : 'Export & Import', desc: isId ? 'Export ke Excel atau import langsung ke sistem KasFlow' : 'Export to Excel or import directly into KasFlow system' },
              ].map(step => (
                <div key={step.icon} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 24, flexShrink: 0 }}>{step.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 4 }}>{step.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
