import React, { useState, useEffect, useRef } from 'react';
import { Account, JournalEntry, JournalLine, ModuleType, AccountType } from '../../types';
import { StorageService } from '../../services/storageService';
import { 
  Calculator, 
  ArrowLeft, 
  Plus, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Search, 
  Printer, 
  TrendingUp, 
  RotateCcw,
  DollarSign, 
  ArrowDownLeft, 
  ArrowUpRight, 
  List, 
  Calendar, 
  FolderTree, 
  ChevronRight, 
  ChevronDown, 
  Edit2, 
  Trash2, 
  Scale, 
  RefreshCcw, 
  Lock, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  AlertTriangle,
  BookOpen // Icon for General Ledger
} from 'lucide-react';

type AccountingView = 'MENU' | 'RECEIPT_VOUCHER' | 'PAYMENT_VOUCHER' | 'JOURNAL_ENTRIES' | 'POSTING' | 'UNPOSTING' | 'STATEMENTS' | 'GENERAL_LEDGER' | 'REPORTS' | 'CHART_OF_ACCOUNTS' | 'PERIODIC_TASKS';

// Arabic Translation for Account Types
const ACCOUNT_TYPE_AR: Record<string, string> = {
  ASSET: 'أصول',
  LIABILITY: 'التزامات',
  EQUITY: 'حقوق ملكية',
  REVENUE: 'إيرادات',
  EXPENSE: 'مصروفات'
};

const AccountingModule: React.FC = () => {
  const [currentView, setCurrentView] = useState<AccountingView>('MENU');

  const renderContent = () => {
    switch(currentView) {
      case 'MENU': return <AccountingMenu onViewChange={setCurrentView} />;
      case 'RECEIPT_VOUCHER': return <VoucherForm type="RECEIPT" onBack={() => setCurrentView('MENU')} />;
      case 'PAYMENT_VOUCHER': return <VoucherForm type="PAYMENT" onBack={() => setCurrentView('MENU')} />;
      case 'JOURNAL_ENTRIES': return <JournalManager onBack={() => setCurrentView('MENU')} />;
      case 'POSTING': return <PostingManager mode="POST" onBack={() => setCurrentView('MENU')} />;
      case 'UNPOSTING': return <PostingManager mode="UNPOST" onBack={() => setCurrentView('MENU')} />;
      case 'STATEMENTS': return <AccountStatements onBack={() => setCurrentView('MENU')} />;
      case 'GENERAL_LEDGER': return <GeneralLedger onBack={() => setCurrentView('MENU')} />;
      case 'CHART_OF_ACCOUNTS': return <ChartOfAccounts onBack={() => setCurrentView('MENU')} />;
      case 'REPORTS': return <AccountingReports onBack={() => setCurrentView('MENU')} />;
      case 'PERIODIC_TASKS': return <PeriodicTasksManager onBack={() => setCurrentView('MENU')} />;
      default: return <AccountingMenu onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className="h-full bg-slate-50/50">
      {renderContent()}
    </div>
  );
};

// --- 1. MAIN MENU GRID ---
const AccountingMenu = ({ onViewChange }: { onViewChange: (v: AccountingView) => void }) => {
  const menuItems = [
    { id: 'CHART_OF_ACCOUNTS', label: 'دليل الحسابات', icon: FolderTree, color: 'bg-purple-50 text-purple-600 border-purple-200', desc: 'إدارة شجرة الحسابات (الأصول، الخصوم...)' },
    { id: 'GENERAL_LEDGER', label: 'الأستاذ العام', icon: BookOpen, color: 'bg-blue-50 text-blue-700 border-blue-200', desc: 'دفتر الأستاذ والتحليل المالي' },
    { id: 'RECEIPT_VOUCHER', label: 'سندات القبض', icon: ArrowDownLeft, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', desc: 'استلام نقدية من عميل/ايراد' },
    { id: 'PAYMENT_VOUCHER', label: 'سندات الصرف', icon: ArrowUpRight, color: 'bg-rose-50 text-rose-600 border-rose-200', desc: 'دفع مصروفات أو للموردين' },
    { id: 'JOURNAL_ENTRIES', label: 'قيود اليومية', icon: FileText, color: 'bg-slate-50 text-slate-700 border-slate-200', desc: 'إدارة جميع القيود المحاسبية' },
    { id: 'POSTING', label: 'الترحيل', icon: CheckCircle, color: 'bg-blue-50 text-blue-600 border-blue-200', desc: 'اعتماد القيود المسودة' },
    { id: 'UNPOSTING', label: 'إلغاء الترحيل', icon: RotateCcw, color: 'bg-orange-50 text-orange-600 border-orange-200', desc: 'تعديل قيود مرحلة' },
    { id: 'STATEMENTS', label: 'الكشوفات', icon: List, color: 'bg-indigo-50 text-indigo-600 border-indigo-200', desc: 'كشف حساب فرعي تفصيلي/إجمالي' },
    { id: 'PERIODIC_TASKS', label: 'العمليات الدورية', icon: RefreshCcw, color: 'bg-teal-50 text-teal-600 border-teal-200', desc: 'الإهلاك، الإقفال، والتسويات' },
    { id: 'REPORTS', label: 'التقارير الختامية', icon: TrendingUp, color: 'bg-amber-50 text-amber-600 border-amber-200', desc: 'ميزان المراجعة والأرباح' },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-8 border-b border-slate-200 pb-4 flex items-center gap-2">
        <Calculator className="text-gold-500" /> النظام المحاسبي
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item: any) => (
          <button 
            key={item.id}
            onClick={() => onViewChange(item.id as AccountingView)}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-gold-300 transition-all flex flex-col items-center text-center gap-4 group h-48 justify-center"
          >
            <div className={`p-4 rounded-full border ${item.color} shadow-sm group-hover:scale-110 transition-transform`}>
              <item.icon size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-gold-600 transition-colors">{item.label}</h3>
              <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// --- GENERAL LEDGER ---
const GeneralLedger = ({ onBack }: { onBack: () => void }) => {
    const [accountId, setAccountId] = useState('');
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]); // Jan 1st
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Today
    const [accounts, setAccounts] = useState<Account[]>([]);
    
    // Ledger Data
    const [ledgerData, setLedgerData] = useState<{
        openingBalance: number,
        transactions: (JournalLine & { date: string, ref: string, desc: string })[],
        closingBalance: number
    } | null>(null);

    useEffect(() => { setAccounts(StorageService.getAccounts()); }, []);

    const handleGenerate = () => {
        if(!accountId) return;

        const journal = StorageService.getJournal().filter(j => j.status === 'POSTED');
        let opening = 0;
        const currentTx: any[] = [];

        // Sort journal strictly by date
        journal.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        journal.forEach(entry => {
            const entryDate = new Date(entry.date);
            const start = new Date(startDate);
            const end = new Date(endDate);

            // Filter relevant lines for this account
            const lines = entry.lines.filter(l => l.accountId === accountId);
            
            lines.forEach(line => {
                if (entryDate < start) {
                    // Accumulate Opening Balance
                    opening += (line.debit - line.credit);
                } else if (entryDate >= start && entryDate <= end) {
                    // Add to Period Transactions
                    currentTx.push({
                        ...line,
                        date: entry.date,
                        ref: entry.reference,
                        desc: entry.description
                    });
                }
            });
        });

        // Calculate Closing
        const periodMovement = currentTx.reduce((sum, line) => sum + (line.debit - line.credit), 0);
        
        setLedgerData({
            openingBalance: opening,
            transactions: currentTx,
            closingBalance: opening + periodMovement
        });
    };

    let runningBalance = ledgerData ? ledgerData.openingBalance : 0;

    return (
        <div className="h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800"><BookOpen className="text-blue-700"/> دفتر الأستاذ العام</h2>
                <button onClick={onBack} className="px-4 py-2 border rounded bg-white font-bold text-slate-600">رجوع</button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1">الحساب</label>
                    <select className="w-full border p-2 rounded bg-white text-slate-900" value={accountId} onChange={e => setAccountId(e.target.value)}>
                        <option value="">-- اختر الحساب --</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">من تاريخ</label>
                    <input type="date" className="border p-2 rounded bg-white text-slate-900" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">إلى تاريخ</label>
                    <input type="date" className="border p-2 rounded bg-white text-slate-900" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <button onClick={handleGenerate} className="px-6 py-2 bg-blue-700 text-white rounded font-bold hover:bg-blue-800 h-[42px]">عرض</button>
                <button onClick={() => window.print()} className="px-4 py-2 bg-slate-100 text-slate-700 rounded border hover:bg-slate-200 h-[42px]"><Printer size={20}/></button>
            </div>

            {/* Report Content */}
            <div className="bg-white rounded-xl shadow border border-slate-200 flex-1 overflow-auto p-8 print:p-0">
                {ledgerData ? (
                    <>
                        <div className="text-center mb-6 pb-4 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">دفتر الأستاذ: {accounts.find(a => a.id === accountId)?.name}</h2>
                            <p className="text-sm text-slate-500 font-mono mt-1">
                                الفترة من {startDate} إلى {endDate}
                            </p>
                        </div>

                        <table className="w-full text-right text-sm border-collapse">
                            <thead className="bg-slate-100 font-bold text-slate-700 border-y border-slate-300">
                                <tr>
                                    <th className="p-3">التاريخ</th>
                                    <th className="p-3">المرجع</th>
                                    <th className="p-3">البيان</th>
                                    <th className="p-3 text-center">مدين</th>
                                    <th className="p-3 text-center">دائن</th>
                                    <th className="p-3 text-center">الرصيد</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {/* Opening Balance Row */}
                                <tr className="bg-blue-50 font-bold text-slate-700">
                                    <td className="p-3">-</td>
                                    <td className="p-3">-</td>
                                    <td className="p-3">الرصيد الافتتاحي (مدور)</td>
                                    <td className="p-3 text-center font-mono">{ledgerData.openingBalance > 0 ? ledgerData.openingBalance.toLocaleString() : '-'}</td>
                                    <td className="p-3 text-center font-mono">{ledgerData.openingBalance < 0 ? Math.abs(ledgerData.openingBalance).toLocaleString() : '-'}</td>
                                    <td className="p-3 text-center font-mono dir-ltr">{ledgerData.openingBalance.toLocaleString()}</td>
                                </tr>

                                {/* Transactions */}
                                {ledgerData.transactions.map((line, idx) => {
                                    runningBalance += (line.debit - line.credit);
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="p-3">{line.date}</td>
                                            <td className="p-3 font-mono text-blue-600 text-xs">{line.ref}</td>
                                            <td className="p-3">{line.desc}</td>
                                            <td className="p-3 text-center font-mono">{line.debit !== 0 ? line.debit.toLocaleString() : '-'}</td>
                                            <td className="p-3 text-center font-mono">{line.credit !== 0 ? line.credit.toLocaleString() : '-'}</td>
                                            <td className="p-3 text-center font-mono dir-ltr font-bold text-slate-700">{runningBalance.toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-slate-800 text-white font-bold border-t-2 border-slate-900">
                                <tr>
                                    <td colSpan={3} className="p-3 text-left">الرصيد الختامي</td>
                                    <td className="p-3 text-center font-mono text-yellow-400">{ledgerData.transactions.reduce((s,l)=>s+l.debit,0).toLocaleString()}</td>
                                    <td className="p-3 text-center font-mono text-yellow-400">{ledgerData.transactions.reduce((s,l)=>s+l.credit,0).toLocaleString()}</td>
                                    <td className="p-3 text-center font-mono text-lg dir-ltr">{ledgerData.closingBalance.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <BookOpen size={64} className="mb-4 opacity-20" />
                        <p>اختر الحساب والفترة الزمنية ثم اضغط "عرض"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- 2. CHART OF ACCOUNTS ---
const ChartOfAccounts = ({ onBack }: { onBack: () => void }) => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState<Partial<Account>>({ type: AccountType.ASSET, isLeaf: true, currency: 'USD' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setAccounts(StorageService.getAccounts().sort((a,b) => a.code.localeCompare(b.code)));
    }, []);

    const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const handleSave = () => {
        if(!form.code || !form.name) return alert("الرمز والاسم مطلوبان");
        const newAcc: Account = {
            id: form.id || Date.now().toString(),
            code: form.code,
            name: form.name,
            type: form.type!,
            balance: form.balance || 0,
            currency: form.currency || 'USD',
            parentId: form.parentId,
            isLeaf: form.isLeaf || false
        };
        StorageService.saveAccount(newAcc);
        setAccounts(StorageService.getAccounts().sort((a,b) => a.code.localeCompare(b.code)));
        setIsModalOpen(false);
        setForm({ type: AccountType.ASSET, isLeaf: true, currency: 'USD' });
    };

    const handleExportCSV = () => {
        const data = accounts.map(a => ({
            Code: a.code,
            Name: a.name,
            Type: ACCOUNT_TYPE_AR[a.type] || a.type,
            IsLeaf: a.isLeaf ? 'نعم' : 'لا',
            Balance: a.balance,
            Currency: a.currency
        }));
        StorageService.exportToCSV(data, 'ChartOfAccounts');
    };

    const handleResetTree = () => {
        if(window.confirm("تحذير حاسم: سيتم حذف الدليل الحالي تماماً واستبداله بالدليل القياسي v3 (الجديد). هل أنت متأكد؟")) {
            // 1. Reset Storage synchronously
            const freshData = StorageService.resetAccountsToDefault();
            
            // 2. Update React State IMMEDIATELY with the fresh data
            setAccounts(freshData.sort((a,b) => a.code.localeCompare(b.code)));
            
            alert("تم تحديث شجرة الحسابات بنجاح إلى النسخة v3.");
        }
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            let content = event.target?.result as string;
            
            if (content.charCodeAt(0) === 0xFEFF) {
                content = content.slice(1);
            }

            try {
                let importedAccounts: Account[] = [];
                // 1. Try Parsing as JSON
                try {
                    const data = JSON.parse(content);
                    if (Array.isArray(data)) importedAccounts = data;
                    else if (data.accounts) importedAccounts = data.accounts;
                } catch(e) { /* Not JSON */ }

                // 2. Filter Valid Accounts
                importedAccounts = importedAccounts.filter(a => a.code && a.name);

                if (importedAccounts.length > 0) {
                    if(window.confirm(`تم العثور على ${importedAccounts.length} حساب في الملف. هل تريد استيرادها الآن؟`)) {
                        // BULK IMPORT - FAST & EFFICIENT
                        StorageService.importAccounts(importedAccounts);
                        
                        // REFRESH VIEW IMMEDIATELY
                        setAccounts(StorageService.getAccounts().sort((a,b) => a.code.localeCompare(b.code)));
                        
                        alert(`تم استيراد ${importedAccounts.length} حساب بنجاح!`);
                    }
                } else {
                    alert("لم يتم العثور على بيانات صالحة. يرجى التأكد من أن الملف بصيغة JSON ويحتوي على مصفوفة من الحسابات.");
                }
            } catch (err) {
                console.error("Import Error", err);
                alert("حدث خطأ غير متوقع أثناء معالجة الملف.");
            }
        };
        reader.readAsText(file);
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    const renderTree = (parentId?: string, level = 0) => {
        const nodes = accounts.filter(a => a.parentId === parentId);
        return nodes.map(node => (
            <React.Fragment key={node.id}>
                <div 
                    className={`flex items-center p-3 border-b hover:bg-slate-50 transition-colors ${level === 0 ? 'bg-slate-50 font-bold' : ''}`}
                    style={{ paddingRight: `${level * 20 + 10}px` }}
                >
                    <div className="flex-1 flex items-center gap-2">
                        {!node.isLeaf && (
                            <button onClick={() => toggleExpand(node.id)}>
                                {expanded[node.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                        )}
                        {node.isLeaf && <span className="w-4"></span>}
                        <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">{node.code}</span>
                        <span className={node.isLeaf ? 'text-slate-600' : 'text-slate-900'}>{node.name}</span>
                    </div>
                    <div className="w-32 text-left font-mono">{node.balance.toLocaleString()}</div>
                    <div className="w-20 text-center text-xs text-slate-400 bg-slate-100 rounded px-1 py-0.5">
                        {ACCOUNT_TYPE_AR[node.type] || node.type}
                    </div>
                    <div className="w-20 flex justify-end">
                        {!node.isLeaf && (
                            <button onClick={() => { setForm({ parentId: node.id, type: node.type, isLeaf: true }); setIsModalOpen(true); }} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                <Plus size={16} />
                            </button>
                        )}
                    </div>
                </div>
                {(!node.isLeaf && expanded[node.id]) && renderTree(node.id, level + 1)}
            </React.Fragment>
        ));
    };

    return (
        <div className="h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800"><FolderTree className="text-purple-600"/> دليل الحسابات</h2>
                <div className="flex gap-2">
                    <button onClick={onBack} className="px-4 py-2 bg-white border rounded text-slate-700 font-bold hover:bg-slate-50">رجوع</button>
                    
                    <div className="flex gap-1 bg-white border rounded-lg p-1">
                        <button onClick={() => window.print()} className="p-2 hover:bg-slate-100 rounded text-slate-600" title="طباعة"><Printer size={18} /></button>
                        <button onClick={handleExportCSV} className="p-2 hover:bg-slate-100 rounded text-green-600" title="تصدير CSV"><FileSpreadsheet size={18} /></button>
                        <label className="p-2 hover:bg-slate-100 rounded text-blue-600 cursor-pointer" title="استيراد (JSON)">
                            <Upload size={18} />
                            <input type="file" ref={fileInputRef} className="hidden" accept=".json,.txt" onChange={handleImport} />
                        </label>
                    </div>

                    <button onClick={handleResetTree} className="px-4 py-2 bg-red-100 text-red-700 rounded font-bold hover:bg-red-200 shadow text-xs flex items-center gap-1">
                        <AlertTriangle size={14} /> استعادة الدليل (تحديث v3)
                    </button>

                    <button onClick={() => { setForm({ isLeaf: false }); setIsModalOpen(true); }} className="px-4 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700 shadow">إضافة حساب رئيسي</button>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow border border-slate-200 flex-1 overflow-auto print:shadow-none print:border-none">
                <div className="flex p-3 border-b bg-slate-100 font-bold text-slate-700 text-sm sticky top-0 print:hidden">
                    <div className="flex-1">اسم الحساب</div>
                    <div className="w-32 text-left">الرصيد</div>
                    <div className="w-20 text-center">النوع</div>
                    <div className="w-20"></div>
                </div>
                {renderTree(undefined)}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
                        <h3 className="font-bold text-lg mb-4">إضافة حساب جديد</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="رمز الحساب" className="w-full border p-2 rounded bg-white text-slate-900" value={form.code || ''} onChange={e => setForm({...form, code: e.target.value})} />
                            <input type="text" placeholder="اسم الحساب" className="w-full border p-2 rounded bg-white text-slate-900" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                            <select className="w-full border p-2 rounded bg-white text-slate-900" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
                                {Object.keys(ACCOUNT_TYPE_AR).map(key => (
                                    <option key={key} value={key}>{ACCOUNT_TYPE_AR[key]}</option>
                                ))}
                            </select>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={form.isLeaf} onChange={e => setForm({...form, isLeaf: e.target.checked})} />
                                <label>حساب فرعي (يقبل القيود)</label>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50">إلغاء</button>
                                <button onClick={handleSave} className="px-4 py-2 bg-purple-600 text-white rounded">حفظ</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 3. VOUCHER FORM ---
const VoucherForm = ({ type, onBack }: { type: 'RECEIPT' | 'PAYMENT', onBack: () => void }) => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        cashAccountId: '',
        accountId: '',
        amount: 0,
        description: '',
        ref: ''
    });

    useEffect(() => {
        setAccounts(StorageService.getAccounts().filter(a => a.isLeaf));
    }, []);

    const handleSave = () => {
        if(!form.cashAccountId || !form.accountId || !form.amount) { alert("بيانات ناقصة"); return; }
        
        const isReceipt = type === 'RECEIPT';
        const je: JournalEntry = {
            id: Date.now().toString(),
            date: form.date,
            reference: form.ref || `${isReceipt ? 'RV' : 'PV'}-${Date.now().toString().substr(-6)}`,
            description: form.description || (isReceipt ? 'سند قبض' : 'سند صرف'),
            status: 'DRAFT', 
            moduleId: ModuleType.ACCOUNTS,
            branchId: 'HEADQUARTERS',
            totalAmount: Number(form.amount),
            createdAt: new Date().toISOString(),
            createdBy: 'User', 
            lines: [
                { 
                    id: '1', 
                    accountId: isReceipt ? form.cashAccountId : form.accountId, 
                    debit: Number(form.amount), 
                    credit: 0 
                },
                { 
                    id: '2', 
                    accountId: isReceipt ? form.accountId : form.cashAccountId, 
                    debit: 0, 
                    credit: Number(form.amount) 
                }
            ]
        };

        StorageService.postJournalEntry(je);
        alert("تم حفظ السند كمسودة. يرجى ترحيله من شاشة الترحيل.");
        onBack();
    };

    const cashAccounts = accounts.filter(a => a.code.startsWith('1101') || a.code.startsWith('1102'));

    return (
        <div className="h-full flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className={`p-6 border-b flex justify-between items-center ${type === 'RECEIPT' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <h2 className={`text-xl font-bold flex items-center gap-2 ${type === 'RECEIPT' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {type === 'RECEIPT' ? <ArrowDownLeft /> : <ArrowUpRight />} 
                        {type === 'RECEIPT' ? 'سند قبض (استلام نقدية)' : 'سند صرف (دفع نقدية)'}
                    </h2>
                    <button onClick={onBack}><XCircle className="text-slate-400 hover:text-red-500" /></button>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">التاريخ</label>
                            <input type="date" className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">رقم المرجع (اختياري)</label>
                            <input type="text" className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={form.ref} onChange={e => setForm({...form, ref: e.target.value})} placeholder="تلقائي إذا ترك فارغاً" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                {type === 'RECEIPT' ? 'حساب الصندوق/البنك (مدين)' : 'حساب الصندوق/البنك (دائن)'}
                            </label>
                            <select className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={form.cashAccountId} onChange={e => setForm({...form, cashAccountId: e.target.value})}>
                                <option value="">-- اختر الحساب --</option>
                                {cashAccounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                {type === 'RECEIPT' ? 'استلمنا من (دائن)' : 'يصرف لحساب (مدين)'}
                            </label>
                            <select className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={form.accountId} onChange={e => setForm({...form, accountId: e.target.value})}>
                                <option value="">-- اختر الحساب المستفيد/الدافع --</option>
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">المبلغ</label>
                        <input type="number" className="w-full border border-slate-300 p-3 rounded font-mono text-lg font-bold bg-white text-slate-900 focus:border-gold-500 outline-none" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">البيان / الوصف</label>
                        <textarea className="w-full border border-slate-300 p-3 rounded h-24 bg-white text-slate-900 focus:border-gold-500 outline-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="عبارة عن..." />
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <button onClick={onBack} className="px-6 py-3 border rounded font-bold text-slate-600 hover:bg-slate-50 bg-white">إلغاء</button>
                        <button onClick={handleSave} className={`px-8 py-3 rounded font-bold text-white shadow-lg transition-transform hover:scale-105 ${type === 'RECEIPT' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                            حفظ السند
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 4. JOURNAL MANAGER ---
const JournalManager = ({ onBack }: { onBack: () => void }) => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        setEntries(StorageService.getJournal());
    }, []);

    const filtered = entries.filter(e => e.description.includes(filter) || e.reference.includes(filter));

    return (
        <div className="h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800"><FileText className="text-slate-600"/> قيود اليومية</h2>
                <div className="flex gap-2">
                    <button onClick={onBack} className="px-4 py-2 border rounded bg-white font-bold text-slate-600">رجوع</button>
                    <div className="relative">
                        <input type="text" placeholder="بحث..." className="pl-8 pr-4 py-2 border rounded bg-white text-slate-900 w-64" value={filter} onChange={e => setFilter(e.target.value)} />
                        <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow border border-slate-200 flex-1 overflow-auto">
                <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 font-bold text-slate-700 sticky top-0">
                        <tr>
                            <th className="p-4">المرجع</th>
                            <th className="p-4">التاريخ</th>
                            <th className="p-4">البيان</th>
                            <th className="p-4">القيمة</th>
                            <th className="p-4">المصدر</th>
                            <th className="p-4">الحالة</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(je => (
                            <tr key={je.id} className="hover:bg-slate-50 cursor-pointer group">
                                <td className="p-4 font-mono font-bold text-blue-600">{je.reference}</td>
                                <td className="p-4">{je.date}</td>
                                <td className="p-4">{je.description}</td>
                                <td className="p-4 font-mono">{je.totalAmount.toLocaleString()}</td>
                                <td className="p-4"><span className="text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">{je.moduleId}</span></td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${je.status === 'POSTED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {je.status === 'POSTED' ? 'مرحل' : 'مسودة'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <div className="p-10 text-center text-slate-400">لا توجد قيود</div>}
            </div>
        </div>
    );
};

// --- 5. POSTING MANAGER ---
const PostingManager = ({ mode, onBack }: { mode: 'POST' | 'UNPOST', onBack: () => void }) => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    
    useEffect(() => {
        const all = StorageService.getJournal();
        setEntries(all.filter(j => j.status === (mode === 'POST' ? 'DRAFT' : 'POSTED')));
    }, [mode]);

    const handleAction = (id: string) => {
        if(window.confirm(mode === 'POST' ? 'هل أنت متأكد من ترحيل القيد؟' : 'هل أنت متأكد من إلغاء ترحيل القيد؟')) {
            StorageService.updateJournalStatus(id, mode === 'POST' ? 'POSTED' : 'DRAFT');
            const all = StorageService.getJournal();
            setEntries(all.filter(j => j.status === (mode === 'POST' ? 'DRAFT' : 'POSTED')));
        }
    };

    return (
        <div className="h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                    {mode === 'POST' ? <CheckCircle className="text-blue-600"/> : <RotateCcw className="text-orange-600"/>}
                    {mode === 'POST' ? 'ترحيل القيود' : 'إلغاء ترحيل القيود'}
                </h2>
                <button onClick={onBack} className="px-4 py-2 border rounded bg-white font-bold text-slate-600">رجوع</button>
            </div>

            <div className="bg-white rounded-xl shadow border border-slate-200 flex-1 overflow-auto">
                <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 font-bold text-slate-700">
                        <tr>
                            <th className="p-4">المرجع</th>
                            <th className="p-4">التاريخ</th>
                            <th className="p-4">البيان</th>
                            <th className="p-4">القيمة</th>
                            <th className="p-4 text-center">الإجراء</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {entries.map(je => (
                            <tr key={je.id} className="hover:bg-slate-50">
                                <td className="p-4 font-mono text-blue-600">{je.reference}</td>
                                <td className="p-4">{je.date}</td>
                                <td className="p-4">{je.description}</td>
                                <td className="p-4 font-mono">{je.totalAmount.toLocaleString()}</td>
                                <td className="p-4 text-center">
                                    <button 
                                        onClick={() => handleAction(je.id)}
                                        className={`px-4 py-1.5 rounded text-white font-bold text-xs shadow ${mode === 'POST' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'}`}
                                    >
                                        {mode === 'POST' ? 'ترحيل' : 'إلغاء الترحيل'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {entries.length === 0 && <div className="p-12 text-center text-slate-400">لا توجد قيود للمعالجة</div>}
            </div>
        </div>
    );
};

// --- 6. STATEMENTS ---
const AccountStatements = ({ onBack }: { onBack: () => void }) => {
    const [accountId, setAccountId] = useState('');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [lines, setLines] = useState<(JournalLine & { date: string, ref: string, desc: string, jeId: string })[]>([]);
    
    useEffect(() => { setAccounts(StorageService.getAccounts()); }, []);

    useEffect(() => {
        if(accountId) {
            const journal = StorageService.getJournal().filter(j => j.status === 'POSTED');
            const accountLines: any[] = [];
            journal.forEach(j => {
                j.lines.filter(l => l.accountId === accountId).forEach(l => {
                    accountLines.push({ ...l, date: j.date, ref: j.reference, desc: j.description, jeId: j.id });
                });
            });
            setLines(accountLines.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        } else {
            setLines([]);
        }
    }, [accountId]);

    let runningBalance = 0;

    return (
        <div className="h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800"><List className="text-indigo-600"/> كشوفات الحسابات</h2>
                <button onClick={onBack} className="px-4 py-2 border rounded bg-white font-bold text-slate-600">رجوع</button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-4 items-center">
                <label className="font-bold text-slate-700">اختر الحساب:</label>
                <select className="flex-1 border p-2 rounded bg-white text-slate-900" value={accountId} onChange={e => setAccountId(e.target.value)}>
                    <option value="">-- اختر حساب لعرض الكشف --</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                </select>
                <button onClick={() => window.print()} className="p-2 border rounded hover:bg-slate-50"><Printer size={20}/></button>
            </div>

            <div className="bg-white rounded-xl shadow border border-slate-200 flex-1 overflow-auto">
                <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 font-bold text-slate-700 sticky top-0">
                        <tr>
                            <th className="p-4">التاريخ</th>
                            <th className="p-4">المرجع</th>
                            <th className="p-4">البيان</th>
                            <th className="p-4 text-center">مدين</th>
                            <th className="p-4 text-center">دائن</th>
                            <th className="p-4 text-center">الرصيد</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {lines.map((l, idx) => {
                            runningBalance += (l.debit - l.credit);
                            return (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="p-4 whitespace-nowrap">{l.date}</td>
                                    <td className="p-4 font-mono text-blue-600">{l.ref}</td>
                                    <td className="p-4">{l.desc}</td>
                                    <td className="p-4 text-center font-mono">{l.debit > 0 ? l.debit.toLocaleString() : '-'}</td>
                                    <td className="p-4 text-center font-mono">{l.credit > 0 ? l.credit.toLocaleString() : '-'}</td>
                                    <td className="p-4 text-center font-mono font-bold bg-slate-50/50" dir="ltr">{runningBalance.toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    {lines.length > 0 && (
                        <tfoot className="bg-indigo-50 font-bold text-indigo-900 border-t-2 border-indigo-200">
                            <tr>
                                <td colSpan={3} className="p-4 text-left">الإجمالي</td>
                                <td className="p-4 text-center font-mono">{lines.reduce((s,l) => s + l.debit, 0).toLocaleString()}</td>
                                <td className="p-4 text-center font-mono">{lines.reduce((s,l) => s + l.credit, 0).toLocaleString()}</td>
                                <td className="p-4 text-center font-mono text-lg">{runningBalance.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
                {!accountId && <div className="p-20 text-center text-slate-400">الرجاء اختيار حساب لعرض البيانات</div>}
                {accountId && lines.length === 0 && <div className="p-20 text-center text-slate-400">لا توجد حركات مرحلة لهذا الحساب</div>}
            </div>
        </div>
    );
};

// --- 7. REPORTS ---
const AccountingReports = ({ onBack }: { onBack: () => void }) => {
    const [reportType, setReportType] = useState<'TRIAL' | 'INCOME' | 'BALANCE'>('TRIAL');
    const [data, setData] = useState<{code: string, name: string, balance: number}[]>([]);

    useEffect(() => {
        const accounts = StorageService.getAccounts();
        if(reportType === 'TRIAL') {
            setData(accounts.filter(a => a.balance !== 0).map(a => ({ code: a.code, name: a.name, balance: a.balance })));
        } else if (reportType === 'INCOME') {
            setData(accounts.filter(a => (a.code.startsWith('4') || a.code.startsWith('5')) && a.balance !== 0).map(a => ({ code: a.code, name: a.name, balance: a.balance })));
        } else {
            setData(accounts.filter(a => (a.code.startsWith('1') || a.code.startsWith('2') || a.code.startsWith('3')) && a.balance !== 0).map(a => ({ code: a.code, name: a.name, balance: a.balance })));
        }
    }, [reportType]);

    return (
        <div className="h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800"><TrendingUp className="text-amber-600"/> التقارير الختامية</h2>
                <div className="flex gap-2">
                    <button onClick={onBack} className="px-4 py-2 border rounded bg-white font-bold text-slate-600">رجوع</button>
                    <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 text-white rounded font-bold shadow">طباعة</button>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <button onClick={() => setReportType('TRIAL')} className={`flex-1 py-3 rounded-lg font-bold border transition-colors ${reportType === 'TRIAL' ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-white text-slate-500'}`}>ميزان المراجعة</button>
                <button onClick={() => setReportType('INCOME')} className={`flex-1 py-3 rounded-lg font-bold border transition-colors ${reportType === 'INCOME' ? 'bg-emerald-100 border-emerald-300 text-emerald-900' : 'bg-white text-slate-500'}`}>قائمة الدخل (أرباح وخسائر)</button>
                <button onClick={() => setReportType('BALANCE')} className={`flex-1 py-3 rounded-lg font-bold border transition-colors ${reportType === 'BALANCE' ? 'bg-blue-100 border-blue-300 text-blue-900' : 'bg-white text-slate-500'}`}>الميزانية العمومية</button>
            </div>

            <div className="bg-white rounded-xl shadow border border-slate-200 flex-1 overflow-auto p-8 print:p-0">
                <div className="text-center mb-8 border-b pb-4">
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">نيو ابراد للدعم اللوجستي</h1>
                    <h2 className="text-xl text-slate-600">
                        {reportType === 'TRIAL' ? 'ميزان المراجعة' : reportType === 'INCOME' ? 'قائمة الدخل' : 'الميزانية العمومية'}
                    </h2>
                    <p className="text-sm text-slate-400 mt-2">{new Date().toLocaleDateString()}</p>
                </div>

                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-700">
                            <th className="p-3 border">الرمز</th>
                            <th className="p-3 border">الحساب</th>
                            <th className="p-3 border text-center">الرصيد</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={idx} className="border-b hover:bg-slate-50">
                                <td className="p-3 border font-mono text-slate-500">{row.code}</td>
                                <td className="p-3 border font-bold text-slate-800">{row.name}</td>
                                <td className={`p-3 border text-center font-mono font-bold dir-ltr ${row.balance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                    {Math.abs(row.balance).toLocaleString()} {row.balance < 0 ? 'Cr' : 'Dr'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-800 text-white font-bold">
                        <tr>
                            <td colSpan={2} className="p-3 text-left">الإجمالي (صافي)</td>
                            <td className="p-3 text-center font-mono dir-ltr">{data.reduce((s, x) => s + x.balance, 0).toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

// --- 8. PERIODIC TASKS MANAGER ---
const PeriodicTasksManager = ({ onBack }: { onBack: () => void }) => {
    const [tab, setTab] = useState<'DEPRECIATION' | 'CLOSING'>('DEPRECIATION');
    const [accounts, setAccounts] = useState<Account[]>([]);
    
    // Depreciation State
    const [depForm, setDepForm] = useState({
        assetAccountId: '',
        expenseAccountId: '',
        accumulatedAccountId: '',
        rate: 10,
        amount: 0,
        date: new Date().toISOString().split('T')[0]
    });

    // Closing State
    const [closingData, setClosingData] = useState({ revenue: 0, expense: 0, net: 0 });
    const [isClosed, setIsClosed] = useState(false);

    useEffect(() => {
        const accs = StorageService.getAccounts();
        setAccounts(accs);

        const rev = accs.filter(a => a.code.startsWith('4')).reduce((s, a) => s + Math.abs(a.balance), 0);
        const exp = accs.filter(a => a.code.startsWith('5')).reduce((s, a) => s + a.balance, 0);
        setClosingData({ revenue: rev, expense: exp, net: rev - exp });
    }, []);

    const handleGenerateDepreciation = () => {
        if(!depForm.assetAccountId || !depForm.expenseAccountId || !depForm.accumulatedAccountId) {
            alert("يرجى تحديد جميع الحسابات المطلوبة");
            return;
        }

        const assetAcc = accounts.find(a => a.id === depForm.assetAccountId);
        
        let amount = depForm.amount;
        if(amount === 0 && assetAcc) {
            amount = (assetAcc.balance * (depForm.rate / 100)) / 12; // Monthly
        }

        if(amount <= 0) { alert("قيمة الإهلاك صفر"); return; }

        const je: JournalEntry = {
            id: Date.now().toString(),
            date: depForm.date,
            reference: `DEP-${Date.now().toString().substr(-5)}`,
            description: `إهلاك أصول شهرية - ${assetAcc?.name}`,
            status: 'POSTED',
            moduleId: ModuleType.ACCOUNTS,
            branchId: 'HEADQUARTERS',
            totalAmount: amount,
            createdAt: new Date().toISOString(),
            createdBy: 'System',
            lines: [
                { id: '1', accountId: depForm.expenseAccountId, debit: amount, credit: 0 },
                { id: '2', accountId: depForm.accumulatedAccountId, debit: 0, credit: amount }
            ]
        };

        StorageService.postJournalEntry(je);
        alert("تم توليد قيد الإهلاك بنجاح");
        setDepForm({...depForm, amount: 0});
    };

    const handleCloseYear = () => {
        if(!window.confirm("تحذير: هل أنت متأكد من إقفال السنة المالية؟\nسيتم تصفير جميع حسابات الإيرادات والمصاريف ونقل الصافي إلى الأرباح المبقاة.")) return;

        const retainedEarningsAcc = accounts.find(a => a.code.startsWith('34') || a.name.includes('أرباح مبقاة') || a.name.includes('Retained'));
        if(!retainedEarningsAcc) { alert("حساب الأرباح المبقاة غير موجود في الدليل"); return; }

        const pnlAccounts = accounts.filter(a => (a.code.startsWith('4') || a.code.startsWith('5')) && a.isLeaf && a.balance !== 0);
        
        if(pnlAccounts.length === 0) { alert("لا توجد أرصدة للإقفال"); return; }

        const lines: JournalLine[] = [];
        let totalDebit = 0;
        let totalCredit = 0;

        pnlAccounts.forEach((acc, idx) => {
            if (acc.code.startsWith('4')) { 
                 lines.push({ id: `line-${idx}`, accountId: acc.id, debit: Math.abs(acc.balance), credit: 0 });
                 totalDebit += Math.abs(acc.balance);
            } else {
                 lines.push({ id: `line-${idx}`, accountId: acc.id, debit: 0, credit: acc.balance });
                 totalCredit += acc.balance;
            }
        });

        const netDifference = totalDebit - totalCredit; 
        
        if (netDifference > 0) {
             lines.push({ id: 'plug', accountId: retainedEarningsAcc.id, debit: 0, credit: netDifference });
        } else if (netDifference < 0) {
             lines.push({ id: 'plug', accountId: retainedEarningsAcc.id, debit: Math.abs(netDifference), credit: 0 });
        }

        const je: JournalEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            reference: `CLOSE-${new Date().getFullYear()}`,
            description: `إقفال السنة المالية ${new Date().getFullYear()}`,
            status: 'POSTED',
            moduleId: ModuleType.ACCOUNTS,
            branchId: 'HEADQUARTERS',
            totalAmount: Math.max(totalDebit, totalCredit),
            createdAt: new Date().toISOString(),
            createdBy: 'Admin',
            lines: lines
        };

        StorageService.postJournalEntry(je);
        setIsClosed(true);
        alert("تم إقفال السنة المالية بنجاح.");
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                    <RefreshCcw className="text-teal-600" /> العمليات الدورية والإقفال
                </h2>
                <button onClick={onBack} className="bg-white border border-slate-300 px-4 py-2 rounded text-slate-700 hover:bg-slate-50 font-bold">رجوع</button>
            </div>

            <div className="flex gap-4 mb-6">
                <button 
                    onClick={() => setTab('DEPRECIATION')}
                    className={`px-6 py-3 rounded-xl border flex items-center gap-2 font-bold transition-all ${tab === 'DEPRECIATION' ? 'bg-white border-teal-500 text-teal-700 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                >
                    <Scale size={20} /> إهلاك الأصول
                </button>
                <button 
                    onClick={() => setTab('CLOSING')}
                    className={`px-6 py-3 rounded-xl border flex items-center gap-2 font-bold transition-all ${tab === 'CLOSING' ? 'bg-white border-rose-500 text-rose-700 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                >
                    <Lock size={20} /> إقفال السنة المالية
                </button>
            </div>

            <div className="bg-white rounded-xl shadow border border-slate-200 flex-1 p-8 overflow-auto">
                
                {tab === 'DEPRECIATION' && (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-teal-50 border border-teal-200 p-4 rounded-lg mb-8 text-teal-800 text-sm">
                            يستخدم هذا النموذج لتوليد قيد الإهلاك الشهري للأصول. <br/>
                            <strong>القيد الناتج:</strong> من ح/ مصروف الإهلاك &rarr; إلى ح/ مجمع الإهلاك
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">حساب الأصل (السيارات/المعدات)</label>
                                <select className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={depForm.assetAccountId} onChange={e => setDepForm({...depForm, assetAccountId: e.target.value})}>
                                    <option value="">-- اختر حساب الأصل --</option>
                                    {accounts.filter(a => a.code.startsWith('12') && a.isLeaf).map(a => <option key={a.id} value={a.id}>{a.code} - {a.name} ({a.balance.toLocaleString()})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ القيد</label>
                                <input type="date" className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={depForm.date} onChange={e => setDepForm({...depForm, date: e.target.value})} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">حساب مصروف الإهلاك (مدين)</label>
                                <select className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={depForm.expenseAccountId} onChange={e => setDepForm({...depForm, expenseAccountId: e.target.value})}>
                                    <option value="">-- اختر حساب المصروف --</option>
                                    {accounts.filter(a => a.code.startsWith('5') && a.isLeaf).map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">حساب مجمع الإهلاك (دائن)</label>
                                <select className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={depForm.accumulatedAccountId} onChange={e => setDepForm({...depForm, accumulatedAccountId: e.target.value})}>
                                    <option value="">-- اختر حساب المجمع --</option>
                                    {accounts.filter(a => a.code.startsWith('2') && a.isLeaf).map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">نسبة الإهلاك السنوي % (اختياري)</label>
                                <input type="number" className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={depForm.rate} onChange={e => setDepForm({...depForm, rate: Number(e.target.value)})} placeholder="20" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">أو مبلغ الإهلاك المحدد</label>
                                <input type="number" className="w-full border border-slate-300 p-3 rounded font-bold bg-white text-slate-900 focus:border-gold-500 outline-none" value={depForm.amount} onChange={e => setDepForm({...depForm, amount: Number(e.target.value)})} placeholder="0.00" />
                            </div>
                        </div>

                        <button onClick={handleGenerateDepreciation} className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-teal-700 transition-colors flex justify-center items-center gap-2">
                            <RefreshCcw /> توليد قيد الإهلاك
                        </button>
                    </div>
                )}

                {tab === 'CLOSING' && (
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock size={40} className="text-rose-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">إقفال السنة المالية</h2>
                        <p className="text-slate-500 mb-8">سيقوم النظام بحساب صافي الربح/الخسارة وتصفير جميع حسابات قائمة الدخل.</p>

                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-right mb-8">
                            <h3 className="font-bold text-slate-700 border-b border-slate-200 pb-2 mb-4">ملخص الأداء المتوقع للإقفال</h3>
                            <div className="flex justify-between items-center mb-2">
                                <span>إجمالي الإيرادات (دائن):</span>
                                <span className="font-mono font-bold text-green-600">{closingData.revenue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span>إجمالي المصروفات (مدين):</span>
                                <span className="font-mono font-bold text-red-600">{closingData.expense.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between items-center bg-white p-2 rounded">
                                <span className="font-bold text-slate-900">صافي الربح (يضاف للأرباح المبقاة):</span>
                                <span className="font-mono font-black text-xl text-blue-700">{closingData.net.toLocaleString()}</span>
                            </div>
                        </div>

                        {isClosed ? (
                            <div className="bg-green-100 text-green-800 p-4 rounded-xl font-bold border border-green-200 flex items-center justify-center gap-2">
                                <CheckCircle /> تم إقفال السنة بنجاح
                            </div>
                        ) : (
                            <button onClick={handleCloseYear} className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-rose-700 transition-colors flex justify-center items-center gap-2">
                                <Lock /> تنفيذ الإقفال النهائي
                            </button>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default AccountingModule;