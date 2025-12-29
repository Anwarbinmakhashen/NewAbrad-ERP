import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storageService';
import { Vehicle, VehicleStatus } from '../../types';
import { PieChart, TrendingUp, TrendingDown, DollarSign, Fuel, Wrench, Activity, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react';

interface VehicleCostAnalysis {
  id: string;
  plateNumber: string;
  make: string;
  revenue: number;
  fuelCost: number;
  maintCost: number;
  otherCost: number;
  totalCost: number;
  netProfit: number;
  margin: number;
}

const CostingModule: React.FC = () => {
  const [analysis, setAnalysis] = useState<VehicleCostAnalysis[]>([]);
  const [totals, setTotals] = useState({
      revenue: 0,
      expenses: 0,
      profit: 0
  });

  useEffect(() => {
    calculateCosts();
  }, []);

  const calculateCosts = () => {
      const vehicles = StorageService.getVehicles();
      const tasks = StorageService.getTasks();
      const fuel = StorageService.getFuelRecords();
      const maint = StorageService.getMaintenanceRecords();

      let totalRev = 0;
      let totalExp = 0;

      const vehicleStats = vehicles.map(v => {
          // 1. Revenue from Tasks (Operational Revenue)
          const vTasks = tasks.filter(t => t.vehicleId === v.id && t.status !== 'CANCELLED');
          const revenue = vTasks.reduce((sum, t) => sum + (t.revenue || 0), 0);

          // 2. Fuel Costs (Direct Expense)
          const vFuel = fuel.filter(f => f.vehicleId === v.id);
          const fuelCost = vFuel.reduce((sum, f) => sum + (f.totalCost || 0), 0);

          // 3. Maintenance Costs (Direct Expense)
          const vMaint = maint.filter(m => m.vehicleId === v.id);
          const maintCost = vMaint.reduce((sum, m) => sum + (m.totalCost || 0), 0);

          // 4. Totals Calculation
          const totalCost = fuelCost + maintCost;
          const netProfit = revenue - totalCost;
          
          // Margin Calculation (Safety check for division by zero)
          const margin = revenue > 0 ? (netProfit / revenue) * 100 : (totalCost > 0 ? -100 : 0);

          totalRev += revenue;
          totalExp += totalCost;

          return {
              id: v.id,
              plateNumber: v.plateNumber,
              make: v.make,
              revenue,
              fuelCost,
              maintCost,
              otherCost: 0,
              totalCost,
              netProfit,
              margin
          };
      });

      // Sort by Net Profit (Highest First)
      setAnalysis(vehicleStats.sort((a,b) => b.netProfit - a.netProfit));
      setTotals({ revenue: totalRev, expenses: totalExp, profit: totalRev - totalExp });
  };

  return (
      <div className="h-full flex flex-col gap-6">
          {/* Header Title */}
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <BarChart2 className="text-gold-500" /> تقارير التكاليف وربحية الأسطول
                </h2>
                <p className="text-slate-500 text-sm mt-1">تحليل مراكز التكلفة (المركبات) بناءً على الإيرادات والمصروفات المباشرة</p>
            </div>
            <button onClick={calculateCosts} className="px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors shadow-sm">
                <RefreshCw size={18} /> تحديث البيانات
            </button>
          </div>

          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                      <span className="text-slate-500 font-bold text-sm">صافي الأرباح</span>
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={20}/></div>
                  </div>
                  <h3 className="text-3xl font-mono font-bold text-slate-900 dir-ltr text-right z-10 relative">{totals.profit.toLocaleString()}</h3>
                  <span className={`text-xs font-bold block mt-1 ${totals.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {totals.profit >= 0 ? 'أداء إيجابي' : 'خسارة تشغيلية'}
                  </span>
                  <div className={`absolute bottom-0 left-0 w-full h-1 ${totals.profit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                      <span className="text-slate-500 font-bold text-sm">إجمالي الإيرادات</span>
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><TrendingUp size={20}/></div>
                  </div>
                  <h3 className="text-2xl font-mono font-bold text-slate-900 dir-ltr text-right">{totals.revenue.toLocaleString()}</h3>
                  <span className="text-xs text-slate-400 mt-1 block">من العقود والتكليفات</span>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                      <span className="text-slate-500 font-bold text-sm">تكاليف الوقود</span>
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Fuel size={20}/></div>
                  </div>
                  <h3 className="text-2xl font-mono font-bold text-slate-900 dir-ltr text-right">
                      {analysis.reduce((s, x) => s + x.fuelCost, 0).toLocaleString()}
                  </h3>
                  <span className="text-xs text-slate-400 mt-1 block">مصروفات المحروقات</span>
              </div>

               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                      <span className="text-slate-500 font-bold text-sm">تكاليف الصيانة</span>
                      <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Wrench size={20}/></div>
                  </div>
                  <h3 className="text-2xl font-mono font-bold text-slate-900 dir-ltr text-right">
                       {analysis.reduce((s, x) => s + x.maintCost, 0).toLocaleString()}
                  </h3>
                  <span className="text-xs text-slate-400 mt-1 block">قطع غيار وأجور يد</span>
              </div>
          </div>

          {/* Detailed Analysis Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                  <Activity size={18} className="text-gold-500" />
                  <h3 className="font-bold text-slate-800 text-sm">قائمة تحليل الأداء المالي للمركبات</h3>
              </div>
              
              <div className="overflow-auto flex-1">
                  <table className="w-full text-right text-sm">
                      <thead className="bg-white text-slate-700 font-bold border-b border-slate-200 sticky top-0 shadow-sm z-10">
                          <tr>
                              <th className="p-4 w-1/4">المركبة (مركز التكلفة)</th>
                              <th className="p-4 text-center bg-blue-50/50 text-blue-800">الإيراد المحقق</th>
                              <th className="p-4 text-center text-orange-700">وقود</th>
                              <th className="p-4 text-center text-red-700">صيانة</th>
                              <th className="p-4 text-center bg-slate-50 text-slate-800">إجمالي التكلفة</th>
                              <th className="p-4 text-center bg-slate-100 text-slate-900">صافي الربح/الخسارة</th>
                              <th className="p-4 w-1/6">مؤشر الأداء</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {analysis.map(item => (
                              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                  <td className="p-4 border-l border-slate-50">
                                      <div className="font-bold text-slate-800 text-base">{item.make}</div>
                                      <div className="text-xs font-mono font-bold text-slate-500 bg-slate-100 w-fit px-2 py-0.5 rounded border border-slate-200 mt-1">
                                          {item.plateNumber}
                                      </div>
                                  </td>
                                  <td className="p-4 text-center font-mono font-bold text-blue-700 bg-blue-50/10 text-base">
                                      {item.revenue.toLocaleString()}
                                  </td>
                                  <td className="p-4 text-center font-mono text-slate-600 group-hover:text-orange-600 transition-colors">
                                      {item.fuelCost.toLocaleString()}
                                  </td>
                                  <td className="p-4 text-center font-mono text-slate-600 group-hover:text-red-600 transition-colors">
                                      {item.maintCost.toLocaleString()}
                                  </td>
                                  <td className="p-4 text-center font-mono font-bold text-slate-700 bg-slate-50/50">
                                      {item.totalCost.toLocaleString()}
                                  </td>
                                  <td className={`p-4 text-center font-mono font-bold text-lg bg-slate-50 dir-ltr ${item.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                      {item.netProfit > 0 ? '+' : ''}{item.netProfit.toLocaleString()}
                                  </td>
                                  <td className="p-4">
                                      <div className="flex flex-col gap-1">
                                          <div className="flex justify-between text-xs font-bold text-slate-500">
                                              <span>{item.margin.toFixed(1)}%</span>
                                              <span>{item.margin >= 0 ? 'Excellent' : 'Poor'}</span>
                                          </div>
                                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                              <div 
                                                  className={`h-full rounded-full transition-all duration-500 ${item.margin >= 50 ? 'bg-emerald-500' : item.margin >= 0 ? 'bg-gold-400' : 'bg-red-500'}`} 
                                                  style={{ width: `${Math.min(Math.max(item.margin + 50, 0), 100)}%` }} // Simple visualizer scaling
                                              ></div>
                                          </div>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                          {analysis.length === 0 && (
                              <tr>
                                  <td colSpan={7} className="p-12 text-center text-slate-400">
                                      <div className="flex flex-col items-center justify-center gap-2">
                                          <AlertCircle size={40} className="opacity-20" />
                                          <span className="font-bold">لا توجد بيانات كافية للتحليل</span>
                                          <span className="text-xs">قم بإضافة مركبات، عقود، وسجلات صيانة ووقود لتظهر البيانات هنا</span>
                                      </div>
                                  </td>
                              </tr>
                          )}
                      </tbody>
                      {analysis.length > 0 && (
                          <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-800">
                              <tr>
                                  <td className="p-4 text-right">الإجمالي الكلي</td>
                                  <td className="p-4 text-center text-blue-700 font-mono text-lg">{totals.revenue.toLocaleString()}</td>
                                  <td className="p-4 text-center text-slate-600 font-mono">{analysis.reduce((s, x) => s + x.fuelCost, 0).toLocaleString()}</td>
                                  <td className="p-4 text-center text-slate-600 font-mono">{analysis.reduce((s, x) => s + x.maintCost, 0).toLocaleString()}</td>
                                  <td className="p-4 text-center text-slate-800 font-mono">{totals.expenses.toLocaleString()}</td>
                                  <td className={`p-4 text-center font-mono text-xl dir-ltr ${totals.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                      {totals.profit.toLocaleString()}
                                  </td>
                                  <td className="p-4"></td>
                              </tr>
                          </tfoot>
                      )}
                  </table>
              </div>
          </div>
      </div>
  );
};

export default CostingModule;