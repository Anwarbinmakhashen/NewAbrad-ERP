import React, { useState, useRef } from 'react';
import { StorageService } from '../../services/storageService';
import { SystemConfig, Branch, User, FinancialYear } from '../../types';
import { Building2, CheckCircle, Globe, MapPin, Lock, Loader, Check, Upload, Image as ImageIcon, Calendar, DownloadCloud } from 'lucide-react';

interface SystemSetupProps {
  onSetupComplete: () => void;
}

const SystemSetup: React.FC<SystemSetupProps> = ({ onSetupComplete }) => {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<Partial<SystemConfig>>({
    baseCurrency: 'USD', 
    companyName: 'نيو ابراد للدعم اللوجستي وتاجير السيارات المصفحة والعادية', 
    address: 'اليمن - مارب - شارع الاربعين الجنوبي بجوار مطعم الشيباني',
    isConfigured: true
  });
  
  // Backup Input Ref
  const backupInputRef = useRef<HTMLInputElement>(null);
  
  // Financial Year State
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [newYear, setNewYear] = useState<Partial<FinancialYear>>({
      startDate: '',
      endDate: '',
      name: '',
      status: 'OPEN',
      isCurrent: true
  });

  // Pre-defined branches for NewAbrad
  const defaultBranches = [
    { name: 'المركز الرئيسي - مأرب', location: 'مأرب - المجمع', isMain: true },
    { name: 'فرع عدن', location: 'عدن - المعلا', isMain: false },
    { name: 'فرع حضرموت', location: 'المكلا', isMain: false },
    { name: 'فرع المهرة', location: 'الغيضة', isMain: false },
  ];

  const handleAddYear = () => {
      if(!newYear.name || !newYear.startDate || !newYear.endDate) {
          alert("الرجاء تعبئة بيانات السنة المالية");
          return;
      }
      
      const year: FinancialYear = {
          id: Date.now().toString(),
          name: newYear.name!,
          startDate: newYear.startDate!,
          endDate: newYear.endDate!,
          status: 'OPEN',
          isCurrent: true // First one is current by default
      };

      setFinancialYears([year]); // Only allow adding one initially to keep it simple, or push if supporting multiple
  };

  const handleFinish = async () => {
    if (!config.companyName) return alert("يرجى تعبئة اسم الشركة");
    if (financialYears.length === 0) return alert("يجب إضافة سنة مالية واحدة على الأقل");
    
    setStep(4); // Moving to processing step
    setIsProcessing(true);

    // Simulate processing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 1. Save System Configuration
    StorageService.saveConfig({
        companyName: config.companyName!,
        baseCurrency: config.baseCurrency || 'USD',
        isConfigured: true,
        taxNumber: config.taxNumber || '',
        address: config.address || '',
        phone: config.phone || '',
        logo: config.logo
    });
    
    // 2. Create Default Branches
    defaultBranches.forEach((b, index) => {
        const branch: Branch = {
          id: b.isMain ? 'HEADQUARTERS' : `BRANCH-${index + 1}`,
          name: b.name,
          location: b.location,
          managerName: '',
          phone: '',
          isMain: b.isMain
        };
        StorageService.saveBranch(branch);
    });

    // 3. Save Financial Years
    financialYears.forEach(year => {
        StorageService.saveFinancialYear(year);
    });

    // 4. Create Default Admin User
    const adminUser: User = {
        id: 'ADMIN_001',
        username: 'admin',
        password: 'admin123', // Default Password
        role: 'ADMIN',
        fullName: 'مدير النظام',
        branchId: 'HEADQUARTERS'
    };
    StorageService.saveUser(adminUser);

    setIsProcessing(false);
  };

  const handleEnterSystem = () => {
      onSetupComplete();
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        // Validation: Max 1MB (1024 * 1024 bytes)
        if (file.size > 1024 * 1024) {
            alert("حجم الصورة كبير جداً. يرجى اختيار شعار بحجم أقل من 1 ميجابايت لضمان سرعة النظام وتجنب أخطاء الذاكرة.");
            // Reset input
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                setConfig({ ...config, logo: reader.result });
            }
        };
        reader.readAsDataURL(file);
    }
    // Always reset input value to allow re-selecting the same file if needed
    event.target.value = '';
  };

  const handleRestoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if(!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              if (StorageService.restoreBackup(content)) {
                  alert("تمت استعادة البيانات بنجاح. سيتم الدخول للنظام.");
                  onSetupComplete();
              }
          } catch(err: any) {
              alert("فشل في استعادة النسخة: " + err.message);
          }
      };
      reader.readAsText(file);
      if(backupInputRef.current) backupInputRef.current.value = '';
  };

  return (
    <div className="h-screen w-screen bg-slate-50 flex items-center justify-center font-arabic dir-rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col min-h-[600px] border border-slate-200">
        {/* Header */}
        <div className="bg-white p-8 text-center border-b border-gold-500">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">تهيئة نظام نيو ابراد ERP</h1>
          <p className="text-slate-500">إعداد النظام لأول مرة - نسخة سطح المكتب</p>
        </div>

        {/* Body */}
        <div className="p-10 flex-1 flex flex-col overflow-y-auto">
          
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn flex-1 flex flex-col">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Globe className="text-gold-500" /> بيانات الشركة وشعار النظام
              </h2>
              
              <div className="flex gap-6 items-start">
                  <div className="flex-1 space-y-4">
                        <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1">اسم الشركة الرسمي</label>
                        <input 
                            type="text" 
                            className="w-full border-2 border-slate-200 rounded-lg p-3 text-lg focus:border-gold-500 outline-none text-slate-900 bg-white"
                            value={config.companyName || ''}
                            onChange={e => setConfig({...config, companyName: e.target.value})}
                        />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1">العنوان</label>
                            <input 
                            type="text" 
                            className="w-full border-2 border-slate-200 rounded-lg p-3 outline-none text-slate-900 bg-white"
                            value={config.address || ''}
                            onChange={e => setConfig({...config, address: e.target.value})}
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-bold text-slate-600 mb-1">العملة الأساسية للنظام</label>
                             <select 
                                className="w-full border-2 border-slate-200 rounded-lg p-3 text-lg focus:border-gold-500 outline-none text-slate-900 bg-white"
                                value={config.baseCurrency}
                                onChange={e => setConfig({...config, baseCurrency: e.target.value as any})}
                            >
                                <option value="USD">دولار أمريكي (USD)</option>
                                <option value="SAR">ريال سعودي (SAR)</option>
                                <option value="YER">ريال يمني (YER)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1">الرقم الضريبي (اختياري)</label>
                            <input 
                            type="text" 
                            className="w-full border-2 border-slate-200 rounded-lg p-3 outline-none text-slate-900 bg-white"
                            value={config.taxNumber || ''}
                            onChange={e => setConfig({...config, taxNumber: e.target.value})}
                            />
                        </div>
                  </div>

                  {/* Logo Upload */}
                  <div className="w-1/3 flex flex-col items-center">
                       <label className="block text-sm font-bold text-slate-600 mb-2">شعار الشركة</label>
                       <label className="w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors overflow-hidden">
                           {config.logo ? (
                               <img src={config.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                           ) : (
                               <>
                                <ImageIcon className="text-slate-300 mb-2" size={32} />
                                <span className="text-xs text-slate-400">اضغط للرفع</span>
                                <span className="text-[10px] text-slate-300 mt-1">PNG, JPG (max 1MB)</span>
                               </>
                           )}
                           <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                       </label>
                  </div>
              </div>

              {/* Restore Backup Option */}
              <div className="mt-4 pt-4 border-t border-slate-100 text-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-slate-500 text-sm mb-3 font-bold">هل لديك نسخة احتياطية من جهاز سابق؟</p>
                  <button 
                      onClick={() => backupInputRef.current?.click()}
                      className="bg-white border border-slate-300 text-slate-700 hover:text-blue-600 hover:border-blue-300 px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 mx-auto transition-all shadow-sm"
                  >
                      <DownloadCloud size={16} /> استعادة نسخة احتياطية وتخطي الإعداد
                  </button>
                  <input 
                      type="file" 
                      ref={backupInputRef}
                      accept=".json"
                      className="hidden"
                      onChange={handleRestoreBackup}
                  />
              </div>

              <div className="flex justify-end pt-4 mt-auto">
                <button onClick={() => setStep(2)} className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-800 shadow">التالي</button>
              </div>
            </div>
          )}

          {/* ... Rest of Steps (No changes needed in Step 2, 3, 4 structure but kept for completeness in context) ... */}
          {step === 2 && (
             <div className="space-y-6 animate-fadeIn flex-1">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="text-gold-500" /> الفروع ومراكز التشغيل
              </h2>
              {/* ... Same as previous ... */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-sm text-slate-600 mb-4">سيتم إنشاء الفروع التالية تلقائياً كنقاط تشغيل ومراكز تكلفة:</p>
                  <div className="grid grid-cols-2 gap-3">
                      {defaultBranches.map((b, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white p-3 rounded border border-slate-100 shadow-sm">
                              <MapPin size={16} className={b.isMain ? "text-gold-500" : "text-slate-400"} />
                              <div>
                                  <span className={`block font-bold text-sm ${b.isMain ? 'text-slate-900' : 'text-slate-700'}`}>{b.name}</span>
                                  <span className="text-xs text-slate-400">{b.location}</span>
                              </div>
                              {b.isMain && <span className="mr-auto text-xs bg-gold-100 text-gold-700 px-2 py-0.5 rounded font-bold">رئيسي</span>}
                          </div>
                      ))}
                  </div>
              </div>

              <div className="flex justify-between pt-4 mt-auto">
                <button onClick={() => setStep(1)} className="text-slate-500 px-4">رجوع</button>
                <button onClick={() => setStep(3)} className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-800 shadow">التالي</button>
              </div>
            </div>
          )}

          {step === 3 && (
              <div className="space-y-6 animate-fadeIn flex-1">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Calendar className="text-gold-500" /> السنوات المالية
                  </h2>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                      يجب تعريف السنة المالية الحالية لبدء العمليات المحاسبية. يمكنك إضافة سنوات أخرى لاحقاً من لوحة التحكم.
                  </div>

                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                       <div className="grid grid-cols-3 gap-4 mb-4">
                           <div>
                               <label className="block text-sm font-bold text-slate-600 mb-1">اسم السنة (مثال: 2024)</label>
                               <input 
                                  type="text" 
                                  className="w-full border border-slate-300 p-2 rounded bg-white text-slate-900 focus:outline-none focus:border-gold-500"
                                  value={newYear.name} 
                                  onChange={e => setNewYear({...newYear, name: e.target.value})}
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-slate-600 mb-1">من تاريخ</label>
                               <input 
                                  type="date" 
                                  className="w-full border border-slate-300 p-2 rounded bg-white text-slate-900 focus:outline-none focus:border-gold-500"
                                  value={newYear.startDate} 
                                  onChange={e => setNewYear({...newYear, startDate: e.target.value})}
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-slate-600 mb-1">إلى تاريخ</label>
                               <input 
                                  type="date" 
                                  className="w-full border border-slate-300 p-2 rounded bg-white text-slate-900 focus:outline-none focus:border-gold-500"
                                  value={newYear.endDate} 
                                  onChange={e => setNewYear({...newYear, endDate: e.target.value})}
                               />
                           </div>
                       </div>
                       <button 
                          onClick={handleAddYear}
                          className="w-full bg-white border-2 border-dashed border-slate-300 text-slate-600 py-3 rounded-lg font-bold hover:bg-slate-100 hover:border-gold-400 transition-colors"
                       >
                           + اعتماد السنة المالية
                       </button>
                  </div>

                  {financialYears.length > 0 && (
                      <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <CheckCircle className="text-green-500" size={24} />
                              <div>
                                  <h4 className="font-bold text-slate-800">السنة المالية: {financialYears[0].name}</h4>
                                  <p className="text-xs text-slate-500">
                                      {financialYears[0].startDate} - {financialYears[0].endDate}
                                  </p>
                              </div>
                          </div>
                          <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-bold">الحالية</span>
                      </div>
                  )}

                  <div className="flex justify-between pt-4 mt-auto">
                    <button onClick={() => setStep(2)} className="text-slate-500 px-4">رجوع</button>
                    <button onClick={handleFinish} disabled={financialYears.length === 0} className="bg-gold-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-gold-600 flex items-center gap-2 shadow-lg hover:shadow-gold-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      <CheckCircle /> اعتماد وبدء النظام
                    </button>
                  </div>
              </div>
          )}

          {step === 4 && (
              <div className="flex flex-col items-center justify-center flex-1 animate-fadeIn text-center">
                  {isProcessing ? (
                      <>
                        <Loader size={64} className="text-gold-500 animate-spin mb-6" />
                        <h2 className="text-xl font-bold text-slate-800 mb-2">جاري إعداد النظام...</h2>
                        <p className="text-slate-500">يتم الآن إنشاء قاعدة البيانات وشجرة الحسابات والسنوات المالية</p>
                      </>
                  ) : (
                      <>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100">
                            <Check size={48} className="text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">تم الإعداد بنجاح!</h2>
                        <p className="text-slate-500 mb-8 max-w-xs">بيانات الدخول الافتراضية:<br/>admin / admin123</p>
                        
                        <div className="w-full bg-slate-50 p-4 rounded-lg border border-slate-200 mb-8 text-sm font-mono text-left dir-ltr space-y-2 text-slate-600">
                            <div className="flex items-center gap-2"><Check size={14} className="text-green-500"/> Config Saved</div>
                            <div className="flex items-center gap-2"><Check size={14} className="text-green-500"/> Branches Created</div>
                            <div className="flex items-center gap-2"><Check size={14} className="text-green-500"/> Financial Year Initialized</div>
                            <div className="flex items-center gap-2"><Check size={14} className="text-green-500"/> Admin User Created</div>
                        </div>

                        <button onClick={handleEnterSystem} className="bg-slate-900 text-gold-400 w-full py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl">
                            الدخول للنظام
                        </button>
                      </>
                  )}
              </div>
          )}

        </div>
        
        {/* Progress */}
        <div className="h-2 bg-slate-100 flex">
          <div className={`h-full bg-gold-500 transition-all duration-500 ${step === 1 ? 'w-1/4' : step === 2 ? 'w-2/4' : step === 3 ? 'w-3/4' : 'w-full'}`}></div>
        </div>
      </div>
    </div>
  );
};

export default SystemSetup;