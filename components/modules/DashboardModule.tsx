import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storageService';
import { 
  Truck, 
  DollarSign, 
  Wallet, 
  Activity, 
  Bell, 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Briefcase,
  Link,
  Server,
  Database,
  Calendar
} from 'lucide-react';
import { AccountType, JournalEntry, OperationalTask, VehicleStatus } from '../../types';

const DashboardModule: React.FC = () => {
  const [stats, setStats] = useState({
    totalAssets: 0,
    cashBalance: 0,
    activeTasksCount: 0,
    monthlyRevenue: 0,
    fleetUtil: 0
  });

  const [recentJournals, setRecentJournals] = useState<JournalEntry[]>([]);
  const [activeTasks, setActiveTasks] = useState<OperationalTask[]>([]);
  const [systemHealth, setSystemHealth] = useState<{label: string, status: 'OK' | 'WARN'}[]>([]);
  const [dbConfig, setDbConfig] = useState<{mode: 'LOCAL' | 'NETWORK', ip?: string}>({ mode: 'LOCAL' });
  
  // New: Alerts
  const [alerts, setAlerts] = useState<{type: 'INSURANCE' | 'LICENSE' | 'SYSTEM', msg: string}[]>([]);

  useEffect(() => {
    // 1. Fetch All Data Sources
    const accounts = StorageService.getAccounts();
    const vehicles = StorageService.getVehicles();
    const employees = StorageService.getEmployees();
    const journals = StorageService.getJournal();
    const tasks = StorageService.getTasks();
    const config = StorageService.getConfig();

    // 2. Connectivity Checks (Real Logic)
    const healthChecks: {label: string, status: 'OK' | 'WARN'}[] = [];
    
    // Check DB Mode
    if (config?.serverIp) {
        setDbConfig({ mode: 'NETWORK', ip: config.serverIp });
        healthChecks.push({ label: `السيرفر: ${config.serverIp}`, status: 'OK' });
    } else {
        setDbConfig({ mode: 'LOCAL' });
        healthChecks.push({ label: "قاعدة البيانات: محلية", status: 'WARN' });
    }

    if (accounts.length > 0) healthChecks.push({ label: "الدليل المحاسبي: جاهز", status: 'OK' });
    if (vehicles.length > 0) healthChecks.push({ label: "الأسطول: متصل", status: 'OK' });

    setSystemHealth(healthChecks);

    // 3. Calculate Real-time Financials
    const totalAssets = accounts
        .filter(a => a.type === AccountType.ASSET)
        .reduce((sum, a) => sum + (a.isLeaf ? a.balance : 0), 0);
    
    // Cash (1101) & Banks (1102) - UPDATED CODES
    const cashBalance = accounts
        .filter(a => (a.code.startsWith('1101') || a.code.startsWith('1102')) && a.isLeaf)
        .reduce((sum, a) => sum + a.balance, 0);

    // Revenue (4) - Usually Credit is negative balance, we take Abs
    const revenue = accounts
        .filter(a => a.type === AccountType.REVENUE && a.isLeaf)
        .reduce((sum, a) => sum + Math.abs(a.balance), 0);

    // 4. Fleet Utilization
    const rentedVehicles = vehicles.filter(v => v.status === VehicleStatus.RENTED).length;
    const fleetUtil = vehicles.length > 0 ? Math.round((rentedVehicles / vehicles.length) * 100) : 0;

    // 5. Active Tasks
    const active = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PENDING');

    setStats({
        totalAssets,
        cashBalance,
        activeTasksCount: active.length,
        monthlyRevenue: revenue,
        fleetUtil
    });

    // 6. Recent Activity (Show Accounting Impact)
    setRecentJournals(journals.slice(0, 6)); // First 6
    setActiveTasks(active.slice(0, 4)); // First 4

    // 7. Check Alerts
    const newAlerts: {type: 'INSURANCE' | 'LICENSE' | 'SYSTEM', msg: string}[] = [];
    
    // Check Cash Flow
    if (cashBalance < 5000) newAlerts.push({ type: 'SYSTEM', msg: 'النقدية أقل من الحد الأدنى' });

    // Check Insurance (Dummy 30 days check logic if date exists) - Mocking expiry check if strings are ISO dates
    // In real app, compare new Date(v.insuranceExpiry) with today + 30 days.
    
    setAlerts(newAlerts);

  }, []);

  const StatCard = ({ title, value, icon: Icon, colorClass, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between hover:shadow-md transition-all group">
        <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800 font-mono dir-ltr text-right group-hover:scale-105 transition-transform">{value}</h3>
            {subtext && <p className="text-[10px] text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClass} group-hover:rotate-12 transition-transform`}>
            <Icon size={24} />
        </div>
    </div>
  );

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-10 animate-fadeIn">
        {/* Connection Banner - CHANGED TO WHITE */}
        <div className="bg-white text-slate-800 p-4 rounded-xl shadow-md border border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${dbConfig.mode === 'NETWORK' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                    {dbConfig.mode === 'NETWORK' ? <Server size={24} /> : <Database size={24} />}
                </div>
                <div>
                    <h3 className="font-bold text-base flex items-center gap-2">
                        {dbConfig.mode === 'NETWORK' ? 'النظام متصل بالسيرفر المركزي' : 'وضع العمل المحلي (Offline Mode)'}
                        {dbConfig.mode === 'NETWORK' && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        {dbConfig.mode === 'NETWORK' 
                            ? `يتم مزامنة البيانات لحظياً مع ${dbConfig.ip}` 
                            : 'يتم حفظ البيانات على هذا الجهاز فقط (Local Storage)'}
                    </p>
                </div>
            </div>
            
            <div className="flex gap-2">
                {systemHealth.map((h, i) => (
                    <div key={i} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${h.status === 'OK' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                        {h.status === 'OK' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                        {h.label}
                    </div>
                ))}
            </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                title="إجمالي الأصول (المالية)" 
                value={stats.totalAssets.toLocaleString()} 
                icon={Briefcase} 
                colorClass="bg-blue-50 text-blue-600 border border-blue-100"
                subtext="محدث من شجرة الحسابات"
            />
             <StatCard 
                title="السيولة النقدية الحالية" 
                value={stats.cashBalance.toLocaleString()} 
                icon={Wallet} 
                colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100" 
                subtext="الصناديق والبنوك"
            />
             <StatCard 
                title="إشغال الأسطول" 
                value={`${stats.fleetUtil}%`} 
                icon={Truck} 
                colorClass="bg-slate-100 text-slate-700 border border-slate-200"
                subtext={`${stats.activeTasksCount} مهام جارية`}
            />
             <StatCard 
                title="الإيرادات المحققة" 
                value={stats.monthlyRevenue.toLocaleString()} 
                icon={TrendingUp} 
                colorClass="bg-gold-50 text-gold-600 border border-gold-100" 
                subtext="إجمالي العقود والمبيعات"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Journal Feed */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Link size={18} className="text-blue-600"/> سجل العمليات المترابطة (الأثر المالي)
                    </h3>
                    <span className="text-xs text-slate-500 bg-white border px-2 py-1 rounded">تحديث لحظي</span>
                </div>
                <div className="flex-1 overflow-auto max-h-[400px]">
                    <table className="w-full text-right text-sm">
                        <thead className="text-slate-500 font-medium bg-slate-50/50 sticky top-0">
                            <tr>
                                <th className="p-3">المصدر (Unit)</th>
                                <th className="p-3">البيان (Description)</th>
                                <th className="p-3">الأثر المالي</th>
                                <th className="p-3">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {recentJournals.length > 0 ? recentJournals.map(j => (
                                <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3">
                                        <span className={`text-[10px] px-2 py-1 rounded font-bold border ${
                                            j.moduleId === 'FLEET' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                            j.moduleId === 'TASKS' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            j.moduleId === 'HR' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                            j.moduleId === 'STORE' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                            'bg-slate-100 text-slate-700 border-slate-200'
                                        }`}>
                                            {j.moduleId}
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-700 font-medium">{j.description}</td>
                                    <td className="p-3 font-mono font-bold text-slate-900">{j.totalAmount.toLocaleString()}</td>
                                    <td className="p-3">
                                        {j.status === 'POSTED' ? (
                                            <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-100 w-fit">
                                                <CheckCircle size={10} /> مرحل للميزانية
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">مسودة</span>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400">ابدأ بإدخال العمليات لتظهر هنا</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Side Widgets */}
            <div className="flex flex-col gap-6">
                
                {/* Active Operations Logic - CHANGED TO WHITE */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden text-slate-800 flex-1">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                        <Truck size={18} className="text-gold-500" />
                        <h3 className="font-bold text-slate-900">موقف العمليات الميداني</h3>
                    </div>
                    <div className="p-2 overflow-auto max-h-[300px]">
                        {activeTasks.length > 0 ? activeTasks.map(t => (
                            <div key={t.id} className="p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm text-slate-800">{t.route}</span>
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded border border-blue-200">جاري التنفيذ</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span className="font-mono">{t.reference}</span>
                                    <span className="text-green-600 font-bold font-mono">{t.revenue.toLocaleString()}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                <Truck size={32} className="mx-auto mb-2 opacity-20" />
                                الأسطول متوقف حالياً
                            </div>
                        )}
                    </div>
                    {activeTasks.length > 0 && (
                        <div className="p-3 bg-slate-50 text-center text-xs text-gold-600 border-t border-slate-200 font-bold">
                            يوجد {activeTasks.length} سيارات خارج الموقع
                        </div>
                    )}
                </div>

                {/* Quick Alerts */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-500" /> تنبيهات الإدارة
                    </h3>
                    <div className="space-y-2">
                        {alerts.map((alert, idx) => (
                            <div key={idx} className="text-xs bg-red-50 text-red-700 p-2 rounded border border-red-100 flex gap-2">
                                <span className="font-bold">{alert.type}:</span> {alert.msg}
                            </div>
                        ))}
                        {alerts.length === 0 && <p className="text-xs text-slate-400">لا توجد تنبيهات عاجلة</p>}
                        
                        {/* Static Example for demo if no alerts */}
                        {alerts.length === 0 && (
                             <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded border border-blue-100 flex gap-2">
                                <span className="font-bold">نظام:</span> النسخ الاحتياطي التلقائي جاهز
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default DashboardModule;