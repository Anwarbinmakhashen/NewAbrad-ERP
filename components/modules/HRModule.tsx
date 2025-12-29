import React, { useState, useEffect } from 'react';
import { Employee, EmployeeStatus, HRTransaction, HROperationType, Account, JournalEntry, ModuleType } from '../../types';
import { StorageService } from '../../services/storageService';
import { Users, UserPlus, Briefcase, Plus, Save, Banknote, AlertTriangle, Plane, Stethoscope, Search, Check, Wallet, X,  CreditCard, Edit2, Trash2 } from 'lucide-react';

const HRModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'OPERATIONS'>('EMPLOYEES');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<HRTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Modals
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isOpModalOpen, setIsOpModalOpen] = useState(false);

  // Forms
  const [empForm, setEmpForm] = useState<Partial<Employee>>({
    status: EmployeeStatus.ACTIVE,
    currency: 'YER'
  });

  const [opForm, setOpForm] = useState<{
    employeeId: string;
    type: HROperationType;
    amount: number;
    description: string;
    date: string;
    cashAccountId?: string; // For payouts
  }>({
    employeeId: '',
    type: HROperationType.BONUS,
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    cashAccountId: ''
  });

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const refreshData = () => {
    setEmployees(StorageService.getEmployees());
    setTransactions(StorageService.getHRTransactions());
    setAccounts(StorageService.getAccounts());
  };

  // --- HANDLERS: EMPLOYEE ---

  const handleSaveEmployee = () => {
    if (!empForm.fullName || !empForm.basicSalary) {
      alert("يرجى إدخال الاسم والراتب الأساسي");
      return;
    }

    const newEmp: Employee = {
      id: empForm.id || Date.now().toString(),
      fullName: empForm.fullName!,
      position: empForm.position || 'Employee',
      department: empForm.department || 'General',
      hireDate: empForm.hireDate || new Date().toISOString(),
      basicSalary: Number(empForm.basicSalary),
      currency: empForm.currency || 'YER',
      status: empForm.status || EmployeeStatus.ACTIVE,
      phone: empForm.phone || '',
      // New Fields from Table 1-6
      idNumber: empForm.idNumber,
      idType: empForm.idType,
      idIssuePlace: empForm.idIssuePlace,
      licenseNumber: empForm.licenseNumber,
      licenseExpiry: empForm.licenseExpiry
    };

    StorageService.saveEmployee(newEmp);
    setIsEmpModalOpen(false);
    refreshData();
    setEmpForm({ status: EmployeeStatus.ACTIVE, currency: 'YER' });
  };

  const handleEditEmployee = (employee: Employee) => {
      setEmpForm(employee);
      setIsEmpModalOpen(true);
  };

  const handleDeleteEmployee = (id: string) => {
      if(window.confirm("هل أنت متأكد من حذف هذا الموظف/السائق؟ لا يمكن التراجع عن هذا الإجراء.")) {
          StorageService.deleteEmployee(id);
          refreshData();
      }
  };

  // --- HANDLERS: OPERATIONS & ACCOUNTING ---

  const handleSaveOperation = () => {
    if (!opForm.employeeId || !opForm.amount || !opForm.description) {
      alert("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }

    const employee = employees.find(e => e.id === opForm.employeeId);
    if (!employee) return;

    // PREPARE JOURNAL ENTRY AUTOMATICALLY
    // This is the core requirement: Everything must have accounting impact.
    
    let drAccount = ''; // Debit
    let crAccount = ''; // Credit
    let jeDescription = '';

    // Map logic based on NEW CHART OF ACCOUNTS
    if (opForm.type === HROperationType.TRAVEL_ALLOWANCE) {
        // Dr Travel Exp (5206) / Cr Cash
        const expAcc = accounts.find(a => a.code.startsWith('5206'));
        if (!expAcc) { alert("حساب تذاكر السفر/بدل السفر (5206) غير موجود"); return; }
        if (!opForm.cashAccountId) { alert("يرجى تحديد حساب الدفع (الصندوق/البنك)"); return; }
        
        drAccount = expAcc.id;
        crAccount = opForm.cashAccountId;
        jeDescription = `صرف بدل سفر - ${employee.fullName} - ${opForm.description}`;

    } else if (opForm.type === HROperationType.MEDICAL) {
        // Dr Medical Exp (5202) / Cr Cash
        const expAcc = accounts.find(a => a.code.startsWith('5202'));
        if (!expAcc) { alert("حساب التأمين الطبي (5202) غير موجود"); return; }
        if (!opForm.cashAccountId) { alert("يرجى تحديد حساب الدفع"); return; }

        drAccount = expAcc.id;
        crAccount = opForm.cashAccountId;
        jeDescription = `صرف رعاية صحية - ${employee.fullName} - ${opForm.description}`;

    } else if (opForm.type === HROperationType.BONUS) {
        // Accrual: Dr Bonus Exp (5205) / Cr Staff Payables (2103)
        const expAcc = accounts.find(a => a.code.startsWith('5205'));
        const payAcc = accounts.find(a => a.code.startsWith('2103')); // Salaries Payable
        
        drAccount = expAcc?.id || '';
        crAccount = payAcc?.id || '';
        jeDescription = `استحقاق مكافأة/علاوة - ${employee.fullName} - ${opForm.description}`;

    } else if (opForm.type === HROperationType.VIOLATION) {
        // Deduction: Dr Staff Payables (2103) / Cr Other Revenue (4201)
        const payAcc = accounts.find(a => a.code.startsWith('2103'));
        const revAcc = accounts.find(a => a.code.startsWith('4201')); 
        
        drAccount = payAcc?.id || '';
        crAccount = revAcc?.id || '';
        jeDescription = `قيد مخالفة/جزاء - ${employee.fullName} - ${opForm.description}`;

    } else if (opForm.type === HROperationType.ADVANCE) {
        // Dr Staff Advances (1105) / Cr Cash
        const recAcc = accounts.find(a => a.code.startsWith('1105')); // Advances
        if (!opForm.cashAccountId) { alert("يرجى تحديد حساب الدفع"); return; }

        drAccount = recAcc?.id || '';
        crAccount = opForm.cashAccountId;
        jeDescription = `صرف سلفة - ${employee.fullName}`;
    }

    if (!drAccount || !crAccount) {
        alert("خطأ في توجيه الحسابات المحاسبية. تأكد من شجرة الحسابات (الأكواد: 5206, 5202, 5205, 2103, 1105).");
        return;
    }

    // Create Journal Entry
    const je: JournalEntry = {
        id: Date.now().toString(),
        date: opForm.date,
        reference: `HR-${Date.now().toString().substr(-6)}`,
        description: jeDescription,
        status: 'POSTED',
        moduleId: ModuleType.HR,
        branchId: 'HEADQUARTERS',
        totalAmount: Number(opForm.amount),
        createdAt: new Date().toISOString(),
        createdBy: 'HR Admin',
        lines: [
            { id: '1', accountId: drAccount, debit: Number(opForm.amount), credit: 0 },
            { id: '2', accountId: crAccount, debit: 0, credit: Number(opForm.amount) }
        ]
    };

    // Save JE
    StorageService.postJournalEntry(je);

    // Save HR Transaction Record
    const tx: HRTransaction = {
        id: Date.now().toString(),
        employeeId: opForm.employeeId,
        type: opForm.type,
        amount: Number(opForm.amount),
        date: opForm.date,
        description: opForm.description,
        linkedJournalEntryId: je.id
    };

    StorageService.saveHRTransaction(tx);
    
    alert("تم حفظ العملية وترحيل القيد المحاسبي بنجاح");
    setIsOpModalOpen(false);
    refreshData();
    setOpForm({
        employeeId: '',
        type: HROperationType.BONUS,
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
        cashAccountId: ''
    });
  };

  // --- RENDERERS ---

  const renderEmployeeList = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                    <th className="p-4">الاسم الكامل (الرباعي)</th>
                    <th className="p-4">الوظيفة</th>
                    <th className="p-4">رقم الهوية</th>
                    <th className="p-4">رخصة القيادة</th>
                    <th className="p-4">انتهاء الرخصة</th>
                    <th className="p-4">الراتب</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4 text-center">إجراءات</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-800">{emp.fullName}</td>
                        <td className="p-3 text-slate-600">{emp.position}</td>
                        <td className="p-3 font-mono text-xs">{emp.idNumber || '-'}</td>
                        <td className="p-3 font-mono text-xs text-blue-600">{emp.licenseNumber || '-'}</td>
                        <td className="p-3 font-mono text-xs">{emp.licenseExpiry || '-'}</td>
                        <td className="p-3 font-mono font-bold text-slate-700">{emp.basicSalary.toLocaleString()} {emp.currency}</td>
                        <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${emp.status === EmployeeStatus.ACTIVE ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {emp.status}
                            </span>
                        </td>
                        <td className="p-3">
                            <div className="flex justify-center gap-2">
                                <button onClick={() => handleEditEmployee(emp)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="تعديل">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDeleteEmployee(emp.id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors" title="حذف">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                {employees.length === 0 && (
                    <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">لا يوجد موظفين مسجلين</td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
  );

  const renderOperations = () => (
    <div className="space-y-4">
        {transactions.map(tx => {
            const emp = employees.find(e => e.id === tx.employeeId);
            const je = StorageService.getJournal().find(j => j.id === tx.linkedJournalEntryId);
            
            let icon = <Banknote />;
            let color = 'bg-blue-100 text-blue-700';

            if (tx.type === HROperationType.VIOLATION) { icon = <AlertTriangle />; color = 'bg-red-100 text-red-700'; }
            else if (tx.type === HROperationType.TRAVEL_ALLOWANCE) { icon = <Plane />; color = 'bg-emerald-100 text-emerald-700'; }
            else if (tx.type === HROperationType.MEDICAL) { icon = <Stethoscope />; color = 'bg-purple-100 text-purple-700'; }

            return (
                <div key={tx.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${color}`}>
                                {icon}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    {emp?.fullName}
                                    <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{tx.type}</span>
                                </h4>
                                <p className="text-slate-600 mt-1">{tx.description}</p>
                                <div className="mt-2 text-xs text-slate-400 font-mono flex items-center gap-2">
                                    <span>{new Date(tx.date).toLocaleDateString('en-GB')}</span>
                                    <span>|</span>
                                    <span>Ref: {je?.reference}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-xl text-slate-800 font-mono">{tx.amount.toLocaleString()}</div>
                            <div className="text-xs text-gold-600 font-bold mt-1">مرحل محاسبياً</div>
                        </div>
                    </div>
                </div>
            );
        })}
        {transactions.length === 0 && (
             <div className="text-center p-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                 لا توجد عمليات مالية مسجلة
             </div>
        )}
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-6">
        {/* Sub Navigation */}
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border border-slate-200 w-fit">
                <button 
                    onClick={() => setActiveTab('EMPLOYEES')}
                    className={`px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-all ${activeTab === 'EMPLOYEES' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <Users size={16} /> تهيئة الموظفين
                </button>
                <button 
                    onClick={() => setActiveTab('OPERATIONS')}
                    className={`px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-all ${activeTab === 'OPERATIONS' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <Briefcase size={16} /> الحركات والعمليات المالية
                </button>
            </div>

            {/* Actions */}
            {activeTab === 'EMPLOYEES' ? (
                <button 
                    onClick={() => { setEmpForm({ status: EmployeeStatus.ACTIVE, currency: 'YER' }); setIsEmpModalOpen(true); }}
                    className="bg-gold-500 hover:bg-gold-600 text-white px-6 py-2 rounded-lg shadow-lg flex items-center gap-2 font-bold transition-transform hover:scale-105"
                >
                    <UserPlus size={20} /> إضافة موظف
                </button>
            ) : (
                <button 
                    onClick={() => setIsOpModalOpen(true)}
                    className="bg-gold-500 hover:bg-gold-600 text-white px-6 py-2 rounded-lg shadow-lg flex items-center gap-2 font-bold transition-transform hover:scale-105"
                >
                    <Plus size={20} /> عملية جديدة (سلفة/علاوة/مخالفة)
                </button>
            )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto pb-10">
            {activeTab === 'EMPLOYEES' ? renderEmployeeList() : renderOperations()}
        </div>

        {/* Employee Modal - Light Theme */}
        {isEmpModalOpen && (
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
                    <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-slate-800 font-bold text-lg">{empForm.id ? 'تعديل بيانات موظف' : 'إضافة موظف جديد (جدول 1-6)'}</h3>
                        <button onClick={() => setIsEmpModalOpen(false)} className="text-slate-400 hover:text-red-500"><X /></button>
                    </div>
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">الاسم الرباعي الكامل</label>
                                <input type="text" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={empForm.fullName || ''} onChange={e => setEmpForm({...empForm, fullName: e.target.value})} placeholder="الاسم الأول - الأب - الجد - اللقب" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">رقم الهاتف</label>
                                <input type="text" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={empForm.phone || ''} onChange={e => setEmpForm({...empForm, phone: e.target.value})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">المسمى الوظيفي</label>
                                <input type="text" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={empForm.position || ''} onChange={e => setEmpForm({...empForm, position: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">القسم</label>
                                <input type="text" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={empForm.department || ''} onChange={e => setEmpForm({...empForm, department: e.target.value})} />
                            </div>
                        </div>

                        {/* ID and License Details (New Section) */}
                        <div className="bg-blue-50 p-4 rounded border border-blue-200">
                            <h4 className="font-bold text-sm text-blue-800 mb-3 flex items-center gap-2"><CreditCard size={16}/> بيانات الهوية والرخصة</h4>
                            <div className="grid grid-cols-2 gap-4 mb-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">رقم الهوية</label>
                                    <input type="text" className="w-full border border-slate-300 p-2 rounded bg-white text-slate-900 focus:border-gold-500 outline-none font-mono" value={empForm.idNumber || ''} onChange={e => setEmpForm({...empForm, idNumber: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">مكان الإصدار</label>
                                    <input type="text" className="w-full border border-slate-300 p-2 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={empForm.idIssuePlace || ''} onChange={e => setEmpForm({...empForm, idIssuePlace: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">رقم رخصة القيادة</label>
                                    <input type="text" className="w-full border border-slate-300 p-2 rounded bg-white text-slate-900 focus:border-gold-500 outline-none font-mono" value={empForm.licenseNumber || ''} onChange={e => setEmpForm({...empForm, licenseNumber: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ انتهاء الرخصة</label>
                                    <input type="date" className="w-full border border-slate-300 p-2 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={empForm.licenseExpiry || ''} onChange={e => setEmpForm({...empForm, licenseExpiry: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded border border-slate-100">
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">الراتب الأساسي</label>
                                <input type="number" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 font-mono focus:border-gold-500 outline-none" value={empForm.basicSalary || ''} onChange={e => setEmpForm({...empForm, basicSalary: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">العملة</label>
                                <select className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={empForm.currency} onChange={e => setEmpForm({...empForm, currency: e.target.value as any})}>
                                    <option value="YER">ريال يمني</option>
                                    <option value="USD">دولار أمريكي</option>
                                    <option value="SAR">ريال سعودي</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ التعيين</label>
                                <input type="date" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={empForm.hireDate ? new Date(empForm.hireDate).toISOString().split('T')[0] : ''} onChange={e => setEmpForm({...empForm, hireDate: e.target.value})} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button onClick={() => setIsEmpModalOpen(false)} className="px-4 py-2 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded">إلغاء</button>
                            <button onClick={handleSaveEmployee} className="px-6 py-2 bg-slate-900 text-gold-400 font-bold rounded hover:bg-slate-800 flex items-center gap-2">
                                <Check size={18} /> حفظ البيانات
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Operation Modal - Light Theme */}
        {isOpModalOpen && (
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
                    <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-slate-800 font-bold text-lg">تسجيل حركة / عملية مالية</h3>
                        <button onClick={() => setIsOpModalOpen(false)} className="text-slate-400 hover:text-red-500"><X /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800 flex items-start gap-2">
                            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                            <p>تنبيه: سيتم إنشاء قيد محاسبي تلقائيًا لهذه العملية. تأكد من صحة البيانات.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">الموظف</label>
                                <select 
                                    className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none"
                                    value={opForm.employeeId}
                                    onChange={e => setOpForm({...opForm, employeeId: e.target.value})}
                                >
                                    <option value="">اختر الموظف...</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">نوع العملية</label>
                                <select 
                                    className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none"
                                    value={opForm.type}
                                    onChange={e => setOpForm({...opForm, type: e.target.value as HROperationType})}
                                >
                                    <option value={HROperationType.BONUS}>علاوة / حافز (استحقاق)</option>
                                    <option value={HROperationType.VIOLATION}>مخالفة / جزاء (خصم)</option>
                                    <option value={HROperationType.TRAVEL_ALLOWANCE}>بدل سفر وانتقال (صرف نقدي)</option>
                                    <option value={HROperationType.MEDICAL}>رعاية صحية (صرف نقدي)</option>
                                    <option value={HROperationType.ADVANCE}>سلفة على الراتب (صرف نقدي)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">المبلغ</label>
                                <input type="number" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 font-mono focus:border-gold-500 outline-none" value={opForm.amount || ''} onChange={e => setOpForm({...opForm, amount: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">التاريخ</label>
                                <input type="date" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" value={opForm.date} onChange={e => setOpForm({...opForm, date: e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">الوصف / التفاصيل</label>
                            <input type="text" className="w-full border border-slate-300 p-2.5 rounded bg-white text-slate-900 focus:border-gold-500 outline-none" placeholder="شرح سبب العملية..." value={opForm.description} onChange={e => setOpForm({...opForm, description: e.target.value})} />
                        </div>

                        {/* Cash Account Selection - Only for Cash Payouts */}
                        {(opForm.type === HROperationType.TRAVEL_ALLOWANCE || opForm.type === HROperationType.MEDICAL || opForm.type === HROperationType.ADVANCE) && (
                            <div className="bg-slate-50 p-4 rounded border border-slate-200 mt-2">
                                <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <Wallet size={16} /> حساب الدفع (الصندوق / البنك)
                                </label>
                                <select 
                                    className="w-full border border-slate-300 rounded bg-white text-slate-900 p-2 focus:border-gold-500 outline-none"
                                    value={opForm.cashAccountId}
                                    onChange={e => setOpForm({...opForm, cashAccountId: e.target.value})}
                                >
                                    <option value="">اختر حساب النقدية...</option>
                                    {accounts.filter(a => (a.code.startsWith('1101') || a.code.startsWith('1102')) && a.isLeaf).map(a => (
                                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button onClick={() => setIsOpModalOpen(false)} className="px-4 py-2 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded">إلغاء</button>
                            <button onClick={handleSaveOperation} className="px-6 py-2 bg-gold-500 text-white font-bold rounded hover:bg-gold-600 flex items-center gap-2 shadow-lg">
                                <Save size={18} /> ترحيل القيد وحفظ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default HRModule;