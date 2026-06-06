import { ChartOfAccount, JournalEntry, JournalLine, Transaction, Account } from '../types';
import { generateId } from './utils';

// ── Default Chart of Accounts (Standar Indonesia) ──────────────────────────
export const DEFAULT_COA: ChartOfAccount[] = [
  // ASET (1xxx)
  { code: '1100', name: 'Kas',                    type: 'asset',     normalBalance: 'debit',  isSystem: true, description: 'Uang tunai di tangan' },
  { code: '1200', name: 'Bank',                   type: 'asset',     normalBalance: 'debit',  isSystem: true, description: 'Saldo rekening bank' },
  { code: '1300', name: 'Piutang Usaha',          type: 'asset',     normalBalance: 'debit',  description: 'Tagihan kepada pelanggan' },
  { code: '1400', name: 'Persediaan',             type: 'asset',     normalBalance: 'debit',  description: 'Stok barang dagang' },
  { code: '1500', name: 'Biaya Dibayar Dimuka',   type: 'asset',     normalBalance: 'debit',  description: 'Biaya yang dibayar di muka' },
  { code: '1600', name: 'Aset Tetap',             type: 'asset',     normalBalance: 'debit',  description: 'Peralatan, gedung, kendaraan' },
  { code: '1610', name: 'Akumulasi Penyusutan',   type: 'asset',     normalBalance: 'credit', description: 'Pengurang aset tetap' },
  // LIABILITAS (2xxx)
  { code: '2100', name: 'Utang Usaha',            type: 'liability', normalBalance: 'credit', description: 'Tagihan dari pemasok' },
  { code: '2200', name: 'Utang Bank',             type: 'liability', normalBalance: 'credit', description: 'Pinjaman bank' },
  { code: '2300', name: 'Utang Pajak',            type: 'liability', normalBalance: 'credit', description: 'Pajak yang belum dibayar' },
  { code: '2400', name: 'Beban Yang Masih Harus Dibayar', type: 'liability', normalBalance: 'credit', description: 'Beban yang masih terutang' },
  // EKUITAS (3xxx)
  { code: '3100', name: 'Modal Pemilik',          type: 'equity',    normalBalance: 'credit', isSystem: true, description: 'Modal disetor pemilik' },
  { code: '3200', name: 'Prive',                  type: 'equity',    normalBalance: 'debit',  description: 'Penarikan modal pemilik' },
  { code: '3300', name: 'Laba Ditahan',           type: 'equity',    normalBalance: 'credit', description: 'Akumulasi laba/rugi sebelumnya' },
  // PENDAPATAN (4xxx)
  { code: '4100', name: 'Pendapatan Usaha',       type: 'revenue',   normalBalance: 'credit', isSystem: true, description: 'Pendapatan dari kegiatan utama' },
  { code: '4200', name: 'Pendapatan Lain-lain',   type: 'revenue',   normalBalance: 'credit', description: 'Bunga, dividen, dll.' },
  // BEBAN (5xxx)
  { code: '5100', name: 'Beban Gaji',             type: 'expense',   normalBalance: 'debit',  description: 'Gaji dan tunjangan karyawan' },
  { code: '5200', name: 'Beban Makanan',          type: 'expense',   normalBalance: 'debit',  description: 'Konsumsi dan F&B' },
  { code: '5300', name: 'Beban Transportasi',     type: 'expense',   normalBalance: 'debit',  description: 'Biaya perjalanan & kendaraan' },
  { code: '5400', name: 'Beban Tagihan',          type: 'expense',   normalBalance: 'debit',  description: 'Listrik, air, telepon, internet' },
  { code: '5500', name: 'Beban Hiburan',          type: 'expense',   normalBalance: 'debit',  description: 'Entertainment & rekreasi' },
  { code: '5600', name: 'Beban Kesehatan',        type: 'expense',   normalBalance: 'debit',  description: 'Biaya medis & kesehatan' },
  { code: '5700', name: 'Beban Belanja',          type: 'expense',   normalBalance: 'debit',  description: 'Pembelian barang konsumsi' },
  { code: '5800', name: 'Beban Pendidikan',       type: 'expense',   normalBalance: 'debit',  description: 'Biaya belajar & pelatihan' },
  { code: '5900', name: 'Beban Sewa',             type: 'expense',   normalBalance: 'debit',  description: 'Sewa rumah, kantor, dll.' },
  { code: '5999', name: 'Beban Lain-lain',        type: 'expense',   normalBalance: 'debit',  description: 'Beban diluar kategori lain' },
];

// ── Category → COA Code Mapping ──────────────────────────────────────────────
export const CATEGORY_COA_MAP: Record<string, string> = {
  '💼 Gaji': '4100',    '🎁 Bonus': '4100',   '💻 Freelance': '4100',
  '📈 Investasi': '4200', '🏪 Bisnis': '4100',  '📦 Lainnya': '4200',
  '🍜 Makanan': '5200', '🚗 Transportasi': '5300', '📱 Tagihan': '5400',
  '🎮 Hiburan': '5500', '🏥 Kesehatan': '5600',  '🛍️ Belanja': '5700',
  '📚 Pendidikan': '5800', '🏠 Rumah': '5900',
};

// ── Account Type → COA Code ─────────────────────────────────────────────────
export const ACCOUNT_TYPE_COA: Record<string, string> = {
  cash: '1100', bank: '1200', ewallet: '1100',
  investment: '1600', credit: '2200',
};

// ── Generate Journal Entry from Transaction ──────────────────────────────────
export function generateJournalFromTransaction(
  tx: Transaction,
  accounts: Account[],
  coa: ChartOfAccount[],
  index: number
): JournalEntry {
  const year = tx.date.substring(0, 4);
  const number = `JU-${year}-${String(index + 1).padStart(4, '0')}`;

  const fromAcc = accounts.find(a => a.id === tx.accountId);
  const cashCode = fromAcc?.coaCode ?? ACCOUNT_TYPE_COA[fromAcc?.type ?? 'cash'] ?? '1100';
  const cashName = coa.find(c => c.code === cashCode)?.name ?? fromAcc?.name ?? 'Kas';

  let lines: JournalLine[] = [];

  if (tx.type === 'income') {
    const revCode = CATEGORY_COA_MAP[tx.category] ?? '4100';
    const revName = coa.find(c => c.code === revCode)?.name ?? tx.category;
    lines = [
      { accountCode: cashCode, accountName: cashName, debit: tx.amount, credit: 0 },
      { accountCode: revCode,  accountName: revName,  debit: 0, credit: tx.amount },
    ];
  } else if (tx.type === 'expense') {
    const expCode = CATEGORY_COA_MAP[tx.category] ?? '5999';
    const expName = coa.find(c => c.code === expCode)?.name ?? tx.category;
    lines = [
      { accountCode: expCode,  accountName: expName,  debit: tx.amount, credit: 0 },
      { accountCode: cashCode, accountName: cashName, debit: 0, credit: tx.amount },
    ];
  } else {
    // transfer
    const toAcc = accounts.find(a => a.id === tx.toAccountId);
    const toCode = toAcc?.coaCode ?? ACCOUNT_TYPE_COA[toAcc?.type ?? 'cash'] ?? '1100';
    const toName = coa.find(c => c.code === toCode)?.name ?? toAcc?.name ?? 'Kas';
    lines = [
      { accountCode: toCode,   accountName: toName,   debit: tx.amount, credit: 0 },
      { accountCode: cashCode, accountName: cashName, debit: 0, credit: tx.amount },
    ];
  }

  return {
    id: generateId(),
    date: tx.date,
    number,
    description: tx.category + (tx.note ? ' — ' + tx.note : ''),
    lines,
    createdAt: tx.createdAt,
    transactionId: tx.id,
    isAutomatic: true,
  };
}

// ── Get all journal entries (auto + manual) ─────────────────────────────────
export function getAllJournalEntries(
  transactions: Transaction[],
  accounts: Account[],
  coa: ChartOfAccount[],
  manualEntries: JournalEntry[]
): JournalEntry[] {
  const autoEntries = transactions.map((tx, i) =>
    generateJournalFromTransaction(tx, accounts, coa, i)
  );
  return [...autoEntries, ...manualEntries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.createdAt - b.createdAt
  );
}

// ── Ledger: balance per account ─────────────────────────────────────────────
export interface LedgerLine {
  date: string;
  number: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}
export interface LedgerAccount {
  code: string;
  name: string;
  type: string;
  normalBalance: 'debit' | 'credit';
  lines: LedgerLine[];
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export function getLedger(entries: JournalEntry[], coa: ChartOfAccount[]): LedgerAccount[] {
  const map: Record<string, LedgerAccount> = {};

  // Initialize all COA accounts
  coa.forEach(acc => {
    map[acc.code] = { code: acc.code, name: acc.name, type: acc.type, normalBalance: acc.normalBalance, lines: [], totalDebit: 0, totalCredit: 0, balance: 0 };
  });

  // Post journal lines
  entries.forEach(entry => {
    entry.lines.forEach(line => {
      if (!map[line.accountCode]) {
        map[line.accountCode] = { code: line.accountCode, name: line.accountName, type: 'asset', normalBalance: 'debit', lines: [], totalDebit: 0, totalCredit: 0, balance: 0 };
      }
      const acc = map[line.accountCode];
      acc.totalDebit += line.debit;
      acc.totalCredit += line.credit;
      const runningBalance = acc.normalBalance === 'debit'
        ? acc.totalDebit - acc.totalCredit
        : acc.totalCredit - acc.totalDebit;
      acc.balance = runningBalance;
      acc.lines.push({ date: entry.date, number: entry.number, description: entry.description, debit: line.debit, credit: line.credit, balance: runningBalance });
    });
  });

  return Object.values(map).sort((a, b) => a.code.localeCompare(b.code));
}

// ── Trial Balance ────────────────────────────────────────────────────────────
export interface TrialBalanceLine {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
}
export function getTrialBalance(ledger: LedgerAccount[]): { lines: TrialBalanceLine[]; totalDebit: number; totalCredit: number; isBalanced: boolean } {
  const lines: TrialBalanceLine[] = ledger
    .filter(a => a.totalDebit > 0 || a.totalCredit > 0)
    .map(a => ({
      code: a.code, name: a.name, type: a.type,
      debit: a.normalBalance === 'debit' ? Math.max(0, a.totalDebit - a.totalCredit) : 0,
      credit: a.normalBalance === 'credit' ? Math.max(0, a.totalCredit - a.totalDebit) : 0,
    }));
  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  return { lines, totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 };
}

// ── Income Statement ─────────────────────────────────────────────────────────
export interface IncomeStatementSection {
  accounts: { code: string; name: string; amount: number }[];
  total: number;
}
export function getIncomeStatement(ledger: LedgerAccount[]): { revenue: IncomeStatementSection; expense: IncomeStatementSection; netIncome: number } {
  const revenue: IncomeStatementSection = { accounts: [], total: 0 };
  const expense: IncomeStatementSection = { accounts: [], total: 0 };
  ledger.forEach(a => {
    if (a.type === 'revenue' && a.balance > 0) {
      revenue.accounts.push({ code: a.code, name: a.name, amount: a.balance });
      revenue.total += a.balance;
    }
    if (a.type === 'expense' && a.balance > 0) {
      expense.accounts.push({ code: a.code, name: a.name, amount: a.balance });
      expense.total += a.balance;
    }
  });
  return { revenue, expense, netIncome: revenue.total - expense.total };
}

// ── Balance Sheet ────────────────────────────────────────────────────────────
export interface BalanceSheetSection { accounts: { code: string; name: string; amount: number }[]; total: number; }
export function getBalanceSheet(ledger: LedgerAccount[], netIncome: number): {
  assets: BalanceSheetSection; liabilities: BalanceSheetSection; equity: BalanceSheetSection; isBalanced: boolean;
} {
  const assets: BalanceSheetSection = { accounts: [], total: 0 };
  const liabilities: BalanceSheetSection = { accounts: [], total: 0 };
  const equity: BalanceSheetSection = { accounts: [], total: 0 };
  ledger.forEach(a => {
    if (a.type === 'asset' && a.balance !== 0) { assets.accounts.push({ code: a.code, name: a.name, amount: a.balance }); assets.total += a.balance; }
    if (a.type === 'liability' && a.balance !== 0) { liabilities.accounts.push({ code: a.code, name: a.name, amount: a.balance }); liabilities.total += a.balance; }
    if (a.type === 'equity' && a.balance !== 0) { equity.accounts.push({ code: a.code, name: a.name, amount: a.balance }); equity.total += a.balance; }
  });
  equity.accounts.push({ code: 'L/R', name: 'Laba/Rugi Berjalan', amount: netIncome });
  equity.total += netIncome;
  return { assets, liabilities, equity, isBalanced: Math.abs(assets.total - (liabilities.total + equity.total)) < 0.01 };
}
