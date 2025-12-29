import React, { useState, useEffect, useRef } from 'react';
import { Branch, User, SystemConfig, FinancialYear } from '../../types';
import { StorageService } from '../../services/storageService';
import { Building2, Plus, Users, Shield, Save, Download, UserPlus, Trash2, Edit2, Key, Check, X, Settings as SettingsIcon, Upload, Image as ImageIcon, Calendar, Database, UploadCloud, DownloadCloud, AlertTriangle, Network, Server, Printer, CreditCard, HardDrive, FileText, Truck, Folder } from 'lucide-react';

const AdminModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BRANCHES' | 'USERS' | 'SETTINGS' | 'PRINT' | 'YEARS' | 'BACKUP' | 'NETWORK'>('USERS');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [dbPath, setDbPath] = useState('');
  
  // Database Stats
  const [dbStats, setDbStats] = useState({
      users: 0,
      branches: 0,
      journalLines: 0,
      vehicles: 0,
      clients: 0,
      invoices: 0
  });
  
  // Forms
  const [isBranchModal, setIsBranchModal] = useState(false);
  const [branchForm, setBranchForm] = useState<Partial<Branch>>({});

  const [isUserModal, setIsUserModal] = useState(false);
  const [userForm, setUserForm] = useState<Partial<User>>({});

  const [isYearModal, setIsYearModal] = useState(false);
  const [yearForm, setYearForm] = useState<Partial<FinancialYear>>({});

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  
  // Print Settings Inputs Refs
  const headerInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);
  const sealInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const refreshData = () => {
      setBranches(StorageService.getBranches());
      setUsers(StorageService.getUsers());
      setConfig(StorageService.getConfig());
      setFinancialYears(StorageService.getFinancialYears());
      
      // Get DB Path safely (needs cast as it's added method)
      setDbPath((StorageService as any).getDatabasePath?.() || 'Unknown');

      // Fetch DB Stats
      setDbStats({
          users: StorageService.getUsers().length,
          branches: StorageService.getBranches().length,
          journalLines: StorageService.getJournal().length,
          vehicles: StorageService.getVehicles().length,
          clients: StorageService.getClients().length,
          invoices: StorageService.get('trade_invoices').length
      });
  };

  // --- BRANCH HANDLERS ---
  const handleSaveBranch = () => {
    if(!branchForm.name || !branchForm.location) return alert("يرجى تعبئة الاسم والموقع");
    
    const newBranch: Branch = {
      id: branchForm.id || Date.now().toString(),
      name: branchForm.name!,
      location: branchForm.location!,
      managerName: branchForm.managerName || '',
      phone: branchForm.phone || '',
      isMain: branchForm.isMain || false
    };
    
    StorageService.saveBranch(newBranch);
    refreshData();
    setIsBranchModal(false);
    setBranchForm({});
  };

  // --- USER HANDLERS ---
  const handleSaveUser = () => {
    if(!userForm.username || !userForm.fullName || !userForm.role || !userForm.branchId) {
        alert("جميع الحقول مطلوبة");
        return;
    }
    
    // For new users, password is required
    if (!userForm.id && !userForm.password) {
        alert("كلمة المرور مطلوبة للمستخدم الجديد");
        return;
    }

    const newUser: User = {
        id: userForm.id || Date.now().toString(),
        username: userForm.username,
        password: userForm.password, // In real app, avoid overwriting if empty on edit
        fullName: userForm.fullName,
        role: userForm.role,
        branchId: userForm.branchId
    };

    StorageService.saveUser(newUser);
    refreshData();
    setIsUserModal(false);
    setUserForm({});
    alert("تم حفظ بيانات المستخدم بنجاح");
  };

  const handleDeleteUser = (id: string) => {
    if(window.confirm("هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.")) {
        StorageService.deleteUser(id);
        refreshData();
    }
  };

  // --- FINANCIAL YEAR HANDLERS ---
  const handleSaveYear = () => {
    if(!yearForm.name || !yearForm.startDate || !yearForm.endDate) {
        alert("جميع الحقول مطلوبة");
        return;
    }

    const newYear: FinancialYear = {
        id: yearForm.id || Date.now().toString(),
        name: yearForm.name!,
        startDate: yearForm.startDate!,
        endDate: yearForm.endDate!,
        status: yearForm.status || 'OPEN',
        isCurrent: yearForm.isCurrent || false
    };

    StorageService.saveFinancialYear(newYear);
    refreshData();
    setIsYearModal(false);
    setYearForm({});
    alert("تم حفظ السنة المالية بنجاح");
  };

  // --- SETTINGS HANDLERS ---
  const handleSaveConfig = () => {
    if(config) {
        StorageService.saveConfig(config);
        alert("تم تحديث الإعدادات بنجاح. قد تحتاج لإعادة تحميل الصفحة لتطبيق إعدادات الطباعة.");
        window.location.reload(); 
    }
  };

  const handleTestConnection = () => {
      // Simulation of connection test
      if(!config?.serverIp) {
          alert("يرجى إدخال عنوان السيرفر IP");
          return;
      }
      alert(`جاري محاولة الاتصال بالسيرفر ${config.serverIp}...\n\n(محاكاة: الاتصال ناجح ✅)`);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'printHeader' | 'printFooter' | 'companySeal') => {
    const file = event.target.files?.[0];
    if (file) {
        // Validation: Max 1MB
        if (file.size > 1024 * 1024) {
            alert("حجم الملف كبير جداً. يرجى اختيار ملف بحجم أقل من 1 ميجابايت.");
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (config && typeof reader.result === 'string') {
                setConfig({ ...config, [field]: reader.result });
            }
        };
        reader.readAsDataURL(file);
    }
    // Clear input to allow re-uploading the same file
    event.target.value = '';
  };

  const handleExport = () => {
    if(activeTab === 'BRANCHES') StorageService.exportToCSV(branches, 'branches');
    if(activeTab === 'USERS') StorageService.exportToCSV(users, 'users');
    if(activeTab === 'YEARS') StorageService.exportToCSV(financialYears, 'financial_years');
  };

  // --- BACKUP & RESTORE ---
  const handleCreateBackup = () => {
      const json = StorageService.createBackup();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `newabrad_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleRestoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if(!file) return;

      if(window.confirm("تحذير: سيؤدي هذا الإجراء إلى استبدال كافة البيانات الحالية بالبيانات الموجودة في ملف النسخة الاحتياطية. هل أنت متأكد تماماً؟")) {
          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const content = e.target?.result as string;
                  StorageService.restoreBackup(content);
                  alert("تمت استعادة النسخة الاحتياطية بنجاح. سيتم إعادة تحميل النظام.");
                  window.location.reload();
              } catch(err: any) {
                  alert("فشل في استعادة النسخة: " + err.message);
              }
          };
          reader.readAsText(file);
      }
      if(backupInputRef.current) backupInputRef.current.value = '';
  };

  return (
    <div className="h-full flex flex-col gap-6">
       {/* ... Header and Tabs ... */}
       {/* Module Header */}
       <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="text-gold-500" /> الإدارة والتهيئة
                </h2>
                <p className="text-slate-500 text-sm mt-1">إدارة الهيكل التنظيمي، إعدادات الشركة، وصلاحيات المستخدمين</p>
            </div>
            <div className="flex gap-2">
               {(activeTab !== 'SETTINGS' && activeTab !== 'BACKUP' && activeTab !== 'NETWORK' && activeTab !== 'PRINT') && (
                <button onClick={handleExport} className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2 font-bold transition-colors">
                   <Download size={18} /> تصدير القائمة
                </button>
               )}
               
               {activeTab === 'BRANCHES' && (
                 <button onClick={() => { setBranchForm({}); setIsBranchModal(true); }} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-slate-900 shadow transition-colors">
                     <Plus size={18} /> إضافة فرع
                 </button>
               )}
               
               {activeTab === 'USERS' && (
                 <button onClick={() => { setUserForm({}); setIsUserModal(true); }} className="px-4 py-2 bg-gold-500 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-gold-600 shadow transition-colors">
                     <UserPlus size={18} /> إضافة مستخدم جديد
                 </button>
               )}

               {activeTab === 'YEARS' && (
                 <button onClick={() => { setYearForm({ status: 'OPEN', isCurrent: false }); setIsYearModal(true); }} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow transition-colors">
                     <Plus size={18} /> إضافة سنة مالية
                 </button>
               )}
            </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit border border-slate-200 overflow-x-auto">
             <button onClick={() => setActiveTab('USERS')} className={`px-6 py-2 rounded-md font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'USERS' ? 'bg-white text-gold-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>المستخدمين</button>
             <button onClick={() => setActiveTab('BRANCHES')} className={`px-6 py-2 rounded-md font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'BRANCHES' ? 'bg-white text-gold-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>الفروع</button>
             <button onClick={() => setActiveTab('YEARS')} className={`px-6 py-2 rounded-md font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'YEARS' ? 'bg-white text-gold-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Calendar size={14} /> السنوات المالية</button>
             <button onClick={() => setActiveTab('SETTINGS')} className={`px-6 py-2 rounded-md font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'SETTINGS' ? 'bg-white text-gold-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><SettingsIcon size={14} /> إعدادات الشركة</button>
             <button onClick={() => setActiveTab('PRINT')} className={`px-6 py-2 rounded-md font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'PRINT' ? 'bg-white text-gold-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Printer size={14} /> تصميم المطبوعات</button>
             <button onClick={() => setActiveTab('NETWORK')} className={`px-6 py-2 rounded-md font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'NETWORK' ? 'bg-white text-gold-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Network size={14} /> الخادم والشبكة</button>
             <button onClick={() => setActiveTab('BACKUP')} className={`px-6 py-2 rounded-md font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'BACKUP' ? 'bg-white text-gold-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Database size={14} /> النسخ الاحتياطي</button>
        </div>

        <div className="flex-1 overflow-auto">
          {/* ... Other Tabs (Branches, Users, Years, Settings, Print, Network) ... */}
          {/* BRANCHES VIEW */}
          {activeTab === 'BRANCHES' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map(b => (
                  <div key={b.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                     {b.isMain && <div className="absolute top-0 right-0 bg-gold-500 text-white text-xs px-3 py-1 rounded-bl-lg font-bold shadow-sm">الرئيسي</div>}
                     <div className="flex items-center gap-4 mb-4">
                        <div className="bg-slate-100 p-3 rounded-full"><Building2 className="text-slate-700" /></div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">{b.name}</h3>
                            <span className="text-xs text-slate-400 font-mono">{b.id}</span>
                        </div>
                     </div>
                     <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="flex justify-between"><span>📍 الموقع:</span> <span className="font-bold">{b.location}</span></p>
                        <p className="flex justify-between"><span>👤 المدير:</span> <span className="font-bold">{b.managerName || 'غير محدد'}</span></p>
                        <p className="flex justify-between"><span>📞 الهاتف:</span> <span className="font-bold font-mono">{b.phone || '-'}</span></p>
                     </div>
                     <div className="mt-4 flex justify-end">
                        <button onClick={() => { setBranchForm(b); setIsBranchModal(true); }} className="px-3 py-1.5 bg-white border border-slate-200 text-blue-600 rounded text-sm font-bold hover:bg-blue-50 flex items-center gap-1 transition-colors">
                            <Edit2 size={14} /> تعديل البيانات
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          )}

          {/* USERS VIEW */}
          {activeTab === 'USERS' && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                            <th className="p-4 w-16">#</th>
                            <th className="p-4">معلومات المستخدم</th>
                            <th className="p-4">الصلاحية (Role)</th>
                            <th className="p-4">الفرع التابع له</th>
                            <th className="p-4 text-center">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((u, index) => {
                            const branch = branches.find(b => b.id === u.branchId);
                            return (
                                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-400 font-mono">{index + 1}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase border border-slate-200">
                                                {u.username.substring(0,2)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{u.fullName}</div>
                                                <div className="text-xs text-slate-500 font-mono">@{u.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                            u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                                            u.role === 'ACCOUNTANT' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                            'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="flex items-center gap-1 text-slate-600">
                                            <Building2 size={14} className="text-slate-400"/>
                                            {branch?.name || u.branchId}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => { setUserForm(u); setIsUserModal(true); }} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip" title="تعديل المستخدم"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip" title="حذف المستخدم"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
             </div>
          )}

          {/* YEARS VIEW */}
          {activeTab === 'YEARS' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                            <th className="p-4">السنة المالية</th>
                            <th className="p-4">من تاريخ</th>
                            <th className="p-4">إلى تاريخ</th>
                            <th className="p-4">الحالة</th>
                            <th className="p-4 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {financialYears.map((y) => (
                            <tr key={y.id} className={`hover:bg-slate-50 transition-colors ${y.isCurrent ? 'bg-blue-50/30' : ''}`}>
                                <td className="p-4"><span className="font-bold text-slate-800 text-lg">{y.name}</span>{y.isCurrent && <span className="mr-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">الحالية</span>}</td>
                                <td className="p-4 font-mono text-slate-600">{y.startDate}</td>
                                <td className="p-4 font-mono text-slate-600">{y.endDate}</td>
                                <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${y.status === 'OPEN' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{y.status === 'OPEN' ? 'مفتوحة' : 'مغلقة'}</span></td>
                                <td className="p-4 text-center"><button onClick={() => { setYearForm(y); setIsYearModal(true); }} className="text-slate-500 hover:text-blue-600 p-2"><Edit2 size={18} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
          )}

          {/* SETTINGS VIEW - RESTORED & ENHANCED WITH BANK ACCOUNTS */}
          {activeTab === 'SETTINGS' && config && (
              <div className="space-y-6">
                  {/* General Config Card */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex gap-8">
                      <div className="w-1/4 flex flex-col items-center">
                          <label className="block text-sm font-bold text-slate-600 mb-2">شعار النظام</label>
                          <div className="relative w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden hover:border-gold-400 transition-colors cursor-pointer group">
                              <input type="file" ref={fileInputRef} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                              {config.logo ? (
                                  <img src={config.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                              ) : (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                      <ImageIcon size={32} className="mb-2 group-hover:text-gold-500 transition-colors" />
                                      <span className="text-xs">اضغط للرفع</span>
                                  </div>
                              )}
                          </div>
                          <button onClick={() => fileInputRef.current?.click()} className="mt-2 text-xs text-blue-600 font-bold hover:underline">
                              (Browse) اختيار صورة
                          </button>
                      </div>
                      <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-bold text-slate-600 mb-1">اسم الشركة</label>
                                  <input type="text" className="w-full border p-2.5 rounded bg-white text-slate-900 border-slate-300 focus:border-gold-500 outline-none" value={config.companyName} onChange={e => setConfig({...config, companyName: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-600 mb-1">الرقم الضريبي</label>
                                  <input type="text" className="w-full border p-2.5 rounded bg-white text-slate-900 border-slate-300 focus:border-gold-500 outline-none" value={config.taxNumber || ''} onChange={e => setConfig({...config, taxNumber: e.target.value})} />
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-600 mb-1">العنوان</label>
                              <input type="text" className="w-full border p-2.5 rounded bg-white text-slate-900 border-slate-300 focus:border-gold-500 outline-none" value={config.address || ''} onChange={e => setConfig({...config, address: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-bold text-slate-600 mb-1">الهاتف</label>
                                  <input type="text" className="w-full border p-2.5 rounded bg-white text-slate-900 border-slate-300 focus:border-gold-500 outline-none" value={config.phone || ''} onChange={e => setConfig({...config, phone: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-600 mb-1">العملة الأساسية</label>
                                  <select className="w-full border p-2.5 rounded bg-white text-slate-900 border-slate-300 focus:border-gold-500 outline-none" value={config.baseCurrency} onChange={e => setConfig({...config, baseCurrency: e.target.value as any})}>
                                      <option value="USD">دولار أمريكي (USD)</option>
                                      <option value="YER">ريال يمني (YER)</option>
                                      <option value="SAR">ريال سعودي (SAR)</option>
                                  </select>
                              </div>
                          </div>
                          <button onClick={handleSaveConfig} className="bg-gold-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-gold-700 flex items-center gap-2 shadow-lg w-fit mt-4">
                              <Save size={18} /> حفظ الإعدادات
                          </button>
                      </div>
                  </div>

                  {/* Bank Accounts Section (Read-only/Display from Chart of Accounts) */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                          <CreditCard size={20} className="text-blue-600" /> الحسابات البنكية المعتمدة
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-center">
                              <span className="block text-xs font-bold text-slate-500 mb-1">بنك الكريمي (دولار)</span>
                              <span className="block text-lg font-black text-slate-800 font-mono tracking-wider">2000362118</span>
                              <span className="text-xs text-green-600 font-bold">USD</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-center">
                              <span className="block text-xs font-bold text-slate-500 mb-1">بنك الكريمي (سعودي)</span>
                              <span className="block text-lg font-black text-slate-800 font-mono tracking-wider">2000362107</span>
                              <span className="text-xs text-green-600 font-bold">SAR</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-center">
                              <span className="block text-xs font-bold text-slate-500 mb-1">بنك الكريمي (يمني)</span>
                              <span className="block text-lg font-black text-slate-800 font-mono tracking-wider">2000362096</span>
                              <span className="text-xs text-green-600 font-bold">YER</span>
                          </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-3 text-center">* تم تهيئة هذه الحسابات تلقائياً في شجرة الحسابات (الأصول المتداولة - النقدية في البنوك).</p>
                  </div>
              </div>
          )}

          {/* PRINT SETTINGS VIEW - RESTORED */}
          {activeTab === 'PRINT' && config && (
              <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ImageIcon size={18}/> ترويسة الصفحة (Header)</h3>
                          <div className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg relative hover:border-blue-400 transition-colors cursor-pointer group">
                              <input type="file" ref={headerInputRef} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" onChange={(e) => handleImageUpload(e, 'printHeader')} />
                              {config.printHeader ? (
                                  <img src={config.printHeader} className="w-full h-full object-contain" alt="Header" />
                              ) : (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                      <Upload size={24} className="mb-1" />
                                      <span className="text-xs">رفع صورة الترويسة (A4)</span>
                                  </div>
                              )}
                          </div>
                      </div>
                      
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ImageIcon size={18}/> تذييل الصفحة (Footer)</h3>
                          <div className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg relative hover:border-blue-400 transition-colors cursor-pointer group">
                              <input type="file" ref={footerInputRef} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" onChange={(e) => handleImageUpload(e, 'printFooter')} />
                              {config.printFooter ? (
                                  <img src={config.printFooter} className="w-full h-full object-contain" alt="Footer" />
                              ) : (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                      <Upload size={24} className="mb-1" />
                                      <span className="text-xs">رفع صورة التذييل (A4)</span>
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                          <div className="flex gap-8 items-center">
                              <div className="w-1/3">
                                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Shield size={18}/> الختم الرسمي (Seal)</h3>
                                  <div className="w-40 h-40 bg-slate-50 border-2 border-dashed border-slate-300 rounded-full relative hover:border-blue-400 transition-colors cursor-pointer mx-auto overflow-hidden">
                                      <input type="file" ref={sealInputRef} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" onChange={(e) => handleImageUpload(e, 'companySeal')} />
                                      {config.companySeal ? (
                                          <img src={config.companySeal} className="w-full h-full object-contain" alt="Seal" />
                                      ) : (
                                          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                              <Upload size={24} className="mb-1" />
                                              <span className="text-xs">رفع الختم (PNG شفاف)</span>
                                          </div>
                                      )}
                                  </div>
                              </div>
                              <div className="flex-1 text-sm text-slate-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                  <h4 className="font-bold text-blue-800 mb-2">تعليمات التصميم:</h4>
                                  <ul className="list-disc list-inside space-y-1">
                                      <li>يفضل استخدام صور بصيغة PNG مع خلفية شفافة للختم.</li>
                                      <li>عرض الترويسة والتذييل المثالي هو 2480 بكسل (لجودة طباعة عالية).</li>
                                      <li>سيتم تطبيق هذه التصاميم تلقائياً على كافة سندات وفواتير النظام عند الطباعة.</li>
                                  </ul>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="flex justify-end">
                      <button onClick={handleSaveConfig} className="bg-slate-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-900 flex items-center gap-2 shadow-lg">
                          <Save size={18} /> حفظ إعدادات الطباعة
                      </button>
                  </div>
              </div>
          )}

          {/* NETWORK VIEW - RESTORED */}
          {activeTab === 'NETWORK' && config && (
              <div className="max-w-2xl mx-auto space-y-6">
                  <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-center mb-8">
                          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Server size={40} className="text-blue-600" />
                          </div>
                          <h2 className="text-xl font-bold text-slate-800">إعدادات الاتصال بالسيرفر</h2>
                          <p className="text-slate-500 text-sm mt-1">ربط المحطة بقاعدة البيانات المركزية</p>
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-bold text-slate-600 mb-1">عنوان السيرفر (IP Address)</label>
                              <input type="text" className="w-full border p-3 rounded bg-white text-slate-900 border-slate-300 focus:border-gold-500 outline-none font-mono dir-ltr placeholder:text-right" placeholder="192.168.1.xxx" value={config.serverIp || ''} onChange={e => setConfig({...config, serverIp: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-bold text-slate-600 mb-1">المنفذ (Port)</label>
                                  <input type="text" className="w-full border p-3 rounded bg-white text-slate-900 border-slate-300 focus:border-gold-500 outline-none font-mono" placeholder="1433" value={config.serverPort || ''} onChange={e => setConfig({...config, serverPort: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-600 mb-1">اسم قاعدة البيانات</label>
                                  <input type="text" className="w-full border p-3 rounded bg-white text-slate-900 border-slate-300 focus:border-gold-500 outline-none font-mono" placeholder="NEWABRAD_DB" value={config.dbName || ''} onChange={e => setConfig({...config, dbName: e.target.value})} />
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-bold text-slate-600 mb-1">اسم المستخدم (DB User)</label>
                                  <input type="text" className="w-full border p-3 rounded bg-white text-slate-900 border-slate-300 focus:border-gold-500 outline-none font-mono" value={config.dbUser || ''} onChange={e => setConfig({...config, dbUser: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-600 mb-1">كلمة المرور (DB Pass)</label>
                                  <input type="password" className="w-full border p-3 rounded bg-white text-slate-900 border-slate-300 focus:border-gold-500 outline-none font-mono" placeholder="••••••" />
                              </div>
                          </div>
                      </div>

                      <div className="flex gap-4 mt-8">
                          <button onClick={handleTestConnection} className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors">
                              اختبار الاتصال
                          </button>
                          <button onClick={handleSaveConfig} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
                              حفظ الإعدادات
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {/* BACKUP VIEW - ENHANCED FOR FILE SYSTEM PATH */}
          {activeTab === 'BACKUP' && (
              <div className="space-y-8">
                  {/* Database Info Box */}
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <HardDrive className="text-slate-600" /> موقع قاعدة البيانات (آمن)
                      </h3>
                      <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                          تم ضبط النظام لحفظ البيانات في ملف محلي بجانب ملف التشغيل (Portable). <br/>
                          هذا يحمي بياناتك من الضياع في حال تعطل قرص النظام C، حيث يمكنك تثبيت البرنامج في D أو E.
                      </p>
                      
                      <div className="flex items-center gap-2 bg-white p-3 rounded border border-slate-300 font-mono text-xs text-slate-700 dir-ltr mb-6 overflow-x-auto">
                          <Folder size={16} className="text-yellow-500 shrink-0" />
                          <span>{dbPath}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                          <div className="bg-white p-3 rounded border border-slate-200 text-center">
                              <span className="block text-xs text-slate-500 font-bold mb-1">العملاء</span>
                              <span className="font-mono font-bold text-slate-800">{dbStats.clients}</span>
                          </div>
                          <div className="bg-white p-3 rounded border border-slate-200 text-center">
                              <span className="block text-xs text-slate-500 font-bold mb-1">الفواتير</span>
                              <span className="font-mono font-bold text-slate-800">{dbStats.invoices}</span>
                          </div>
                          <div className="bg-white p-3 rounded border border-slate-200 text-center">
                              <span className="block text-xs text-slate-500 font-bold mb-1">المركبات</span>
                              <span className="font-mono font-bold text-slate-800">{dbStats.vehicles}</span>
                          </div>
                          <div className="bg-white p-3 rounded border border-slate-200 text-center">
                              <span className="block text-xs text-slate-500 font-bold mb-1">القيود</span>
                              <span className="font-mono font-bold text-slate-800">{dbStats.journalLines}</span>
                          </div>
                          <div className="bg-white p-3 rounded border border-slate-200 text-center">
                              <span className="block text-xs text-slate-500 font-bold mb-1">المستخدمين</span>
                              <span className="font-mono font-bold text-slate-800">{dbStats.users}</span>
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                      {/* Backup Card */}
                      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-lg text-center flex flex-col items-center">
                          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                              <DownloadCloud size={40} className="text-blue-600" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 mb-2">نسخة احتياطية يدوية</h3>
                          <p className="text-slate-500 mb-8 max-w-sm">تحميل نسخة إضافية بصيغة JSON للاحتفاظ بها خارج الجهاز.</p>
                          <button 
                              onClick={handleCreateBackup}
                              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 flex items-center gap-3 transition-transform hover:scale-105"
                          >
                              <Download size={20} /> تحميل النسخة الآن
                          </button>
                      </div>

                      {/* Restore Card */}
                      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-lg text-center flex flex-col items-center relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
                          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                              <UploadCloud size={40} className="text-red-600" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 mb-2">استيراد بيانات</h3>
                          <p className="text-slate-500 mb-6 max-w-sm">استيراد ملف نسخة احتياطية لاستبدال البيانات الحالية.</p>
                          
                          <div className="w-full max-w-xs">
                              <input 
                                  type="file" 
                                  ref={backupInputRef}
                                  accept=".json"
                                  className="hidden"
                                  onChange={handleRestoreBackup}
                              />
                              <button 
                                  onClick={() => backupInputRef.current?.click()}
                                  className="bg-white border-2 border-red-100 text-red-600 px-8 py-3 rounded-lg font-bold shadow-sm hover:bg-red-50 hover:border-red-200 flex items-center justify-center gap-3 w-full transition-colors"
                              >
                                  <Upload size={20} /> رفع ملف الاستعادة
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          )}

        </div>

        {/* ... Modals (Branch, User, Year) ... */}
        {/* Same Modals as before */}
        {isBranchModal && (
           <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                  {/* ... Branch Form Content ... */}
                  <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800">بيانات الفرع</h3><button onClick={() => setIsBranchModal(false)}><X className="text-slate-400 hover:text-red-500" /></button></div>
                  <div className="p-6 space-y-4">
                      <input 
                        type="text" 
                        className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-gold-500" 
                        placeholder="اسم الفرع" 
                        value={branchForm.name || ''} 
                        onChange={e => setBranchForm({...branchForm, name: e.target.value})} 
                      />
                      <input 
                        type="text" 
                        className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-gold-500" 
                        placeholder="الموقع" 
                        value={branchForm.location || ''} 
                        onChange={e => setBranchForm({...branchForm, location: e.target.value})} 
                      />
                      <button 
                        onClick={handleSaveBranch} 
                        className="w-full py-2 bg-white border-2 border-slate-800 text-slate-800 rounded font-bold hover:bg-slate-50 transition-colors"
                      >
                        حفظ
                      </button>
                  </div>
              </div>
           </div>
        )}
        
        {isUserModal && (
           <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                  <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                      <h3 className="font-bold text-lg text-slate-800">بيانات المستخدم</h3>
                      <button onClick={() => setIsUserModal(false)}><X className="text-slate-400 hover:text-red-500" /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <input type="text" className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 outline-none focus:border-gold-500" placeholder="اسم المستخدم" value={userForm.username || ''} onChange={e => setUserForm({...userForm, username: e.target.value})} />
                      <input type="password" className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 outline-none focus:border-gold-500" placeholder="كلمة المرور" value={userForm.password || ''} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                      <input type="text" className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 outline-none focus:border-gold-500" placeholder="الاسم الكامل" value={userForm.fullName || ''} onChange={e => setUserForm({...userForm, fullName: e.target.value})} />
                      
                      <select className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 outline-none focus:border-gold-500" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as any})}>
                          <option value="">اختر الصلاحية</option>
                          <option value="ADMIN">مدير نظام</option>
                          <option value="ACCOUNTANT">محاسب</option>
                          <option value="USER">مستخدم عادي</option>
                      </select>

                      <select className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 outline-none focus:border-gold-500" value={userForm.branchId} onChange={e => setUserForm({...userForm, branchId: e.target.value})}>
                          <option value="">اختر الفرع</option>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>

                      <button onClick={handleSaveUser} className="w-full py-2 bg-slate-800 text-white rounded font-bold hover:bg-slate-900 transition-colors shadow">حفظ المستخدم</button>
                  </div>
              </div>
           </div>
        )}

        {isYearModal && (
           <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                  <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800">السنة المالية</h3><button onClick={() => setIsYearModal(false)}><X className="text-slate-400 hover:text-red-500" /></button></div>
                  <div className="p-6 space-y-4">
                      <input type="text" className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 outline-none focus:border-gold-500" placeholder="اسم السنة (2024)" value={yearForm.name || ''} onChange={e => setYearForm({...yearForm, name: e.target.value})} />
                      <div className="grid grid-cols-2 gap-4">
                          <input type="date" className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 outline-none focus:border-gold-500" value={yearForm.startDate || ''} onChange={e => setYearForm({...yearForm, startDate: e.target.value})} />
                          <input type="date" className="w-full border border-slate-300 p-3 rounded bg-white text-slate-900 outline-none focus:border-gold-500" value={yearForm.endDate || ''} onChange={e => setYearForm({...yearForm, endDate: e.target.value})} />
                      </div>
                      <div className="flex items-center gap-2">
                          <input type="checkbox" checked={yearForm.isCurrent} onChange={e => setYearForm({...yearForm, isCurrent: e.target.checked})} />
                          <label className="text-slate-700 font-bold">تعيين كسنة حالية</label>
                      </div>
                      <button onClick={handleSaveYear} className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors shadow">حفظ</button>
                  </div>
              </div>
           </div>
        )}
    </div>
  );
};

export default AdminModule;