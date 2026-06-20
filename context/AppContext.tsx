'use client';

import { createContext, useContext, ReactNode, useEffect, useMemo, useCallback, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { supabase } from '../lib/supabase';
import { Transaction, Budget, Account, Language, Theme, ChartOfAccount, JournalEntry, Invoice, Customer, CompanyProfile } from '../types';
import { generateId } from '../lib/utils';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/categories';
import { createTranslator } from '../lib/translations';
import { DEFAULT_COA, getAllJournalEntries as _getAllEntries } from '../lib/accounting';

export const DEFAULT_ACCOUNT: Account = {
  id: 'default', name: 'Main Wallet', type: 'cash',
  color: '#10B981', icon: '💵', createdAt: Date.now(),
};

// --- Mappers ---
const mapTx = (row: any): Transaction => ({
  id: row.id, type: row.type, amount: Number(row.amount), category: row.category,
  date: row.date, note: row.note, createdAt: Number(row.created_at),
  accountId: row.account_id, toAccountId: row.to_account_id,
  isRecurring: row.is_recurring, recurrenceType: row.recurrence_type,
});
const unmapTx = (tx: Transaction) => ({
  id: tx.id, type: tx.type, amount: tx.amount, category: tx.category,
  date: tx.date, note: tx.note, created_at: tx.createdAt,
  account_id: tx.accountId, to_account_id: tx.toAccountId,
  is_recurring: tx.isRecurring, recurrence_type: tx.recurrenceType,
});

const mapAcc = (row: any): Account => ({
  id: row.id, name: row.name, type: row.type, color: row.color, icon: row.icon,
  createdAt: Number(row.created_at), coaCode: row.coa_code,
});
const unmapAcc = (acc: Account) => ({
  id: acc.id, name: acc.name, type: acc.type, color: acc.color, icon: acc.icon,
  created_at: acc.createdAt, coa_code: acc.coaCode,
});

const mapBud = (row: any): Budget => ({
  id: row.id, category: row.category, limitAmount: Number(row.limit_amount), month: row.month,
});
const unmapBud = (b: Budget) => ({
  id: b.id, category: b.category, limit_amount: b.limitAmount, month: b.month,
});

const mapCoa = (row: any): ChartOfAccount => ({
  code: row.code, name: row.name, type: row.type, normalBalance: row.normal_balance,
  isSystem: row.is_system, description: row.description,
});
const unmapCoa = (c: ChartOfAccount) => ({
  code: c.code, name: c.name, type: c.type, normal_balance: c.normalBalance,
  is_system: c.isSystem, description: c.description,
});

const mapJe = (row: any): JournalEntry => ({
  id: row.id, date: row.date, number: row.number, description: row.description,
  lines: row.lines, createdAt: Number(row.created_at),
  transactionId: row.transaction_id, isAutomatic: row.is_automatic,
});
const unmapJe = (e: JournalEntry) => ({
  id: e.id, date: e.date, number: e.number, description: e.description,
  lines: e.lines, created_at: e.createdAt,
  transaction_id: e.transactionId, is_automatic: e.isAutomatic,
});

interface AppContextType {
  transactions: Transaction[];
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  activeTransactions: Transaction[];
  budgets: Budget[];
  addBudget: (data: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, data: Partial<Omit<Budget, 'id'>>) => void;
  deleteBudget: (id: string) => void;
  accounts: Account[];
  activeAccountId: string;
  setActiveAccountId: (id: string) => void;
  addAccount: (data: Omit<Account, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, data: Partial<Omit<Account, 'id' | 'createdAt'>>) => void;
  deleteAccount: (id: string) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: string, vars?: Record<string, string>) => string;
  customExpenseCategories: string[];
  customIncomeCategories: string[];
  addExpenseCategory: (cat: string) => void;
  addIncomeCategory: (cat: string) => void;
  removeExpenseCategory: (cat: string) => void;
  removeIncomeCategory: (cat: string) => void;
  allExpenseCategories: string[];
  allIncomeCategories: string[];
  exportData: () => void;
  importData: (json: string) => void;
  clearData: () => void;
  coa: ChartOfAccount[];
  addCoaAccount: (acc: ChartOfAccount) => void;
  updateCoaAccount: (code: string, data: Partial<ChartOfAccount>) => void;
  deleteCoaAccount: (code: string) => void;
  manualJournalEntries: JournalEntry[];
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  deleteJournalEntry: (id: string) => void;
  getAllJournalEntries: () => JournalEntry[];
  companyProfile: CompanyProfile;
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // DB State (Persisted Locally fallback)
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('kasflow_txs', []);
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('kasflow_budgets', []);
  const [accounts, setAccounts] = useLocalStorage<Account[]>('kasflow_accs', [{ ...DEFAULT_ACCOUNT, id: 'default' }]);
  const [coa, setCoa] = useLocalStorage<ChartOfAccount[]>('kasflow_coa', DEFAULT_COA);
  const [manualJournalEntries, setManualJournalEntries] = useLocalStorage<JournalEntry[]>('kasflow_je', []);
  const [companyProfile, setCompanyProfile] = useLocalStorage<CompanyProfile>('kasflow_cp', {
    name: 'KASFLOW COMPANY', address: 'Jl. Sudirman No. 1, Jakarta', email: 'billing@company.com', phone: '021-555-1234'
  });


  // Local Preferences
  const [activeAccountId, setActiveAccountId] = useLocalStorage<string>('kasflow_activeAccount', 'all');
  const [theme, setThemeStore] = useLocalStorage<Theme>('kasflow_theme', 'dark');
  const [language, setLanguageStore] = useLocalStorage<Language>('kasflow_language', 'en');
  const [customExpenseCategories, setCustomExpense] = useLocalStorage<string[]>('kasflow_customExpense', []);
  const [customIncomeCategories, setCustomIncome] = useLocalStorage<string[]>('kasflow_customIncome', []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initial Supabase Load
  useEffect(() => {
    async function loadData() {
      try {
        const [ { data: accData }, { data: txData }, { data: budData }, { data: coaData }, { data: jeData }, { data: cpData } ] = await Promise.all([
          supabase.from('accounts').select('*'),
          supabase.from('transactions').select('*').order('created_at', { ascending: false }),
          supabase.from('budgets').select('*'),
          supabase.from('chart_of_accounts').select('*'),
          supabase.from('journal_entries').select('*'),
          supabase.from('company_profiles').select('*').limit(1),
        ]);

        let loadedAccs = accData ? accData.map(mapAcc) : [];
        if (loadedAccs.length === 0) {
          const defaultAcc = { ...DEFAULT_ACCOUNT, id: generateId() };
          await supabase.from('accounts').insert(unmapAcc(defaultAcc));
          loadedAccs = [defaultAcc];
        }
        setAccounts(loadedAccs);
        if (txData) setTransactions(txData.map(mapTx));
        if (budData) setBudgets(budData.map(mapBud));
        if (coaData && coaData.length > 0) setCoa(coaData.map(mapCoa));
        if (jeData) setManualJournalEntries(jeData.map(mapJe));
        if (cpData && cpData.length > 0) setCompanyProfile(cpData[0]);

      } catch (err) {
        console.error('Error loading Supabase data:', err);
      }
    }
    loadData();
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeStore(t);
    document.documentElement.setAttribute('data-theme', t);
  }, [setThemeStore]);

  const setLanguage = useCallback((l: Language) => setLanguageStore(l), [setLanguageStore]);

  const t = useMemo(() => createTranslator(language), [language]);

  const allExpenseCategories = useMemo(() => [...EXPENSE_CATEGORIES, ...customExpenseCategories], [customExpenseCategories]);
  const allIncomeCategories = useMemo(() => [...INCOME_CATEGORIES, ...customIncomeCategories], [customIncomeCategories]);

  const activeTransactions = useMemo(() => 
    activeAccountId === 'all'
      ? transactions
      : transactions.filter((tx) => tx.accountId === activeAccountId),
  [transactions, activeAccountId]);

  const addTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const tx: Transaction = {
      ...data,
      accountId: data.accountId || accounts[0]?.id || 'default',
      id: generateId(),
      createdAt: Date.now(),
    };
    setTransactions((prev) => [tx, ...prev]);
    await supabase.from('transactions').insert(unmapTx(tx));
  }, [accounts]);

  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('transactions').delete().eq('id', id);
  }, []);

  const updateTransaction = useCallback(async (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    
    // We only send the updated fields, map camel to snake
    const updatePayload: any = {};
    if (data.type) updatePayload.type = data.type;
    if (data.amount) updatePayload.amount = data.amount;
    if (data.category) updatePayload.category = data.category;
    if (data.date) updatePayload.date = data.date;
    if (data.note !== undefined) updatePayload.note = data.note;
    if (data.accountId) updatePayload.account_id = data.accountId;
    if (data.toAccountId) updatePayload.to_account_id = data.toAccountId;
    
    await supabase.from('transactions').update(updatePayload).eq('id', id);
  }, []);

  const addBudget = useCallback(async (data: Omit<Budget, 'id'>) => {
    const b: Budget = { ...data, id: generateId() };
    setBudgets((prev) => [...prev, b]);
    await supabase.from('budgets').insert(unmapBud(b));
  }, []);

  const updateBudget = useCallback(async (id: string, data: Partial<Omit<Budget, 'id'>>) => {
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
    const payload: any = {};
    if (data.category) payload.category = data.category;
    if (data.limitAmount) payload.limit_amount = data.limitAmount;
    if (data.month) payload.month = data.month;
    await supabase.from('budgets').update(payload).eq('id', id);
  }, []);

  const deleteBudget = useCallback(async (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    await supabase.from('budgets').delete().eq('id', id);
  }, []);

  const addAccount = useCallback(async (data: Omit<Account, 'id' | 'createdAt'>) => {
    const acc: Account = { ...data, id: generateId(), createdAt: Date.now() };
    setAccounts((prev) => [...prev, acc]);
    await supabase.from('accounts').insert(unmapAcc(acc));
  }, []);

  const updateAccount = useCallback(async (id: string, data: Partial<Omit<Account, 'id' | 'createdAt'>>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
    const payload: any = {};
    if (data.name) payload.name = data.name;
    if (data.type) payload.type = data.type;
    if (data.color) payload.color = data.color;
    if (data.icon) payload.icon = data.icon;
    if (data.coaCode) payload.coa_code = data.coaCode;
    await supabase.from('accounts').update(payload).eq('id', id);
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    if (activeAccountId === id) setActiveAccountId('all');
    await supabase.from('accounts').delete().eq('id', id);
  }, [activeAccountId, setActiveAccountId]);

  const addExpenseCategory = useCallback((cat: string) => setCustomExpense((prev) => [...prev, cat]), [setCustomExpense]);
  const addIncomeCategory = useCallback((cat: string) => setCustomIncome((prev) => [...prev, cat]), [setCustomIncome]);
  const removeExpenseCategory = useCallback((cat: string) => setCustomExpense((prev) => prev.filter((c) => c !== cat)), [setCustomExpense]);
  const removeIncomeCategory = useCallback((cat: string) => setCustomIncome((prev) => prev.filter((c) => c !== cat)), [setCustomIncome]);

  const exportData = useCallback(() => {
    const blob = new Blob(
      [JSON.stringify({ transactions, budgets, accounts, version: 2 }, null, 2)],
      { type: 'application/json' }
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kasflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }, [transactions, budgets, accounts]);

  const importData = useCallback(async (json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.accounts) {
        setAccounts(data.accounts);
        for (const a of data.accounts) await supabase.from('accounts').upsert(unmapAcc(a));
      }
      if (data.transactions) {
        setTransactions(data.transactions);
        for (const t of data.transactions) await supabase.from('transactions').upsert(unmapTx(t));
      }
      if (data.budgets) {
        setBudgets(data.budgets);
        for (const b of data.budgets) await supabase.from('budgets').upsert(unmapBud(b));
      }
    } catch { alert('Invalid backup file.'); }
  }, []);

  const clearData = useCallback(async () => {
    setTransactions([]);
    setBudgets([]);
    setAccounts([]);
    setManualJournalEntries([]);
    // Warning: we aren't truncating Supabase on clearData to prevent accidental full DB wipe
  }, []);

  const addCoaAccount = useCallback(async (acc: ChartOfAccount) => {
    setCoa(prev => [...prev, acc]);
    await supabase.from('chart_of_accounts').insert(unmapCoa(acc));
  }, []);
  
  const updateCoaAccount = useCallback(async (code: string, data: Partial<ChartOfAccount>) => {
    setCoa(prev => prev.map(a => a.code === code ? { ...a, ...data } : a));
    const payload: any = {};
    if (data.name) payload.name = data.name;
    if (data.type) payload.type = data.type;
    if (data.normalBalance) payload.normal_balance = data.normalBalance;
    if (data.description !== undefined) payload.description = data.description;
    await supabase.from('chart_of_accounts').update(payload).eq('code', code);
  }, []);

  const deleteCoaAccount = useCallback(async (code: string) => {
    setCoa(prev => prev.filter(a => a.code !== code || a.isSystem));
    await supabase.from('chart_of_accounts').delete().eq('code', code);
  }, []);

  const addJournalEntry = useCallback(async (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    const je: JournalEntry = { ...entry, id: generateId(), createdAt: Date.now() };
    setManualJournalEntries(prev => [...prev, je]);
    await supabase.from('journal_entries').insert(unmapJe(je));
  }, []);

  const deleteJournalEntry = useCallback(async (id: string) => {
    setManualJournalEntries(prev => prev.filter(e => e.id !== id));
    await supabase.from('journal_entries').delete().eq('id', id);
  }, []);

  const getAllJournalEntries = useCallback(() => _getAllEntries(transactions, accounts, coa, manualJournalEntries), [transactions, accounts, coa, manualJournalEntries]);

  const updateCompanyProfile = useCallback(async (data: Partial<CompanyProfile>) => {
    setCompanyProfile(prev => {
      const updated = { ...prev, ...data };
      supabase.from('company_profiles').select('id').limit(1).then(({ data: cp }) => {
        if (cp && cp.length > 0) supabase.from('company_profiles').update(data).eq('id', cp[0].id).then();
        else supabase.from('company_profiles').insert({ ...updated, id: generateId() }).then();
      });
      return updated;
    });
  }, []);

  const contextValue = useMemo(() => ({
    transactions, addTransaction, deleteTransaction, updateTransaction, activeTransactions,
    budgets, addBudget, updateBudget, deleteBudget,
    accounts, activeAccountId, setActiveAccountId, addAccount, updateAccount, deleteAccount,
    theme, setTheme, language, setLanguage, t,
    customExpenseCategories, customIncomeCategories,
    addExpenseCategory, addIncomeCategory, removeExpenseCategory, removeIncomeCategory,
    allExpenseCategories, allIncomeCategories,
    exportData, importData, clearData,
    coa, addCoaAccount, updateCoaAccount, deleteCoaAccount,
    manualJournalEntries, addJournalEntry, deleteJournalEntry, getAllJournalEntries,
    companyProfile, updateCompanyProfile
  }), [
    transactions, addTransaction, deleteTransaction, updateTransaction, activeTransactions,
    budgets, addBudget, updateBudget, deleteBudget,
    accounts, activeAccountId, setActiveAccountId, addAccount, updateAccount, deleteAccount,
    theme, setTheme, language, setLanguage, t,
    customExpenseCategories, customIncomeCategories,
    addExpenseCategory, addIncomeCategory, removeExpenseCategory, removeIncomeCategory,
    allExpenseCategories, allIncomeCategories,
    exportData, importData, clearData,
    coa, addCoaAccount, updateCoaAccount, deleteCoaAccount,
    manualJournalEntries, addJournalEntry, deleteJournalEntry, getAllJournalEntries,
    companyProfile, updateCompanyProfile
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
}
