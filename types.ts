export enum ModuleType {
  DASHBOARD = 'DASHBOARD',
  ADMIN = 'ADMIN',
  ACCOUNTS = 'ACCOUNTS',
  STORE = 'STORE',
  TRADE = 'TRADE',
  TASKS = 'TASKS', // NEW: Operational Tasks (التكليفات)
  HR = 'HR',
  FLEET = 'FLEET',
  COSTING = 'COSTING',
  STATS = 'STATS',
  HELP = 'HELP',
  ABOUT = 'ABOUT'
}

export interface SystemConfig {
  companyName: string;
  baseCurrency: 'YER' | 'USD' | 'SAR';
  isConfigured: boolean;
  taxNumber?: string;
  address?: string;
  phone?: string;
  logo?: string; // Base64 Image String for App Icon
  
  // Print Settings (Official Documents)
  printHeader?: string; // Base64 Image for A4 Header
  printFooter?: string; // Base64 Image for A4 Footer
  companySeal?: string; // Base64 Image for Stamp/Seal
  
  // Connection Settings
  serverIp?: string;
  serverPort?: string;
  dbName?: string;
  dbUser?: string;
  isCloudConnected?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  managerName: string;
  phone: string;
  isMain: boolean;
}

export interface FinancialYear {
  id: string;
  name: string; // e.g. "2024"
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CLOSED';
  isCurrent: boolean;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'ADMIN' | 'ACCOUNTANT' | 'USER';
  fullName: string;
  branchId: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  module: ModuleType;
  details: string;
}

// --- ACCOUNTING CORE ---

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE'
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: 'USD' | 'YER' | 'SAR';
  parentId?: string;
  isLeaf: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  status: 'DRAFT' | 'POSTED';
  lines: JournalLine[];
  moduleId: ModuleType;
  branchId: string;
  totalAmount: number;
  createdAt: string;
  createdBy: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountName?: string;
  debit: number;
  credit: number;
  description?: string;
}

// --- ASSETS & DEPRECIATION ---
export interface AssetDepreciationConfig {
    assetAccountId: string; // e.g., Vehicles (120103)
    depreciationExpenseAccountId: string; // e.g., Dep Expense (521502)
    accumulatedDepreciationAccountId: string; // e.g., Acc Dep (210902)
    annualRate: number; // e.g., 20%
}

// --- TRADE & CONTRACTS ---

export interface Client {
  id: string;
  name: string;
  type: 'ORGANIZATION' | 'INDIVIDUAL' | 'GOVERNMENT'; // المنظمات، الجهات الحكومية
  phone: string;
  email: string;
  address: string;
  taxNumber?: string;
  receivableAccountId: string; // Linked Account (12xxxx)
}

export interface Contract {
  id: string;
  reference: string;
  clientId: string;
  clientName?: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  currency: 'USD' | 'YER' | 'SAR';
  status: 'ACTIVE' | 'EXPIRED' | 'DRAFT';
  description: string;
  revenueAccountId: string; // Integration with Accounting
}

// --- OPERATIONAL TASKS (التكليفات) - CORE LOGISTICS ---
// Updated based on "Mission Contract Table 1-1"
export type RentalCategory = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface OperationalTask {
  id: string;
  date: string;
  reference: string; // رقم التكليف / رقم العقد
  clientId: string; // الجهة المستفيدة
  contractId?: string; // العقد المرتبط (اختياري)
  
  // Resources
  vehicleId: string;
  driverId: string;
  
  // Mission Details (جدول 1-1)
  route: string; // خط السير / موقع المهمة
  startDate: string;
  endDate: string;
  
  // Contract Specifics (الاشتراطات)
  rentalCategory: RentalCategory; // فئة التأجير (يومي/أسبوعي/شهري)
  withDriver: boolean; // مع السائق / بدون سائق
  withFuel: boolean; // مع المحروقات / بدون محروقات
  vehicleTypeRequirement: 'ARMORED' | 'SOFT'; // سوفت / مدرع (Required Type)

  // Financials
  cost: number; // تكلفة التشغيل (المصاريف)
  revenue: number; // الإيراد المتفق عليه (المبلغ للإيجار)
  currency: 'USD' | 'YER' | 'SAR';
  
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  linkedJournalEntryId?: string; // قيد الاستحقاق
  branchId: string;
}

export interface Quotation {
  id: string;
  offerNumber: string;
  date: string;
  currency: 'YER' | 'USD' | 'SAR';
  exchangeRate: number;
  clientId: string;
  clientName: string;
  tenderNumber?: string;
  tenderDate?: string;
  deliveryLocation?: string;
  deliveryDate?: string;
  paymentTerms?: string;
  deliveryDuration?: string;
  description: string;
  notes?: string;
  total: number;
  discount: number;
  finalTotal: number;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED';
}

// --- FLEET ---

export enum VehicleType {
  ARMORED_B6 = 'ARMORED_B6',
  ARMORED_B7 = 'ARMORED_B7',
  CIVILIAN_SUV = 'CIVILIAN_SUV', // Soft
  CIVILIAN_SEDAN = 'CIVILIAN_SEDAN', // Soft
  BUS = 'BUS',
  TRUCK = 'TRUCK'
}

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}

// Updated based on "Vehicle List 1-4"
export interface Vehicle {
  id: string;
  plateNumber: string; // رقم اللوحة
  make: string; // الشركة المصنعة
  model: string; // الموديل
  year: number;
  color: string; // اللون (Added)
  vin: string; // رقم القعادة / الشاصي
  type: VehicleType; // النوع (سوفت / مدرع - derived from Enum)
  status: VehicleStatus;
  
  // Specs from PDF
  insurancePolicyNumber?: string; // رقم بوليصة التأمين
  insuranceExpiry?: string; // Add Expiry Date for Alerts
  seats?: number; // عدد المقاعد
  driveType?: '4WD' | '2WD'; // نظام الدفع

  driverId?: string;
  branchId: string;
  assetAccountId: string;
  expenseAccountId: string;
  currentMeter: number;
  purchaseDate: string;
  purchasePrice: number;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  driverId?: string;
  date: string;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  meterReading: number;
  linkedJournalEntryId: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'TIRES' | 'BATTERY';
  description: string;
  costLabor: number;
  partsUsed: { partId: string; quantity: number; cost: number }[];
  totalCost: number;
  linkedJournalEntryId: string;
}

// --- STORE ---

export interface SparePart {
  id: string;
  partNumber: string;
  name: string;
  description: string;
  currentStock: number;
  averageCost: number;
  salePrice: number;
  location: string;
  assetAccountId: string;
}

// --- HR ---

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
  RESIGNED = 'RESIGNED'
}

export interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
  hireDate: string;
  basicSalary: number;
  currency: 'YER' | 'USD' | 'SAR';
  status: EmployeeStatus;
  phone: string;
  
  // New Fields from Table 1-6 (Drivers)
  idNumber?: string; // رقم الهوية
  idType?: string; // نوع الهوية
  idIssuePlace?: string; // مكان الإصدار
  idIssueDate?: string; // تاريخ الإصدار
  licenseNumber?: string; // رقم رخصة القيادة
  licenseExpiry?: string; // تاريخ انتهاء الرخصة
}

export enum HROperationType {
  BONUS = 'BONUS',
  VIOLATION = 'VIOLATION',
  TRAVEL_ALLOWANCE = 'TRAVEL_ALLOWANCE',
  MEDICAL = 'MEDICAL',
  ADVANCE = 'ADVANCE'
}

export interface HRTransaction {
  id: string;
  employeeId: string;
  type: HROperationType;
  amount: number;
  date: string;
  description: string;
  linkedJournalEntryId: string;
}