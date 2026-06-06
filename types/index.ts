export type TransactionType = 'income' | 'expense' | 'transfer';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type Language = 'en' | 'id';
export type Theme = 'dark' | 'light';
export type CoaType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'ewallet' | 'investment' | 'credit';
  color: string;
  icon: string;
  createdAt: number;
  coaCode?: string; // link ke Chart of Accounts
}

export interface ChartOfAccount {
  code: string;       // e.g. "1100"
  name: string;       // e.g. "Kas"
  type: CoaType;
  normalBalance: 'debit' | 'credit';
  isSystem?: boolean; // tidak bisa dihapus
  description?: string;
}

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  number: string;       // e.g. "JU-2026-0001"
  description: string;
  lines: JournalLine[];
  createdAt: number;
  transactionId?: string;  // jika auto-generated
  isAutomatic?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  createdAt: number;
}

export interface CompanyProfile {
  name: string;
  address: string;
  email: string;
  phone: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: string;
  customerId: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;     // e.g. 11 for 11%
  taxAmount: number;
  total: number;
  status: 'draft' | 'unpaid' | 'paid';
  notes?: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note: string;
  createdAt: number;
  accountId: string;
  toAccountId?: string;
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: string;
}
