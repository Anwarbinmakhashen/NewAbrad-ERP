import React, { useEffect, useState } from 'react';
import { MODULES, COLORS } from '../constants';
import { ModuleType, SystemConfig } from '../types';
import { StorageService } from '../services/storageService';
import { Code, Smartphone, Monitor, LogOut } from 'lucide-react';

interface SidebarProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeModule, onModuleChange, onLogout }) => {
  const [logo, setLogo] = useState<string | undefined>(undefined);

  useEffect(() => {
    const config = StorageService.getConfig();
    if(config && config.logo) {
      setLogo(config.logo);
    }
  }, []);

  return (
    <div className="w-64 h-full bg-white text-slate-800 flex flex-col shadow-xl border-l border-slate-200 z-10 relative">
      {/* Header Logo Area */}
      <div className="h-24 flex items-center justify-center border-b border-slate-100 bg-white p-4">
        <div className="flex flex-col items-center justify-center w-full h-full">
          {logo ? (
            <img src={logo} alt="Company Logo" className="max-h-16 max-w-full object-contain" />
          ) : (
             <div className="flex flex-col items-center">
                <h1 className="text-xl font-bold text-slate-900 tracking-wider">NEW ABRAD</h1>
                <span className="text-xs text-slate-500 font-arabic">نظام إدارة الموارد المؤسسية</span>
             </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-300">
        <ul className="space-y-1 px-2">
          {MODULES.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;
            
            return (
              <li key={module.id}>
                <button
                  onClick={() => onModuleChange(module.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-gold-500 text-white shadow-lg shadow-gold-500/20' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon size={20} className={`ml-3 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-gold-500'}`} />
                  <span className="font-arabic font-bold">{module.label}</span>
                  
                  {/* Active Indicator Strip */}
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/30 rounded-l-full" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Status / Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-white font-bold shadow-md">
              AD
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800">Admin User</span>
              <span className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                متصل
              </span>
            </div>
          </div>
          
          <button 
            onClick={onLogout} 
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors tooltip" 
            title="تسجيل الخروج"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;