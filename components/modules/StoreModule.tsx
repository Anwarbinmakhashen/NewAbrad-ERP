import React, { useState, useEffect, useRef } from 'react';
import { SparePart, Account } from '../../types';
import { StorageService } from '../../services/storageService';
import { Package, Plus, Search, ShoppingCart, DollarSign, PenTool, Hash, X, Printer, FileSpreadsheet, Download, Upload } from 'lucide-react';

const StoreModule: React.FC = () => {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [cashAccounts, setCashAccounts] = useState<Account[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add Item Form
  const [formData, setFormData] = useState<Partial<SparePart>>({
    name: '', partNumber: '', location: '', currentStock: 0, averageCost: 0
  });

  // Purchase Stock Form
  const [purchaseForm, setPurchaseForm] = useState({
      partId: '', qty: 0, unitCost: 0, cashAccountId: ''
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setParts(StorageService.getSpareParts());
    setCashAccounts(StorageService.getAccounts().filter(a => (a.code.startsWith('1101') || a.code.startsWith('1102')) && a.isLeaf));
  };

  const handleSavePart = () => {
      if(!formData.name || !formData.partNumber) { alert("أدخل البيانات الأساسية"); return; }
      
      const inventoryAcc = StorageService.getAccounts().find(a => a.code.startsWith('1106'));

      const newPart: SparePart = {
          id: formData.id || Date.now().toString(),
          name: formData.name!,
          partNumber: formData.partNumber!,
          description: formData.description || '',
          location: formData.location || 'Warehouse A',
          currentStock: formData.currentStock || 0,
          averageCost: formData.averageCost || 0,
          salePrice: 0,
          assetAccountId: inventoryAcc?.id || ''
      };
      StorageService.saveSparePart(newPart);
      setIsModalOpen(false);
      refreshData();
      setFormData({});
  };

  const handlePurchaseStock = () => {
      if(!purchaseForm.partId || purchaseForm.qty <= 0 || !purchaseForm.cashAccountId) {
          alert("تأكد من اختيار الصنف وحساب الدفع والكمية");
          return;
      }
      StorageService.addPartStock(
          purchaseForm.partId, 
          purchaseForm.qty, 
          purchaseForm.unitCost, 
          purchaseForm.cashAccountId
      );
      setIsPurchaseModalOpen(false);
      refreshData();
      alert("تمت إضافة الكمية وإنشاء القيد المحاسبي");
  };

  // --- EXPORT / IMPORT HANDLERS ---

  const handleExportCSV = () => {
      const data = parts.map(p => ({
          Name: p.name,
          PartNumber: p.partNumber,
          Description: p.description,
          Location: p.location,
          CurrentStock: p.currentStock,
          AverageCost: p.averageCost,
          TotalValue: p.currentStock * p.averageCost
      }));
      StorageService.exportToCSV(data, 'inventory_parts_export');
  };

  const handleExportJSON = () => {
      const jsonString = JSON.stringify(parts, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `store_inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          const content = e.target?.result as string;
          try {
              const importedData = JSON.parse(content);
              if (Array.isArray(importedData)) {
                  const isValid = importedData.every((item: any) => item.name && item.partNumber);
                  if (isValid) {
                      if (window.confirm(`تم العثور على ${importedData.length} صنف. هل تريد استيرادها ودمجها مع المخزون الحالي؟`)) {
                          importedData.forEach((part: SparePart) => {
                              StorageService.saveSparePart(part);
                          });
                          refreshData();
                          alert("تم استيراد بيانات المخزون بنجاح.");
                      }
                  } else {
                      alert("ملف غير صالح: البيانات ناقصة.");
                  }
              } else {
                  alert("ملف غير صالح: يجب أن يكون مصفوفة JSON.");
              }
          } catch (err) {
              console.error(err);
              alert("حدث خطأ أثناء قراءة الملف.");
          }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-full flex flex-col gap-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Package className="text-gold-500" /> إدارة المخازن وقطع الغيار
                </h2>
                <p className="text-slate-500 text-sm mt-1">المخزون الحالي: {parts.length} صنف | القيمة الإجمالية: {parts.reduce((s, p) => s + (p.currentStock * p.averageCost), 0).toLocaleString()} ريال</p>
            </div>
            
            <div className="flex items-center gap-3">
                {/* Tools Group */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button onClick={() => window.print()} className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors tooltip" title="طباعة الجرد">
                        <Printer size={18} />
                    </button>
                    <button onClick={handleExportCSV} className="p-2 text-slate-600 hover:text-green-600 hover:bg-white rounded transition-colors tooltip" title="تصدير Excel/CSV">
                        <FileSpreadsheet size={18} />
                    </button>
                    <button onClick={handleExportJSON} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-white rounded transition-colors tooltip" title="تصدير نسخة احتياطية (JSON)">
                        <Download size={18} />
                    </button>
                    <label className="p-2 text-slate-600 hover:text-gold-600 hover:bg-white rounded transition-colors cursor-pointer tooltip" title="استيراد مخزون (JSON)">
                        <Upload size={18} />
                        <input 
                            type="file" 
                            accept=".json" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleImportJSON}
                        />
                    </label>
                </div>

                <div className="h-8 w-px bg-slate-300 mx-1"></div>

                <button onClick={() => setIsPurchaseModalOpen(true)} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg font-bold flex items-center gap-2">
                    <ShoppingCart size={18} /> شراء مخزون
                </button>
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-gold-500 text-white hover:bg-gold-600 rounded-lg font-bold flex items-center gap-2 shadow-lg">
                    <Plus size={18} /> تعريف صنف جديد
                </button>
            </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
            {parts.map(part => (
                <div key={part.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg text-slate-800">{part.name}</h3>
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono font-bold border border-slate-200">{part.partNumber}</span>
                    </div>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">{part.description || 'لا يوجد وصف'}</p>
                    
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div>
                            <span className="text-xs text-slate-400 block mb-1">الكمية المتوفرة</span>
                            <span className={`text-xl font-mono font-bold ${part.currentStock < 5 ? 'text-red-500' : 'text-slate-700'}`}>
                                {part.currentStock}
                            </span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 block mb-1">متوسط التكلفة</span>
                            <span className="text-xl font-mono font-bold text-gold-600">
                                {Math.round(part.averageCost).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-400 flex items-center gap-1">
                        <Hash size={12} /> الموقع: {part.location}
                    </div>
                </div>
            ))}
            {parts.length === 0 && (
                <div className="col-span-full text-center py-20 text-slate-400">
                    لا توجد أصناف معرفة في المخزن
                </div>
            )}
        </div>

        {/* Add Part Modal - Light Theme */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                    <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-slate-800 font-bold text-lg">إضافة صنف مخزني جديد</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500"><X /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">اسم القطعة</label>
                            <input type="text" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="مثلاً: فلتر زيت تويوتا" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">رقم القطعة (PN)</label>
                                <input type="text" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={formData.partNumber} onChange={e => setFormData({...formData, partNumber: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">الموقع / الرف</label>
                                <input type="text" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">وصف إضافي</label>
                            <input type="text" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50">إلغاء</button>
                            <button onClick={handleSavePart} className="px-6 py-2 bg-gold-500 text-white font-bold rounded hover:bg-gold-600 shadow">حفظ</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Purchase Stock Modal - Light Theme */}
        {isPurchaseModalOpen && (
             <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                    <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-slate-800 font-bold text-lg">شراء / توريد مخزني</h3>
                        <button onClick={() => setIsPurchaseModalOpen(false)} className="text-slate-400 hover:text-red-500"><X /></button>
                    </div>
                    <div className="p-6 space-y-4">
                         <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">الصنف</label>
                            <select className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={purchaseForm.partId} onChange={e => setPurchaseForm({...purchaseForm, partId: e.target.value})}>
                                <option value="">اختر الصنف...</option>
                                {parts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.partNumber})</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">الكمية الواردة</label>
                                <input type="number" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 font-mono focus:border-gold-500 outline-none" value={purchaseForm.qty} onChange={e => setPurchaseForm({...purchaseForm, qty: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">سعر الوحدة (شراء)</label>
                                <input type="number" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 font-mono focus:border-gold-500 outline-none" value={purchaseForm.unitCost} onChange={e => setPurchaseForm({...purchaseForm, unitCost: Number(e.target.value)})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">حساب الدفع</label>
                            <select className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={purchaseForm.cashAccountId} onChange={e => setPurchaseForm({...purchaseForm, cashAccountId: e.target.value})}>
                                <option value="">اختر النقدية/البنك...</option>
                                {cashAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-100">
                            سيتم إنشاء قيد: من ح/ المخزون إلى ح/ النقدية وتحديث متوسط التكلفة تلقائياً.
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                             <button onClick={() => setIsPurchaseModalOpen(false)} className="px-4 py-2 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50">إلغاء</button>
                            <button onClick={handlePurchaseStock} className="px-6 py-2 bg-slate-800 text-white font-bold rounded hover:bg-slate-700 shadow">تنفيذ الشراء</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default StoreModule;