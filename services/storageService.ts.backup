import { JournalEntry, Account, Vehicle, AccountType, ModuleType, LogEntry, Employee, HRTransaction, SparePart, FuelRecord, MaintenanceRecord, Branch, Client, Contract, SystemConfig, Quotation, User, OperationalTask, VehicleStatus, FinancialYear, EmployeeStatus } from '../types';

// --- NODE.JS INTEGRATION FOR FILE SYSTEM ACCESS ---
// This allows writing to the disk directly instead of Browser LocalStorage
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
        
        // Get the path of the executable (The .exe file)
        const proc = process as any;
        const appPath = electron.remote ? electron.remote.app.getPath('exe') : (proc.execPath || (typeof proc.cwd === 'function' ? proc.cwd() : ''));
        
        // Define Data Directory NEXT TO THE EXECUTABLE
        const baseDir = path.dirname(appPath);
        dataDir = path.join(baseDir, 'NewAbrad_Account_Data');
        dbPath = path.join(dataDir, 'database.json');

        // Ensure Directory Exists
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
  ACCOUNTS: 'newabrad_accounts_v3', 
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
  INIT: 'newabrad_init_flag_v23', // Bumped to v23 to FORCE the new tree
  CURRENT_USER: 'newabrad_session_user'
};

// --- THE OFFICIAL ORIGINAL CHART OF ACCOUNTS (FROM USER JSON) ---
const SEED_ACCOUNTS: Account[] = [
  { "id": "1", "code": "1", "name": "الأصول", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "isLeaf": false },
  { "id": "11", "code": "11", "name": "أصول متداولة", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1", "isLeaf": false },
  { "id": "1101", "code": "1101", "name": "النقدية وما في حكمها", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "11", "isLeaf": false },
  { "id": "110101", "code": "110101", "name": "النقدية في الخزينة", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1101", "isLeaf": true },
  { "id": "110102", "code": "110102", "name": "العهد النقدية", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1101", "isLeaf": true },
  { "id": "1102", "code": "1102", "name": "النقدية في البنوك", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "11", "isLeaf": false },
  { "id": "110201", "code": "110201", "name": "حساب البنك الجاري", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1102", "isLeaf": true },
  { "id": "1103", "code": "1103", "name": "المدينون", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "11", "isLeaf": true },
  { "id": "1104", "code": "1104", "name": "مصروفات مقدمة", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "11", "isLeaf": false },
  { "id": "110401", "code": "110401", "name": "تأمين طبي مقدم", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1104", "isLeaf": true },
  { "id": "110402", "code": "110402", "name": "إيجار مقدم", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1104", "isLeaf": true },
  { "id": "1105", "code": "1105", "name": "سلف موظفين", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "11", "isLeaf": true },
  { "id": "1106", "code": "1106", "name": "المخزون", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "11", "isLeaf": true },
  { "id": "12", "code": "12", "name": "أصول غير متداولة", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1", "isLeaf": false },
  { "id": "1201", "code": "1201", "name": "عقارات وآلات ومعدات", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "12", "isLeaf": false },
  { "id": "120101", "code": "120101", "name": "الأراضي", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1201", "isLeaf": true },
  { "id": "120102", "code": "120102", "name": "المباني", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1201", "isLeaf": true },
  { "id": "120103", "code": "120103", "name": "المعدات", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1201", "isLeaf": true },
  { "id": "120104", "code": "120104", "name": "أجهزة مكتبية وطابعات", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "1201", "isLeaf": true },
  { "id": "1202", "code": "1202", "name": "أصول غير ملموسة", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "12", "isLeaf": true },
  { "id": "1203", "code": "1203", "name": "العقارات الاستثمارية", "type": AccountType.ASSET, "balance": 0, "currency": "USD", "parentId": "12", "isLeaf": true },
  { "id": "2", "code": "2", "name": "الالتزامات", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "isLeaf": false },
  { "id": "21", "code": "21", "name": "الالتزامات المتداولة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2", "isLeaf": false },
  { "id": "2101", "code": "2101", "name": "الدائنون", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "21", "isLeaf": true },
  { "id": "2102", "code": "2102", "name": "مصروفات مستحقة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "21", "isLeaf": true },
  { "id": "2103", "code": "2103", "name": "الرواتب المستحقة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "21", "isLeaf": true },
  { "id": "2104", "code": "2104", "name": "قروض قصيرة الأجل", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "21", "isLeaf": true },
  { "id": "2105", "code": "2105", "name": "ضريبة القيمة المضافة المستحقة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "21", "isLeaf": true },
  { "id": "2106", "code": "2106", "name": "الضرائب المستحقة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "21", "isLeaf": true },
  { "id": "2107", "code": "2107", "name": "إيرادات غير مكتسبة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "21", "isLeaf": true },
  { "id": "2108", "code": "2108", "name": "مستحقات التأمينات الاجتماعية", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "21", "isLeaf": true },
  { "id": "2109", "code": "2109", "name": "مجمع الاستهلاك", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "21", "isLeaf": false },
  { "id": "210901", "code": "210901", "name": "مجمع استهلاك المباني", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2109", "isLeaf": true },
  { "id": "210902", "code": "210902", "name": "مجمع استهلاك المعدات", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2109", "isLeaf": true },
  { "id": "210903", "code": "210903", "name": "مجمع استهلاك أجهزة مكتبية", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2109", "isLeaf": true },
  { "id": "22", "code": "22", "name": "الالتزامات غير المتداولة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "2", "isLeaf": false },
  { "id": "2201", "code": "2201", "name": "قروض طويلة الأجل", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "22", "isLeaf": true },
  { "id": "2202", "code": "2202", "name": "مخصص مكافأة نهاية الخدمة", "type": AccountType.LIABILITY, "balance": 0, "currency": "USD", "parentId": "22", "isLeaf": true },
  { "id": "3", "code": "3", "name": "حقوق الملكية", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "isLeaf": false },
  { "id": "31", "code": "31", "name": "رأس المال", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "3", "isLeaf": false },
  { "id": "3101", "code": "3101", "name": "رأس المال المسجل", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "31", "isLeaf": true },
  { "id": "3102", "code": "3102", "name": "رأس المال الإضافي المدفوع", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "31", "isLeaf": true },
  { "id": "32", "code": "32", "name": "حقوق ملكية أخرى", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "3", "isLeaf": false },
  { "id": "3201", "code": "3201", "name": "أرصدة افتتاحية", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "32", "isLeaf": true },
  { "id": "33", "code": "33", "name": "احتياطيات", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "3", "isLeaf": false },
  { "id": "3301", "code": "3301", "name": "احتياطي نظامي", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "33", "isLeaf": true },
  { "id": "3302", "code": "3302", "name": "احتياطي ترجمة عملات", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "33", "isLeaf": true },
  { "id": "34", "code": "34", "name": "أرباح/خسائر مبقاة", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "3", "isLeaf": false },
  { "id": "3401", "code": "3401", "name": "الأرباح والخسائر المرحلة", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "34", "isLeaf": true },
  { "id": "3402", "code": "3402", "name": "الأرباح المبقاة (أو الخسائر)", "type": AccountType.EQUITY, "balance": 0, "currency": "USD", "parentId": "34", "isLeaf": true },
  { "id": "4", "code": "4", "name": "الإيرادات", "type": AccountType.REVENUE, "balance": 0, "currency": "USD", "isLeaf": false },
  { "id": "41", "code": "41", "name": "الإيرادات التشغيلية", "type": AccountType.REVENUE, "balance": 0, "currency": "USD", "parentId": "4", "isLeaf": false },
  { "id": "4101", "code": "4101", "name": "إيرادات المبيعات/الخدمات", "type": AccountType.REVENUE, "balance": 0, "currency": "USD", "parentId": "41", "isLeaf": true },
  { "id": "42", "code": "42", "name": "الإيرادات غير التشغيلية", "type": AccountType.REVENUE, "balance": 0, "currency": "USD", "parentId": "4", "isLeaf": false },
  { "id": "4201", "code": "4201", "name": "إيرادات أخرى", "type": AccountType.REVENUE, "balance": 0, "currency": "USD", "parentId": "42", "isLeaf": true },
  { "id": "5", "code": "5", "name": "المصاريف", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "isLeaf": false },
  { "id": "51", "code": "51", "name": "التكلفة المباشرة", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "5", "isLeaf": false },
  { "id": "5101", "code": "5101", "name": "تكلفة البضاعة المباعة", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "51", "isLeaf": true },
  { "id": "5102", "code": "5102", "name": "رواتب وأجور", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "51", "isLeaf": true },
  { "id": "5103", "code": "5103", "name": "عمولات البيع", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "51", "isLeaf": true },
  { "id": "5104", "code": "5104", "name": "شحن وتخليص جمركي", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "51", "isLeaf": true },
  { "id": "52", "code": "52", "name": "التكاليف التشغيلية", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "5", "isLeaf": false },
  { "id": "5201", "code": "5201", "name": "الرواتب والرسوم الإدارية", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true },
  { "id": "5202", "code": "5202", "name": "تأمين طبي", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true },
  { "id": "5203", "code": "5203", "name": "مصاريف تسويقية ودعائية", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true },
  { "id": "5204", "code": "5204", "name": "مصاريف الإيجار", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true },
  { "id": "5205", "code": "5205", "name": "مكافآت وحوافز", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true },
  { "id": "5206", "code": "5206", "name": "تذاكر سفر", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true },
  { "id": "5207", "code": "5207", "name": "التأمينات الاجتماعية", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true },
  { "id": "5208", "code": "5208", "name": "الرسوم الحكومية", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true },
  { "id": "5209", "code": "5209", "name": "رسوم واشتراكات", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true },
  { "id": "5210", "code": "5210", "name": "مصاريف خدمات المكتب", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true },
  { "id": "5211", "code": "5211", "name": "مصاريف مكتبية ومطبوعات", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true },
  { "id": "5212", "code": "5212", "name": "مصاريف ضيافة", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true },
  { "id": "5213", "code": "5213", "name": "عمولات بنكية", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true },
  { "id": "5214", "code": "5214", "name": "مصاريف أخرى", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true },
  { "id": "5215", "code": "5215", "name": "مصاريف الإهلاك", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": false },
  { "id": "521501", "code": "521501", "name": "مصروف إهلاك المباني", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "5215", "isLeaf": true },
  { "id": "521502", "code": "521502", "name": "مصروف إهلاك المعدات", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "5215", "isLeaf": true },
  { "id": "521503", "code": "521503", "name": "مصروف إهلاك أجهزة مكتبية", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "5215", "isLeaf": true },
  { "id": "5219", "code": "5219", "name": "مصروف نقل ومواصلات", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "52", "isLeaf": true },
  { "id": "53", "code": "53", "name": "مصاريف غير تشغيلية", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "5", "isLeaf": false },
  { "id": "5301", "code": "5301", "name": "الزكاة", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "53", "isLeaf": true },
  { "id": "5302", "code": "5302", "name": "الضرائب", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "53", "isLeaf": true },
  { "id": "5303", "code": "5303", "name": "ترجمة عملات أجنبية", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "53", "isLeaf": true },
  { "id": "5304", "code": "5304", "name": "فوائد", "type": AccountType.EXPENSE, "balance": 0, "currency": "USD", "parentId": "53", "isLeaf": true }
];

// Updated SEED_EMPLOYEES
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
      licenseExpiry: '2026-05-20' 
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
      licenseExpiry: '2025-11-10' 
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
      licenseExpiry: '2026-06-15' 
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
      phone: '0404040404', 
      idNumber: '0404040404',
      licenseNumber: 'LIC-1004', 
      licenseExpiry: '2025-12-30' 
  },
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

  init: () => {
    // Load from file on startup
    StorageService._loadFromFile();

    const currentVersion = localStorage.getItem(KEYS.INIT);
    if (currentVersion !== 'v23') {
      console.log('Detected version change (v23). Refreshing ORIGINAL seed data...');
      StorageService.save(KEYS.ACCOUNTS, SEED_ACCOUNTS);
      StorageService.save(KEYS.EMPLOYEES, SEED_EMPLOYEES);
      localStorage.setItem(KEYS.INIT, 'v23');
    }
  },

  resetAccountsToDefault: (): Account[] => {
      StorageService.save(KEYS.ACCOUNTS, SEED_ACCOUNTS);
      return SEED_ACCOUNTS;
  },

  // --- NEW: BULK IMPORT FOR PERFORMANCE ---
  importAccounts: (newAccounts: Account[]) => {
      const currentAccounts = StorageService.get<Account>(KEYS.ACCOUNTS);
      
      // Use Map for O(1) lookup based on Code (as it's unique in accounting)
      const accountMap = new Map(currentAccounts.map(a => [a.code, a]));

      newAccounts.forEach(acc => {
          if (accountMap.has(acc.code)) {
              // Merge Update: Keep existing ID to maintain relationships, update other fields
              const existing = accountMap.get(acc.code)!;
              accountMap.set(acc.code, { ...existing, ...acc, id: existing.id });
          } else {
              // Insert New
              // Ensure ID exists
              if (!acc.id) acc.id = Date.now().toString() + Math.random().toString().substr(2, 5);
              accountMap.set(acc.code, acc);
          }
      });

      // Convert back to array
      const mergedList = Array.from(accountMap.values());
      StorageService.save(KEYS.ACCOUNTS, mergedList);
  },

  // --- BACKUP & RESTORE ---
  createBackup: (): string => {
    if (fs && dbPath) {
        StorageService._loadFromFile();
        const backup = { ...memoryCache };
        backup['meta'] = { date: new Date().toISOString(), version: '1.0.0', appName: 'NewAbrad Account ERP', createdAt: new Date().toLocaleString(), source: 'FileSystem' };
        return JSON.stringify(backup, null, 2);
    }
    const backup: Record<string, any> = {};
    Object.values(KEYS).forEach(key => {
      const value = localStorage.getItem(key);
      if (value) { try { backup[key] = JSON.parse(value); } catch (e) { console.warn(`Failed to parse key ${key}`); } }
    });
    backup['meta'] = { date: new Date().toISOString(), version: '1.0.0', appName: 'NewAbrad Account ERP', createdAt: new Date().toLocaleString() };
    return JSON.stringify(backup, null, 2);
  },

  restoreBackup: (jsonString: string): boolean => {
    try {
        const backup = JSON.parse(jsonString);
        if (!backup.meta || !backup.meta.appName.includes('NewAbrad')) throw new Error("ملف النسخة الاحتياطية غير صالح لهذا النظام");
        Object.keys(backup).forEach(key => { if (key !== 'meta') { memoryCache[key] = backup[key]; localStorage.setItem(key, JSON.stringify(backup[key])); } });
        StorageService._saveToFile();
        return true;
    } catch (e) { console.error(e); throw e; }
  },

  // --- GETTERS & SETTERS (Passthrough) ---
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
            const newAcc: Account = { id: Date.now().toString(), code: `1103${list.length + 1}`, name: client.name, type: AccountType.ASSET, balance: 0, currency: 'YER', parentId: parentAcc.id, isLeaf: true };
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
          id: Date.now().toString(),
          date: task.date,
          reference: task.reference,
          description: `استحقاق تكليف رقم ${task.reference} - خط سير ${task.route}`,
          status: 'POSTED',
          moduleId: ModuleType.TASKS,
          branchId: task.branchId,
          totalAmount: task.revenue,
          createdAt: new Date().toISOString(),
          createdBy: 'OpsManager',
          lines: [ { id: '1', accountId: client.receivableAccountId, debit: task.revenue, credit: 0 }, { id: '2', accountId: revenueAcc.id, debit: 0, credit: task.revenue } ]
      };
      
      StorageService.postJournalEntry(je);
      task.linkedJournalEntryId = je.id;
      
      const vehicles = StorageService.getVehicles();
      const vIndex = vehicles.findIndex(v => v.id === task.vehicleId);
      if(vIndex >= 0) { vehicles[vIndex].status = VehicleStatus.RENTED; StorageService.save(KEYS.VEHICLES, vehicles); }

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
    journal.forEach(entry => {
      if(entry.status !== 'POSTED') return;
      entry.lines.forEach(line => {
        if(!balances[line.accountId]) balances[line.accountId] = 0;
        balances[line.accountId] += (line.debit - line.credit);
      });
    });
    return accounts.map(acc => ({ ...acc, balance: balances[acc.id] || 0 }));
  },
  saveAccount: (account: Account) => {
    const accounts = StorageService.get<Account>(KEYS.ACCOUNTS);
    const idx = accounts.findIndex(a => a.id === account.id);
    if (idx >= 0) accounts[idx] = account; else accounts.push(account);
    StorageService.save(KEYS.ACCOUNTS, accounts);
  },
  getJournal: (): JournalEntry[] => StorageService.get<JournalEntry>(KEYS.JOURNAL).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  postJournalEntry: (entry: JournalEntry) => {
    const entries = StorageService.getJournal();
    entries.push(entry);
    StorageService.save(KEYS.JOURNAL, entries);
  },
  updateJournalStatus: (id: string, status: 'DRAFT' | 'POSTED') => {
    const entries = StorageService.getJournal();
    const idx = entries.findIndex(e => e.id === id);
    if (idx >= 0) { entries[idx].status = status; StorageService.save(KEYS.JOURNAL, entries); }
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
      const fuelExpAcc = StorageService.getAccounts().find(a => a.code.startsWith('5101')); 
      if(!fuelExpAcc) throw new Error("حساب تكلفة البضاعة المباعة/الوقود (5101) غير موجود");

      const je: JournalEntry = {
          id: Date.now().toString(),
          date: record.date || new Date().toISOString(),
          reference: `FUEL-${Date.now().toString().substr(-6)}`,
          description: `وقود - ${vehicle?.plateNumber} - ${record.liters}L`,
          status: 'POSTED',
          moduleId: ModuleType.FLEET,
          branchId: vehicle?.branchId || 'HEADQUARTERS',
          totalAmount: fuelCost,
          createdAt: new Date().toISOString(),
          createdBy: 'FleetMgr',
          lines: [ { id: '1', accountId: fuelExpAcc.id, debit: fuelCost, credit: 0 }, { id: '2', accountId: cashAccountId, debit: 0, credit: fuelCost } ]
      };
      StorageService.postJournalEntry(je);

      const fullRecord: FuelRecord = {
          id: Date.now().toString(),
          vehicleId: record.vehicleId!,
          driverId: record.driverId,
          date: record.date!,
          liters: record.liters!,
          costPerLiter: record.costPerLiter!,
          totalCost: fuelCost,
          meterReading: record.meterReading || 0,
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
      const maintExpAcc = StorageService.getAccounts().find(a => a.code.startsWith('5102'));
      const inventoryAcc = StorageService.getAccounts().find(a => a.code.startsWith('1106'));
      
      if(!maintExpAcc || !inventoryAcc) throw new Error("حسابات الصيانة (5102) أو المخزون (1106) غير مهيأة");

      const lines = [];
      lines.push({ id: '1', accountId: maintExpAcc.id, debit: totalCost, credit: 0 });
      if (partsCost > 0) lines.push({ id: '2', accountId: inventoryAcc.id, debit: 0, credit: partsCost });
      if (laborCost > 0) lines.push({ id: '3', accountId: cashAccountId, debit: 0, credit: laborCost });

      const je: JournalEntry = {
          id: Date.now().toString(),
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
              if(partIndex >= 0) allParts[partIndex].currentStock -= used.quantity;
          });
          StorageService.save(KEYS.STORE_PARTS, allParts);
      }

      const fullRecord: MaintenanceRecord = {
          id: Date.now().toString(),
          vehicleId: record.vehicleId!,
          date: record.date!,
          type: record.type as any,
          description: record.description || '',
          costLabor: laborCost,
          partsUsed: record.partsUsed || [],
          totalCost: totalCost,
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
      StorageService.save(KEYS.STORE_PARTS, parts);

      const je: JournalEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        reference: `PUR-PART-${Date.now().toString().substr(-6)}`,
        description: `شراء قطع غيار - ${part.name}`,
        status: 'POSTED',
        moduleId: ModuleType.STORE,
        branchId: 'HEADQUARTERS',
        totalAmount: totalCost,
        createdAt: new Date().toISOString(),
        createdBy: 'StoreMgr',
        lines: [ { id: '1', accountId: inventoryAcc!.id, debit: totalCost, credit: 0 }, { id: '2', accountId: cashAccountId, debit: 0, credit: totalCost } ]
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
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(obj => Object.values(obj).map(v => typeof v === 'string' ? `"${v}"` : v).join(","));
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  resetDB: () => { 
      memoryCache = {};
      localStorage.clear(); 
      // Optionally delete file as well
      window.location.reload(); 
  }
};