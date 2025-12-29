import React, { useState, useEffect } from 'react';
import { OperationalTask, Client, Vehicle, Employee, VehicleStatus, VehicleType } from '../../types';
import { StorageService } from '../../services/storageService';
import { FileCheck, Plus, Search, MapPin, Truck, Calendar, User, Download, Save, X, Shield, Fuel, Clock } from 'lucide-react';

const TasksModule: React.FC = () => {
  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('');

  // Form
  const [form, setForm] = useState<Partial<OperationalTask>>({
      date: new Date().toISOString().split('T')[0],
      currency: 'USD',
      status: 'IN_PROGRESS',
      branchId: 'HEADQUARTERS',
      rentalCategory: 'DAILY',
      withDriver: true,
      withFuel: false,
      vehicleTypeRequirement: 'SOFT'
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setTasks(StorageService.getTasks().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setClients(StorageService.getClients());
    setVehicles(StorageService.getVehicles().filter(v => v.status === VehicleStatus.AVAILABLE));
    setDrivers(StorageService.getEmployees().filter(e => e.position.includes('سائق') || e.position.includes('Driver')));
  };

  const handleSave = () => {
      try {
          if(!form.clientId || !form.vehicleId || !form.driverId || !form.revenue) {
              alert("جميع الحقول المميزة بنجمة مطلوبة");
              return;
          }

          // Validation: Check if selected vehicle matches requirement (Soft/Armored)
          const selectedVehicle = vehicles.find(v => v.id === form.vehicleId);
          const isArmored = selectedVehicle?.type === VehicleType.ARMORED_B6 || selectedVehicle?.type === VehicleType.ARMORED_B7;
          if (form.vehicleTypeRequirement === 'ARMORED' && !isArmored) {
              if(!window.confirm("تنبيه: نوع السيارة المختارة (Soft) لا يطابق اشتراط العقد (Armored). هل تريد الاستمرار؟")) return;
          }

          const newTask: OperationalTask = {
              id: form.id || Date.now().toString(),
              reference: form.reference || `TASK-${Date.now().toString().substr(-5)}`,
              date: form.date!,
              clientId: form.clientId,
              vehicleId: form.vehicleId,
              driverId: form.driverId,
              route: form.route || 'غير محدد',
              startDate: form.startDate || form.date!,
              endDate: form.endDate || form.date!,
              cost: form.cost || 0,
              revenue: Number(form.revenue),
              currency: form.currency || 'USD',
              status: form.status || 'IN_PROGRESS',
              branchId: form.branchId || 'HEADQUARTERS',
              // New Fields from Table 1-1
              rentalCategory: form.rentalCategory || 'DAILY',
              withDriver: form.withDriver ?? true,
              withFuel: form.withFuel ?? false,
              vehicleTypeRequirement: form.vehicleTypeRequirement || 'SOFT'
          };

          StorageService.saveTask(newTask);
          setIsModalOpen(false);
          refreshData();
          setForm({ date: new Date().toISOString().split('T')[0], currency: 'USD', status: 'IN_PROGRESS', rentalCategory: 'DAILY', withDriver: true, withFuel: false, vehicleTypeRequirement: 'SOFT' });
          alert("تم حفظ عقد المهمة وإنشاء قيد الإيراد بنجاح");
      } catch (e: any) {
          alert(e.message);
      }
  };

  const handleExport = () => {
      StorageService.exportToCSV(tasks, 'operations_tasks');
  };

  const filteredTasks = tasks.filter(t => t.reference.includes(filter) || t.route.includes(filter));

  return (
    <div className="h-full flex flex-col gap-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FileCheck className="text-gold-500" /> عقود تنفيذ المهام والتكليفات
                </h2>
                <p className="text-slate-500 text-sm mt-1">جدول 1-1: إدارة عقود المهام التشغيلية</p>
            </div>
            <div className="flex gap-2">
                <button onClick={handleExport} className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-50">
                    <Download size={18} /> تصدير
                </button>
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-gold-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg hover:bg-gold-600 transition-colors">
                    <Plus size={18} /> عقد مهمة جديد
                </button>
            </div>
        </div>

        {/* Search */}
        <div className="relative group">
            <input 
                type="text" 
                placeholder="بحث برقم العقد / التكليف أو الموقع..." 
                className="w-full p-3 pr-10 border-2 border-slate-100 rounded-lg focus:outline-none focus:border-gold-500 bg-white text-slate-900 placeholder-slate-300 shadow-sm transition-all font-bold"
                value={filter}
                onChange={e => setFilter(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-500" size={18} />
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex-1 overflow-y-auto">
            <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-100">
                    <tr>
                        <th className="p-4">رقم المهمة</th>
                        <th className="p-4">العميل</th>
                        <th className="p-4">الاشتراطات</th>
                        <th className="p-4">المركبة / السائق</th>
                        <th className="p-4">موقع المهمة</th>
                        <th className="p-4">فئة التأجير</th>
                        <th className="p-4">المبلغ</th>
                        <th className="p-4">الحالة</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {filteredTasks.map(t => {
                        const client = clients.find(c => c.id === t.clientId);
                        const vehicle = StorageService.getVehicles().find(v => v.id === t.vehicleId) || vehicles.find(v => v.id === t.vehicleId); // Check both lists
                        const driver = drivers.find(d => d.id === t.driverId);

                        return (
                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-mono font-bold text-slate-600">{t.reference}</td>
                                <td className="p-4 font-bold text-slate-900">{client?.name}</td>
                                <td className="p-4">
                                    <div className="flex gap-1">
                                        {t.vehicleTypeRequirement === 'ARMORED' ? 
                                            <span className="bg-slate-800 text-gold-400 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><Shield size={10}/>مدرع</span> : 
                                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">سوفت</span>
                                        }
                                        {t.withFuel && <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-bold">وقود</span>}
                                        {t.withDriver && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">سائق</span>}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col text-xs">
                                        <span className="font-bold flex items-center gap-1 text-slate-800"><Truck size={12}/> {vehicle?.plateNumber}</span>
                                        <span className="text-slate-500 flex items-center gap-1"><User size={12}/> {driver?.fullName}</span>
                                    </div>
                                </td>
                                <td className="p-4 flex items-center gap-1 text-slate-700"><MapPin size={14} className="text-gold-500"/> {t.route}</td>
                                <td className="p-4 text-xs font-bold text-slate-600">
                                    {t.rentalCategory === 'DAILY' ? 'يومي' : t.rentalCategory === 'WEEKLY' ? 'أسبوعي' : 'شهري'}
                                </td>
                                <td className="p-4 font-mono font-bold text-green-700">{t.revenue.toLocaleString()} {t.currency}</td>
                                <td className="p-4">
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">{t.status}</span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>

        {/* Modal */}
        {isModalOpen && (
             <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
                    <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-100">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><FileCheck className="text-gold-500" /> جدول عقد تنفيذ مهمة (1-1)</h3>
                        <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-red-500" /></button>
                    </div>
                    
                    <div className="p-8 overflow-y-auto space-y-6">
                        {/* 1. Client & Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">العميل (المستأجر) *</label>
                                <select className="w-full border border-slate-200 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})}>
                                    <option value="">-- اختر العميل --</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ البدء</label>
                                <input type="date" className="w-full border border-slate-200 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                            </div>
                        </div>

                        {/* 2. Contract Conditions (الاشتراطات) */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2"><Shield size={16}/> اشتراطات العقد</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">فئة التأجير</label>
                                    <select className="w-full border border-slate-200 p-2 rounded bg-white text-slate-900 text-sm" value={form.rentalCategory} onChange={e => setForm({...form, rentalCategory: e.target.value as any})}>
                                        <option value="DAILY">يومي</option>
                                        <option value="WEEKLY">أسبوعي</option>
                                        <option value="MONTHLY">شهري</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">نوع السيارة المطلوب</label>
                                    <select className="w-full border border-slate-200 p-2 rounded bg-white text-slate-900 text-sm" value={form.vehicleTypeRequirement} onChange={e => setForm({...form, vehicleTypeRequirement: e.target.value as any})}>
                                        <option value="SOFT">سوفت (عادية)</option>
                                        <option value="ARMORED">مدرع (B6/B7)</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2 justify-center">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={form.withDriver} onChange={e => setForm({...form, withDriver: e.target.checked})} className="w-4 h-4 accent-gold-500" />
                                        <span>مع سائق</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={form.withFuel} onChange={e => setForm({...form, withFuel: e.target.checked})} className="w-4 h-4 accent-gold-500" />
                                        <span>مع محروقات</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* 3. Resources */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">المركبة (يتم إدخاله من جدول السيارات) *</label>
                                <select className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})}>
                                    <option value="">-- اختر المركبة المتاحة --</option>
                                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} - {v.make} ({v.type})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">السائق (من كشف السائقين) *</label>
                                <select className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={form.driverId} onChange={e => setForm({...form, driverId: e.target.value})}>
                                    <option value="">-- اختر السائق --</option>
                                    {drivers.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* 4. Details */}
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">موقع المهمة / خط السير *</label>
                                <input type="text" className="w-full border border-slate-200 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" placeholder="مثال: صنعاء - مأرب" value={form.route} onChange={e => setForm({...form, route: e.target.value})} />
                             </div>
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ الانتهاء</label>
                                <input type="date" className="w-full border border-slate-200 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
                            </div>
                        </div>

                        {/* 5. Financials */}
                        <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">المبلغ اليومي للإيجار *</label>
                                <input type="number" className="w-full border border-slate-200 p-2.5 rounded bg-white font-mono font-bold text-green-700 focus:border-green-500 outline-none" value={form.revenue} onChange={e => setForm({...form, revenue: Number(e.target.value)})} />
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">العملة</label>
                                <select className="w-full border border-slate-200 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={form.currency} onChange={e => setForm({...form, currency: e.target.value as any})}>
                                    <option value="USD">دولار أمريكي</option>
                                    <option value="YER">ريال يمني</option>
                                    <option value="SAR">ريال سعودي</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">رقم العقد / أمر الشراء</label>
                                <input type="text" className="w-full border border-slate-200 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-bold flex items-center gap-1"><Save size={12}/> يتم الحفظ في جدول العمليات (Tasks) وإنشاء قيد محاسبي</span>
                        <div className="flex gap-2">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 font-bold transition-colors">إلغاء</button>
                            <button onClick={handleSave} className="px-8 py-2 bg-gold-500 text-white rounded hover:bg-gold-600 font-bold shadow-lg shadow-gold-500/20 transition-all">حفظ العقد</button>
                        </div>
                    </div>
                </div>
             </div>
        )}
    </div>
  );
};

export default TasksModule;