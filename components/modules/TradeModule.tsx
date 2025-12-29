import React, { useState, useEffect } from 'react';
import { Client, Contract, Account, Quotation } from '../../types';
import { StorageService } from '../../services/storageService';
import { 
  ShoppingCart, 
  FileText, 
  Plus, 
  Users, 
  ArrowLeft, 
  Printer, 
  Search, 
  Save, 
  Trash2, 
  CornerUpLeft, 
  SkipBack, 
  SkipForward,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FolderOpen,
  ClipboardList,
  Calendar,
  BarChart,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

// --- LOCAL TYPES DEFINITION ---
interface Invoice {
  id: string;
  ref: string;
  date: string;
  clientId: string;
  clientName: string;
  amount: number;
  paidAmount: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  items: string;
}

interface Order {
  id: string;
  ref: string;
  date: string;
  clientId: string;
  clientName: string;
  details: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
  totalEstimate: number;
}

interface ReturnTrx {
  id: string;
  ref: string;
  date: string;
  invoiceRef?: string;
  clientId: string;
  amount: number;
  reason: string;
  isPreviousYear: boolean;
}

interface Installment {
  id: string;
  clientId: string;
  clientName: string;
  year: string;
  totalAmount: number;
  paid: number;
  dueDate: string;
  notes: string;
}

// Sub-components definitions
type TradeView = 'MENU' | 'BASIC_DATA' | 'QUOTATIONS' | 'INVOICES' | 'RETURNS' | 'PREV_RETURNS' | 'ORDERS' | 'LAST_YEAR' | 'SALES_REP' | 'CUST_REP';

const TradeModule: React.FC = () => {
  const [currentView, setCurrentView] = useState<TradeView>('MENU');

  const renderContent = () => {
    switch (currentView) {
      case 'MENU': return <TradeMenu onViewChange={setCurrentView} />;
      case 'BASIC_DATA': return <ClientsManager onBack={() => setCurrentView('MENU')} />;
      case 'QUOTATIONS': return <QuotationsManager onBack={() => setCurrentView('MENU')} />;
      case 'INVOICES': return <InvoicesManager onBack={() => setCurrentView('MENU')} />;
      case 'RETURNS': return <ReturnsManager isPrevious={false} onBack={() => setCurrentView('MENU')} />;
      case 'PREV_RETURNS': return <ReturnsManager isPrevious={true} onBack={() => setCurrentView('MENU')} />;
      case 'ORDERS': return <OrdersManager onBack={() => setCurrentView('MENU')} />;
      case 'LAST_YEAR': return <InstallmentsManager onBack={() => setCurrentView('MENU')} />;
      case 'SALES_REP': return <TradeReports type="SALES" onBack={() => setCurrentView('MENU')} />;
      case 'CUST_REP': return <TradeReports type="CUSTOMERS" onBack={() => setCurrentView('MENU')} />;
      default: return <TradeMenu onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className="h-full bg-slate-50/50">
      {renderContent()}
    </div>
  );
};

// --- MAIN MENU GRID ---
const TradeMenu = ({ onViewChange }: { onViewChange: (v: TradeView) => void }) => {
  const menuItems = [
    { id: 'BASIC_DATA', label: 'البيانات الأساسية', icon: Users, color: 'bg-blue-600', desc: 'إدارة العملاء والموردين' },
    { id: 'QUOTATIONS', label: 'عروض الأسعار', icon: FileText, color: 'bg-gold-500', desc: 'إعداد ومتابعة العروض' },
    { id: 'INVOICES', label: 'فواتير المبيعات', icon: ShoppingCart, color: 'bg-emerald-600', desc: 'إصدار الفواتير الآجلة والنقدية' },
    { id: 'RETURNS', label: 'مردود المبيعات', icon: RefreshCw, color: 'bg-rose-600', desc: 'إثبات مرتجعات البضائع والخدمات' },
    { id: 'ORDERS', label: 'طلبات العملاء', icon: ClipboardList, color: 'bg-slate-600', desc: 'أوامر الشراء الواردة' },
    { id: 'PREV_RETURNS', label: 'مردود سنوات سابقة', icon: SkipBack, color: 'bg-slate-500', desc: 'تسوية مردودات الأعوام الماضية' },
    { id: 'LAST_YEAR', label: 'أقساط العام الماضي', icon: Calendar, color: 'bg-slate-500', desc: 'متابعة الديون المرحلة' },
    { id: 'SALES_REP', label: 'تقارير المبيعات', icon: BarChart, color: 'bg-indigo-600', desc: 'تحليل المبيعات والأداء' },
    { id: 'CUST_REP', label: 'تقارير العملاء', icon: Users, color: 'bg-indigo-600', desc: 'كشوفات حساب وتحليل العملاء' },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-8 border-b border-slate-200 pb-4 flex items-center gap-2">
        <ShoppingCart className="text-gold-500" /> المبيعات والمشتريات
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item: any) => (
          <button 
            key={item.id}
            onClick={() => onViewChange(item.id as TradeView)}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-gold-300 transition-all flex items-center gap-4 group text-right h-32"
          >
            <div className={`p-4 rounded-lg ${item.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
              <item.icon size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-gold-600 transition-colors">{item.label}</h3>
              <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// --- 1. INVOICES MANAGER ---
const InvoicesManager = ({ onBack }: { onBack: () => void }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Invoice>>({ date: new Date().toISOString().split('T')[0], status: 'UNPAID' });

  useEffect(() => {
    setInvoices(StorageService.get<Invoice>('trade_invoices'));
    setClients(StorageService.getClients());
  }, []);

  const handleSave = () => {
    if(!form.clientId || !form.amount) { alert('البيانات ناقصة'); return; }
    const client = clients.find(c => c.id === form.clientId);
    
    const newInv: Invoice = {
      id: form.id || Date.now().toString(),
      ref: form.ref || `INV-${Date.now().toString().substr(-5)}`,
      date: form.date!,
      clientId: form.clientId,
      clientName: client?.name || '',
      amount: Number(form.amount),
      paidAmount: Number(form.paidAmount || 0),
      status: (Number(form.paidAmount || 0) >= Number(form.amount)) ? 'PAID' : 'UNPAID',
      items: form.items || ''
    };

    const list = [...invoices, newInv];
    StorageService.save('trade_invoices', list);
    setInvoices(list);
    setIsModalOpen(false);
    setForm({ date: new Date().toISOString().split('T')[0], status: 'UNPAID' });
  };

  return (
    <div className="h-full flex flex-col p-6">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><ShoppingCart className="text-emerald-600"/> فواتير المبيعات</h2>
          <div className="flex gap-2">
             <button onClick={onBack} className="px-4 py-2 border rounded-lg bg-white hover:bg-slate-50 font-bold text-slate-600">رجوع</button>
             <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow hover:bg-emerald-700 flex gap-2"><Plus size={18}/> فاتورة جديدة</button>
          </div>
       </div>

       <div className="bg-white rounded-xl shadow border border-slate-200 flex-1 overflow-auto">
          <table className="w-full text-right text-sm">
             <thead className="bg-slate-50 font-bold text-slate-700 sticky top-0">
                <tr>
                   <th className="p-4">رقم الفاتورة</th>
                   <th className="p-4">التاريخ</th>
                   <th className="p-4">العميل</th>
                   <th className="p-4">المبلغ الإجمالي</th>
                   <th className="p-4">المدفوع</th>
                   <th className="p-4">الحالة</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {invoices.map(inv => (
                   <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono text-emerald-600 font-bold">{inv.ref}</td>
                      <td className="p-4">{inv.date}</td>
                      <td className="p-4 font-bold">{inv.clientName}</td>
                      <td className="p-4 font-mono">{inv.amount.toLocaleString()}</td>
                      <td className="p-4 font-mono text-slate-500">{inv.paidAmount.toLocaleString()}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{inv.status === 'PAID' ? 'مدفوعة' : 'غير مدفوعة'}</span></td>
                   </tr>
                ))}
             </tbody>
          </table>
          {invoices.length === 0 && <div className="p-10 text-center text-slate-400">لا توجد فواتير</div>}
       </div>

       {isModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
             <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl">
                <h3 className="font-bold text-lg mb-4 border-b pb-2">إصدار فاتورة مبيعات</h3>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="رقم الفاتورة (تلقائي)" className="border p-2 rounded bg-slate-50" readOnly value={form.ref || ''}/>
                      <input type="date" className="border p-2 rounded" value={form.date} onChange={e => setForm({...form, date: e.target.value})}/>
                   </div>
                   <select className="w-full border p-2 rounded" value={form.clientId || ''} onChange={e => setForm({...form, clientId: e.target.value})}>
                      <option value="">اختر العميل</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                   <input type="number" placeholder="المبلغ الإجمالي" className="w-full border p-2 rounded font-bold" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})}/>
                   <input type="number" placeholder="المبلغ المدفوع (مقدم)" className="w-full border p-2 rounded" value={form.paidAmount || ''} onChange={e => setForm({...form, paidAmount: Number(e.target.value)})}/>
                   <textarea placeholder="تفاصيل الفاتورة / الأصناف" className="w-full border p-2 rounded h-20" value={form.items || ''} onChange={e => setForm({...form, items: e.target.value})}></textarea>
                   <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">إلغاء</button>
                      <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700">حفظ وترحيل</button>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

// --- 2. RETURNS MANAGER (Current & Previous) ---
const ReturnsManager = ({ isPrevious, onBack }: { isPrevious: boolean, onBack: () => void }) => {
  const [returns, setReturns] = useState<ReturnTrx[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<ReturnTrx>>({ date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    const allReturns = StorageService.get<ReturnTrx>('trade_returns');
    setReturns(allReturns.filter(r => !!r.isPreviousYear === isPrevious));
    setClients(StorageService.getClients());
  }, [isPrevious]);

  const handleSave = () => {
    if(!form.clientId || !form.amount) { alert('البيانات ناقصة'); return; }
    
    const newReturn: ReturnTrx = {
      id: Date.now().toString(),
      ref: `RET-${isPrevious ? 'PREV-' : ''}${Date.now().toString().substr(-5)}`,
      date: form.date!,
      clientId: form.clientId,
      amount: Number(form.amount),
      reason: form.reason || '',
      isPreviousYear: isPrevious,
      invoiceRef: form.invoiceRef
    };

    const allReturns = StorageService.get<ReturnTrx>('trade_returns');
    const updated = [...allReturns, newReturn];
    StorageService.save('trade_returns', updated);
    
    setReturns(updated.filter(r => !!r.isPreviousYear === isPrevious));
    setIsModalOpen(false);
    setForm({ date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="h-full flex flex-col p-6">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             {isPrevious ? <SkipBack className="text-slate-500"/> : <RefreshCw className="text-rose-600"/>}
             {isPrevious ? 'مردودات سنوات سابقة' : 'مردود المبيعات (الحالي)'}
          </h2>
          <div className="flex gap-2">
             <button onClick={onBack} className="px-4 py-2 border rounded-lg bg-white hover:bg-slate-50 font-bold text-slate-600">رجوع</button>
             <button onClick={() => setIsModalOpen(true)} className={`px-4 py-2 text-white rounded-lg font-bold shadow flex gap-2 ${isPrevious ? 'bg-slate-600 hover:bg-slate-700' : 'bg-rose-600 hover:bg-rose-700'}`}><Plus size={18}/> تسجيل مردود</button>
          </div>
       </div>

       <div className="bg-white rounded-xl shadow border border-slate-200 flex-1 overflow-auto">
          <table className="w-full text-right text-sm">
             <thead className="bg-slate-50 font-bold text-slate-700 sticky top-0">
                <tr>
                   <th className="p-4">رقم المردود</th>
                   <th className="p-4">التاريخ</th>
                   <th className="p-4">العميل</th>
                   <th className="p-4">المبلغ المسترد</th>
                   {!isPrevious && <th className="p-4">مرتبط بفاتورة</th>}
                   <th className="p-4">السبب</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {returns.map(ret => (
                   <tr key={ret.id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono text-rose-600 font-bold">{ret.ref}</td>
                      <td className="p-4">{ret.date}</td>
                      <td className="p-4 font-bold">{clients.find(c => c.id === ret.clientId)?.name}</td>
                      <td className="p-4 font-mono">{ret.amount.toLocaleString()}</td>
                      {!isPrevious && <td className="p-4 font-mono text-slate-500">{ret.invoiceRef || '-'}</td>}
                      <td className="p-4 text-slate-500">{ret.reason}</td>
                   </tr>
                ))}
             </tbody>
          </table>
          {returns.length === 0 && <div className="p-10 text-center text-slate-400">لا توجد مردودات مسجلة</div>}
       </div>

       {isModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
             <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl">
                <h3 className="font-bold text-lg mb-4 border-b pb-2">تسجيل حركة مردود</h3>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <input type="date" className="border p-2 rounded" value={form.date} onChange={e => setForm({...form, date: e.target.value})}/>
                      {!isPrevious && <input type="text" placeholder="رقم الفاتورة الأصلية (اختياري)" className="border p-2 rounded" value={form.invoiceRef || ''} onChange={e => setForm({...form, invoiceRef: e.target.value})}/>}
                   </div>
                   <select className="w-full border p-2 rounded" value={form.clientId || ''} onChange={e => setForm({...form, clientId: e.target.value})}>
                      <option value="">اختر العميل</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                   <input type="number" placeholder="قيمة المردود" className="w-full border p-2 rounded font-bold text-red-600" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})}/>
                   <textarea placeholder="سبب الإرجاع / البيان" className="w-full border p-2 rounded h-20" value={form.reason || ''} onChange={e => setForm({...form, reason: e.target.value})}></textarea>
                   <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">إلغاء</button>
                      <button onClick={handleSave} className="px-6 py-2 bg-rose-600 text-white rounded font-bold hover:bg-rose-700">حفظ الحركة</button>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

// --- 3. ORDERS MANAGER ---
const OrdersManager = ({ onBack }: { onBack: () => void }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Order>>({ date: new Date().toISOString().split('T')[0], status: 'PENDING' });

  useEffect(() => {
    setOrders(StorageService.get<Order>('trade_orders'));
    setClients(StorageService.getClients());
  }, []);

  const handleSave = () => {
    if(!form.clientId) { alert('البيانات ناقصة'); return; }
    const client = clients.find(c => c.id === form.clientId);
    
    const newOrder: Order = {
      id: Date.now().toString(),
      ref: `ORD-${Date.now().toString().substr(-5)}`,
      date: form.date!,
      clientId: form.clientId,
      clientName: client?.name || '',
      details: form.details || '',
      status: form.status || 'PENDING',
      totalEstimate: Number(form.totalEstimate || 0)
    };

    const list = [...orders, newOrder];
    StorageService.save('trade_orders', list);
    setOrders(list);
    setIsModalOpen(false);
    setForm({ date: new Date().toISOString().split('T')[0], status: 'PENDING' });
  };

  return (
    <div className="h-full flex flex-col p-6">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><ClipboardList className="text-slate-600"/> طلبات العملاء (أوامر الشراء)</h2>
          <div className="flex gap-2">
             <button onClick={onBack} className="px-4 py-2 border rounded-lg bg-white hover:bg-slate-50 font-bold text-slate-600">رجوع</button>
             <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-slate-700 text-white rounded-lg font-bold shadow hover:bg-slate-800 flex gap-2"><Plus size={18}/> طلب جديد</button>
          </div>
       </div>

       <div className="bg-white rounded-xl shadow border border-slate-200 flex-1 overflow-auto">
          <table className="w-full text-right text-sm">
             <thead className="bg-slate-50 font-bold text-slate-700 sticky top-0">
                <tr>
                   <th className="p-4">رقم الطلب</th>
                   <th className="p-4">التاريخ</th>
                   <th className="p-4">العميل</th>
                   <th className="p-4">التفاصيل</th>
                   <th className="p-4">تقدير التكلفة</th>
                   <th className="p-4">الحالة</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {orders.map(ord => (
                   <tr key={ord.id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono font-bold text-blue-600">{ord.ref}</td>
                      <td className="p-4">{ord.date}</td>
                      <td className="p-4 font-bold">{ord.clientName}</td>
                      <td className="p-4 text-slate-600">{ord.details}</td>
                      <td className="p-4 font-mono">{ord.totalEstimate.toLocaleString()}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold border ${ord.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>{ord.status}</span></td>
                   </tr>
                ))}
             </tbody>
          </table>
          {orders.length === 0 && <div className="p-10 text-center text-slate-400">لا توجد طلبات</div>}
       </div>

       {isModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
             <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl">
                <h3 className="font-bold text-lg mb-4 border-b pb-2">فتح طلب جديد</h3>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <input type="date" className="border p-2 rounded" value={form.date} onChange={e => setForm({...form, date: e.target.value})}/>
                      <select className="border p-2 rounded" value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}>
                          <option value="PENDING">قيد الانتظار</option>
                          <option value="APPROVED">تمت الموافقة</option>
                          <option value="COMPLETED">مكتمل</option>
                          <option value="CANCELLED">ملغي</option>
                      </select>
                   </div>
                   <select className="w-full border p-2 rounded" value={form.clientId || ''} onChange={e => setForm({...form, clientId: e.target.value})}>
                      <option value="">اختر العميل</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                   <input type="number" placeholder="تكلفة تقديرية (اختياري)" className="w-full border p-2 rounded" value={form.totalEstimate || ''} onChange={e => setForm({...form, totalEstimate: Number(e.target.value)})}/>
                   <textarea placeholder="تفاصيل الطلب / المواد المطلوبة" className="w-full border p-2 rounded h-24" value={form.details || ''} onChange={e => setForm({...form, details: e.target.value})}></textarea>
                   <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">إلغاء</button>
                      <button onClick={handleSave} className="px-6 py-2 bg-slate-700 text-white rounded font-bold hover:bg-slate-800">حفظ الطلب</button>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

// --- 4. INSTALLMENTS MANAGER (Last Year) ---
const InstallmentsManager = ({ onBack }: { onBack: () => void }) => {
  const [items, setItems] = useState<Installment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Installment>>({ year: '2023', dueDate: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    setItems(StorageService.get<Installment>('trade_installments'));
    setClients(StorageService.getClients());
  }, []);

  const handleSave = () => {
    if(!form.clientId || !form.totalAmount) return;
    const client = clients.find(c => c.id === form.clientId);
    
    const newItem: Installment = {
      id: Date.now().toString(),
      clientId: form.clientId,
      clientName: client?.name || '',
      year: form.year || '2023',
      totalAmount: Number(form.totalAmount),
      paid: Number(form.paid || 0),
      dueDate: form.dueDate!,
      notes: form.notes || ''
    };

    const list = [...items, newItem];
    StorageService.save('trade_installments', list);
    setItems(list);
    setIsModalOpen(false);
    setForm({ year: '2023', dueDate: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="h-full flex flex-col p-6">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Calendar className="text-slate-500"/> أقساط العام الماضي</h2>
          <div className="flex gap-2">
             <button onClick={onBack} className="px-4 py-2 border rounded-lg bg-white hover:bg-slate-50 font-bold text-slate-600">رجوع</button>
             <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-slate-600 text-white rounded-lg font-bold shadow hover:bg-slate-700 flex gap-2"><Plus size={18}/> إضافة رصيد سابق</button>
          </div>
       </div>

       <div className="bg-white rounded-xl shadow border border-slate-200 flex-1 overflow-auto">
          <table className="w-full text-right text-sm">
             <thead className="bg-slate-50 font-bold text-slate-700 sticky top-0">
                <tr>
                   <th className="p-4">السنة</th>
                   <th className="p-4">العميل</th>
                   <th className="p-4">المبلغ المستحق</th>
                   <th className="p-4">المسدد</th>
                   <th className="p-4">المتبقي</th>
                   <th className="p-4">تاريخ الاستحقاق</th>
                   <th className="p-4">ملاحظات</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {items.map(item => (
                   <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono">{item.year}</td>
                      <td className="p-4 font-bold">{item.clientName}</td>
                      <td className="p-4 font-mono text-red-600">{item.totalAmount.toLocaleString()}</td>
                      <td className="p-4 font-mono text-green-600">{item.paid.toLocaleString()}</td>
                      <td className="p-4 font-mono font-bold">{(item.totalAmount - item.paid).toLocaleString()}</td>
                      <td className="p-4">{item.dueDate}</td>
                      <td className="p-4 text-slate-500 text-xs">{item.notes}</td>
                   </tr>
                ))}
             </tbody>
          </table>
          {items.length === 0 && <div className="p-10 text-center text-slate-400">لا توجد أقساط مرحلة</div>}
       </div>

       {isModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
             <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl">
                <h3 className="font-bold text-lg mb-4 border-b pb-2">إضافة رصيد / قسط سابق</h3>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="السنة (مثلاً 2023)" className="border p-2 rounded" value={form.year} onChange={e => setForm({...form, year: e.target.value})}/>
                      <input type="date" className="border p-2 rounded" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})}/>
                   </div>
                   <select className="w-full border p-2 rounded" value={form.clientId || ''} onChange={e => setForm({...form, clientId: e.target.value})}>
                      <option value="">اختر العميل</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                   <div className="grid grid-cols-2 gap-4">
                      <input type="number" placeholder="إجمالي المبلغ" className="border p-2 rounded font-bold" value={form.totalAmount || ''} onChange={e => setForm({...form, totalAmount: Number(e.target.value)})}/>
                      <input type="number" placeholder="ما تم سداده" className="border p-2 rounded" value={form.paid || ''} onChange={e => setForm({...form, paid: Number(e.target.value)})}/>
                   </div>
                   <input type="text" placeholder="ملاحظات" className="w-full border p-2 rounded" value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})}/>
                   
                   <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">إلغاء</button>
                      <button onClick={handleSave} className="px-6 py-2 bg-slate-600 text-white rounded font-bold hover:bg-slate-700">حفظ</button>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

// --- 5. REPORTS ---
const TradeReports = ({ type, onBack }: { type: 'SALES' | 'CUSTOMERS', onBack: () => void }) => {
  const invoices = StorageService.get<Invoice>('trade_invoices');
  const returns = StorageService.get<ReturnTrx>('trade_returns');
  
  const totalSales = invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalReturns = returns.reduce((sum, r) => sum + r.amount, 0);
  const netSales = totalSales - totalReturns;

  return (
    <div className="h-full flex flex-col p-6">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             {type === 'SALES' ? <BarChart className="text-indigo-600"/> : <Users className="text-indigo-600"/>}
             {type === 'SALES' ? 'تقارير المبيعات التحليلية' : 'تقارير حركة العملاء'}
          </h2>
          <button onClick={onBack} className="px-4 py-2 border rounded-lg bg-white hover:bg-slate-50 font-bold text-slate-600">رجوع للقائمة</button>
       </div>

       {type === 'SALES' ? (
          <div className="space-y-6">
             <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <p className="text-slate-500 text-sm font-bold">إجمالي المبيعات</p>
                   <h3 className="text-2xl font-mono font-bold text-blue-600">{totalSales.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <p className="text-slate-500 text-sm font-bold">إجمالي المردودات</p>
                   <h3 className="text-2xl font-mono font-bold text-rose-600">{totalReturns.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <p className="text-slate-500 text-sm font-bold">صافي المبيعات</p>
                   <h3 className="text-2xl font-mono font-bold text-emerald-600">{netSales.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <p className="text-slate-500 text-sm font-bold">التحصيل النقدي</p>
                   <h3 className="text-2xl font-mono font-bold text-gold-600">{totalPaid.toLocaleString()}</h3>
                </div>
             </div>
             
             <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2">آخر الفواتير الصادرة</h3>
                <table className="w-full text-right text-sm">
                   <thead className="bg-slate-50 font-bold text-slate-600">
                      <tr>
                         <th className="p-3">رقم الفاتورة</th>
                         <th className="p-3">العميل</th>
                         <th className="p-3">التاريخ</th>
                         <th className="p-3">المبلغ</th>
                      </tr>
                   </thead>
                   <tbody>
                      {invoices.slice(-5).reverse().map(inv => (
                         <tr key={inv.id} className="border-b last:border-0">
                            <td className="p-3 font-mono">{inv.ref}</td>
                            <td className="p-3">{inv.clientName}</td>
                            <td className="p-3">{inv.date}</td>
                            <td className="p-3 font-mono font-bold">{inv.amount.toLocaleString()}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
       ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex-1">
             <div className="flex items-center justify-center h-full flex-col text-slate-400">
                <Users size={64} className="mb-4 opacity-20"/>
                <p>حدد العميل لعرض كشف الحساب التفصيلي (قريباً)</p>
             </div>
          </div>
       )}
    </div>
  );
};

// --- QUOTATIONS MANAGER (Original preserved) ---
const QuotationsManager = ({ onBack }: { onBack: () => void }) => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<'VIEW' | 'EDIT' | 'ADD'>('VIEW');

  // Form State
  const defaultForm: Partial<Quotation> = {
    date: new Date().toISOString().split('T')[0],
    currency: 'YER',
    exchangeRate: 1,
    discount: 0,
    total: 0,
    finalTotal: 0,
    status: 'DRAFT'
  };
  const [formData, setFormData] = useState<Partial<Quotation>>(defaultForm);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const data = StorageService.getQuotations();
    setQuotations(data);
    setClients(StorageService.getClients());
    if (data.length > 0) {
      setFormData(data[data.length - 1]);
      setCurrentIndex(data.length - 1);
    } else {
      setMode('ADD');
      setFormData(defaultForm);
    }
  };

  const handleFirst = () => { if(quotations.length) { setCurrentIndex(0); setFormData(quotations[0]); setMode('VIEW'); } };
  const handleLast = () => { if(quotations.length) { setCurrentIndex(quotations.length - 1); setFormData(quotations[quotations.length - 1]); setMode('VIEW'); } };
  const handleNext = () => { if(currentIndex < quotations.length - 1) { setCurrentIndex(i => i + 1); setFormData(quotations[currentIndex + 1]); setMode('VIEW'); } };
  const handlePrev = () => { if(currentIndex > 0) { setCurrentIndex(i => i - 1); setFormData(quotations[currentIndex - 1]); setMode('VIEW'); } };

  const handleAdd = () => {
    setMode('ADD');
    setFormData({ ...defaultForm, offerNumber: `QT-${Date.now().toString().substr(-6)}` });
  };

  const handleSave = () => {
    if (!formData.offerNumber || !formData.clientId) { alert("يرجى تعبئة رقم العرض والعميل"); return; }
    const client = clients.find(c => c.id === formData.clientId);
    const finalTotal = (formData.total || 0) - (formData.discount || 0);

    const quotation: Quotation = {
      id: formData.id || Date.now().toString(),
      offerNumber: formData.offerNumber,
      date: formData.date!,
      currency: formData.currency || 'YER',
      exchangeRate: formData.exchangeRate || 1,
      clientId: formData.clientId!,
      clientName: client?.name || '',
      tenderNumber: formData.tenderNumber,
      tenderDate: formData.tenderDate,
      deliveryLocation: formData.deliveryLocation,
      deliveryDate: formData.deliveryDate,
      paymentTerms: formData.paymentTerms,
      deliveryDuration: formData.deliveryDuration,
      description: formData.description || '',
      notes: formData.notes,
      total: formData.total || 0,
      discount: formData.discount || 0,
      finalTotal: finalTotal,
      status: formData.status || 'DRAFT'
    };

    StorageService.saveQuotation(quotation);
    refreshData();
    setMode('VIEW');
    alert("تم الحفظ بنجاح");
  };

  const isReadOnly = mode === 'VIEW';

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white p-2 border-b border-slate-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-1">
          <ActionButton onClick={handleAdd} icon={Plus} label="إضافة" disabled={mode !== 'VIEW'} color="text-green-600" />
          <ActionButton onClick={handleSave} icon={Save} label="حفظ" disabled={mode === 'VIEW'} color="text-gold-600" />
          <div className="w-px h-6 bg-slate-300 mx-2"></div>
          <ActionButton onClick={() => window.print()} icon={Printer} label="طباعة" disabled={mode !== 'VIEW'} />
        </div>
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 font-bold transition-colors">
          <ArrowLeft size={16} /> رجوع
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto bg-white border border-slate-200 shadow-md rounded-lg p-8 min-h-[600px] relative">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2 text-center">عروض الأسعار</h2>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
                <InputGroup label="رقم العرض" value={formData.offerNumber} onChange={(v: string) => setFormData({...formData, offerNumber: v})} readOnly={isReadOnly} />
                <InputGroup label="تاريخ العرض" type="date" value={formData.date} onChange={(v: string) => setFormData({...formData, date: v})} readOnly={isReadOnly} />
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-600 mb-1">العملة</label>
                    <select disabled={isReadOnly} className="border border-slate-300 p-2 rounded text-sm focus:border-gold-500 outline-none bg-white text-slate-900" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value as any})}>
                        <option value="YER">ريال يمني</option>
                        <option value="USD">دولار أمريكي</option>
                        <option value="SAR">ريال سعودي</option>
                    </select>
                </div>
                <InputGroup label="سعر التحويل" type="number" value={formData.exchangeRate} onChange={(v: string) => setFormData({...formData, exchangeRate: Number(v)})} readOnly={isReadOnly} />
            </div>

            <div className="bg-slate-50 p-4 border border-slate-200 rounded mb-6">
                <h3 className="font-bold text-slate-700 mb-3 text-sm">بيانات العميل</h3>
                <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col">
                        <label className="text-xs font-bold text-slate-600 mb-1">العملة</label>
                        <select disabled={isReadOnly} className="border border-slate-300 p-2 rounded text-sm focus:border-gold-500 outline-none bg-white text-slate-900" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                            <option value="">-- اختر العميل --</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <InputGroup label="رقم العميل" value={formData.clientId} readOnly={true} bg="bg-slate-100" />
                </div>
            </div>

            <div className="mb-6">
                <label className="text-xs font-bold text-slate-600 mb-1 block">البيان (تفاصيل العرض)</label>
                <textarea readOnly={isReadOnly} className="w-full h-24 border border-slate-300 p-2 rounded text-sm focus:border-gold-500 outline-none resize-none bg-white text-slate-900" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
            </div>

            <div className="grid grid-cols-3 gap-6 bg-slate-50 p-6 border border-slate-200 rounded">
                <InputGroup label="الإجمالي" type="number" value={formData.total} onChange={(v: string) => setFormData({...formData, total: Number(v), finalTotal: Number(v) - (formData.discount || 0)})} readOnly={isReadOnly} />
                <InputGroup label="الخصم" type="number" value={formData.discount} onChange={(v: string) => setFormData({...formData, discount: Number(v), finalTotal: (formData.total || 0) - Number(v)})} readOnly={isReadOnly} />
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-600 mb-1">الإجمالي النهائي</label>
                    <div className="bg-white text-slate-900 font-mono text-xl p-2 rounded text-center font-bold border-2 border-gold-500 shadow-sm">{formData.finalTotal?.toLocaleString()}</div>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white p-2 border-t border-slate-200 flex justify-center items-center gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <NavButton onClick={handleLast} icon={SkipForward} label="الأخير" disabled={quotations.length === 0} />
        <NavButton onClick={handleNext} icon={ChevronRight} label="التالي" disabled={currentIndex >= quotations.length - 1} />
        <span className="font-mono text-sm font-bold text-slate-600 w-24 text-center">{quotations.length > 0 ? `${currentIndex + 1} / ${quotations.length}` : '0 / 0'}</span>
        <NavButton onClick={handlePrev} icon={ChevronLeft} label="السابق" disabled={currentIndex <= 0} />
        <NavButton onClick={handleFirst} icon={SkipBack} label="الأول" disabled={quotations.length === 0} />
      </div>
    </div>
  );
};

// --- SHARED COMPONENTS ---
const ClientsManager = ({ onBack }: { onBack: () => void }) => (
    <div className="p-8 h-full flex flex-col items-center justify-center">
        <button onClick={onBack} className="mb-4 flex items-center gap-2 text-slate-500 hover:text-slate-800 self-start"><ArrowLeft size={16}/> رجوع</button>
        <div className="text-center text-slate-400">
            <Users size={64} className="mb-4 opacity-30 mx-auto"/>
            <h2 className="text-xl font-bold mb-2 text-slate-600">البيانات الأساسية</h2>
            <p>يتم إدارة العملاء حالياً عبر شاشة العقود أو الإدارة العامة</p>
        </div>
    </div>
);

const ActionButton = ({ onClick, icon: Icon, label, disabled, color }: any) => (
  <button onClick={onClick} disabled={disabled} className={`flex flex-col items-center justify-center px-3 py-1 min-w-[60px] rounded hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${color || 'text-slate-600'}`}>
    <Icon size={20} className="mb-1" />
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

const NavButton = ({ onClick, icon: Icon, label, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50 font-bold text-sm">
        <Icon size={16} /> {label}
    </button>
);

const InputGroup = ({ label, value, onChange, type = 'text', readOnly, bg }: any) => (
    <div className="flex flex-col">
        <label className="text-xs font-bold text-slate-600 mb-1">{label}</label>
        <input type={type} readOnly={readOnly} className={`border border-slate-300 p-2 rounded text-sm focus:border-gold-500 outline-none ${bg || 'bg-white'} ${readOnly ? 'text-slate-600' : 'text-slate-900'}`} value={value || ''} onChange={e => onChange && onChange(e.target.value)} />
    </div>
);

export default TradeModule;