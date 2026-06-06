type Dict = Record<string, string>;

const en: Dict = {
  // Nav
  'nav.section': 'Main Menu', 'nav.preferences': 'Preferences',
  'nav.dashboard': 'Dashboard', 'nav.transactions': 'Transactions',
  'nav.reports': 'Reports', 'nav.budget': 'Budget',
  'nav.accounts': 'Accounts', 'nav.settings': 'Settings',
  'nav.footer': 'KasFlow v2.0 · © 2026',
  'nav.allAccounts': 'All Accounts', 'nav.aiChatbot': 'AI Fraud Detector',

  // Dashboard
  'dash.title': 'Dashboard', 'dash.subtitle': "Welcome back! Here's your financial summary 👋",
  'dash.addTx': '➕ Add Transaction', 'dash.balance': 'Total Balance',
  'dash.income': 'Monthly Income', 'dash.expense': 'Monthly Expense',
  'dash.savings': 'Net Savings', 'dash.cashflowTitle': '📈 Annual Cash Flow',
  'dash.cashflowSub': 'Monthly income vs expense — full year view', 'dash.catTitle': '🎯 Expense by Category',
  'dash.recentTitle': '🧾 Recent Transactions', 'dash.recentSub': 'Last 5 transactions',
  'dash.viewAll': 'View All →', 'dash.empty': 'No transactions yet. Start adding one!',

  // Transactions Page
  'tx.title': 'Transactions', 'tx.subtitle': '{count} total transactions',
  'tx.addBtn': '➕ Add Transaction', 'tx.search': 'Search category or note...',
  'tx.allTypes': 'All Types', 'tx.allMonths': 'All Months', 'tx.allAccounts': 'All Accounts',
  'tx.incomeLabel': 'Income', 'tx.expenseLabel': 'Expense', 'tx.netLabel': 'Net',
  'tx.listTitle': 'Transaction List', 'tx.count': '{count} transactions',
  'tx.empty': 'No transactions found.',

  // Modal
  'modal.addTitle': '➕ Add Transaction', 'modal.editTitle': '✏️ Edit Transaction',
  'modal.income': '📥 Income', 'modal.expense': '📤 Expense', 'modal.transfer': '🔄 Transfer',
  'modal.amount': 'Amount (Rp)', 'modal.amountPlaceholder': 'e.g. 500000',
  'modal.category': 'Category', 'modal.date': 'Date', 'modal.account': 'Account',
  'modal.toAccount': 'To Account', 'modal.note': 'Note (Optional)',
  'modal.notePlaceholder': 'Transaction description...', 'modal.recurring': 'Recurring Transaction',
  'modal.recurInterval': 'Repeat Every', 'modal.daily': 'Daily', 'modal.weekly': 'Weekly',
  'modal.monthly': 'Monthly', 'modal.yearly': 'Yearly',
  'modal.cancel': 'Cancel', 'modal.save': '💾 Save Changes', 'modal.add': '➕ Add Transaction',

  // Reports
  'rep.title': 'Financial Reports', 'rep.subtitle': 'Cash flow analysis and financial summary',
  'rep.exportCSV': '📤 Export CSV', 'rep.exportPDF': '🖨️ Print PDF',
  'rep.totalIncome': 'Total Income', 'rep.totalExpense': 'Total Expenses',
  'rep.netBalance': 'Net Balance', 'rep.allTime': 'All time',
  'rep.barTitle': '📊 Monthly Comparison', 'rep.barSub': 'Income vs expense over 6 months',
  'rep.tableTitle': '📋 Monthly Summary', 'rep.month': 'Month',
  'rep.income': 'Income', 'rep.expense': 'Expense', 'rep.net': 'Net Balance', 'rep.txCount': 'Transactions',
  'rep.catTitle': '🏷️ Expense by Category', 'rep.catSub': 'This month',
  'rep.incomeStatement': 'Income Statement',

  // Budget
  'bud.title': 'Budget', 'bud.subtitle': 'Manage spending limits per category',
  'bud.add': '➕ Add Budget', 'bud.addModalTitle': '🎯 Add Budget', 'bud.editModalTitle': '✏️ Edit Budget',
  'bud.total': 'Total Budget', 'bud.used': 'Used', 'bud.remaining': 'Remaining',
  'bud.emptyTitle': 'No budget for {month}', 'bud.emptySub': 'Add a budget to track spending per category',
  'bud.addFirst': '➕ Add First Budget', 'bud.category': 'Expense Category',
  'bud.limit': 'Budget Limit (Rp)', 'bud.month': 'Month',
  'bud.overLimit': '⚠️ Over Limit', 'bud.almostFull': '⚡ Almost Full',
  'bud.pctUsed': '{pct}% used', 'bud.over': 'Over {amount}', 'bud.left': '{amount} left',
  'bud.usedOf': 'Used: {spent}', 'bud.limitLabel': 'Limit: {limit}',
  'bud.cancel': 'Cancel', 'bud.save': '💾 Save', 'bud.addBtn': '➕ Add',

  // Accounts
  'acc.title': 'Accounts', 'acc.subtitle': 'Manage your wallets and bank accounts',
  'acc.add': '➕ Add Account', 'acc.netWorth': '💼 Total Net Worth',
  'acc.empty': 'No accounts yet', 'acc.emptySub': 'Add an account to start tracking finances',
  'acc.addFirst': '➕ Add First Account', 'acc.name': 'Account Name',
  'acc.type': 'Account Type', 'acc.bank': '🏦 Bank Account', 'acc.cash': '💵 Cash / Wallet',
  'acc.ewallet': '📱 E-Wallet', 'acc.investment': '📈 Investment', 'acc.credit': '💳 Credit Card',
  'acc.icon': 'Icon', 'acc.balance': 'Balance', 'acc.transactions': 'transactions',
  'acc.addModal': '➕ Add Account', 'acc.editModal': '✏️ Edit Account',
  'acc.cancel': 'Cancel', 'acc.save': '💾 Save', 'acc.add2': '➕ Add',

  // Settings
  'set.title': 'Settings', 'set.subtitle': 'Customize your KasFlow experience',
  'set.appearance': 'Appearance', 'set.language': 'Language', 'set.theme': 'Theme',
  'set.dark': '🌙 Dark', 'set.light': '☀️ Light',
  'set.categories': 'Custom Categories',
  'set.expenseCat': 'Expense Categories', 'set.incomeCat': 'Income Categories',
  'set.addCatPlaceholder': 'Add new category...', 'set.addCat': '+ Add',
  'set.data': 'Data Management',
  'set.export': '📥 Export Backup (JSON)', 'set.import': '📤 Import Backup (JSON)',
  'set.clear': '🗑️ Clear All Data', 'set.clearConfirm': 'Are you sure? This will permanently delete ALL your data!',

  // General
  'g.cancel': 'Cancel', 'g.save': 'Save', 'g.delete': 'Delete',
};

const id: Dict = {
  'nav.section': 'Menu Utama', 'nav.preferences': 'Preferensi',
  'nav.dashboard': 'Dashboard', 'nav.transactions': 'Transaksi',
  'nav.reports': 'Laporan', 'nav.budget': 'Anggaran',
  'nav.accounts': 'Akun', 'nav.settings': 'Pengaturan',
  'nav.footer': 'KasFlow v2.0 · © 2026', 'nav.allAccounts': 'Semua Akun',
  'nav.aiChatbot': 'Deteksi Fraud AI',

  'dash.title': 'Dashboard', 'dash.subtitle': 'Selamat datang! Berikut ringkasan keuanganmu 👋',
  'dash.addTx': '➕ Tambah Transaksi', 'dash.balance': 'Total Saldo',
  'dash.income': 'Pemasukan Bulan Ini', 'dash.expense': 'Pengeluaran Bulan Ini',
  'dash.savings': 'Tabungan Bersih', 'dash.cashflowTitle': '📈 Arus Kas Tahunan',
  'dash.cashflowSub': 'Perbandingan pemasukan dan pengeluaran sepanjang tahun ini', 'dash.catTitle': '🎯 Pengeluaran per Kategori',
  'dash.recentTitle': '🧾 Transaksi Terbaru', 'dash.recentSub': '5 transaksi terakhir',
  'dash.viewAll': 'Lihat Semua →', 'dash.empty': 'Belum ada transaksi. Mulai tambahkan sekarang!',

  'tx.title': 'Transaksi', 'tx.subtitle': '{count} total transaksi tercatat',
  'tx.addBtn': '➕ Tambah Transaksi', 'tx.search': 'Cari kategori atau catatan...',
  'tx.allTypes': 'Semua Tipe', 'tx.allMonths': 'Semua Bulan', 'tx.allAccounts': 'Semua Akun',
  'tx.incomeLabel': 'Pemasukan', 'tx.expenseLabel': 'Pengeluaran', 'tx.netLabel': 'Selisih',
  'tx.listTitle': 'Daftar Transaksi', 'tx.count': '{count} transaksi',
  'tx.empty': 'Tidak ada transaksi ditemukan.',

  'modal.addTitle': '➕ Tambah Transaksi', 'modal.editTitle': '✏️ Edit Transaksi',
  'modal.income': '📥 Pemasukan', 'modal.expense': '📤 Pengeluaran', 'modal.transfer': '🔄 Transfer',
  'modal.amount': 'Jumlah (Rp)', 'modal.amountPlaceholder': 'Contoh: 500000',
  'modal.category': 'Kategori', 'modal.date': 'Tanggal', 'modal.account': 'Akun',
  'modal.toAccount': 'Ke Akun', 'modal.note': 'Catatan (Opsional)',
  'modal.notePlaceholder': 'Deskripsi transaksi...', 'modal.recurring': 'Transaksi Berulang',
  'modal.recurInterval': 'Ulangi Setiap', 'modal.daily': 'Harian', 'modal.weekly': 'Mingguan',
  'modal.monthly': 'Bulanan', 'modal.yearly': 'Tahunan',
  'modal.cancel': 'Batal', 'modal.save': '💾 Simpan Perubahan', 'modal.add': '➕ Tambah Transaksi',

  'rep.title': 'Laporan Keuangan', 'rep.subtitle': 'Analisis arus kas dan ringkasan keuangan',
  'rep.exportCSV': '📤 Export CSV', 'rep.exportPDF': '🖨️ Cetak PDF',
  'rep.totalIncome': 'Total Pemasukan', 'rep.totalExpense': 'Total Pengeluaran',
  'rep.netBalance': 'Saldo Bersih', 'rep.allTime': 'Sepanjang waktu',
  'rep.barTitle': '📊 Perbandingan Bulanan', 'rep.barSub': 'Pemasukan vs pengeluaran 6 bulan terakhir',
  'rep.tableTitle': '📋 Ringkasan Bulanan', 'rep.month': 'Bulan',
  'rep.income': 'Pemasukan', 'rep.expense': 'Pengeluaran', 'rep.net': 'Saldo Bersih', 'rep.txCount': 'Jumlah Tx',
  'rep.catTitle': '🏷️ Breakdown per Kategori', 'rep.catSub': 'Pengeluaran bulan ini',
  'rep.incomeStatement': 'Laporan Laba Rugi',

  'bud.title': 'Anggaran', 'bud.subtitle': 'Kelola batas pengeluaran per kategori',
  'bud.add': '➕ Tambah Anggaran', 'bud.addModalTitle': '🎯 Tambah Anggaran', 'bud.editModalTitle': '✏️ Edit Anggaran',
  'bud.total': 'Total Anggaran', 'bud.used': 'Terpakai', 'bud.remaining': 'Sisa Anggaran',
  'bud.emptyTitle': 'Belum ada anggaran untuk {month}', 'bud.emptySub': 'Tambahkan anggaran untuk melacak pengeluaran per kategori',
  'bud.addFirst': '➕ Tambah Anggaran Pertama', 'bud.category': 'Kategori Pengeluaran',
  'bud.limit': 'Batas Anggaran (Rp)', 'bud.month': 'Bulan',
  'bud.overLimit': '⚠️ Melebihi Batas', 'bud.almostFull': '⚡ Hampir Habis',
  'bud.pctUsed': '{pct}% terpakai', 'bud.over': 'Lebih {amount}', 'bud.left': 'Sisa {amount}',
  'bud.usedOf': 'Digunakan: {spent}', 'bud.limitLabel': 'Batas: {limit}',
  'bud.cancel': 'Batal', 'bud.save': '💾 Simpan', 'bud.addBtn': '➕ Tambah',

  'acc.title': 'Akun', 'acc.subtitle': 'Kelola dompet dan rekening bank kamu',
  'acc.add': '➕ Tambah Akun', 'acc.netWorth': '💼 Total Kekayaan Bersih',
  'acc.empty': 'Belum ada akun', 'acc.emptySub': 'Tambahkan akun untuk melacak keuanganmu',
  'acc.addFirst': '➕ Tambah Akun Pertama', 'acc.name': 'Nama Akun',
  'acc.type': 'Tipe Akun', 'acc.bank': '🏦 Rekening Bank', 'acc.cash': '💵 Tunai / Dompet',
  'acc.ewallet': '📱 Dompet Digital', 'acc.investment': '📈 Investasi', 'acc.credit': '💳 Kartu Kredit',
  'acc.icon': 'Ikon', 'acc.balance': 'Saldo', 'acc.transactions': 'transaksi',
  'acc.addModal': '➕ Tambah Akun', 'acc.editModal': '✏️ Edit Akun',
  'acc.cancel': 'Batal', 'acc.save': '💾 Simpan', 'acc.add2': '➕ Tambah',

  'set.title': 'Pengaturan', 'set.subtitle': 'Sesuaikan pengalaman KasFlow kamu',
  'set.appearance': 'Tampilan', 'set.language': 'Bahasa', 'set.theme': 'Tema',
  'set.dark': '🌙 Gelap', 'set.light': '☀️ Terang',
  'set.categories': 'Kategori Kustom',
  'set.expenseCat': 'Kategori Pengeluaran', 'set.incomeCat': 'Kategori Pemasukan',
  'set.addCatPlaceholder': 'Tambah kategori baru...', 'set.addCat': '+ Tambah',
  'set.data': 'Manajemen Data',
  'set.export': '📥 Export Backup (JSON)', 'set.import': '📤 Import Backup (JSON)',
  'set.clear': '🗑️ Hapus Semua Data', 'set.clearConfirm': 'Yakin? Semua data akan dihapus secara permanen!',
  'g.cancel': 'Batal', 'g.save': 'Simpan', 'g.delete': 'Hapus',
};

export const translations = { en, id };

export function createTranslator(lang: 'en' | 'id') {
  const dict = translations[lang];
  const fallback = translations.en;
  return (key: string, vars?: Record<string, string>): string => {
    let text = dict[key] ?? fallback[key] ?? key;
    if (vars) Object.entries(vars).forEach(([k, v]) => { text = text.replace(`{${k}}`, v); });
    return text;
  };
}
