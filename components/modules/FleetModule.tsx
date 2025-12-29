import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleType, VehicleStatus, Account, SparePart, FuelRecord, MaintenanceRecord, Employee } from '../../types';
import { StorageService } from '../../services/storageService';
import { Truck, Plus, Check, X, Gauge, Calendar, Shield, Fuel, Wrench, User as UserIcon, Settings, Lock, FileText, Info } from 'lucide-react';

const FleetModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'FUEL' | 'MAINTENANCE'>('LIST');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [maintRecords, setMaintRecords] = useState<MaintenanceRecord[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [cashAccounts, setCashAccounts] = useState<Account[]>([]);
  const [assetAccounts, setAssetAccounts] = useState<Account[]>([]);
  
  // Modals
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);

  // Forms
  const [vehicleForm, setVehicleForm] = useState<Partial<Vehicle>>({ type: VehicleType.CIVILIAN_SUV, status: VehicleStatus.AVAILABLE, assetAccountId: '', driveType: '4WD', seats: 5 });
  const [fuelForm, setFuelForm] = useState<Partial<FuelRecord> & { cashAccountId: string }>({ cashAccountId: '' });
  const [maintForm, setMaintForm] = useState<{
      vehicleId: string;
      type: string;
      description: string;
      costLabor: number;
      cashAccountId: string;
      partsUsed: { partId: string; quantity: number }[];
      date: string;
  }>({
      vehicleId: '', type: 'PREVENTIVE', description: '', costLabor: 0, cashAccountId: '', partsUsed: [], date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const refreshData = () => {
    setVehicles(StorageService.getVehicles());
    setEmployees(StorageService.getEmployees());
    setParts(StorageService.getSpareParts());
    setFuelRecords(StorageService.getFuelRecords());
    setMaintRecords(StorageService.getMaintenanceRecords());
    
    const accounts = StorageService.getAccounts();
    // Cash: 1101 or 1102
    setCashAccounts(accounts.filter(a => (a.code.startsWith('1101') || a.code.startsWith('1102')) && a.isLeaf));
    // Assets: 1201 (PPE)
    setAssetAccounts(accounts.filter(a => a.code.startsWith('1201') && a.isLeaf));
  };

  // --- HANDLERS ---

  const handleSaveVehicle = () => {
    if (!vehicleForm.plateNumber || !vehicleForm.assetAccountId) { alert("بيانات ناقصة"); return; }
    const newVehicle: Vehicle = {
      id: vehicleForm.id || Date.now().toString(),
      plateNumber: vehicleForm.plateNumber!,
      make: vehicleForm.make || '',
      model: vehicleForm.model || '',
      year: vehicleForm.year || 2024,
      color: vehicleForm.color || 'White',
      vin: vehicleForm.vin || '',
      type: vehicleForm.type!,
      status: vehicleForm.status || VehicleStatus.AVAILABLE,
      assetAccountId: vehicleForm.assetAccountId!,
      expenseAccountId: '',
      currentMeter: vehicleForm.currentMeter || 0,
      purchaseDate: new Date().toISOString(),
      purchasePrice: 0,
      driverId: vehicleForm.driverId,
      branchId: vehicleForm.branchId || 'HEADQUARTERS',
      // New Fields from PDF
      insurancePolicyNumber: vehicleForm.insurancePolicyNumber,
      seats: Number(vehicleForm.seats) || 5,
      driveType: vehicleForm.driveType || '4WD'
    };
    StorageService.saveVehicle(newVehicle);
    setIsVehicleModalOpen(false);
    refreshData();
  };

  const handleSaveFuel = () => {
      if(!fuelForm.vehicleId || !fuelForm.liters || !fuelForm.cashAccountId) { alert("بيانات ناقصة"); return; }
      try {
        StorageService.logFuel(fuelForm, fuelForm.cashAccountId);
        setIsFuelModalOpen(false);
        refreshData();
        alert("تم تسجيل الوقود وإنشاء القيد المحاسبي");
      } catch (e: any) {
        alert(e.message);
      }
  };

  const handleSaveMaint = () => {
      if(!maintForm.vehicleId || !maintForm.cashAccountId) { alert("بيانات ناقصة"); return; }
      
      // Validate Stock locally first
      for(const used of maintForm.partsUsed) {
          const part = parts.find(p => p.id === used.partId);
          if(!part || part.currentStock < used.quantity) {
              alert(`لا يوجد رصيد كافي للصنف: ${part?.name}. المتوفر: ${part?.currentStock}`);
              return;
          }
      }

      // Calculate part costs for payload
      const partsPayload = maintForm.partsUsed.map(u => {
          const part = parts.find(p => p.id === u.partId);
          return { partId: u.partId, quantity: u.quantity, cost: (part?.averageCost || 0) * u.quantity };
      });

      try {
        StorageService.logMaintenance({
            vehicleId: maintForm.vehicleId,
            date: maintForm.date,
            type: maintForm.type as any,
            description: maintForm.description,
            costLabor: maintForm.costLabor,
            partsUsed: partsPayload
        }, maintForm.cashAccountId);

        setIsMaintModalOpen(false);
        refreshData();
        alert("تم تسجيل الصيانة وخصم قطع الغيار من المخزن");
      } catch (e: any) {
          alert(e.message);
      }
  };

  // --- RENDERERS ---

  const renderList = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map(v => {
              const driver = employees.find(e => e.id === v.driverId);
              const isArmored = v.type === VehicleType.ARMORED_B6 || v.type === VehicleType.ARMORED_B7;
              
              return (
                <div key={v.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group relative">
                    {/* Badge for Armored */}
                    {isArmored && <div className="absolute top-2 left-2 bg-slate-800 text-gold-400 text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10 flex items-center gap-1"><Shield size={10} /> {v.type.replace('_', ' ')}</div>}
                    
                    <div className="h-28 bg-slate-50 border-b border-slate-100 relative flex items-center justify-center flex-col">
                        <Truck size={40} className={`group-hover:scale-110 transition-transform mb-2 ${isArmored ? 'text-slate-700' : 'text-slate-400'}`} />
                        <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            {v.driveType} • {v.seats} Seats
                        </span>
                        <span className="absolute top-2 right-2 text-xs text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                             فرع: {v.branchId || 'HQ'}
                        </span>
                    </div>
                    <div className="p-4">
                        <div className="flex justify-between mb-2">
                            <div>
                                <h3 className="font-bold text-slate-800">{v.make} {v.model}</h3>
                                <div className="flex gap-2 text-xs text-slate-500 mt-1">
                                    <span>{v.year}</span>
                                    <span>•</span>
                                    <span>{v.color}</span>
                                </div>
                            </div>
                            <span className="font-mono bg-slate-100 text-slate-700 border border-slate-200 px-2 rounded font-bold h-fit py-1">{v.plateNumber}</span>
                        </div>
                        
                        {/* Insurance Info */}
                        <div className="bg-blue-50 border border-blue-100 rounded p-2 mb-2 flex items-center gap-2">
                            <FileText size={14} className="text-blue-500" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-blue-400 font-bold uppercase">Policy Number</span>
                                <span className="text-xs font-mono font-bold text-blue-700">{v.insurancePolicyNumber || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="text-xs text-slate-400 mb-2 font-mono flex justify-between">
                            <span>VIN: {v.vin || 'N/A'}</span>
                            <span className="flex items-center gap-1"><Gauge size={12}/> {v.currentMeter.toLocaleString()}</span>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-600" title="عهدة السائق">
                                <Lock size={14} className="text-gold-500" /> 
                                {driver ? <span className="text-slate-800 font-bold">{driver.fullName}</span> : <span className="text-slate-400">بدون عهده</span>}
                            </div>
                            <button onClick={() => { setVehicleForm(v); setIsVehicleModalOpen(true); }} className="text-slate-400 hover:text-gold-500"><Settings size={16} /></button>
                        </div>
                    </div>
                </div>
              );
          })}
      </div>
  );

  const renderFuel = () => (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                      <th className="p-3">المركبة</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">اللترات</th>
                      <th className="p-3">التكلفة</th>
                      <th className="p-3">عداد الكيلو</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {fuelRecords.map(f => {
                      const v = vehicles.find(v => v.id === f.vehicleId);
                      return (
                          <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-bold text-slate-800">{v?.plateNumber} - {v?.make}</td>
                              <td className="p-3">{new Date(f.date).toLocaleDateString()}</td>
                              <td className="p-3">{f.liters} L</td>
                              <td className="p-3 font-mono text-gold-600 font-bold">{f.totalCost.toLocaleString()}</td>
                              <td className="p-3 font-mono">{f.meterReading}</td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>
      </div>
  );

  return (
    <div className="h-full flex flex-col gap-6">
        <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm border border-slate-200">
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('LIST')} className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${activeTab === 'LIST' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>كشف السيارات (1-4)</button>
                <button onClick={() => setActiveTab('FUEL')} className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${activeTab === 'FUEL' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>سجل الوقود</button>
                <button onClick={() => setActiveTab('MAINTENANCE')} className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${activeTab === 'MAINTENANCE' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>سجل الصيانة</button>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setIsFuelModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors"><Fuel size={16} /> صرف وقود</button>
                <button onClick={() => setIsMaintModalOpen(true)} className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors"><Wrench size={16} /> صيانة</button>
                <button onClick={() => { setVehicleForm({ type: VehicleType.CIVILIAN_SUV, seats: 5, driveType: '4WD' }); setIsVehicleModalOpen(true); }} className="bg-gold-500 hover:bg-gold-600 text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors"><Plus size={16} /> مركبة جديدة</button>
            </div>
        </div>

        <div className="flex-1 overflow-auto">
            {activeTab === 'LIST' && renderList()}
            {activeTab === 'FUEL' && renderFuel()}
            {activeTab === 'MAINTENANCE' && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                          <tr>
                              <th className="p-3">المركبة</th>
                              <th className="p-3">التاريخ</th>
                              <th className="p-3">نوع الصيانة</th>
                              <th className="p-3">قطع الغيار</th>
                              <th className="p-3">التكلفة الإجمالية</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {maintRecords.map(m => {
                              const v = vehicles.find(v => v.id === m.vehicleId);
                              const usedPartsNames = m.partsUsed.map(u => {
                                const p = parts.find(part => part.id === u.partId);
                                return `${p?.name || 'Unknown'} (${u.quantity})`;
                              }).join(', ');

                              return (
                                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="p-3 font-bold text-slate-800">{v?.plateNumber}</td>
                                      <td className="p-3">{new Date(m.date).toLocaleDateString()}</td>
                                      <td className="p-3">{m.type}</td>
                                      <td className="p-3 text-xs text-slate-500">{usedPartsNames || '-'}</td>
                                      <td className="p-3 font-mono text-gold-600 font-bold">{m.totalCost.toLocaleString()}</td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
            )}
        </div>

        {/* Vehicle Modal - Light Theme - UPDATED FOR TABLE 1-4 & INSURANCE */}
        {isVehicleModalOpen && (
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
                    <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                         <h3 className="font-bold text-lg text-slate-800">بيانات كشف السيارة (جدول 1-4)</h3>
                         <button onClick={() => setIsVehicleModalOpen(false)}><X className="text-slate-400 hover:text-red-500" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <input type="text" placeholder="الشركة المصنعة" className="border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={vehicleForm.make} onChange={e => setVehicleForm({...vehicleForm, make: e.target.value})} />
                            <input type="text" placeholder="الموديل" className="border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} />
                            <input type="text" placeholder="اللون" className="border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={vehicleForm.color || ''} onChange={e => setVehicleForm({...vehicleForm, color: e.target.value})} />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-slate-600 mb-1">النوع</label>
                                <select className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={vehicleForm.type} onChange={e => setVehicleForm({...vehicleForm, type: e.target.value as any})}>
                                    <option value={VehicleType.CIVILIAN_SUV}>سوفت (SUV)</option>
                                    <option value={VehicleType.CIVILIAN_SEDAN}>سوفت (Sedan)</option>
                                    <option value={VehicleType.ARMORED_B6}>مدرع (B6)</option>
                                    <option value={VehicleType.ARMORED_B7}>مدرع (B7)</option>
                                    <option value={VehicleType.BUS}>باص</option>
                                    <option value={VehicleType.TRUCK}>شاحنة</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-slate-600 mb-1">نظام الدفع</label>
                                <select className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={vehicleForm.driveType} onChange={e => setVehicleForm({...vehicleForm, driveType: e.target.value as any})}>
                                    <option value="4WD">4WD (دفع رباعي)</option>
                                    <option value="2WD">2WD (دفع ثنائي)</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-slate-600 mb-1">المقاعد</label>
                                <input type="number" placeholder="5" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={vehicleForm.seats} onChange={e => setVehicleForm({...vehicleForm, seats: Number(e.target.value)})} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">رقم اللوحة</label>
                                <input type="text" placeholder="12345" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={vehicleForm.plateNumber} onChange={e => setVehicleForm({...vehicleForm, plateNumber: e.target.value})} />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">رقم القعادة (الشاصي / VIN)</label>
                                <input type="text" placeholder="VIN..." className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none font-mono" value={vehicleForm.vin || ''} onChange={e => setVehicleForm({...vehicleForm, vin: e.target.value})} />
                             </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded border border-blue-100">
                            <h4 className="font-bold text-sm text-blue-800 mb-2 flex items-center gap-2"><Info size={16}/> بيانات التأمين</h4>
                            <input type="text" placeholder="رقم بوليصة التأمين (Policy Number)" className="w-full border border-blue-200 p-2.5 rounded bg-white text-slate-900 focus:border-blue-500 outline-none font-mono" value={vehicleForm.insurancePolicyNumber || ''} onChange={e => setVehicleForm({...vehicleForm, insurancePolicyNumber: e.target.value})} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                            <div>
                                 <label className="block text-xs font-bold text-slate-600 mb-1">السائق (العهدة)</label>
                                 <select className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={vehicleForm.driverId} onChange={e => setVehicleForm({...vehicleForm, driverId: e.target.value})}>
                                    <option value="">-- اختر السائق (ربط العهدة) --</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                 <label className="block text-xs font-bold text-slate-600 mb-1">الأصل المحاسبي</label>
                                 <select className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={vehicleForm.assetAccountId} onChange={e => setVehicleForm({...vehicleForm, assetAccountId: e.target.value})}>
                                    <option value="">-- اختر حساب الأصل --</option>
                                    {assetAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                            <button onClick={() => setIsVehicleModalOpen(false)} className="px-4 py-2 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50">إلغاء</button>
                            <button onClick={handleSaveVehicle} className="px-6 py-2 bg-gold-500 text-white font-bold rounded hover:bg-gold-600 shadow">حفظ السيارة</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ... [Rest of the Fuel and Maintenance Modals remain unchanged for brevity, as they were already solid] ... */}
        {/* Fuel Modal - Light Theme */}
        {isFuelModalOpen && (
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                    <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                         <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Fuel className="text-gold-500" /> تسجيل صرف وقود</h3>
                         <button onClick={() => setIsFuelModalOpen(false)}><X className="text-slate-400 hover:text-red-500" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <select className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={fuelForm.vehicleId} onChange={e => setFuelForm({...fuelForm, vehicleId: e.target.value})}>
                            <option value="">اختر المركبة...</option>
                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} - {v.make}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="number" placeholder="لترات" className="border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" onChange={e => setFuelForm({...fuelForm, liters: Number(e.target.value)})} />
                            <input type="number" placeholder="سعر اللتر" className="border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" onChange={e => setFuelForm({...fuelForm, costPerLiter: Number(e.target.value)})} />
                            <input type="number" placeholder="عداد الكيلو الحالي" className="border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" onChange={e => setFuelForm({...fuelForm, meterReading: Number(e.target.value)})} />
                            <input type="date" className="border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" onChange={e => setFuelForm({...fuelForm, date: e.target.value})} />
                        </div>
                        <select className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={fuelForm.cashAccountId} onChange={e => setFuelForm({...fuelForm, cashAccountId: e.target.value})}>
                            <option value="">اختر حساب الدفع (الصندوق/البنك)...</option>
                            {cashAccounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name} ({a.currency})</option>)}
                        </select>
                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                            <button onClick={() => setIsFuelModalOpen(false)} className="px-4 py-2 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50">إلغاء</button>
                            <button onClick={handleSaveFuel} className="px-6 py-2 bg-gold-500 text-white font-bold rounded hover:bg-gold-600 shadow">تسجيل</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Maintenance Modal - Light Theme */}
        {isMaintModalOpen && (
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
                    <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                         <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Wrench className="text-gold-500" /> تسجيل صيانة</h3>
                         <button onClick={() => setIsMaintModalOpen(false)}><X className="text-slate-400 hover:text-red-500" /></button>
                    </div>
                    
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                             <select className="border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={maintForm.vehicleId} onChange={e => setMaintForm({...maintForm, vehicleId: e.target.value})}>
                                <option value="">اختر المركبة...</option>
                                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
                            </select>
                            <input type="date" className="border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={maintForm.date} onChange={e => setMaintForm({...maintForm, date: e.target.value})} />
                        </div>

                        <input type="text" placeholder="وصف العطل / الصيانة" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={maintForm.description} onChange={e => setMaintForm({...maintForm, description: e.target.value})} />
                        
                        <div className="p-4 bg-slate-50 rounded border border-slate-200">
                            <h4 className="font-bold text-sm text-slate-700 mb-2">استهلاك قطع غيار (من المخزن)</h4>
                            {maintForm.partsUsed.map((u, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                    <select className="flex-1 border border-slate-300 p-1.5 rounded bg-white text-slate-900 text-sm focus:border-gold-500 outline-none" value={u.partId} onChange={(e) => {
                                        const newParts = [...maintForm.partsUsed];
                                        newParts[idx].partId = e.target.value;
                                        setMaintForm({...maintForm, partsUsed: newParts});
                                    }}>
                                        <option value="">اختر القطعة...</option>
                                        {parts.map(p => <option key={p.id} value={p.id}>{p.name} (Available: {p.currentStock})</option>)}
                                    </select>
                                    <input type="number" placeholder="Qty" className="w-20 border border-slate-300 p-1.5 rounded bg-white text-slate-900 text-sm focus:border-gold-500 outline-none" value={u.quantity} onChange={(e) => {
                                         const newParts = [...maintForm.partsUsed];
                                         newParts[idx].quantity = Number(e.target.value);
                                         setMaintForm({...maintForm, partsUsed: newParts});
                                    }} />
                                </div>
                            ))}
                            <button onClick={() => setMaintForm({...maintForm, partsUsed: [...maintForm.partsUsed, { partId: '', quantity: 1 }]})} className="text-xs text-blue-600 font-bold hover:text-blue-700">+ إضافة قطعة</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                 <label className="text-xs font-bold text-slate-600 mb-1 block">تكلفة اليد العاملة (خارجي)</label>
                                 <input type="number" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={maintForm.costLabor} onChange={e => setMaintForm({...maintForm, costLabor: Number(e.target.value)})} />
                            </div>
                            <div>
                                 <label className="text-xs font-bold text-slate-600 mb-1 block">حساب الدفع (للعمالة)</label>
                                 <select className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={maintForm.cashAccountId} onChange={e => setMaintForm({...maintForm, cashAccountId: e.target.value})}>
                                    <option value="">اختر حساب...</option>
                                    {cashAccounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                            <button onClick={() => setIsMaintModalOpen(false)} className="px-4 py-2 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50">إلغاء</button>
                            <button onClick={handleSaveMaint} className="px-6 py-2 bg-gold-500 text-white font-bold rounded hover:bg-gold-600 shadow">حفظ وخصم المخزون</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default FleetModule;