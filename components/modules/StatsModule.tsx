import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storageService';
import { JournalEntry, VehicleStatus, Vehicle, Client, OperationalTask, MaintenanceRecord, Account } from '../../types';
import { 
  BarChart2, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Calendar, 
  ArrowUp, 
  ArrowDown, 
  Users,
  Briefcase,
  FileText, 
  Printer, 
  ClipboardList, 
  ShieldCheck, 
  Clock, 
  ArrowLeft, 
  CheckCircle, 
  History, 
  Eye, 
  File, 
  Download, 
  CalendarDays, 
  Layers, 
  AlertCircle as AlertCircleIcon // Renamed to avoid collision if needed
} from 'lucide-react';

type ViewMode = 'DASHBOARD' | 'REPORTS' | 'ARCHIVE';
type ReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'SAFETY' | null;

const StatsModule: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  const [activeReport, setActiveReport] = useState<ReportType>(null);
  
  // Dashboard Data State
  const [financials, setFinancials] = useState<{revenue: number, expense: number, profit: number}>({ revenue: 0, expense: 0, profit: 0 });
  const [monthlyData, setMonthlyData] = useState<{month: string, revenue: number, expense: number}[]>([]);
  const [fleetStats, setFleetStats] = useState<{total: number, rented: number, available: number, maintenance: number}>({ total: 0, rented: 0, available: 0, maintenance: 0 });
  const [topClients, setTopClients] = useState<{name: string, value: number}[]>([]);

  useEffect(() => {
    calculateStatistics();
  }, []);

  const calculateStatistics = () => {
    const journal = StorageService.getJournal().filter(j => j.status === 'POSTED');
    const vehicles = StorageService.getVehicles();
    const tasks = StorageService.getTasks();
    const clients = StorageService.getClients();
    const accounts = StorageService.getAccounts();

    // 1. Financials (Global)
    const rev = accounts.filter(a => a.code.startsWith('4')).reduce((sum, a) => sum + Math.abs(a.balance), 0);
    const exp = accounts.filter(a => a.code.startsWith('5')).reduce((sum, a) => sum + a.balance, 0);

    setFinancials({
        revenue: rev,
        expense: exp,
        profit: rev - exp
    });

    // 2. Monthly Trends (Last 6 Months)
    const months: any = {};
    const today = new Date();
    for(let i=5; i>=0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = d.toLocaleString('en-US', { month: 'short' });
        months[key] = { revenue: 0, expense: 0 };
    }

    journal.forEach(entry => {
        const d = new Date(entry.date);
        const key = d.toLocaleString('en-US', { month: 'short' });
        if(months[key]) {
            if(entry.moduleId === 'TASKS') months[key].revenue += entry.totalAmount;
            if(entry.moduleId === 'FLEET' || entry.moduleId === 'HR' || entry.moduleId === 'STORE') months[key].expense += entry.totalAmount;
        }
    });

    setMonthlyData(Object.keys(months).map(k => ({ month: k, revenue: months[k].revenue, expense: months[k].expense })));

    // 3. Fleet Stats
    setFleetStats({
        total: vehicles.length,
        rented: vehicles.filter(v => v.status === VehicleStatus.RENTED).length,
        available: vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length,
        maintenance: vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE || v.status === VehicleStatus.OUT_OF_SERVICE).length
    });

    // 4. Top Clients
    const clientRev: Record<string, number> = {};
    tasks.forEach(t => {
        if(!clientRev[t.clientId]) clientRev[t.clientId] = 0;
        clientRev[t.clientId] += t.revenue;
    });
    
    const topList = Object.keys(clientRev).map(cid => {
        const c = clients.find(x => x.id === cid);
        return { name: c?.name || 'Unknown', value: clientRev[cid] };
    }).sort((a,b) => b.value - a.value).slice(0, 5); 

    setTopClients(topList);
  };

  // --- REPORT GENERATION LOGIC ---
  const renderReportContent = () => {
      switch(activeReport) {
          case 'DAILY': return <DailyReportTemplate />;
          case 'WEEKLY': return <WeeklyReportTemplate />;
          case 'MONTHLY': return <MonthlyReportTemplate />;
          case 'QUARTERLY': return <QuarterlyReportTemplate />;
          case 'YEARLY': return <YearlyReportTemplate />;
          case 'SAFETY': return <SafetyReportTemplate />;
          default: return null;
      }
  };

  const handleExportReport = () => {
      // Logic to export specific data based on activeReport
      // This is a placeholder for the concept
      alert("سيتم تصدير البيانات بصيغة CSV...");
  };

  // --- MOCK ARCHIVE DATA ---
  const archiveReports = [
      { id: 1, type: 'تقرير مالي شهري', date: '2024-03-31', user: 'Admin', size: '2.4 MB' },
      { id: 2, type: 'تقرير أداء أسبوعي', date: '2024-03-28', user: 'Ops Manager', size: '1.1 MB' },
      { id: 3, type: 'تقرير سلامة فنية', date: '2024-03-25', user: 'Fleet Mgr', size: '4.5 MB' },
      { id: 4, type: 'تقرير تشغيلي يومي', date: '2024-03-24', user: 'Admin', size: '0.8 MB' },
  ];

  return (
    <div className="h-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <PieChart className="text-gold-500" /> الإحصائيات والتقارير الدورية
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                    {viewMode === 'DASHBOARD' ? 'نظرة شاملة على أداء الشركة المالي والتشغيلي' : viewMode === 'REPORTS' ? 'إصدار التقارير الدورية والإدارية' : 'سجل التقارير السابقة والأرشيف'}
                </p>
            </div>
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                 <button 
                    onClick={() => { setViewMode('DASHBOARD'); setActiveReport(null); }}
                    className={`px-4 py-2 rounded-md font-bold text-sm transition-all flex items-center gap-2 ${viewMode === 'DASHBOARD' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                    <Activity size={16} /> لوحة المؤشرات
                 </button>
                 <button 
                    onClick={() => { setViewMode('REPORTS'); setActiveReport(null); }}
                    className={`px-4 py-2 rounded-md font-bold text-sm transition-all flex items-center gap-2 ${viewMode === 'REPORTS' ? 'bg-white text-gold-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                    <FileText size={16} /> التقارير الدورية
                 </button>
                 <button 
                    onClick={() => { setViewMode('ARCHIVE'); setActiveReport(null); }}
                    className={`px-4 py-2 rounded-md font-bold text-sm transition-all flex items-center gap-2 ${viewMode === 'ARCHIVE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                    <History size={16} /> الأرشيف والسجلات
                 </button>
            </div>
        </div>

        {/* DASHBOARD VIEW */}
        {viewMode === 'DASHBOARD' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
                {/* 1. KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KPICard title="إجمالي الإيرادات" amount={financials.revenue} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" />
                    <KPICard title="إجمالي المصروفات" amount={financials.expense} icon={TrendingDown} color="text-rose-600" bg="bg-rose-50" border="border-rose-100" />
                    <KPICard title="صافي الأرباح" amount={financials.profit} icon={DollarSign} color={financials.profit >= 0 ? "text-blue-600" : "text-red-600"} bg={financials.profit >= 0 ? "bg-blue-50" : "bg-red-50"} border={financials.profit >= 0 ? "border-blue-100" : "border-red-100"} />
                </div>

                {/* 2. Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-80">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart2 size={18} className="text-slate-400" /> النمو الشهري (إيرادات vs مصروفات)</h3>
                        <div className="flex-1 flex items-end justify-between gap-4 px-4 pb-2">
                            {monthlyData.map((d, i) => {
                                const maxVal = Math.max(...monthlyData.map(m => Math.max(m.revenue, m.expense))) || 1;
                                const revH = (d.revenue / maxVal) * 100;
                                const expH = (d.expense / maxVal) * 100;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-2 group w-full">
                                        <div className="relative w-full h-48 flex justify-center items-end gap-1">
                                            <div className="w-3 md:w-6 bg-emerald-500 rounded-t-sm" style={{ height: `${Math.max(revH, 2)}%` }} title={`Rev: ${d.revenue}`}></div>
                                            <div className="w-3 md:w-6 bg-rose-500 rounded-t-sm" style={{ height: `${Math.max(expH, 2)}%` }} title={`Exp: ${d.expense}`}></div>
                                        </div>
                                        <span className="text-xs text-slate-500 font-bold">{d.month}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex flex-col gap-6">
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex-1">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PieChart size={18} className="text-slate-400" /> حالة الأسطول</h3>
                            <div className="space-y-3">
                                <FleetProgress label="مؤجرة (في الخدمة)" value={fleetStats.rented} total={fleetStats.total} color="bg-blue-500" />
                                <FleetProgress label="متاحة (جاهزة)" value={fleetStats.available} total={fleetStats.total} color="bg-emerald-500" />
                                <FleetProgress label="صيانة / خارج الخدمة" value={fleetStats.maintenance} total={fleetStats.total} color="bg-orange-500" />
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex-1 overflow-auto">
                             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Briefcase size={18} className="text-slate-400" /> أهم العملاء</h3>
                            <div className="space-y-2">
                                {topClients.map((c, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm border-b border-slate-50 pb-1 last:border-0">
                                        <span className="text-slate-600 font-bold flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">{i+1}</span>
                                            {c.name}
                                        </span>
                                        <span className="font-mono text-slate-800 font-bold">{c.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* REPORTS VIEW */}
        {viewMode === 'REPORTS' && !activeReport && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                 <ReportCard 
                    title="التقرير التشغيلي اليومي" 
                    desc="ملخص الحركة اليومية للمركبات، التكليفات الجديدة، وحالة الصندوق." 
                    icon={Clock} 
                    color="text-blue-600" 
                    bg="bg-blue-50"
                    onClick={() => setActiveReport('DAILY')}
                 />
                 <ReportCard 
                    title="تقرير الأداء الأسبوعي" 
                    desc="تحليل كفاءة التشغيل، نسب الإشغال، ومقارنة الإيرادات بالمستهدف." 
                    icon={TrendingUp} 
                    color="text-emerald-600" 
                    bg="bg-emerald-50"
                    onClick={() => setActiveReport('WEEKLY')}
                 />
                 <ReportCard 
                    title="التقرير المالي الشهري" 
                    desc="قائمة الدخل التقديرية، المصروفات التشغيلية والإدارية، صافي الربح." 
                    icon={CalendarDays} 
                    color="text-gold-600" 
                    bg="bg-gold-50"
                    onClick={() => setActiveReport('MONTHLY')}
                 />
                 <ReportCard 
                    title="التقرير الربع سنوي" 
                    desc="تحليل الأداء للأشهر الثلاثة الماضية ومقارنة الفصول." 
                    icon={Layers} 
                    color="text-purple-600" 
                    bg="bg-purple-50"
                    onClick={() => setActiveReport('QUARTERLY')}
                 />
                 <ReportCard 
                    title="التقرير السنوي الختامي" 
                    desc="ملخص السنة المالية، الميزانية العمومية، والأرباح المبقاة." 
                    icon={Briefcase} 
                    color="text-slate-800" 
                    bg="bg-slate-100"
                    onClick={() => setActiveReport('YEARLY')}
                 />
                 <ReportCard 
                    title="تقرير السلامة الفنية" 
                    desc="حالة الأسطول الفنية، سجلات الصيانة، التنبيهات، ومتابعة الأعطال." 
                    icon={ShieldCheck} 
                    color="text-red-600" 
                    bg="bg-red-50"
                    onClick={() => setActiveReport('SAFETY')}
                 />
            </div>
        )}

        {/* ARCHIVE VIEW */}
        {viewMode === 'ARCHIVE' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden animate-fadeIn">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <History size={18} className="text-blue-600" /> سجل التقارير المحفوظة
                    </h3>
                    <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">يتم حفظ نسخة تلقائية عند الطباعة</span>
                </div>
                <table className="w-full text-right text-sm">
                    <thead className="bg-white text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                            <th className="p-4 w-12 text-center">#</th>
                            <th className="p-4">نوع التقرير</th>
                            <th className="p-4">تاريخ الإصدار</th>
                            <th className="p-4">المستخدم</th>
                            <th className="p-4">حجم الملف</th>
                            <th className="p-4 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {archiveReports.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 text-center text-slate-400 font-mono">{item.id}</td>
                                <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                                    <File size={16} className="text-slate-400" /> {item.type}
                                </td>
                                <td className="p-4 text-slate-600 font-mono">{item.date}</td>
                                <td className="p-4 text-slate-600">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs border border-slate-200">{item.user}</span>
                                </td>
                                <td className="p-4 text-slate-400 font-mono text-xs">{item.size}</td>
                                <td className="p-4 text-center">
                                    <button className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center justify-center gap-1 mx-auto text-xs font-bold">
                                        <Eye size={14} /> معاينة
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* REPORT PREVIEW (DETAILS) */}
        {viewMode === 'REPORTS' && activeReport && (
            <div className="flex-1 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col animate-fadeIn">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                     <div className="flex items-center gap-4">
                         <button onClick={() => setActiveReport(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ArrowLeft size={20} className="text-slate-600" /></button>
                         <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                             <FileText className="text-gold-500" /> معاينة التقرير
                         </h3>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={handleExportReport} className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
                             <Download size={18} /> تصدير (Excel)
                         </button>
                         <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-slate-900 shadow">
                             <Printer size={18} /> طباعة
                         </button>
                     </div>
                </div>
                <div className="flex-1 overflow-auto p-8 bg-slate-50/50">
                    <div className="max-w-4xl mx-auto bg-white shadow-2xl min-h-[800px] p-12 print:shadow-none print:w-full print:p-0">
                        {renderReportContent()}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

// --- REPORT TEMPLATES ---

const ReportHeader = ({ title, subTitle }: { title: string, subTitle: string }) => (
    <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
            <p className="text-slate-500 font-bold">{subTitle}</p>
        </div>
        <div className="text-left">
            <h2 className="text-xl font-bold text-slate-800">NEW ABRAD ERP</h2>
            <p className="text-xs text-slate-400 font-mono">System Generated Report</p>
            <p className="text-xs text-slate-400 font-mono">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
        </div>
    </div>
);

const DailyReportTemplate = () => {
    const today = new Date().toISOString().split('T')[0];
    const tasks = StorageService.getTasks().filter(t => t.date === today);
    const journal = StorageService.getJournal().filter(j => j.date.startsWith(today));
    const vehicles = StorageService.getVehicles();

    const activeVehicles = vehicles.filter(v => v.status === VehicleStatus.RENTED).length;
    const maintVehicles = vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length;
    
    // Calculated Financials for Today
    const dailyRevenue = journal.filter(j => j.moduleId === 'TASKS').reduce((s, j) => s + j.totalAmount, 0);
    const dailyExpense = journal.filter(j => j.moduleId !== 'TASKS').reduce((s, j) => s + j.totalAmount, 0);

    return (
        <div className="space-y-8">
            <ReportHeader title="التقرير التشغيلي اليومي" subTitle={`التاريخ: ${today}`} />
            
            <div className="grid grid-cols-4 gap-4 mb-6">
                <ReportStatBox label="حركة اليوم (إيراد)" value={dailyRevenue.toLocaleString()} color="bg-green-50 text-green-700" />
                <ReportStatBox label="مصروفات اليوم" value={dailyExpense.toLocaleString()} color="bg-red-50 text-red-700" />
                <ReportStatBox label="تكليفات جديدة" value={tasks.length} color="bg-blue-50 text-blue-700" />
                <ReportStatBox label="مركبات بالصيانة" value={maintVehicles} color="bg-orange-50 text-orange-700" />
            </div>

            <section>
                <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">1. حركة التكليفات والتشغيل</h3>
                <table className="w-full text-sm text-right border border-slate-200">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                        <tr>
                            <th className="p-2 border">رقم التكليف</th>
                            <th className="p-2 border">العميل</th>
                            <th className="p-2 border">خط السير</th>
                            <th className="p-2 border">القيمة</th>
                            <th className="p-2 border">الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(t => (
                            <tr key={t.id}>
                                <td className="p-2 border">{t.reference}</td>
                                <td className="p-2 border">{StorageService.getClients().find(c => c.id === t.clientId)?.name}</td>
                                <td className="p-2 border">{t.route}</td>
                                <td className="p-2 border font-mono">{t.revenue.toLocaleString()}</td>
                                <td className="p-2 border">{t.status}</td>
                            </tr>
                        ))}
                        {tasks.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-400">لا توجد حركات مسجلة اليوم</td></tr>}
                    </tbody>
                </table>
            </section>

             <section>
                <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">2. ملخص حالة الأسطول</h3>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-sm">
                    <ul className="flex justify-between">
                         <li>إجمالي المركبات: <strong>{vehicles.length}</strong></li>
                         <li>في الخدمة (مؤجر): <strong>{activeVehicles}</strong></li>
                         <li>جاهز للتشغيل: <strong>{vehicles.length - activeVehicles - maintVehicles}</strong></li>
                         <li>صيانة / معطل: <strong>{maintVehicles}</strong></li>
                    </ul>
                </div>
            </section>
        </div>
    );
};

const WeeklyReportTemplate = () => {
    const tasks = StorageService.getTasks(); // Should filter by week range in real app
    const revenue = tasks.reduce((sum, t) => sum + t.revenue, 0);
    const trips = tasks.length;
    
    return (
        <div className="space-y-8">
            <ReportHeader title="تقرير الأداء الأسبوعي" subTitle="الفترة: الأسبوع الحالي" />
            
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                 <h2 className="text-xl font-bold text-slate-700 mb-2">مؤشر كفاءة التشغيل</h2>
                 <div className="text-4xl font-black text-gold-600 mb-2">88.5%</div>
                 <p className="text-sm text-slate-500">معدل استغلال الأسطول هذا الأسبوع</p>
            </div>

            <section>
                <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">تحليل الأداء</h3>
                <ul className="space-y-4">
                    <li className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded">
                        <span className="font-bold text-slate-700">إجمالي الرحلات / التكليفات</span>
                        <span className="font-mono text-lg">{trips}</span>
                    </li>
                    <li className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded">
                        <span className="font-bold text-slate-700">الإيراد المحقق (تقديري)</span>
                        <span className="font-mono text-lg text-emerald-600 font-bold">{revenue.toLocaleString()} USD</span>
                    </li>
                    <li className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded">
                        <span className="font-bold text-slate-700">عدد العملاء النشطين</span>
                        <span className="font-mono text-lg">4</span>
                    </li>
                </ul>
            </section>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <strong>توصيات النظام:</strong> يلاحظ ارتفاع في طلب السيارات المصفحة، يرجى مراجعة جاهزية المركبات المصفحة في المخازن.
            </div>
        </div>
    );
};

const MonthlyReportTemplate = () => {
    const accounts = StorageService.getAccounts();
    const revenue = accounts.filter(a => a.code.startsWith('4')).reduce((s, a) => s + Math.abs(a.balance), 0);
    const expenses = accounts.filter(a => a.code.startsWith('5')).reduce((s, a) => s + a.balance, 0);
    const profit = revenue - expenses;

    return (
        <div className="space-y-8">
            <ReportHeader title="التقرير المالي الشهري" subTitle={`شهر: ${new Date().toLocaleDateString('ar-EG', {month: 'long', year: 'numeric'})}`} />
            
            <section className="border-2 border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-slate-100 text-slate-800 border-b-2 border-slate-300">
                        <tr>
                            <th className="p-4">البيان</th>
                            <th className="p-4 text-left">القيمة (USD)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700 font-bold">
                        <tr className="bg-green-50">
                            <td className="p-4">إجمالي الإيرادات التشغيلية</td>
                            <td className="p-4 text-left font-mono">{revenue.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td className="p-4 pl-8 text-sm font-normal text-slate-600">- إيرادات تأجير سيارات</td>
                            <td className="p-4 text-left font-mono text-sm text-slate-500">{(revenue * 0.4).toLocaleString()}</td>
                        </tr>
                         <tr>
                            <td className="p-4 pl-8 text-sm font-normal text-slate-600">- إيرادات دعم لوجستي</td>
                            <td className="p-4 text-left font-mono text-sm text-slate-500">{(revenue * 0.6).toLocaleString()}</td>
                        </tr>
                        
                        <tr className="bg-red-50">
                            <td className="p-4">إجمالي المصروفات</td>
                            <td className="p-4 text-left font-mono text-red-600">({expenses.toLocaleString()})</td>
                        </tr>
                         <tr>
                            <td className="p-4 pl-8 text-sm font-normal text-slate-600">- مصروفات المحروقات</td>
                            <td className="p-4 text-left font-mono text-sm text-slate-500">({(expenses * 0.3).toLocaleString()})</td>
                        </tr>
                         <tr>
                            <td className="p-4 pl-8 text-sm font-normal text-slate-600">- الصيانة وقطع الغيار</td>
                            <td className="p-4 text-left font-mono text-sm text-slate-500">({(expenses * 0.2).toLocaleString()})</td>
                        </tr>
                        
                        <tr className="bg-slate-50 border-t-2 border-slate-300 text-lg">
                            <td className="p-4 font-black text-slate-900">صافي الربح / الخسارة</td>
                            <td className={`p-4 text-left font-mono font-black ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {profit.toLocaleString()}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </div>
    );
};

const QuarterlyReportTemplate = () => {
    // Mock Data for Quarterly
    const data = [
        { month: 'الشهر الأول', revenue: 120000, expense: 80000 },
        { month: 'الشهر الثاني', revenue: 145000, expense: 95000 },
        { month: 'الشهر الثالث', revenue: 160000, expense: 90000 },
    ];
    const totalRev = data.reduce((s, x) => s + x.revenue, 0);
    const totalExp = data.reduce((s, x) => s + x.expense, 0);

    return (
        <div className="space-y-8">
            <ReportHeader title="التقرير الربع سنوي (Q1)" subTitle={`الفترة: يناير - مارس ${new Date().getFullYear()}`} />
            
            <div className="flex gap-4 mb-8">
                <div className="flex-1 bg-white border border-slate-200 p-6 rounded-xl text-center shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 mb-2">إجمالي إيرادات الربع</h3>
                    <p className="text-3xl font-black text-slate-800">{totalRev.toLocaleString()}</p>
                </div>
                <div className="flex-1 bg-white border border-slate-200 p-6 rounded-xl text-center shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 mb-2">إجمالي المصروفات</h3>
                    <p className="text-3xl font-black text-slate-800">{totalExp.toLocaleString()}</p>
                </div>
                <div className="flex-1 bg-white border border-slate-200 p-6 rounded-xl text-center shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 mb-2">هامش الربح</h3>
                    <p className="text-3xl font-black text-green-600">{((totalRev - totalExp) / totalRev * 100).toFixed(1)}%</p>
                </div>
            </div>

            <section>
                <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">تحليل الأداء الشهري</h3>
                <table className="w-full text-right text-sm border border-slate-200">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                        <tr>
                            <th className="p-3 border">الشهر</th>
                            <th className="p-3 border">الإيرادات</th>
                            <th className="p-3 border">المصروفات</th>
                            <th className="p-3 border">الصافي</th>
                            <th className="p-3 border">النمو</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i}>
                                <td className="p-3 border font-bold">{row.month}</td>
                                <td className="p-3 border font-mono">{row.revenue.toLocaleString()}</td>
                                <td className="p-3 border font-mono">{row.expense.toLocaleString()}</td>
                                <td className="p-3 border font-mono font-bold text-blue-700">{(row.revenue - row.expense).toLocaleString()}</td>
                                <td className="p-3 border text-green-600 dir-ltr text-left">+5%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

const YearlyReportTemplate = () => {
    return (
        <div className="space-y-8">
            <ReportHeader title="التقرير السنوي الختامي" subTitle={`السنة المالية: ${new Date().getFullYear()}`} />
            
            {/* CHANGED: FROM BG-SLATE-900 TO BG-WHITE */}
            <div className="bg-white border-2 border-slate-200 text-slate-800 p-8 rounded-2xl mb-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-6 text-center text-slate-900">ملخص الأداء السنوي</h2>
                <div className="grid grid-cols-3 gap-8 text-center divide-x divide-slate-200 divide-x-reverse">
                    <div>
                        <p className="text-slate-500 text-sm mb-1 font-bold">إجمالي الأصول</p>
                        <p className="text-3xl font-mono font-bold text-gold-600">2,450,000</p>
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm mb-1 font-bold">صافي الربح السنوي</p>
                        <p className="text-3xl font-mono font-bold text-green-600">320,000</p>
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm mb-1 font-bold">العائد على الاستثمار</p>
                        <p className="text-3xl font-mono font-bold text-blue-600">18.5%</p>
                    </div>
                </div>
            </div>

            <section>
                <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">التوصيات الاستراتيجية للعام القادم</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-700 bg-slate-50 p-6 rounded-xl border border-slate-200 leading-relaxed">
                    <li>زيادة حجم الأسطول بنسبة 20% لتلبية الطلب المتزايد في العقود الربع سنوية.</li>
                    <li>تقليل مصاريف الصيانة عبر استبدال المركبات التي تجاوزت عمرها الافتراضي (موديلات 2018).</li>
                    <li>التركيز على عقود المنظمات لضمان تدفق نقدي مستقر بالعملة الصعبة.</li>
                </ul>
            </section>
        </div>
    );
};

const SafetyReportTemplate = () => {
    const maintRecords = StorageService.getMaintenanceRecords();
    const vehicles = StorageService.getVehicles();
    const maintVehicles = vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE);
    
    return (
        <div className="space-y-8">
            <ReportHeader title="تقرير السلامة الفنية الشامل" subTitle="الوضع الحالي للأسطول" />
            
            <div className="grid grid-cols-2 gap-6">
                 <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                     <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                         <ShieldCheck className="text-green-600"/> المركبات السليمة
                     </h3>
                     <div className="text-4xl font-mono font-bold text-slate-700">{vehicles.length - maintVehicles.length}</div>
                     <p className="text-xs text-slate-400 mt-2">مركبة جاهزة للعمل</p>
                 </div>
                  <div className="bg-white border border-red-200 p-4 rounded-xl shadow-sm">
                     <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                         <AlertCircleIcon className="text-red-600"/> مركبات متوقفة (أعطال)
                     </h3>
                     <div className="text-4xl font-mono font-bold text-red-600">{maintVehicles.length}</div>
                     <p className="text-xs text-red-400 mt-2">تحتاج صيانة عاجلة</p>
                 </div>
            </div>

            <section>
                <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">سجل الصيانة الحديثة</h3>
                <table className="w-full text-sm text-right border border-slate-200">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                        <tr>
                            <th className="p-2 border">المركبة</th>
                            <th className="p-2 border">نوع الصيانة</th>
                            <th className="p-2 border">الوصف</th>
                            <th className="p-2 border">التاريخ</th>
                            <th className="p-2 border">الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {maintRecords.slice(0, 5).map(m => { // Last 5
                             const v = vehicles.find(x => x.id === m.vehicleId);
                             return (
                                 <tr key={m.id}>
                                     <td className="p-2 border font-bold">{v?.plateNumber}</td>
                                     <td className="p-2 border">{m.type}</td>
                                     <td className="p-2 border text-slate-600">{m.description}</td>
                                     <td className="p-2 border">{new Date(m.date).toLocaleDateString()}</td>
                                     <td className="p-2 border text-green-600 font-bold"><CheckCircle size={14} className="inline"/> تم الإصلاح</td>
                                 </tr>
                             );
                        })}
                        {maintRecords.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-400">سجل الصيانة نظيف</td></tr>}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const ReportCard = ({ title, desc, icon: Icon, color, bg, onClick }: any) => (
    <button onClick={onClick} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-gold-300 transition-all text-right group flex gap-4 items-start">
        <div className={`p-4 rounded-lg ${bg} ${color} group-hover:scale-110 transition-transform`}>
            <Icon size={32} />
        </div>
        <div>
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-gold-600 transition-colors mb-2">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
        </div>
    </button>
);

const ReportStatBox = ({ label, value, color }: any) => (
    <div className={`p-4 rounded border ${color} bg-opacity-30 border-opacity-20`}>
        <div className="text-xs font-bold opacity-70 mb-1">{label}</div>
        <div className="text-xl font-bold font-mono">{value}</div>
    </div>
);

const KPICard = ({ title, amount, icon: Icon, color, bg, border }: any) => (
    <div className={`p-6 rounded-xl border shadow-sm ${bg} ${border} relative overflow-hidden group`}>
        <div className="flex justify-between items-start mb-2 relative z-10">
            <span className="text-slate-600 font-bold text-sm">{title}</span>
            <div className={`p-2 rounded-lg bg-white/60 backdrop-blur-sm ${color}`}>
                <Icon size={20} />
            </div>
        </div>
        <div className="relative z-10">
            <h3 className={`text-3xl font-mono font-bold dir-ltr text-right ${color}`}>
                {amount.toLocaleString()}
            </h3>
        </div>
        <Icon size={100} className={`absolute -bottom-4 -left-4 opacity-5 ${color} transform group-hover:scale-110 transition-transform`} />
    </div>
);

const FleetProgress = ({ label, value, total, color }: any) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>{label}</span>
                <span>{value} / {total}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

export default StatsModule;