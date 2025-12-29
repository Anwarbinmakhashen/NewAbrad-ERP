import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  ChevronRight, 
  FileText, 
  Truck, 
  Calculator, 
  Users, 
  Package, 
  Briefcase, 
  Shield, 
  HelpCircle, 
  Settings,
  Menu,
  FileCheck
} from 'lucide-react';

// --- HELP CONTENT DATA ---
const HELP_TOPICS = [
  {
    id: 'intro',
    category: 'البداية',
    title: 'مقدمة عن النظام',
    icon: BookOpen,
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">مرحباً بك في نظام نيو أبراد ERP</h3>
        <p>نظام نيو أبراد هو نظام تخطيط موارد مؤسسية (ERP) متكامل، صُمم خصيصاً لإدارة عمليات تأجير السيارات، الدعم اللوجستي، والمقاولات، مع تركيز أساسي على الضبط المحاسبي الدقيق.</p>
        
        <div className="bg-gold-50 border-r-4 border-gold-500 p-4 rounded-l my-4">
          <h4 className="font-bold text-gold-700 mb-2">الفلسفة الأساسية للنظام</h4>
          <p className="text-sm text-slate-700">النظام "محاسبي أولاً". هذا يعني أن أي حركة تشغيلية (صرف وقود، إيجار سيارة، صرف راتب) يجب أن تولد قيداً محاسبياً يؤثر في القوائم المالية فوراً.</p>
        </div>

        <h4 className="font-bold text-slate-800 mt-6">أقسام النظام الرئيسية:</h4>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li><strong className="text-slate-800">القيادة (Dashboard):</strong> نظرة عامة ومؤشرات.</li>
          <li><strong className="text-slate-800">العمليات (Tasks):</strong> إدارة حركة السيارات والعقود اليومية.</li>
          <li><strong className="text-slate-800">المالية (Accounts):</strong> قلب النظام، القيود، السندات، والتقارير.</li>
          <li><strong className="text-slate-800">الأسطول (Fleet):</strong> إدارة الأصول، الصيانة، والوقود.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'accounting_vouchers',
    category: 'الإدارة المالية',
    title: 'السندات والقيود',
    icon: Calculator,
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">إدارة السندات والقيود</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div className="border border-slate-200 rounded p-4">
                <h5 className="font-bold text-emerald-600 mb-2">سندات القبض (Receipts)</h5>
                <p className="text-sm text-slate-600">تستخدم عند استلام نقدية من عميل أو إيراد. القيد التلقائي: <br/> <strong>من ح/ الصندوق &rarr; إلى ح/ العميل</strong></p>
            </div>
            <div className="border border-slate-200 rounded p-4">
                <h5 className="font-bold text-red-600 mb-2">سندات الصرف (Payments)</h5>
                <p className="text-sm text-slate-600">تستخدم لدفع مصروفات أو لموردين. القيد التلقائي: <br/> <strong>من ح/ المصروف &rarr; إلى ح/ الصندوق</strong></p>
            </div>
        </div>

        <h4 className="font-bold text-slate-800">الترحيل (Posting)</h4>
        <p>جميع القيود تنشأ بمسودة (Draft). يجب على المدير المالي أو المحاسب الأول مراجعتها واعتمادها عبر شاشة "الترحيل" لتظهر في التقارير النهائية.</p>
      </div>
    )
  },
  {
    id: 'fleet_mgmt',
    category: 'إدارة الأسطول',
    title: 'إدارة المركبات والوقود',
    icon: Truck,
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">إدارة الأسطول</h3>
        <p>يتيح هذا المديول متابعة التكاليف التشغيلية لكل مركبة (مركز تكلفة).</p>

        <h4 className="font-bold text-slate-800 mt-4">إضافة مركبة جديدة</h4>
        <p>عند إضافة مركبة، يجب ربطها بـ "حساب أصل" (1111) وموظف عهدة (سائق). هذا الربط ضروري لاحتساب الإهلاك والمسؤولية.</p>

        <h4 className="font-bold text-slate-800 mt-4">تسجيل الوقود</h4>
        <p>يتم تسجيل كمية اللترات والسعر. النظام يقوم تلقائياً بإنشاء قيد:</p>
        <div className="bg-slate-100 p-3 rounded font-mono text-sm border border-slate-200">
            من ح/ مصروفات المحروقات (511)<br/>
            إلى ح/ الصندوق أو البنك (121)
        </div>
        <p className="text-sm text-slate-500 mt-2">ملاحظة: يتم ربط التكلفة بالمركبة المحددة لغرض تقارير الربحية.</p>
      </div>
    )
  },
  {
    id: 'operations_tasks',
    category: 'العمليات',
    title: 'التكليفات وخطوط السير',
    icon: FileCheck,
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">التكليفات الميدانية</h3>
        <p>هذا هو المديول التشغيلي الرئيسي الذي يربط (العميل + المركبة + السائق).</p>

        <ul className="list-decimal list-inside space-y-3 text-slate-700 mt-4">
            <li><strong>إنشاء التكليف:</strong> اختر العميل، المركبة المتاحة، والسائق.</li>
            <li><strong>تحديد خط السير:</strong> حدد المسار والفترة الزمنية.</li>
            <li><strong>القيمة المالية:</strong> أدخل قيمة العقد المتفق عليها.</li>
            <li><strong>الأثر المالي:</strong> عند الحفظ، ينشئ النظام قيد استحقاق: <br/> <span className="font-bold text-blue-600">من ح/ العملاء &rarr; إلى ح/ إيرادات التشغيل</span></li>
        </ul>
        
        <div className="bg-yellow-50 p-4 rounded border border-yellow-200 mt-4 text-sm text-yellow-800 flex items-start gap-2">
            <Shield size={16} className="mt-0.5" />
            <p>لا يمكن اختيار مركبة حالتها "مؤجرة" أو "في الصيانة". يجب أن تكون المركبة "متاحة" (Available).</p>
        </div>
      </div>
    )
  },
  {
    id: 'store_inventory',
    category: 'المخازن',
    title: 'قطع الغيار والمشتريات',
    icon: Package,
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">نظام المخزون</h3>
        <p>يعتمد النظام طريقة "متوسط التكلفة المرجح" (Weighted Average Cost) لتقييم المخزون.</p>

        <h4 className="font-bold text-slate-800 mt-4">دورة العمل:</h4>
        <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li><strong>الشراء:</strong> يزيد الكمية ويحدث متوسط التكلفة. ينشئ قيد (من ح/ المخزون &rarr; إلى ح/ النقدية).</li>
            <li><strong>الصرف (لصيانة):</strong> يتم عبر مديول الأسطول &rarr; الصيانة. ينقص الكمية وينشئ قيد (من ح/ مصروف الصيانة &rarr; إلى ح/ المخزون).</li>
        </ol>
      </div>
    )
  },
  {
    id: 'hr_payroll',
    category: 'الموارد البشرية',
    title: 'الموظفين والرواتب',
    icon: Users,
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">شؤون الموظفين</h3>
        <p>إدارة ملفات الموظفين والعمليات المالية المتعلقة بهم.</p>

        <h4 className="font-bold text-slate-800 mt-4">أنواع العمليات:</h4>
        <ul className="space-y-2 text-slate-600">
            <li><strong className="text-indigo-600">سلف:</strong> صرف نقدي يخصم من الراتب لاحقاً (قيد على ذمة الموظف).</li>
            <li><strong className="text-emerald-600">بدل سفر:</strong> مصروف نقدي مباشر للمهمات.</li>
            <li><strong className="text-red-600">جزاءات:</strong> خصم يقلل من استحقاق الراتب.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'reports_stats',
    category: 'التقارير',
    title: 'التقارير والإحصائيات',
    icon: FileText,
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">مخرجات النظام</h3>
        <p>يوفر النظام تقارير لحظية تعتمد على البيانات المرحلة:</p>
        
        <div className="space-y-3 mt-4">
            <div className="flex gap-3 items-start">
                <div className="bg-slate-100 p-2 rounded"><FileText size={16}/></div>
                <div>
                    <h5 className="font-bold text-slate-800">كشف حساب (Account Statement)</h5>
                    <p className="text-xs text-slate-500">حركة تفصيلية لأي حساب (عميل، مورد، صندوق) خلال فترة.</p>
                </div>
            </div>
            <div className="flex gap-3 items-start">
                <div className="bg-slate-100 p-2 rounded"><Truck size={16}/></div>
                <div>
                    <h5 className="font-bold text-slate-800">تحليل ربحية المركبة</h5>
                    <p className="text-xs text-slate-500">مقارنة الإيرادات المحققة من التكليفات مقابل مصاريف الوقود والصيانة لنفس المركبة.</p>
                </div>
            </div>
        </div>
      </div>
    )
  }
];

const HelpModule: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState('');

  const activeTopic = HELP_TOPICS.find(t => t.id === selectedTopicId) || HELP_TOPICS[0];

  const filteredTopics = HELP_TOPICS.filter(t => 
    t.title.includes(searchQuery) || t.category.includes(searchQuery)
  );

  // Group by Category
  const groupedTopics: Record<string, typeof HELP_TOPICS> = {};
  filteredTopics.forEach(topic => {
    if (!groupedTopics[topic.category]) groupedTopics[topic.category] = [];
    groupedTopics[topic.category].push(topic);
  });

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 bg-slate-50/50">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        
        {/* Search Box */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <HelpCircle className="text-gold-500" /> مركز المساعدة
            </h2>
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="ابحث عن موضوع..." 
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-gold-500 transition-colors text-sm font-bold"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
        </div>

        {/* Topics List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 overflow-y-auto p-2">
            {Object.keys(groupedTopics).length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">لا توجد نتائج للبحث</div>
            ) : (
                Object.keys(groupedTopics).map(category => (
                    <div key={category} className="mb-4 last:mb-0">
                        <h4 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{category}</h4>
                        <div className="space-y-1">
                            {groupedTopics[category].map(topic => (
                                <button
                                    key={topic.id}
                                    onClick={() => setSelectedTopicId(topic.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-all duration-200 group ${selectedTopicId === topic.id ? 'bg-gold-50 text-gold-700 border border-gold-200 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
                                >
                                    <topic.icon size={18} className={selectedTopicId === topic.id ? 'text-gold-600' : 'text-slate-400 group-hover:text-slate-600'} />
                                    <span className="font-bold text-sm flex-1">{topic.title}</span>
                                    {selectedTopicId === topic.id && <ChevronRight size={14} className="text-gold-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Support Contact - UPDATED STYLE & EMAIL */}
        <div className="bg-white border-2 border-slate-200 p-4 rounded-xl text-center text-xs shadow-sm">
            <p className="mb-2 font-bold text-slate-900">هل تحتاج لمساعدة تقنية؟</p>
            <p className="text-slate-600">تواصل مع فريق الدعم الفني</p>
            <p className="font-mono mt-1 text-blue-600 font-bold">anwar@newabrad.com</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Header */}
          <div className="h-20 border-b border-slate-100 flex items-center px-8 bg-slate-50/50">
               <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm mr-4 ml-4">
                   <activeTopic.icon size={28} className="text-gold-500" />
               </div>
               <div>
                   <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-1">
                       <span>الدليل</span>
                       <ChevronRight size={12} />
                       <span>{activeTopic.category}</span>
                   </div>
                   <h1 className="text-2xl font-bold text-slate-800">{activeTopic.title}</h1>
               </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 text-base leading-relaxed text-slate-600">
               {activeTopic.content}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 bg-slate-50">
              <span>آخر تحديث: {new Date().toLocaleDateString('en-GB')}</span>
              <span>NewAbrad Documentation v1.0</span>
          </div>
      </div>

    </div>
  );
};

export default HelpModule;