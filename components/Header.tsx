import React, { useState, useEffect } from 'react';
import { ModuleType } from '../types';
import { MODULES } from '../constants';
import { StorageService } from '../services/storageService';
import { Bell, Search, Wifi, WifiOff, Calendar, Clock, Server, Database } from 'lucide-react';

interface HeaderProps {
  activeModule: ModuleType;
}

const Header: React.FC<HeaderProps> = ({ activeModule }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dbMode, setDbMode] = useState<'LOCAL' | 'NETWORK'>('LOCAL');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check DB Mode from Config
    const checkConfig = () => {
        const config = StorageService.getConfig();
        if (config && config.serverIp) {
            setDbMode('NETWORK');
        } else {
            setDbMode('LOCAL');
        }
    };
    checkConfig();
    // Poll for config changes every few seconds (in case updated in Admin)
    const configTimer = setInterval(checkConfig, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(configTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const activeModuleData = MODULES.find(m => m.id === activeModule);

  return (
    <header className="h-20 bg-white border-b border-slate-100 px-6 flex items-center justify-between shadow-sm">
      {/* Title Section */}
      <div className="flex items-center gap-4">
        <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-800">
          {activeModuleData && <activeModuleData.icon size={24} />}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-arabic">{activeModuleData?.label}</h2>
          <p className="text-xs text-slate-500 font-arabic">نظام نيو أبراد لإدارة الموارد - {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex items-center gap-4 md:gap-6">
        
        {/* Search Bar */}
        <div className="relative hidden md:block group">
          <input 
            type="text" 
            placeholder="بحث في النظام..." 
            className="pl-4 pr-10 py-2.5 w-64 rounded-full border-2 border-slate-100 bg-white text-slate-900 placeholder-slate-300 focus:outline-none focus:border-gold-500 focus:ring-0 text-sm font-bold font-arabic transition-all shadow-sm group-hover:border-gold-200"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-500" size={18} />
        </div>

        {/* Time & Status */}
        <div className="flex items-center gap-4 border-r border-slate-100 pr-6 mr-2">
            <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-800 font-mono flex items-center gap-2">
                    {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                    <Clock size={14} className="text-gold-500" />
                </span>
                <span className="text-xs text-slate-500 font-mono flex items-center gap-2">
                    {currentTime.toLocaleDateString('en-GB')}
                    <Calendar size={14} className="text-slate-300" />
                </span>
            </div>
        </div>

        {/* Server Status Indicator */}
        <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${dbMode === 'NETWORK' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`} title={dbMode === 'NETWORK' ? 'متصل بالسيرفر المركزي' : 'يعمل على قاعدة بيانات محلية'}>
            {dbMode === 'NETWORK' ? <Server size={14} /> : <Database size={14} />}
            <span className="font-arabic">{dbMode === 'NETWORK' ? 'مركزي' : 'محلي'}</span>
        </div>

        {/* Internet Connection Status */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${isOnline ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="font-arabic hidden md:inline">{isOnline ? 'متصل' : 'مفصول'}</span>
        </div>

      </div>
    </header>
  );
};

export default Header;