import { JournalEntry, Account, Vehicle, AccountType, ModuleType, LogEntry, Employee, HRTransaction, SparePart, FuelRecord, MaintenanceRecord, Branch, Client, Contract, SystemConfig, Quotation, User, OperationalTask, VehicleStatus, FinancialYear, EmployeeStatus } from '../types';

// --- NODE.JS INTEGRATION FOR FILE SYSTEM ACCESS ---
let fs: any;
let path: any;
let dbPath: string;
let dataDir: string;

// Initialize File System Access
if (typeof window !== 'undefined' && (window as any).require) {
    try {
        fs = (window as any).require('fs');
        path = (window as any).require('path');
        const electron = (window as any).require('electron');
        
        const proc = process as any;
        const appPath = electron.remote ? electron.remote.app.getPath('exe') : (proc.execPath || (typeof proc.cwd === 'function' ? proc.cwd() : ''));
        
        const baseDir = path.dirname(appPath);
        dataDir = path.join(baseDir, 'NewAbrad_Account_Data');
        dbPath = path.join(dataDir, 'database.json');

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    } catch (e) {
        console.error("Could not load Node.js FS modules. Falling back to LocalStorage.", e);
    }
}

// --- MEMORY CACHE ---
let memoryCache: Record<string, any> = {};

const KEYS = {
  CONFIG: 'newabrad_config_v1',
  BRANCHES: 'newabrad_branches_v1',
  USERS: 'newabrad_users_v1',
  ACCOUNTS: 'newabrad_accounts_v4', // Updated to v4 for complete tree
  JOURNAL: 'newabrad_journal_v1',
  VEHICLES: 'newabrad_vehicles_v1',
  EMPLOYEES: 'newabrad_employees_v1',
  HR_TRANSACTIONS: 'newabrad_hr_transactions_v1',
  STORE_PARTS: 'newabrad_store_parts_v1',
  FLEET_FUEL: 'newabrad_fleet_fuel_v1',
  FLEET_MAINT: 'newabrad_fleet_maint_v1',
  CLIENTS: 'newabrad_clients_v1',
  CONTRACTS: 'newabrad_contracts_v1',
  TASKS: 'newabrad_tasks_v1',
  QUOTATIONS: 'newabrad_quotations_v1',
  FINANCIAL_YEARS: 'newabrad_fin_years_v1',
  LOGS: 'newabrad_logs_v1',
  INIT: 'newabrad_init_flag_v24', // Bumped to v24 for complete accounts tree
  CURRENT_USER: 'newabrad_session_user',
  COMPANY_INFO: 'newabrad_company_info_v1'
};

// --- COMPLETE ACCOUNTS TREE (FROM BACKUP FILE) ---
const SEED_ACCOUNTS: Account[] = [
  // ===== الأصول =====
  { "id": "1", "code": "1", "name": "الأصول", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "isLeaf": false, "description": "مجموع الأصول" },
  
  // الأصول المتداولة
  { "id": "11", "code": "11", "name": "أصول متداولة", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1", "isLeaf": false, "description": "الأصول التي يمكن تحويلها إلى نقد خلال سنة" },
  
  // النقدية وما في حكمها
  { "id": "1101", "code": "1101", "name": "النقدية وما في حكمها", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "11", "isLeaf": false, "description": "النقدية والسندات سريعة التحويل" },
  { "id": "110101", "code": "110101", "name": "النقدية في الخزينة", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1101", "isLeaf": true, "description": "النقدية المتوفرة في خزينة الشركة" },
  { "id": "110102", "code": "110102", "name": "العهد النقدية", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1101", "isLeaf": true, "description": "المبالغ المدفوعة مقدماً على شكل عهد" },
  { "id": "110103", "code": "110103", "name": "شيكات تحت التحصيل", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1101", "isLeaf": true, "description": "الشيكات المودعة ولم تحصل بعد" },
  
  // النقدية في البنوك
  { "id": "1102", "code": "1102", "name": "النقدية في البنوك", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "11", "isLeaf": false, "description": "جميع الحسابات البنكية" },
  { "id": "110201", "code": "110201", "name": "حساب البنك الجاري", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1102", "isLeaf": true, "description": "الحساب الجاري الرئيسي" },
  { "id": "110202", "code": "110202", "name": "حساب التوفير", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1102", "isLeaf": true, "description": "حساب التوفير" },
  { "id": "110203", "code": "110203", "name": "حساب ودائع", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1102", "isLeaf": true, "description": "الودائع البنكية" },
  
  // المدينون والذمم المدينة
  { "id": "1103", "code": "1103", "name": "المدينون والذمم المدينة", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "11", "isLeaf": false, "description": "المبالغ المستحقة على العملاء" },
  { "id": "110301", "code": "110301", "name": "عملاء محليون", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1103", "isLeaf": true, "description": "ذمم العملاء المحليين" },
  { "id": "110302", "code": "110302", "name": "عملاء أجانب", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1103", "isLeaf": true, "description": "ذمم العملاء الأجانب" },
  { "id": "110303", "code": "110303", "name": "مخصص ديون مشكوك في تحصيلها", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1103", "isLeaf": true, "description": "مخصص للديون التي قد لا تحصل" },
  
  // مصروفات مقدمة
  { "id": "1104", "code": "1104", "name": "مصروفات مقدمة", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "11", "isLeaf": false, "description": "المصروفات المدفوعة مقدماً" },
  { "id": "110401", "code": "110401", "name": "تأمين طبي مقدم", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1104", "isLeaf": true, "description": "أقساط التأمين الطبي المدفوعة مقدماً" },
  { "id": "110402", "code": "110402", "name": "إيجار مقدم", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1104", "isLeaf": true, "description": "الإيجارات المدفوعة مقدماً" },
  { "id": "110403", "code": "110403", "name": "اشتراكات مسبقة", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1104", "isLeaf": true, "description": "الاشتراكات السنوية المدفوعة مقدماً" },
  { "id": "110404", "code": "110404", "name": "إعلانات مسبقة الدفع", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1104", "isLeaf": true, "description": "مبالغ الإعلانات المدفوعة مقدماً" },
  
  // سلف موظفين
  { "id": "1105", "code": "1105", "name": "سلف موظفين", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "11", "isLeaf": false, "description": "السلف الممنوحة للموظفين" },
  { "id": "110501", "code": "110501", "name": "سلف علاجية", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1105", "isLeaf": true, "description": "سلف للعلاج الطبي" },
  { "id": "110502", "code": "110502", "name": "سلف سكنية", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1105", "isLeaf": true, "description": "سلف لشراء أو إيجار مساكن" },
  { "id": "110503", "code": "110503", "name": "سلف طارئة", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1105", "isLeaf": true, "description": "سلف للظروف الطارئة" },
  
  // المخزون
  { "id": "1106", "code": "1106", "name": "المخزون", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "11", "isLeaf": false, "description": "مخزون المواد والبضائع" },
  { "id": "110601", "code": "110601", "name": "مخزون قطع غيار", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1106", "isLeaf": true, "description": "قطع غيار المركبات" },
  { "id": "110602", "code": "110602", "name": "مخزون مواد مكتبية", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1106", "isLeaf": true, "description": "المواد المكتبية" },
  { "id": "110603", "code": "110603", "name": "مخزون وقود", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1106", "isLeaf": true, "description": "مخزون الوقود" },
  { "id": "110604", "code": "110604", "name": "مخزون زيوت وشحوم", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1106", "isLeaf": true, "description": "الزيوت والشحوم" },
  
  // استثمارات قصيرة الأجل
  { "id": "1107", "code": "1107", "name": "استثمارات قصيرة الأجل", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "11", "isLeaf": false, "description": "الاستثمارات القابلة للتحويل خلال سنة" },
  { "id": "110701", "code": "110701", "name": "أسهم وسندات قصيرة الأجل", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1107", "isLeaf": true, "description": "الاستثمارات في الأوراق المالية" },
  { "id": "110702", "code": "110702", "name": "ودائع قصيرة الأجل", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1107", "isLeaf": true, "description": "الودائع البنكية قصيرة الأجل" },
  
  // مصروفات مدفوعة مقدماً أخرى
  { "id": "1108", "code": "1108", "name": "مصروفات مدفوعة مقدماً أخرى", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "11", "isLeaf": false, "description": "مصروفات أخرى مدفوعة مقدماً" },
  { "id": "110801", "code": "110801", "name": "ضرائب مدفوعة مقدماً", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1108", "isLeaf": true, "description": "الضرائب المدفوعة مقدماً" },
  { "id": "110802", "code": "110802", "name": "رواتب مدفوعة مقدماً", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1108", "isLeaf": true, "description": "الرواتب المدفوعة مقدماً" },
  
  // ===== الأصول غير المتداولة =====
  { "id": "12", "code": "12", "name": "أصول غير متداولة", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1", "isLeaf": false, "description": "الأصول التي لا يمكن تحويلها خلال سنة" },
  
  // عقارات وآلات ومعدات
  { "id": "1201", "code": "1201", "name": "عقارات وآلات ومعدات", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "12", "isLeaf": false, "description": "الأصول الثابتة الملموسة" },
  { "id": "120101", "code": "120101", "name": "الأراضي", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1201", "isLeaf": true, "description": "قطع الأراضي المملوكة" },
  { "id": "120102", "code": "120102", "name": "المباني", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1201", "isLeaf": true, "description": "المباني والمقرات" },
  { "id": "120103", "code": "120103", "name": "المركبات والمعدات", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1201", "isLeaf": true, "description": "أسطول المركبات والمعدات" },
  { "id": "120104", "code": "120104", "name": "أجهزة مكتبية وطابعات", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1201", "isLeaf": true, "description": "الأجهزة المكتبية" },
  { "id": "120105", "code": "120105", "name": "معدات ووسائل نقل", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1201", "isLeaf": true, "description": "معدات النقل والشحن" },
  { "id": "120106", "code": "120106", "name": "أثاث ومفروشات", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1201", "isLeaf": true, "description": "الأثاث المكتبي" },
  { "id": "120107", "code": "120107", "name": "معدات اتصالات", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1201", "isLeaf": true, "description": "أجهزة الاتصالات" },
  
  // أصول غير ملموسة
  { "id": "1202", "code": "1202", "name": "أصول غير ملموسة", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "12", "isLeaf": false, "description": "الأصول غير المادية" },
  { "id": "120201", "code": "120201", "name": "الشهرة", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1202", "isLeaf": true, "description": "شهرة المحل" },
  { "id": "120202", "code": "120202", "name": "براءات الاختراع", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1202", "isLeaf": true, "description": "براءات الاختراع المسجلة" },
  { "id": "120203", "code": "120203", "name": "العلامات التجارية", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1202", "isLeaf": true, "description": "العلامات التجارية المسجلة" },
  { "id": "120204", "code": "120204", "name": "التراخيص والامتيازات", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1202", "isLeaf": true, "description": "التراخيص والامتيازات التجارية" },
  
  // العقارات الاستثمارية
  { "id": "1203", "code": "1203", "name": "العقارات الاستثمارية", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "12", "isLeaf": false, "description": "العقارات المخصصة للإيجار أو الاستثمار" },
  { "id": "120301", "code": "120301", "name": "عقارات للإيجار", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1203", "isLeaf": true, "description": "العقارات المخصصة للإيجار" },
  { "id": "120302", "code": "120302", "name": "أراضي استثمارية", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1203", "isLeaf": true, "description": "الأراضي المخصصة للاستثمار" },
  
  // الاستثمارات طويلة الأجل
  { "id": "1204", "code": "1204", "name": "استثمارات طويلة الأجل", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "12", "isLeaf": false, "description": "الاستثمارات لمدة تزيد عن سنة" },
  { "id": "120401", "code": "120401", "name": "استثمارات في شركات أخرى", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1204", "isLeaf": true, "description": "الاستثمارات في الشركات التابعة" },
  { "id": "120402", "code": "120402", "name": "سندات طويلة الأجل", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1204", "isLeaf": true, "description": "السندات الحكومية والشركات" },
  
  // ===== الالتزامات =====
  { "id": "2", "code": "2", "name": "الالتزامات", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "isLeaf": false, "description": "مجموع الالتزامات" },
  
  // الالتزامات المتداولة
  { "id": "21", "code": "21", "name": "الالتزامات المتداولة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2", "isLeaf": false, "description": "الديون المستحقة خلال سنة" },
  
  // الدائنون
  { "id": "2101", "code": "2101", "name": "الدائنون والذمم الدائنة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "21", "isLeaf": false, "description": "المبالغ المستحقة للموردين" },
  { "id": "210101", "code": "210101", "name": "موردون محليون", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2101", "isLeaf": true, "description": "ذمم الموردين المحليين" },
  { "id": "210102", "code": "210102", "name": "موردون أجانب", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2101", "isLeaf": true, "description": "ذمم الموردين الأجانب" },
  
  // مصروفات مستحقة
  { "id": "2102", "code": "2102", "name": "مصروفات مستحقة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "21", "isLeaf": false, "description": "المصروفات المستحقة الدفع" },
  { "id": "210201", "code": "210201", "name": "كهرباء وماء مستحقة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2102", "isLeaf": true, "description": "فواتير الكهرباء والماء" },
  { "id": "210202", "code": "210202", "name": "اتصالات مستحقة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2102", "isLeaf": true, "description": "فواتير الاتصالات" },
  { "id": "210203", "code": "210203", "name": "إيجار مستحق", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2102", "isLeaf": true, "description": "الإيجارات المستحقة" },
  
  // الرواتب المستحقة
  { "id": "2103", "code": "2103", "name": "الرواتب والمزايا المستحقة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "21", "isLeaf": false, "description": "الرواتب والمزايا المستحقة للموظفين" },
  { "id": "210301", "code": "210301", "name": "رواتب أساسية مستحقة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2103", "isLeaf": true, "description": "الرواتب الأساسية" },
  { "id": "210302", "code": "210302", "name": "بدلات سفر ومكافآت مستحقة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2103", "isLeaf": true, "description": "بدلات السفر والمكافآت" },
  { "id": "210303", "code": "210303", "name": "أجور إضافية مستحقة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2103", "isLeaf": true, "description": "الأجور الإضافية" },
  
  // قروض قصيرة الأجل
  { "id": "2104", "code": "2104", "name": "قروض قصيرة الأجل", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "21", "isLeaf": false, "description": "القروض المستحقة خلال سنة" },
  { "id": "210401", "code": "210401", "name": "قروض بنكية قصيرة الأجل", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2104", "isLeaf": true, "description": "القروض البنكية قصيرة الأجل" },
  { "id": "210402", "code": "210402", "name": "سندات دفع قصيرة الأجل", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2104", "isLeaf": true, "description": "سندات الدفع قصيرة الأجل" },
  
  // الضرائب المستحقة
  { "id": "2105", "code": "2105", "name": "الضرائب والرسوم المستحقة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "21", "isLeaf": false, "description": "الضرائب والرسوم المستحقة للحكومة" },
  { "id": "210501", "code": "210501", "name": "ضريبة دخل مستحقة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2105", "isLeaf": true, "description": "ضريبة الدخل" },
  { "id": "210502", "code": "210502", "name": "ضريبة مبيعات مستحقة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2105", "isLeaf": true, "description": "ضريبة المبيعات" },
  { "id": "210503", "code": "210503", "name": "رسوم بلدية مستحقة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2105", "isLeaf": true, "description": "الرسوم البلدية" },
  
  // إيرادات غير مكتسبة
  { "id": "2106", "code": "2106", "name": "إيرادات غير مكتسبة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "21", "isLeaf": false, "description": "الإيرادات المقبوضة مقدماً" },
  { "id": "210601", "code": "210601", "name": "إيجارات مقبوضة مقدماً", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2106", "isLeaf": true, "description": "الإيجارات المقبوضة مقدماً" },
  { "id": "210602", "code": "210602", "name": "اشتراكات مقبوضة مقدماً", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2106", "isLeaf": true, "description": "الاشتراكات المقبوضة مقدماً" },
  
  // مستحقات التأمينات الاجتماعية
  { "id": "2107", "code": "2107", "name": "مستحقات التأمينات الاجتماعية", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "21", "isLeaf": false, "description": "مستحقات التأمين الاجتماعي" },
  { "id": "210701", "code": "210701", "name": "تأمين صحي مستحق", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2107", "isLeaf": true, "description": "أقساط التأمين الصحي" },
  { "id": "210702", "code": "210702", "name": "تأمين تقاعد مستحق", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2107", "isLeaf": true, "description": "أقساط تأمين التقاعد" },
  
  // مجمع الاستهلاك
  { "id": "2108", "code": "2108", "name": "مجمع الاستهلاك", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "21", "isLeaf": false, "description": "مجمع استهلاك الأصول" },
  { "id": "210801", "code": "210801", "name": "مجمع استهلاك المباني", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2108", "isLeaf": true, "description": "استهلاك المباني" },
  { "id": "210802", "code": "210802", "name": "مجمع استهلاك المعدات", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2108", "isLeaf": true, "description": "استهلاك المعدات" },
  { "id": "210803", "code": "210803", "name": "مجمع استهلاك المركبات", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2108", "isLeaf": true, "description": "استهلاك المركبات" },
  { "id": "210804", "code": "210804", "name": "مجمع استهلاك الأثاث", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2108", "isLeaf": true, "description": "استهلاك الأثاث" },
  
  // ===== الالتزامات غير المتداولة =====
  { "id": "22", "code": "22", "name": "الالتزامات غير المتداولة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2", "isLeaf": false, "description": "الديون المستحقة بعد سنة" },
  
  // قروض طويلة الأجل
  { "id": "2201", "code": "2201", "name": "قروض طويلة الأجل", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "22", "isLeaf": false, "description": "القروض المستحقة بعد سنة" },
  { "id": "220101", "code": "220101", "name": "قروض بنكية طويلة الأجل", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2201", "isLeaf": true, "description": "القروض البنكية طويلة الأجل" },
  { "id": "220102", "code": "220102", "name": "سندات دفع طويلة الأجل", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2201", "isLeaf": true, "description": "سندات الدفع طويلة الأجل" },
  
  // مخصص مكافأة نهاية الخدمة
  { "id": "2202", "code": "2202", "name": "مخصص مكافأة نهاية الخدمة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "22", "isLeaf": false, "description": "مخصص لمكافآت نهاية الخدمة" },
  { "id": "220201", "code": "220201", "name": "مخصص مكافأة موظفين دائمين", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2202", "isLeaf": true, "description": "مكافأة نهاية خدمة الموظفين الدائمين" },
  { "id": "220202", "code": "220202", "name": "مخصص مكافأة موظفين متعاقدين", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2202", "isLeaf": true, "description": "مكافأة نهاية خدمة المتعاقدين" },
  
  // ===== حقوق الملكية =====
  { "id": "3", "code": "3", "name": "حقوق الملكية", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "isLeaf": false, "description": "حقوق المالكين في الشركة" },
  
  // رأس المال
  { "id": "31", "code": "31", "name": "رأس المال", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "3", "isLeaf": false, "description": "رأس مال الشركة" },
  { "id": "3101", "code": "3101", "name": "رأس المال المسجل", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "31", "isLeaf": true, "description": "رأس المال المسجل رسمياً" },
  { "id": "3102", "code": "3102", "name": "رأس المال الإضافي المدفوع", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "31", "isLeaf": true, "description": "رأس المال الإضافي" },
  { "id": "3103", "code": "3103", "name": "رأس مال مجاني", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "31", "isLeaf": true, "description": "رأس المال المجاني" },
  
  // حقوق ملكية أخرى
  { "id": "32", "code": "32", "name": "حقوق ملكية أخرى", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "3", "isLeaf": false, "description": "حقوق الملكية الإضافية" },
  { "id": "3201", "code": "3201", "name": "أرصدة افتتاحية", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "32", "isLeaf": true, "description": "الأرصدة الافتتاحية" },
  { "id": "3202", "code": "3202", "name": "تعديلات رأسمالية", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "32", "isLeaf": true, "description": "التعديلات على رأس المال" },
  
  // احتياطيات
  { "id": "33", "code": "33", "name": "احتياطيات", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "3", "isLeaf": false, "description": "الاحتياطيات المالية" },
  { "id": "3301", "code": "3301", "name": "احتياطي نظامي", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "33", "isLeaf": true, "description": "الاحتياطي النظامي" },
  { "id": "3302", "code": "3302", "name": "احتياطي عام", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "33", "isLeaf": true, "description": "الاحتياطي العام" },
  { "id": "3303", "code": "3303", "name": "احتياطي خاص", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "33", "isLeaf": true, "description": "الاحتياطي الخاص" },
  { "id": "3304", "code": "3304", "name": "احتياطي إعادة تقييم", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "33", "isLeaf": true, "description": "احتياطي إعادة التقييم" },
  
  // أرباح/خسائر مبقاة
  { "id": "34", "code": "34", "name": "أرباح/خسائر مبقاة", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "3", "isLeaf": false, "description": "الأرباح والخسائر المحتجزة" },
  { "id": "3401", "code": "3401", "name": "الأرباح والخسائر المرحلة", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "34", "isLeaf": true, "description": "الأرباح والخسائر المرحلة" },
  { "id": "3402", "code": "3402", "name": "الأرباح المبقاة", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "34", "isLeaf": true, "description": "الأرباح المحتجزة" },
  { "id": "3403", "code": "3403", "name": "خسائر متراكمة", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "34", "isLeaf": true, "description": "الخسائر المتراكمة" },
  
  // ===== الإيرادات =====
  { "id": "4", "code": "4", "name": "الإيرادات", "type": AccountType.REVENUE, "balance": 0, "currency": "USD", "isLeaf": false, "description": "إيرادات الشركة" },
  
  // الإيرادات التشغيلية
  { "id": "41", "code": "41", "name": "الإيرادات التشغيلية", "type": AccountType.REVENUE, "balance": 0, "currency": "USD", "parentId": "4", "isLeaf": false, "description": "الإيرادات من النشاط الرئيسي" },
  { "id": "4101", "code": "4101", "name": "إيرادات تأجير المركبات", "type": AccountType.REVENUE, "balance": 0, "currency": "USD", "parentId": "41", "isLeaf": true, "description": "إيرادات تأجير السيارات" },
  { "id": "4102", "code": "4102", "name": "إيرادات النقل والخدمات اللوجستية", "type": AccountType.REVENUE, "balance": 0, "currency": "USD", "parentId": "41", "isLeaf": true, "description": "إيرادات خدمات النقل" },
  { "id": "4103", "code": "4103", "name": "إيرادات الشحن والتخليص", "type": AccountType.REVENUE, "balance": 0, "currency": "USD", "parentId": "41", "isLeaf": true, "description": "إيرادات الشحن الجمركي" },
  { "id": "4104", "code": "4104", "name": "إيرادات الصيانة والإصلاح", "type": AccountType.REVENUE, "balance": 0, "currency": "USD", "parentId": "41", "isLeaf": true, "description": "إيرادات ورش الصيانة" },
  { "id": "4105", "code": "4105", "name": "إيرادات بيع قطع الغيار", "type": AccountType.REVENUE, "balance": 0, "currency": "USD", "parentId": "41", "isLeaf": true, "description": "إيرادات بيع قطع الغيار" },
  
  // الإيرادات غير التشغيلية
  { "id": "42", "code": "42", "name": "الإيرادات غير التشغيلية", "type": AccountType.REVENUE, "balance": 0, "currency": "USD", "parentId": "4", "isLeaf": false, "description": "الإيرادات من مصادر غير رئيسية" },
  { "id": "4201", "code": "4201", "name": "إيرادات استثمارية", "type": AccountType.REVENUE, "balance": 0, "currency": "USD", "parentId": "42", "isLeaf": true, "description": "إيرادات الاستثمارات" },
  { "id": "4202", "code": "4202", "name": "إيرادات فوائد بنكية", "type": AccountType.REVENUE, "balance": 0, "currency": "USD", "parentId": "42", "isLeaf": true, "description": "فوائد الودائع البنكية" },
  { "id": "4203", "code": "4203", "name": "إيرادات عقارية", "type": AccountType.REVENUE, "balance": 0, "currency": "USD", "parentId": "42", "isLeaf": true, "description": "إيرادات تأجير العقارات" },
  { "id": "4204", "code": "4204", "name": "إيرادات متنوعة", "type": AccountType.REVENUE, "balance": 0, "currency": "USD", "parentId": "42", "isLeaf": true, "description": "إيرادات متنوعة أخرى" },
  
  // ===== المصاريف =====
  { "id": "5", "code": "5", "name": "المصاريف", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "isLeaf": false, "description": "مصاريف الشركة" },
  
  // التكلفة المباشرة
  { "id": "51", "code": "51", "name": "التكلفة المباشرة", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "5", "isLeaf": false, "description": "التكاليف المباشرة للإنتاج" },
  { "id": "5101", "code": "5101", "name": "تكلفة الوقود", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "51", "isLeaf": true, "description": "تكلفة وقود المركبات" },
  { "id": "5102", "code": "5102", "name": "تكلفة قطع الغيار", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "51", "isLeaf": true, "description": "تكلفة قطع الغيار" },
  { "id": "5103", "code": "5103", "name": "تكلفة الصيانة والإصلاح", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "51", "isLeaf": true, "description": "تكلفة صيانة المركبات" },
  { "id": "5104", "code": "5104", "name": "تكلفة الرواتب التشغيلية", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "51", "isLeaf": true, "description": "رواتب السائقين والعاملين" },
  { "id": "5105", "code": "5105", "name": "تكلفة التأمين على المركبات", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "51", "isLeaf": true, "description": "أقساط تأمين المركبات" },
  
  // التكاليف التشغيلية
  { "id": "52", "code": "52", "name": "التكاليف التشغيلية", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "5", "isLeaf": false, "description": "التكاليف الإدارية والتشغيلية" },
  { "id": "5201", "code": "5201", "name": "الرواتب والمرتبات الإدارية", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true, "description": "رواتب الموظفين الإداريين" },
  { "id": "5202", "code": "5202", "name": "تأمين صحي للموظفين", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true, "description": "أقساط التأمين الصحي" },
  { "id": "5203", "code": "5203", "name": "مصاريف تسويقية ودعائية", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true, "description": "مصاريف التسويق والإعلان" },
  { "id": "5204", "code": "5204", "name": "مصاريف إيجار المباني", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true, "description": "إيجار المقرات والمكاتب" },
  { "id": "5205", "code": "5205", "name": "مصاريف كهرباء وماء واتصالات", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true, "description": "فواتير الخدمات" },
  { "id": "5206", "code": "5206", "name": "مصاريف نقل ومواصلات", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true, "description": "مصاريف النقل والتنقل" },
  { "id": "5207", "code": "5207", "name": "مصاريف قرطاسية ومطبوعات", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true, "description": "مصاريف المواد المكتبية" },
  { "id": "5208", "code": "5208", "name": "مصاريف صيانة المباني", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true, "description": "صيانة المقرات والمباني" },
  { "id": "5209", "code": "5209", "name": "مصاريف تدريب وتطوير", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true, "description": "مصاريف التدريب والتطوير" },
  { "id": "5210", "code": "5210", "name": "مصاريف بنكية ومالية", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true, "description": "العمولات والرسوم البنكية" },
  { "id": "5211", "code": "5211", "name": "مصاريف قانونية واستشارية", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true, "description": "مصاريف المحامين والمستشارين" },
  { "id": "5212", "code": "5212", "name": "مصاريف تأمين متنوعة", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true, "description": "أقساط التأمينات المختلفة" },
  { "id": "5213", "code": "5213", "name": "مصاريف إهلاك واستهلاك", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": false, "description": "مصاريف إهلاك الأصول" },
  { "id": "521301", "code": "521301", "name": "إهلاك المباني", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "5213", "isLeaf": true, "description": "إهلاك المباني" },
  { "id": "521302", "code": "521302", "name": "إهلاك المعدات", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "5213", "isLeaf": true, "description": "إهلاك المعدات" },
  { "id": "521303", "code": "521303", "name": "إهلاك المركبات", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "5213", "isLeaf": true, "description": "إهلاك المركبات" },
  { "id": "521304", "code": "521304", "name": "إهلاك الأثاث", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "5213", "isLeaf": true, "description": "إهلاك الأثاث" },
  { "id": "5214", "code": "5214", "name": "مصاريف ضيافة وترفيه", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true, "description": "مصاريف الضيافة والترفيه" },
  { "id": "5215", "code": "5215", "name": "مصاريف متنوعة", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true, "description": "مصاريف متنوعة أخرى" },
  
  // مصاريف غير تشغيلية
  { "id": "53", "code": "53", "name": "مصاريف غير تشغيلية", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "5", "isLeaf": false, "description": "المصاريف غير المرتبطة بالنشاط الرئيسي" },
  { "id": "5301", "code": "5301", "name": "مصاريف فوائد القروض", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "53", "isLeaf": true, "description": "فوائد القروض البنكية" },
  { "id": "5302", "code": "5302", "name": "مصاريف خسائر صرف العملات", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "53", "isLeaf": true, "description": "خسائر تبادل العملات" },
  { "id": "5303", "code": "5303", "name": "مصاريف تأمينات متنوعة", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "53", "isLeaf": true, "description": "أقساط التأمينات الإضافية" },
  { "id": "5304", "code": "5304", "name": "مصاريف ضرائب متنوعة", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "53", "isLeaf": true, "description": "ضرائب متنوعة" }
];

// Updated SEED_EMPLOYEES with more details
const SEED_EMPLOYEES: Employee[] = [
  { 
      id: 'DRV001', 
      fullName: 'صالح محمد صالح جلال', 
      position: 'سائق', 
      department: 'العمليات', 
      hireDate: '2023-01-01', 
      basicSalary: 250000, 
      currency: 'YER', 
      status: EmployeeStatus.ACTIVE, 
      phone: '777000001', 
      idNumber: '0101010101',
      licenseNumber: 'LIC-1001', 
      licenseExpiry: '2026-05-20',
      address: 'صنعاء - شارع الزبيري',
      email: 'driver1@newabrad.com',
      emergencyContact: '777111111',
      bankAccount: '1234567890',
      notes: 'سائق متميز - خبرة 5 سنوات'
  },
  { 
      id: 'DRV002', 
      fullName: 'محمد احمد الروساء', 
      position: 'سائق', 
      department: 'العمليات', 
      hireDate: '2023-02-15', 
      basicSalary: 250000, 
      currency: 'YER', 
      status: EmployeeStatus.ACTIVE, 
      phone: '777000002', 
      idNumber: '0202020202',
      licenseNumber: 'LIC-1002', 
      licenseExpiry: '2025-11-10',
      address: 'صنعاء - حي التحرير',
      email: 'driver2@newabrad.com',
      emergencyContact: '777222222',
      bankAccount: '2345678901',
      notes: 'سائق شاحنات ثقيلة'
  },
  { 
      id: 'DRV003', 
      fullName: 'حمد حسن فرحان', 
      position: 'سائق', 
      department: 'العمليات', 
      hireDate: '2023-03-10', 
      basicSalary: 250000, 
      currency: 'YER', 
      status: EmployeeStatus.ACTIVE, 
      phone: '777000003', 
      idNumber: '0303030303',
      licenseNumber: 'LIC-1003', 
      licenseExpiry: '2026-06-15',
      address: 'تعز - حي القاهرة',
      email: 'driver3@newabrad.com',
      emergencyContact: '777333333',
      bankAccount: '3456789012',
      notes: 'سابقاً في شركة نقل بضائع'
  },
  { 
      id: 'DRV004', 
      fullName: 'احمد محسن حمد الشريف', 
      position: 'سائق', 
      department: 'العمليات', 
      hireDate: '2023-01-20', 
      basicSalary: 250000, 
      currency: 'YER', 
      status: EmployeeStatus.ACTIVE, 
      phone: '777000004', 
      idNumber: '0404040404',
      licenseNumber: 'LIC-1004', 
      licenseExpiry: '2025-12-30',
      address: 'عدن - خورمكسر',
      email: 'driver4@newabrad.com',
      emergencyContact: '777444444',
      bankAccount: '4567890123',
      notes: 'يتمتع بشهادة سائق مهني'
  },
  { 
      id: 'ADM001', 
      fullName: 'علي عبدالله محمد', 
      position: 'مدير العمليات', 
      department: 'الإدارة', 
      hireDate: '2022-06-01', 
      basicSalary: 500000, 
      currency: 'YER', 
      status: EmployeeStatus.ACTIVE, 
      phone: '777555555', 
      idNumber: '0505050505',
      licenseNumber: 'LIC-2001', 
      licenseExpiry: '2027-01-15',
      address: 'صنعاء - حي السبعين',
      email: 'operations@newabrad.com',
      emergencyContact: '777666666',
      bankAccount: '5678901234',
      notes: 'خبرة 10 سنوات في إدارة الأساطيل'
  },
  { 
      id: 'ACC001', 
      fullName: 'فاطمة محمد عبدالرحمن', 
      position: 'محاسب', 
      department: 'المالية', 
      hireDate: '2023-04-01', 
      basicSalary: 350000, 
      currency: 'YER', 
      status: EmployeeStatus.ACTIVE, 
      phone: '777777777', 
      idNumber: '0606060606',
      licenseNumber: '', 
      licenseExpiry: '',
      address: 'صنعاء - حي الوحدة',
      email: 'accounting@newabrad.com',
      emergencyContact: '777888888',
      bankAccount: '6789012345',
      notes: 'خريجة كلية التجارة - قسم المحاسبة'
  }
];

export const StorageService = {
  // --- INTERNAL: LOAD/SAVE TO FILE ---
  _loadFromFile: () => {
      if (fs && dbPath && fs.existsSync(dbPath)) {
          try {
              const data = fs.readFileSync(dbPath, 'utf-8');
              memoryCache = JSON.parse(data);
          } catch (e) {
              console.error("Failed to read database file", e);
              memoryCache = {}; // Fallback
          }
      }
  },

  _saveToFile: () => {
      if (fs && dbPath) {
          try {
              fs.writeFileSync(dbPath, JSON.stringify(memoryCache, null, 2), 'utf-8');
          } catch (e) {
              console.error("Failed to write database file", e);
          }
      }
  },

  get: <T>(key: string): T[] => {
    // 1. Try Memory Cache
    if (memoryCache[key]) return memoryCache[key];

    // 2. Try LocalStorage (Fallback / Legacy)
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },

  save: <T>(key: string, data: T[]): void => {
    // 1. Update Memory
    memoryCache[key] = data;
    
    // 2. Write to File (Primary)
    StorageService._saveToFile();

    // 3. Write to LocalStorage (Backup/Compatibility)
    localStorage.setItem(key, JSON.stringify(data));
  },

  getSingle: <T>(key: string): T | null => {
    if (memoryCache[key]) return memoryCache[key];
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  },

  saveSingle: <T>(key: string, data: T): void => {
    memoryCache[key] = data;
    StorageService._saveToFile();
    localStorage.setItem(key, JSON.stringify(data));
  },

  getDatabasePath: (): string => {
      return dbPath || 'LocalStorage (Browser Cache)';
  },

  getConfig: (): SystemConfig | null => StorageService.getSingle(KEYS.CONFIG),
  saveConfig: (config: SystemConfig) => StorageService.saveSingle(KEYS.CONFIG, config),

  getCompanyInfo: (): any => StorageService.getSingle(KEYS.COMPANY_INFO),
  saveCompanyInfo: (info: any) => StorageService.saveSingle(KEYS.COMPANY_INFO, info),

  init: () => {
    // Load from file on startup
    StorageService._loadFromFile();

    const currentVersion = localStorage.getItem(KEYS.INIT);
    if (currentVersion !== 'v24') {
      console.log('Initializing complete accounts tree (v24)...');
      StorageService.save(KEYS.ACCOUNTS, SEED_ACCOUNTS);
      StorageService.save(KEYS.EMPLOYEES, SEED_EMPLOYEES);
      
      // Initialize default company info
      const defaultCompanyInfo = {
        name: 'شركة نيو ابراد',
        tradeName: 'NewAbrad',
        address: 'صنعاء - اليمن',
        phone: '017777777',
        email: 'info@newabrad.com',
        taxNumber: '123456789',
        commercialRegister: '987654321',
        logo: '',
        establishedDate: '2020-01-01',
        currency: 'YER',
        fiscalYearStart: '01-01',
        fiscalYearEnd: '12-31'
      };
      StorageService.saveCompanyInfo(defaultCompanyInfo);
      
      localStorage.setItem(KEYS.INIT, 'v24');
    }
  },

  resetAccountsToDefault: (): Account[] => {
      StorageService.save(KEYS.ACCOUNTS, SEED_ACCOUNTS);
      return SEED_ACCOUNTS;
  },

  // --- NEW: COMPLETE ACCOUNTS TREE MANAGEMENT ---
  getAccountTree: (): Account[] => {
    const accounts = StorageService.getAccounts();
    return this.buildAccountTree(accounts);
  },

  buildAccountTree: (accounts: Account[]): Account[] => {
    const accountMap = new Map<string, Account & { children?: Account[] }>();
    
    // Create map and initialize children arrays
    accounts.forEach(account => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    // Build tree structure
    const tree: Account[] = [];
    accountMap.forEach(account => {
      if (account.parentId) {
        const parent = accountMap.get(account.parentId);
        if (parent && parent.children) {
          parent.children.push(account);
        }
      } else {
        tree.push(account);
      }
    });

    // Sort tree by code
    const sortAccounts = (accounts: Account[]): Account[] => {
      return accounts.sort((a, b) => a.code.localeCompare(b.code)).map(acc => {
        if ((acc as any).children) {
          (acc as any).children = sortAccounts((acc as any).children);
        }
        return acc;
      });
    };

    return sortAccounts(tree);
  },

  getAccountByCode: (code: string): Account | undefined => {
    const accounts = StorageService.getAccounts();
    return accounts.find(acc => acc.code === code);
  },

  getChildAccounts: (parentId: string): Account[] => {
    const accounts = StorageService.getAccounts();
    return accounts.filter(acc => acc.parentId === parentId);
  },

  getLeafAccounts: (): Account[] => {
    const accounts = StorageService.getAccounts();
    return accounts.filter(acc => acc.isLeaf);
  },

  getAccountsByType: (type: AccountType): Account[] => {
    const accounts = StorageService.getAccounts();
    return accounts.filter(acc => acc.type === type);
  },

  // --- BULK IMPORT FOR PERFORMANCE ---
  importAccounts: (newAccounts: Account[]): { added: number, updated: number } => {
      const currentAccounts = StorageService.get<Account>(KEYS.ACCOUNTS);
      
      const accountMap = new Map(currentAccounts.map(a => [a.code, a]));
      let added = 0;
      let updated = 0;

      newAccounts.forEach(acc => {
          if (accountMap.has(acc.code)) {
              // Merge Update: Keep existing ID to maintain relationships
              const existing = accountMap.get(acc.code)!;
              accountMap.set(acc.code, { 
                ...existing, 
                ...acc, 
                id: existing.id,
                balance: existing.balance // Preserve existing balance
              });
              updated++;
          } else {
              // Insert New with generated ID if missing
              if (!acc.id) {
                acc.id = `ACC${Date.now()}${Math.floor(Math.random() * 1000)}`;
              }
              accountMap.set(acc.code, acc);
              added++;
          }
      });

      // Convert back to array
      const mergedList = Array.from(accountMap.values());
      StorageService.save(KEYS.ACCOUNTS, mergedList);
      
      return { added, updated };
  },

  // --- BACKUP & RESTORE ---
  createBackup: (): string => {
    if (fs && dbPath) {
        StorageService._loadFromFile();
        const backup = { ...memoryCache };
        backup['meta'] = { 
          date: new Date().toISOString(), 
          version: '2.0.0', 
          appName: 'NewAbrad Account ERP', 
          createdAt: new Date().toLocaleString('ar-YE'), 
          source: 'FileSystem',
          accountsCount: (backup[KEYS.ACCOUNTS] || []).length,
          employeesCount: (backup[KEYS.EMPLOYEES] || []).length,
          journalEntriesCount: (backup[KEYS.JOURNAL] || []).length
        };
        return JSON.stringify(backup, null, 2);
    }
    const backup: Record<string, any> = {};
    Object.values(KEYS).forEach(key => {
      const value = localStorage.getItem(key);
      if (value) { 
        try { 
          backup[key] = JSON.parse(value); 
        } catch (e) { 
          console.warn(`Failed to parse key ${key}`); 
        } 
      }
    });
    backup['meta'] = { 
      date: new Date().toISOString(), 
      version: '2.0.0', 
      appName: 'NewAbrad Account ERP', 
      createdAt: new Date().toLocaleString('ar-YE'),
      accountsCount: (backup[KEYS.ACCOUNTS] || []).length,
      employeesCount: (backup[KEYS.EMPLOYEES] || []).length,
      journalEntriesCount: (backup[KEYS.JOURNAL] || []).length
    };
    return JSON.stringify(backup, null, 2);
  },

  restoreBackup: (jsonString: string): { success: boolean, message: string } => {
    try {
        const backup = JSON.parse(jsonString);
        if (!backup.meta || !backup.meta.appName.includes('NewAbrad')) {
          throw new Error("ملف النسخة الاحتياطية غير صالح لهذا النظام");
        }
        
        // Clear existing data
        memoryCache = {};
        localStorage.clear();
        
        // Restore all keys except meta
        Object.keys(backup).forEach(key => { 
          if (key !== 'meta') { 
            memoryCache[key] = backup[key]; 
            localStorage.setItem(key, JSON.stringify(backup[key])); 
          } 
        });
        
        // Save to file if available
        StorageService._saveToFile();
        
        return { 
          success: true, 
          message: `تم استعادة النسخة الاحتياطية بنجاح. ${backup.meta.accountsCount || 0} حساب، ${backup.meta.employeesCount || 0} موظف` 
        };
    } catch (e) { 
        console.error("Restore failed:", e);
        return { 
          success: false, 
          message: `فشل استعادة النسخة الاحتياطية: ${e.message}` 
        };
    }
  },

  // --- GETTERS & SETTERS (Passthrough) ---
  // [بقية الدوال تبقى كما هي بدون تغيير]
  getUsers: (): User[] => StorageService.get(KEYS.USERS),
  saveUser: (user: User) => {
    const users = StorageService.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user; else users.push(user);
    StorageService.save(KEYS.USERS, users);
  },
  deleteUser: (id: string) => {
    const users = StorageService.getUsers().filter(u => u.id !== id);
    StorageService.save(KEYS.USERS, users);
  },
  getCurrentUser: (): User | null => StorageService.getSingle(KEYS.CURRENT_USER),
  setCurrentUser: (user: User | null) => {
      if(user) StorageService.saveSingle(KEYS.CURRENT_USER, user);
      else { delete memoryCache[KEYS.CURRENT_USER]; StorageService._saveToFile(); localStorage.removeItem(KEYS.CURRENT_USER); }
  },

  getBranches: (): Branch[] => StorageService.get(KEYS.BRANCHES),
  saveBranch: (branch: Branch) => {
    const list = StorageService.getBranches();
    const idx = list.findIndex(x => x.id === branch.id);
    if(idx >= 0) list[idx] = branch; else list.push(branch);
    StorageService.save(KEYS.BRANCHES, list);
  },

  getFinancialYears: (): FinancialYear[] => StorageService.get(KEYS.FINANCIAL_YEARS),
  saveFinancialYear: (year: FinancialYear) => {
    const list = StorageService.getFinancialYears();
    if (year.isCurrent) list.forEach(y => y.isCurrent = false);
    const idx = list.findIndex(y => y.id === year.id);
    if(idx >= 0) list[idx] = year; else list.push(year);
    StorageService.save(KEYS.FINANCIAL_YEARS, list);
  },

  getClients: (): Client[] => StorageService.get(KEYS.CLIENTS),
  saveClient: (client: Client) => {
    const list = StorageService.getClients();
    const idx = list.findIndex(x => x.id === client.id);
    if (!client.receivableAccountId) {
        const parentAcc = StorageService.getAccounts().find(a => a.code === '1103');
        if(parentAcc) {
            const newAcc: Account = { 
              id: `CLI${Date.now()}`, 
              code: `1103${list.length + 1}`, 
              name: `ذمم ${client.name}`, 
              type: AccountType.ASSET, 
              balance: 0, 
              currency: 'YER', 
              parentId: parentAcc.id, 
              isLeaf: true,
              description: `حساب ذمم العميل ${client.name}`
            };
            StorageService.saveAccount(newAcc);
            client.receivableAccountId = newAcc.id;
        }
    }
    if(idx >= 0) list[idx] = client; else list.push(client);
    StorageService.save(KEYS.CLIENTS, list);
  },

  getContracts: (): Contract[] => StorageService.get(KEYS.CONTRACTS),
  saveContract: (contract: Contract) => {
    const list = StorageService.getContracts();
    const idx = list.findIndex(x => x.id === contract.id);
    if(idx >= 0) list[idx] = contract; else list.push(contract);
    StorageService.save(KEYS.CONTRACTS, list);
  },

  getTasks: (): OperationalTask[] => StorageService.get(KEYS.TASKS),
  
  saveTask: (task: OperationalTask) => {
      if(!task.clientId || !task.vehicleId || !task.revenue) throw new Error("بيانات التكليف ناقصة");
      const list = StorageService.getTasks();
      const client = StorageService.getClients().find(c => c.id === task.clientId);
      if(!client || !client.receivableAccountId) throw new Error("حساب العميل غير موجود");
      const revenueAcc = StorageService.getAccounts().find(a => a.code === '4101'); 
      if(!revenueAcc) throw new Error("حساب الإيرادات (4101) غير مهيأ");

      const je: JournalEntry = {
          id: `J${Date.now()}`,
          date: task.date,
          reference: task.reference,
          description: `استحقاق تكليف رقم ${task.reference} - خط سير ${task.route}`,
          status: 'POSTED',
          moduleId: ModuleType.TASKS,
          branchId: task.branchId,
          totalAmount: task.revenue,
          createdAt: new Date().toISOString(),
          createdBy: 'OpsManager',
          lines: [ 
            { id: '1', accountId: client.receivableAccountId, debit: task.revenue, credit: 0 }, 
            { id: '2', accountId: revenueAcc.id, debit: 0, credit: task.revenue } 
          ]
      };
      
      StorageService.postJournalEntry(je);
      task.linkedJournalEntryId = je.id;
      
      const vehicles = StorageService.getVehicles();
      const vIndex = vehicles.findIndex(v => v.id === task.vehicleId);
      if(vIndex >= 0) { 
        vehicles[vIndex].status = VehicleStatus.RENTED; 
        vehicles[vIndex].lastTaskDate = new Date().toISOString();
        StorageService.save(KEYS.VEHICLES, vehicles); 
      }

      const idx = list.findIndex(t => t.id === task.id);
      if(idx >= 0) list[idx] = task; else list.push(task);
      StorageService.save(KEYS.TASKS, list);
  },

  getQuotations: (): Quotation[] => StorageService.get(KEYS.QUOTATIONS),
  saveQuotation: (quotation: Quotation) => {
    const list = StorageService.getQuotations();
    const idx = list.findIndex(x => x.id === quotation.id);
    if(idx >= 0) list[idx] = quotation; else list.push(quotation);
    StorageService.save(KEYS.QUOTATIONS, list);
  },
  deleteQuotation: (id: string) => {
    const list = StorageService.getQuotations().filter(q => q.id !== id);
    StorageService.save(KEYS.QUOTATIONS, list);
  },

  getAccounts: (): Account[] => {
    const accounts = StorageService.get<Account>(KEYS.ACCOUNTS);
    const journal = StorageService.getJournal();
    const balances: Record<string, number> = {};
    
    // Calculate balances from journal entries
    journal.forEach(entry => {
      if(entry.status !== 'POSTED') return;
      entry.lines.forEach(line => {
        if(!balances[line.accountId]) balances[line.accountId] = 0;
        balances[line.accountId] += (line.debit - line.credit);
      });
    });
    
    // Return accounts with updated balances
    return accounts.map(acc => ({ 
      ...acc, 
      balance: balances[acc.id] || 0 
    }));
  },
  
  saveAccount: (account: Account) => {
    const accounts = StorageService.get<Account>(KEYS.ACCOUNTS);
    const idx = accounts.findIndex(a => a.id === account.id);
    if (idx >= 0) {
      // Preserve balance when updating
      const existingBalance = accounts[idx].balance;
      accounts[idx] = { ...account, balance: existingBalance };
    } else {
      accounts.push(account);
    }
    StorageService.save(KEYS.ACCOUNTS, accounts);
  },
  
  getJournal: (): JournalEntry[] => StorageService.get<JournalEntry>(KEYS.JOURNAL)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    
  postJournalEntry: (entry: JournalEntry) => {
    const entries = StorageService.getJournal();
    entries.push(entry);
    StorageService.save(KEYS.JOURNAL, entries);
  },
  
  updateJournalStatus: (id: string, status: 'DRAFT' | 'POSTED') => {
    const entries = StorageService.getJournal();
    const idx = entries.findIndex(e => e.id === id);
    if (idx >= 0) { 
      entries[idx].status = status; 
      StorageService.save(KEYS.JOURNAL, entries); 
    }
  },

  getVehicles: (): Vehicle[] => StorageService.get(KEYS.VEHICLES),
  saveVehicle: (vehicle: Vehicle) => {
    const vehicles = StorageService.getVehicles();
    const idx = vehicles.findIndex(v => v.id === vehicle.id);
    if (idx >= 0) vehicles[idx] = vehicle; else vehicles.push(vehicle);
    StorageService.save(KEYS.VEHICLES, vehicles);
  },
  
  getFuelRecords: (): FuelRecord[] => StorageService.get(KEYS.FLEET_FUEL),
  
  getMaintenanceRecords: (): MaintenanceRecord[] => StorageService.get(KEYS.FLEET_MAINT),
  
  logFuel: (record: Partial<FuelRecord>, cashAccountId: string): void => {
      const fuelCost = (record.liters || 0) * (record.costPerLiter || 0);
      const vehicle = StorageService.getVehicles().find(v => v.id === record.vehicleId);
      const fuelExpAcc = StorageService.getAccounts().find(a => a.code === '5101'); 
      if(!fuelExpAcc) throw new Error("حساب تكلفة الوقود (5101) غير موجود");

      const je: JournalEntry = {
          id: `FUEL${Date.now()}`,
          date: record.date || new Date().toISOString(),
          reference: `FUEL-${Date.now().toString().substr(-6)}`,
          description: `وقود - ${vehicle?.plateNumber} - ${record.liters} لتر`,
          status: 'POSTED',
          moduleId: ModuleType.FLEET,
          branchId: vehicle?.branchId || 'HEADQUARTERS',
          totalAmount: fuelCost,
          createdAt: new Date().toISOString(),
          createdBy: 'FleetMgr',
          lines: [ 
            { id: '1', accountId: fuelExpAcc.id, debit: fuelCost, credit: 0 }, 
            { id: '2', accountId: cashAccountId, debit: 0, credit: fuelCost } 
          ]
      };
      StorageService.postJournalEntry(je);

      const fullRecord: FuelRecord = {
          id: `FR${Date.now()}`,
          vehicleId: record.vehicleId!,
          driverId: record.driverId,
          date: record.date!,
          liters: record.liters!,
          costPerLiter: record.costPerLiter!,
          totalCost: fuelCost,
          meterReading: record.meterReading || 0,
          fuelStation: record.fuelStation || 'غير محدد',
          notes: record.notes || '',
          linkedJournalEntryId: je.id
      };
      const records = StorageService.getFuelRecords();
      records.push(fullRecord);
      StorageService.save(KEYS.FLEET_FUEL, records);
  },
  
  logMaintenance: (record: Partial<MaintenanceRecord>, cashAccountId: string): void => {
      const partsCost = record.partsUsed?.reduce((sum, p) => sum + p.cost, 0) || 0;
      const laborCost = record.costLabor || 0;
      const totalCost = partsCost + laborCost;
      const vehicle = StorageService.getVehicles().find(v => v.id === record.vehicleId);
      const maintExpAcc = StorageService.getAccounts().find(a => a.code === '5103');
      const inventoryAcc = StorageService.getAccounts().find(a => a.code.startsWith('1106'));
      
      if(!maintExpAcc || !inventoryAcc) throw new Error("حسابات الصيانة (5103) أو المخزون (1106) غير مهيأة");

      const lines = [];
      lines.push({ id: '1', accountId: maintExpAcc.id, debit: totalCost, credit: 0 });
      if (partsCost > 0) lines.push({ id: '2', accountId: inventoryAcc.id, debit: 0, credit: partsCost });
      if (laborCost > 0) lines.push({ id: '3', accountId: cashAccountId, debit: 0, credit: laborCost });

      const je: JournalEntry = {
          id: `MAINT${Date.now()}`,
          date: record.date!,
          reference: `MAINT-${Date.now().toString().substr(-6)}`,
          description: `صيانة مركبة ${vehicle?.plateNumber} - ${record.type}`,
          status: 'POSTED',
          moduleId: ModuleType.FLEET,
          branchId: vehicle?.branchId || 'HEADQUARTERS',
          totalAmount: totalCost,
          createdAt: new Date().toISOString(),
          createdBy: 'FleetMgr',
          lines: lines
      };
      StorageService.postJournalEntry(je);
      
      if (record.partsUsed && record.partsUsed.length > 0) {
          const allParts = StorageService.getSpareParts();
          record.partsUsed.forEach(used => {
              const partIndex = allParts.findIndex(p => p.id === used.partId);
              if(partIndex >= 0) {
                allParts[partIndex].currentStock -= used.quantity;
                allParts[partIndex].lastUsedDate = new Date().toISOString();
              }
          });
          StorageService.save(KEYS.STORE_PARTS, allParts);
      }

      const fullRecord: MaintenanceRecord = {
          id: `MR${Date.now()}`,
          vehicleId: record.vehicleId!,
          date: record.date!,
          type: record.type as any,
          description: record.description || '',
          costLabor: laborCost,
          partsUsed: record.partsUsed || [],
          totalCost: totalCost,
          workshop: record.workshop || 'الورشة الداخلية',
          nextMaintenanceDate: record.nextMaintenanceDate,
          odometer: record.odometer || 0,
          linkedJournalEntryId: je.id
      };
      const records = StorageService.getMaintenanceRecords();
      records.push(fullRecord);
      StorageService.save(KEYS.FLEET_MAINT, records);
  },
  
  getSpareParts: (): SparePart[] => StorageService.get(KEYS.STORE_PARTS),
  
  saveSparePart: (part: SparePart) => {
      const parts = StorageService.getSpareParts();
      const idx = parts.findIndex(p => p.id === part.id);
      if(idx >= 0) parts[idx] = part; else parts.push(part);
      StorageService.save(KEYS.STORE_PARTS, parts);
  },
  
  addPartStock: (partId: string, qty: number, unitCost: number, cashAccountId: string) => {
      const parts = StorageService.getSpareParts();
      const part = parts.find(p => p.id === partId);
      if(!part) return;

      const totalCost = qty * unitCost;
      const inventoryAcc = StorageService.getAccounts().find(a => a.code.startsWith('1106'));
      const oldVal = part.currentStock * part.averageCost;
      const newVal = qty * unitCost;
      part.averageCost = (oldVal + newVal) / (part.currentStock + qty);
      part.currentStock += qty;
      part.lastPurchaseDate = new Date().toISOString();
      part.lastPurchasePrice = unitCost;
      StorageService.save(KEYS.STORE_PARTS, parts);

      const je: JournalEntry = {
        id: `PUR${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        reference: `PUR-PART-${Date.now().toString().substr(-6)}`,
        description: `شراء قطع غيار - ${part.name}`,
        status: 'POSTED',
        moduleId: ModuleType.STORE,
        branchId: 'HEADQUARTERS',
        totalAmount: totalCost,
        createdAt: new Date().toISOString(),
        createdBy: 'StoreMgr',
        lines: [ 
          { id: '1', accountId: inventoryAcc!.id, debit: totalCost, credit: 0 }, 
          { id: '2', accountId: cashAccountId, debit: 0, credit: totalCost } 
        ]
      };
      StorageService.postJournalEntry(je);
  },
  
  getEmployees: (): Employee[] => StorageService.get(KEYS.EMPLOYEES),
  
  saveEmployee: (employee: Employee) => {
    const employees = StorageService.getEmployees();
    const idx = employees.findIndex(e => e.id === employee.id);
    if (idx >= 0) employees[idx] = employee; else employees.push(employee);
    StorageService.save(KEYS.EMPLOYEES, employees);
  },
  
  deleteEmployee: (id: string) => {
    const employees = StorageService.getEmployees().filter(e => e.id !== id);
    StorageService.save(KEYS.EMPLOYEES, employees);
  },
  
  getHRTransactions: (): HRTransaction[] => StorageService.get(KEYS.HR_TRANSACTIONS),
  
  saveHRTransaction: (tx: HRTransaction) => {
    const txs = StorageService.getHRTransactions();
    txs.push(tx);
    StorageService.save(KEYS.HR_TRANSACTIONS, txs);
  },
  
  exportToCSV: (data: any[], filename: string) => {
    if (!data.length) { alert("لا توجد بيانات للتصدير"); return; }
    
    // Convert Arabic headers
    const headers = Object.keys(data[0])
      .map(key => {
        const headerMap: Record<string, string> = {
          'id': 'المعرف',
          'code': 'الكود',
          'name': 'الاسم',
          'type': 'النوع',
          'balance': 'الرصيد',
          'currency': 'العملة',
          'parentId': 'الحساب الأب',
          'isLeaf': 'حساب نهائي',
          'description': 'الوصف'
        };
        return headerMap[key] || key;
      })
      .join(",");
    
    const rows = data.map(obj => 
      Object.values(obj).map(v => 
        typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
      ).join(",")
    );
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  
  resetDB: () => { 
      memoryCache = {};
      localStorage.clear(); 
      // Optionally delete file as well
      if (fs && dbPath && fs.existsSync(dbPath)) {
        try {
          fs.unlinkSync(dbPath);
        } catch (e) {
          console.error("Failed to delete database file:", e);
        }
      }
      window.location.reload(); 
  },
  
  // --- NEW: SYSTEM INFO AND DIAGNOSTICS ---
  getSystemInfo: () => {
    return {
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio || 1,
      colorDepth: window.screen.colorDepth,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      isHighDPI: window.devicePixelRatio > 1,
      supportsTouch: 'ontouchstart' in window,
      appVersion: '2.0.0',
      dataPath: StorageService.getDatabasePath(),
      accountsCount: StorageService.getAccounts().length,
      employeesCount: StorageService.getEmployees().length,
      vehiclesCount: StorageService.getVehicles().length,
      clientsCount: StorageService.getClients().length
    };
  },
  
  optimizeForDPI: () => {
    const dpi = window.devicePixelRatio;
    const isHighDPI = dpi > 1.25;
    
    if (isHighDPI) {
      // Apply high DPI optimizations
      document.documentElement.style.fontSize = `${16 * (1 + (dpi - 1) * 0.1)}px`;
      document.body.classList.add('high-dpi-mode');
    }
    
    return { dpi, isHighDPI };
  }
};
