import { ModuleType } from './types';
import { 
  LayoutDashboard, 
  Settings, 
  Calculator, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  PieChart, 
  BarChart2, 
  HelpCircle, 
  Info,
  Briefcase,
  FileCheck
} from 'lucide-react';

export const APP_NAME = "NewAbrad ERP";
export const COMPANY_NAME = "نيو ابراد للدعم اللوجستي وتاجير السيارات المصفحة والعادية";

export const COLORS = {
  primary: '#0f172a',
  secondary: '#1e293b',
  accent: '#c9a744',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  text: '#1e293b', // Dark text for Light theme
  textMuted: '#64748b'
};

export const MODULES = [
  { id: ModuleType.DASHBOARD, label: 'لوحة القيادة', icon: LayoutDashboard },
  { id: ModuleType.TASKS, label: 'التكليفات والعمليات', icon: FileCheck }, // NEW CORE MODULE
  { id: ModuleType.TRADE, label: 'العملاء والعقود', icon: Briefcase },
  { id: ModuleType.FLEET, label: 'إدارة الأسطول', icon: Truck },
  { id: ModuleType.ACCOUNTS, label: 'الإدارة المالية', icon: Calculator },
  { id: ModuleType.HR, label: 'الموارد البشرية', icon: Users },
  { id: ModuleType.STORE, label: 'المخازن والمشتريات', icon: Package },
  { id: ModuleType.COSTING, label: 'تقارير التكاليف', icon: BarChart2 },
  { id: ModuleType.STATS, label: 'الإحصائيات والتقارير', icon: PieChart }, // Changed Icon Here
  { id: ModuleType.ADMIN, label: 'التهيئة والإعدادات', icon: Settings },
  { id: ModuleType.HELP, label: 'دليل الاستخدام', icon: HelpCircle },
  { id: ModuleType.ABOUT, label: 'حول النظام', icon: Info },
];